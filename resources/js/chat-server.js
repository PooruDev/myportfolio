// Reference backend for the portfolio Community Chat (zero dependencies).
//   node chat-server.js [staticDir] [port]
// Implements the contract community-chat.js already speaks:
//   GET  /chat?after=ID  -> { messages: [{id,name,message,location,device,at}], total }
//   POST /chat  {name,message,client_id,location,device}
//        -> 201 { message }   |   422 { reason: "link" | "blocked" | "invalid" }
// Messages persist in chat-data.json (next to this file), so they survive
// refreshes and restarts. If you already run your own backend (e.g. Laravel),
// you do not need this file - just keep the same two routes/response shapes.
const http = require("http"), fs = require("fs"), path = require("path");
const STATIC = path.resolve(process.argv[2] || ".");
const PORT = +process.argv[3] || +process.env.PORT || 8787;
const DB = process.env.CHAT_DB || path.join(__dirname, "chat-data.json");
const MAX_BODY = 8 * 1024, HISTORY = 60;
let db = { nextId: 1, messages: [] };
try { db = JSON.parse(fs.readFileSync(DB, "utf8")); } catch (e) {}
function save() { fs.writeFileSync(DB + ".tmp", JSON.stringify(db)); fs.renameSync(DB + ".tmp", DB); }
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".mp4": "video/mp4", ".wav": "audio/wav" };
const json = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store" }); res.end(JSON.stringify(obj)); };
const hasLink = (t) => /https?:\/\//i.test(t) || /(^|[^a-z0-9])www\.[a-z0-9]/i.test(t) || /[a-z0-9][a-z0-9-]*\.(com|net|org|io|co|dev|app|ai|xyz|info|biz|link|site|online|me|ly|gg|tv|ph)\b/i.test(t);
const clean = (v, n) => String(v == null ? "" : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, n);
http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  // CORS: lets a static site on another origin use this API (set <meta name="chat-api">)
  res.setHeader("Access-Control-Allow-Origin", process.env.CHAT_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-CSRF-TOKEN, X-XSRF-TOKEN");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
  if (u.pathname === "/chat") {
    if (req.method === "GET") {
      const after = +u.searchParams.get("after") || 0;
      const list = after ? db.messages.filter((m) => m.id > after) : db.messages.slice(-HISTORY);
      return json(res, 200, { messages: list.map(({ client_id, ...pub }) => pub), total: db.messages.length });
    }
    if (req.method === "POST") {
      let body = "";
      req.on("data", (c) => { body += c; if (body.length > MAX_BODY) req.destroy(); });
      req.on("end", () => {
        let d; try { d = JSON.parse(body); } catch (e) { return json(res, 422, { reason: "invalid" }); }
        const name = clean(d.name, 40), message = clean(d.message, 500);
        if (!name || !message) return json(res, 422, { reason: "invalid" });
        if (hasLink(name) || hasLink(message)) return json(res, 422, { reason: "link" });
        const m = { id: db.nextId++, name, message, location: clean(d.location, 60), device: clean(d.device, 20), client_id: clean(d.client_id, 64), at: new Date().toISOString() };
        db.messages.push(m); save();
        const { client_id, ...pub } = m; // never expose visitor ids
        return json(res, 201, { message: pub });
      });
      return;
    }
    return json(res, 405, { error: "method" });
  }
  // static files
  let p = path.join(STATIC, decodeURIComponent(u.pathname === "/" ? "/index.html" : u.pathname));
  if (!p.startsWith(STATIC)) { res.writeHead(403); return res.end(); }
  fs.readFile(p, (err, buf) => {
    if (err) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(p)] || "application/octet-stream" }); res.end(buf);
  });
}).listen(PORT, () => console.log("chat server on http://localhost:" + PORT));
