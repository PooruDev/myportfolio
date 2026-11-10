      // ── Community Chat: name → message phases, live polling, message
      // handling, moderation, cooldowns, rendering — logic ported 1:1 from
      // asdasd.html. Opening this overlay never collapses, hides, or navigates
      // away from the Identity Expanded View — the expanded view stays open
      // and active behind the chat (same pattern as the Ask / Typing overlays).
      (function () {
        const overlay = document.getElementById("chatOverlay");
        if (!overlay) return;
        const messagesEl = document.getElementById("chatMessages");
        const countEl = document.getElementById("chatCount");
        const form = document.getElementById("chatForm");
        const inputEl = document.getElementById("chatInput");
        const promptEl = document.getElementById("chatPrompt");
        const sendEl = document.getElementById("chatSend");
        // Chat API: GET {API}?after=ID and POST {API}. Defaults to /chat; point it
        // at another origin with <meta name="chat-api" content="https://…/chat">
        // or window.CHAT_API_URL. (The old build hard-coded a CSRF token from a
        // different session, which every POST was rejected for.)
        const metaApi = document.querySelector('meta[name="chat-api"]');
        const API = String(
          window.CHAT_API_URL || (metaApi && metaApi.content) || "/chat",
        ).replace(/\/+$/, "");
        function csrfHeaders() {
          const meta = document.querySelector('meta[name="csrf-token"]');
          if (meta && meta.content) return { "X-CSRF-TOKEN": meta.content };
          const m = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
          return m ? { "X-XSRF-TOKEN": decodeURIComponent(m[1]) } : {};
        }
        let lastId = 0;
        const seen = new Set(); // message ids already rendered (de-dupe poll vs POST)
        let sending = false; // true while a POST is in flight (no duplicate submits)
        let loading = false; // true while a GET is in flight
        let initialLoaded = false;
        let connText = ""; // connection problem shown next to the message count
        let pollTimer = null;
        let closeT1 = null,
          closeT2 = null;
        let phase = "name";
        let clientId = "";
        let chatName = "";
        let myDevice = "";
        let myLocation = "";
        const MAX_VISIBLE = 60; // keep a scrollable history in the DOM (bounded)
        let totalCount = 0; // total messages (for the count label)
        const SEND_COOLDOWN = 3000; // min ms between a user's own messages (anti-spam)
        const KIND_URL = "https://en.wikipedia.org/wiki/Netiquette";
        const BAD_LOOSE = [
          "fuck",
          "motherfuck",
          "shit",
          "bullshit",
          "bitch",
          "asshole",
          "cunt",
          "faggot",
          "nigger",
          "nigga",
          "dickhead",
          "jackass",
          "dumbass",
          "cocksuck",
          "dipshit",
          "putangina",
          "putanginamo",
          "tangina",
          "taena",
          "tarantado",
          "gago",
          "gaga",
          "ulol",
          "kingina",
          "kupal",
          "pakshet",
          "pakyu",
          "hinayupak",
          "hindot",
          "hindut",
          "buwiset",
          "bwisit",
          "putang ina",
          "tang ina",
          "walang hiya",
          "hayop ka",
          "gunggong",
        ];
        const BAD_STRICT = [
          "ass",
          "dick",
          "cock",
          "prick",
          "slut",
          "whore",
          "twat",
          "wank",
          "piss",
          "bastard",
          "pussy",
          "puta",
          "tanga",
          "bobo",
          "tite",
          "titi",
          "puki",
          "pekpek",
          "jakol",
          "leche",
          "peste",
          "lintik",
          "ungas",
          "inutil",
        ];
        const LINK_TLDS = [
          "com",
          "net",
          "org",
          "io",
          "co",
          "dev",
          "app",
          "ai",
          "xyz",
          "info",
          "biz",
          "link",
          "site",
          "online",
          "store",
          "shop",
          "page",
          "live",
          "tech",
          "cloud",
          "click",
          "me",
          "ly",
          "gg",
          "gl",
          "be",
          "to",
          "tv",
          "fm",
          "sh",
          "cc",
          "ws",
          "ph",
          "uk",
          "ca",
          "au",
          "de",
          "jp",
          "eu",
          "edu",
          "gov",
          "top",
          "vip",
          "pro",
          "fun",
          "icu",
        ];
        let lastSent = 0;
        let hintTimer = null;
        let timeTimer = null;
        try {
          clientId = localStorage.getItem("visitorId") || "";
        } catch (e) {}
        if (!clientId) {
          clientId =
            (window.crypto && crypto.randomUUID && crypto.randomUUID()) ||
            "v-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
          try {
            localStorage.setItem("visitorId", clientId);
          } catch (e) {}
        }
        try {
          chatName = localStorage.getItem("chatName") || "";
        } catch (e) {}

        function avatarUrl(name) {
          return (
            "https://api.dicebear.com/9.x/notionists/svg?seed=" +
            encodeURIComponent(name || "anon") +
            "&radius=50&backgroundColor=f1f1f1"
          );
        }

        function detectDevice() {
          const ua = navigator.userAgent || "";
          const touch = navigator.maxTouchPoints || 0;
          if (/iPad/.test(ua) || (/Macintosh/.test(ua) && touch > 1))
            return "iPad";
          if (/iPhone|iPod/.test(ua)) return "iPhone";
          if (/Android/.test(ua))
            return /Mobile/.test(ua) ? "Android" : "Android tablet";
          if (/Macintosh|Mac OS X/.test(ua)) return "Mac";
          if (/Windows/.test(ua)) return "Windows";
          if (/CrOS/.test(ua)) return "Chromebook";
          if (/Linux/.test(ua)) return "Linux";
          return "device";
        }

        const DEV_ICONS = {
          phone:
            '<svg class="chat-dev" viewBox="0 0 24 24" fill="none"><rect x="7" y="2.5" width="10" height="19" rx="2.2" stroke="currentColor" stroke-width="1.6"/><line x1="10.5" y1="18.5" x2="13.5" y2="18.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
          tablet:
            '<svg class="chat-dev" viewBox="0 0 24 24" fill="none"><rect x="4" y="2.5" width="16" height="19" rx="2.2" stroke="currentColor" stroke-width="1.6"/><line x1="10.5" y1="18.5" x2="13.5" y2="18.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
          laptop:
            '<svg class="chat-dev" viewBox="0 0 24 24" fill="none"><rect x="4" y="5" width="16" height="11" rx="1.6" stroke="currentColor" stroke-width="1.6"/><path d="M2 19.5h20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
        };
        function deviceIcon(label) {
          if (label === "iPhone" || label === "Android") return DEV_ICONS.phone;
          if (label === "iPad" || label === "Android tablet")
            return DEV_ICONS.tablet;
          return DEV_ICONS.laptop;
        }

        async function collectLocation() {
          if (myLocation) return;
          try {
            const ctrl = new AbortController();
            const to = setTimeout(() => ctrl.abort(), 3500);
            const r = await fetch("https://ipwho.is/", {
              signal: ctrl.signal,
            });
            clearTimeout(to);
            const d = await r.json();
            if (d && d.success !== false) {
              myLocation =
                [d.city, d.country_code].filter(Boolean).join(", ") ||
                d.country ||
                "";
            }
          } catch (e) {}
        }

        function messagePrompt() {
          promptEl.classList.remove("is-error");
          promptEl.innerHTML = "chatting as ";
          const b = document.createElement("b");
          b.textContent = chatName; // textContent => XSS-safe
          promptEl.appendChild(b);
        }

        function cooldownHint() {
          if (hintTimer) clearTimeout(hintTimer);
          promptEl.textContent = "easy — give it a sec…";
          hintTimer = setTimeout(messagePrompt, 1400);
        }

        function timeAgo(iso) {
          const then = iso ? new Date(iso).getTime() : NaN;
          if (isNaN(then)) return "";
          const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
          if (s < 10) return "just now";
          if (s < 60) return s + "s ago";
          const m = Math.floor(s / 60);
          if (m < 60) return m + "m ago";
          const h = Math.floor(m / 60);
          if (h < 24) return h + "h ago";
          const d = Math.floor(h / 24);
          if (d < 7) return d + "d ago";
          const w = Math.floor(d / 7);
          if (w < 5) return w + "w ago";
          const mo = Math.floor(d / 30);
          if (mo < 12) return mo + "mo ago";
          return Math.floor(d / 365) + "y ago";
        }
        function updateTimes() {
          messagesEl.querySelectorAll(".chat-time").forEach((el) => {
            el.textContent = timeAgo(el.dataset.at);
          });
        }

        function isOffensive(text) {
          const t = (text || "").toLowerCase();
          for (const w of BAD_LOOSE) {
            if (t.indexOf(w) !== -1) return true;
          }
          for (const w of BAD_STRICT) {
            try {
              if (
                new RegExp(
                  "\\b" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b",
                  "u",
                ).test(t)
              )
                return true;
            } catch (e) {}
          }
          return false;
        }
        function containsLink(text) {
          const t = (text || "").toLowerCase();
          if (/https?:\/\//.test(t)) return true;
          if (/(?:^|[^a-z0-9])www\.[a-z0-9]/.test(t)) return true;
          try {
            return new RegExp(
              "[a-z0-9][a-z0-9-]*\\.(?:" + LINK_TLDS.join("|") + ")\\b",
            ).test(t);
          } catch (e) {
            return false;
          }
        }
        function linkHint() {
          if (hintTimer) clearTimeout(hintTimer);
          promptEl.textContent = "links aren't allowed in chat";
          hintTimer = setTimeout(messagePrompt, 2400);
        }

        function openKindnessTab() {
          window.open(KIND_URL, "_blank", "noopener");
        }
        function blockedHint() {
          if (hintTimer) clearTimeout(hintTimer);
          promptEl.textContent = "let's keep it kind — opening a guide for you";
          hintTimer = setTimeout(messagePrompt, 2800);
        }

        function startCooldown() {
          lastSent = Date.now();
        }

        function updateFades() {
          const el = messagesEl;
          const canScroll = el.scrollHeight - el.clientHeight > 4;
          el.classList.toggle("fade-top", canScroll && el.scrollTop > 4);
          el.classList.toggle(
            "fade-bottom",
            canScroll && el.scrollHeight - el.scrollTop - el.clientHeight > 4,
          );
        }
        const COUNT_ICON =
          '<svg viewBox="0 0 24 24" fill="none"><path d="M4 5.5h16v10H10l-4.5 4v-4H4z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>';
        function updateCount() {
          countEl.innerHTML =
            totalCount > 0
              ? COUNT_ICON +
                "<span>" +
                totalCount +
                (totalCount === 1 ? " message" : " messages") +
                "</span>"
              : "";
          if (connText) {
            const c = document.createElement("span");
            c.className = "chat-conn";
            c.textContent = (totalCount > 0 ? "· " : "") + connText;
            countEl.appendChild(c);
          }
        }
        function setConn(t) {
          if (connText === t) return;
          connText = t;
          updateCount();
        }
        function showStatus(text, kind) {
          clearStatus();
          const p = document.createElement("p");
          p.className = "chat-empty";
          p.dataset.kind = kind;
          p.textContent = text;
          messagesEl.appendChild(p);
        }
        function clearStatus() {
          const el = messagesEl.querySelector(".chat-empty");
          if (el) el.remove();
        }
        function describeError(err) {
          switch (err && err.kind) {
            case "offline":
              return "you're offline";
            case "timeout":
              return "the server took too long to respond";
            case "network":
              return "couldn't reach the chat server";
            case "parse":
              return "the chat server sent an unexpected response";
            case "http":
              if (err.status === 404) return "chat server not found (404)";
              if (err.status === 419) return "session expired, refresh the page";
              if (err.status === 429) return "too many requests, slow down";
              return "server error (" + err.status + ")";
          }
          return "something went wrong";
        }
        // One place for every network call: timeout, JSON check, typed errors.
        async function request(method, query, body) {
          const ctrl = new AbortController();
          const to = setTimeout(() => ctrl.abort(), 10000);
          let res;
          try {
            res = await fetch(API + (query || ""), {
              method: method,
              cache: "no-store",
              signal: ctrl.signal,
              headers: Object.assign(
                { Accept: "application/json" },
                body ? { "Content-Type": "application/json" } : {},
                body ? csrfHeaders() : {},
              ),
              body: body ? JSON.stringify(body) : undefined,
            });
          } catch (err) {
            const e = new Error("network");
            e.kind =
              navigator.onLine === false
                ? "offline"
                : err && err.name === "AbortError"
                  ? "timeout"
                  : "network";
            throw e;
          } finally {
            clearTimeout(to);
          }
          let data = null;
          if ((res.headers.get("content-type") || "").indexOf("json") !== -1) {
            try {
              data = await res.json();
            } catch (e2) {}
          }
          if (!res.ok) {
            const e = new Error("http");
            e.kind = "http";
            e.status = res.status;
            e.data = data;
            throw e;
          }
          if (data === null) {
            const e = new Error("parse");
            e.kind = "parse";
            throw e;
          }
          return data;
        }
        messagesEl.addEventListener("scroll", updateFades, {
          passive: true,
        });

        function trimMessages() {
          const items = messagesEl.querySelectorAll(".chat-item");
          if (items.length > MAX_VISIBLE) {
            for (let i = 0; i < items.length - MAX_VISIBLE; i++)
              items[i].remove();
          }
          updateFades();
        }

        function setPhase(p) {
          phase = p;
          if (p === "name") {
            promptEl.textContent = "what's your name?";
            inputEl.placeholder = "your name";
            inputEl.maxLength = 40;
            sendEl.textContent = "next ↵";
          } else {
            messagePrompt();
            inputEl.placeholder = "say something…";
            inputEl.maxLength = 500;
            sendEl.textContent = "send ↵";
          }
          if (p === "message") {
            if (window.playgroundShow) window.playgroundShow(chatName);
          } else if (window.playgroundHide) window.playgroundHide();
          inputEl.value = "";
          inputEl.focus();
        }

        function animateIn(item) {
          const full = item.offsetHeight;
          item.style.overflow = "hidden";
          item.style.height = "0px";
          item.style.marginTop = "-12px";
          item.style.opacity = "0";
          item.style.filter = "blur(7px)";
          item.style.transform = "translateY(8px)";
          void item.offsetHeight;
          item.style.transition =
            "height .42s cubic-bezier(.16,1,.3,1), margin-top .42s cubic-bezier(.16,1,.3,1), opacity .42s ease, filter .5s ease, transform .42s cubic-bezier(.16,1,.3,1)";
          requestAnimationFrame(() => {
            item.style.height = full + "px";
            item.style.marginTop = "0px";
            item.style.opacity = "1";
            item.style.filter = "blur(0)";
            item.style.transform = "translateY(0)";
          });
          const done = (e) => {
            if (e.propertyName !== "height") return;
            item.style.transition = "";
            item.style.height = "";
            item.style.overflow = "";
            item.style.marginTop = "";
            item.style.transform = "";
            item.style.opacity = "";
            item.style.filter = "";
            updateFades();
            item.removeEventListener("transitionend", done);
          };
          item.addEventListener("transitionend", done);
        }

        function addMessage(m, animate) {
          const id = Number(m.id);
          if (!isFinite(id) || seen.has(id)) return false;
          seen.add(id);
          m = Object.assign({}, m, { id: id });
          const item = document.createElement("div");
          item.className = "chat-item";
          const img = document.createElement("img");
          img.className = "chat-avatar";
          img.alt = "";
          img.loading = "lazy";
          // if the avatar service is unreachable show the empty ring, not a broken-image icon
          img.onerror = function () {
            this.onerror = null;
            this.removeAttribute("src");
          };
          img.src = avatarUrl(m.name);
          const body = document.createElement("div");
          body.className = "chat-body";
          const a = document.createElement("span");
          a.className = "chat-author";
          const nm = document.createElement("span");
          nm.className = "chat-name-txt";
          nm.textContent = m.name;
          a.appendChild(nm);
          if (m.location) {
            const sep = document.createElement("span");
            sep.className = "chat-sep";
            sep.textContent = "·";
            const loc = document.createElement("span");
            loc.className = "chat-loc";
            loc.textContent = m.location;
            a.appendChild(sep);
            a.appendChild(loc);
          }
          if (m.device) {
            const dv = document.createElement("span");
            dv.className = "chat-dev-wrap";
            dv.title = m.device;
            dv.innerHTML = deviceIcon(m.device); // fixed-set SVG, never user input
            a.appendChild(dv);
          }
          if (m.at) {
            const tsep = document.createElement("span");
            tsep.className = "chat-sep";
            tsep.textContent = "·";
            const tm = document.createElement("span");
            tm.className = "chat-time";
            tm.dataset.at = m.at;
            tm.textContent = timeAgo(m.at);
            a.appendChild(tsep);
            a.appendChild(tm);
          }
          const bub = document.createElement("div");
          bub.className = "chat-bubble";
          bub.textContent = m.message; // textContent keeps it XSS-safe
          body.appendChild(a);
          body.appendChild(bub);
          item.appendChild(img);
          item.appendChild(body);
          messagesEl.appendChild(item);
          lastId = Math.max(lastId, m.id);
          if (animate) animateIn(item);
          return true;
        }

        function scrollBottom() {
          messagesEl.scrollTop = messagesEl.scrollHeight;
        }
        let scrollAnim = null;
        function smoothScrollBottom(maxMs) {
          const el = messagesEl;
          if (scrollAnim) cancelAnimationFrame(scrollAnim);
          const startT = performance.now(),
            limit = maxMs || 1500;
          let settled = 0;
          const step = (now) => {
            const target = Math.max(0, el.scrollHeight - el.clientHeight);
            const dist = target - el.scrollTop;
            if (dist > 0.5) {
              el.scrollTop += dist * 0.2;
              settled = 0;
            } else {
              el.scrollTop = target;
              settled++;
            }
            updateFades();
            if (settled < 3 && now - startT < limit) {
              scrollAnim = requestAnimationFrame(step);
            } else {
              el.scrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
              scrollAnim = null;
              updateFades();
            }
          };
          scrollAnim = requestAnimationFrame(step);
        }

        async function load() {
          if (loading) return;
          loading = true;
          if (!initialLoaded && !messagesEl.querySelector(".chat-item"))
            showStatus("loading messages…", "loading");
          try {
            const data = await request("GET", lastId ? "?after=" + lastId : "");
            const list = Array.isArray(data) ? data : data.messages;
            if (!Array.isArray(list)) {
              const e = new Error("parse");
              e.kind = "parse";
              throw e;
            }
            setConn("");
            const fresh = list
              .filter((m) => m && m.id != null && !seen.has(Number(m.id)))
              .sort((a, b) => Number(a.id) - Number(b.id));
            const nearBottom =
              messagesEl.scrollHeight -
                messagesEl.scrollTop -
                messagesEl.clientHeight <
              90;
            if (fresh.length) {
              clearStatus();
              fresh.forEach((m) => addMessage(m, initialLoaded));
              trimMessages();
              updateTimes();
              if (!initialLoaded) scrollBottom();
              else if (nearBottom) smoothScrollBottom(); // never yank a reader away
              requestAnimationFrame(updateFades);
            } else if (!messagesEl.querySelector(".chat-item")) {
              showStatus("no messages yet — say hi 👋", "empty");
            }
            totalCount =
              !Array.isArray(data) && typeof data.total === "number"
                ? Math.max(data.total, seen.size)
                : seen.size;
            initialLoaded = true;
            updateCount();
          } catch (e) {
            const why = describeError(e);
            if (!messagesEl.querySelector(".chat-item"))
              showStatus("couldn't load messages — " + why, "error");
            else setConn(why + " · retrying");
          } finally {
            loading = false;
          }
        }

        function sendFailed(text) {
          if (hintTimer) clearTimeout(hintTimer);
          promptEl.classList.add("is-error");
          promptEl.textContent = text;
          hintTimer = setTimeout(messagePrompt, 5000);
        }

        async function send(e) {
          e.preventDefault();
          if (sending) return; // one submission at a time
          const val = inputEl.value.trim();
          if (!val) return; // empty / whitespace-only

          if (phase === "name") {
            if (containsLink(val)) {
              if (hintTimer) clearTimeout(hintTimer);
              promptEl.textContent = "name can't contain a link";
              hintTimer = setTimeout(() => {
                promptEl.textContent = "what's your name?";
              }, 2400);
              return;
            }
            chatName = val;
            try {
              localStorage.setItem("chatName", chatName);
            } catch (e2) {}
            setPhase("message");
            return;
          }

          if (isOffensive(val) || isOffensive(chatName)) {
            inputEl.value = "";
            blockedHint();
            openKindnessTab();
            return;
          }

          if (containsLink(val) || containsLink(chatName)) {
            linkHint();
            return;
          }

          if (Date.now() - lastSent < SEND_COOLDOWN) {
            cooldownHint();
            return;
          }

          sending = true;
          sendEl.setAttribute("aria-busy", "true");
          try {
            const data = await request("POST", "", {
              name: chatName,
              message: val,
              client_id: clientId,
              location: myLocation,
              device: myDevice,
            });
            const m = data && data.message;
            if (!m || m.id == null) {
              const pe = new Error("parse");
              pe.kind = "parse";
              throw pe;
            }
            // only now is it really saved: clear the field and show it
            if (inputEl.value.trim() === val) inputEl.value = "";
            clearStatus();
            setConn("");
            if (addMessage(m, true)) totalCount += 1;
            totalCount = Math.max(totalCount, seen.size);
            updateCount();
            trimMessages();
            startCooldown();
            smoothScrollBottom(); // always glide the user's own message into view
            requestAnimationFrame(updateFades);
          } catch (err) {
            if (err.kind === "http" && err.status === 422) {
              // server-side moderation backstop
              if (err.data && err.data.reason === "link") linkHint();
              else {
                inputEl.value = "";
                blockedHint();
                openKindnessTab();
              }
            } else {
              // keep the text so nothing is lost; say why it failed
              sendFailed(
                "couldn't send — " + describeError(err) + " · your message is still here",
              );
            }
          } finally {
            sending = false;
            sendEl.removeAttribute("aria-busy");
            inputEl.focus();
          }
        }
        form.addEventListener("submit", send);

        window.openChat = function () {
          clearTimeout(closeT1);
          clearTimeout(closeT2);
          overlay.classList.remove("is-closing");
          overlay.classList.add("is-visible");
          document.documentElement.style.overflow = "hidden";
          requestAnimationFrame(() => overlay.classList.add("is-open"));
          myDevice = detectDevice();
          collectLocation();
          load();
          setPhase(chatName ? "message" : "name");
          setTimeout(() => inputEl.focus(), 90);
          if (pollTimer) clearInterval(pollTimer);
          pollTimer = setInterval(load, 5000);
          if (timeTimer) clearInterval(timeTimer);
          timeTimer = setInterval(updateTimes, 20000);
        };
        window.closeChat = function () {
          if (
            !overlay.classList.contains("is-visible") ||
            overlay.classList.contains("is-closing")
          )
            return;
          document.documentElement.style.overflow = "";
          if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
          }
          if (timeTimer) {
            clearInterval(timeTimer);
            timeTimer = null;
          }
          if (window.playgroundHide) window.playgroundHide();
          overlay.classList.add("is-closing");
          closeT1 = setTimeout(() => {
            overlay.classList.remove("is-open");
            closeT2 = setTimeout(() => {
              overlay.classList.remove("is-visible", "is-closing");
            }, 380);
          }, 280);
        };
        window.chatIsOpen = function () {
          return (
            overlay.classList.contains("is-visible") ||
            overlay.classList.contains("is-closing")
          );
        };
        document.addEventListener("keydown", (e) => {
          if (e.key === "Escape" && overlay.classList.contains("is-visible"))
            closeChat();
        });
        // catch up immediately when the connection or the tab comes back
        const catchUp = () => {
          if (overlay.classList.contains("is-visible")) load();
        };
        window.addEventListener("online", catchUp);
        document.addEventListener("visibilitychange", () => {
          if (!document.hidden) catchUp();
        });
        promptEl.setAttribute("aria-live", "polite");
      })();
