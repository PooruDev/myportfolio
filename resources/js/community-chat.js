      // ── Community Chat: name → message phases, realtime sync (Firebase Realtime
      // Database + anonymous auth), message handling, moderation, cooldowns,
      // rendering — logic ported 1:1 from asdasd.html. Opening this overlay
      // never collapses, hides, or navigates away from the Identity Expanded
      // View — the expanded view stays open and active behind the chat (same
      // pattern as the Ask / Typing overlays).
      (function () {
        const overlay = document.getElementById("chatOverlay");
        if (!overlay) return;
        const messagesEl = document.getElementById("chatMessages");
        const countEl = document.getElementById("chatCount");
        const form = document.getElementById("chatForm");
        const inputEl = document.getElementById("chatInput");
        const promptEl = document.getElementById("chatPrompt");
        const sendEl = document.getElementById("chatSend");
        // Firebase adapter (resources/js/firebase-init.js). Loaded lazily with a
        // dynamic import() the first time the chat is used, so nothing is
        // downloaded or connected until a visitor opens it. Must be read here,
        // while this script is still executing (document.currentScript).
        const FB_MODULE =
          document.currentScript && document.currentScript.src
            ? new URL("firebase-init.js", document.currentScript.src).href
            : new URL("resources/js/firebase-init.js", document.baseURI).href;
        let fbPromise = null;
        function getFirebase() {
          if (!fbPromise) {
            fbPromise = import(FB_MODULE)
              .then((m) => m.loadChatFirebase())
              .catch((err) => {
                fbPromise = null; // allow a retry
                if (err && !err.kind) err.kind = "load";
                throw err;
              });
          }
          return fbPromise;
        }
        const seen = new Set(); // message ids already rendered (de-dupe)
        let sending = false; // true while a write is in flight (no duplicate submits)
        let initialLoaded = false;
        let connText = ""; // connection problem shown next to the message count
        let unsub = null; // active realtime subscription (null while closed)
        let attachSeq = 0; // bumped on every attach/detach to cancel stale async work
        let attachInFlight = false;
        let wasConnected = false;
        let myUid = ""; // anonymous Firebase uid of this visitor
        let pending = null; // { val, key } of a send that didn't confirm (retry-safe)
        let closeT1 = null,
          closeT2 = null;
        let phase = "name";
        let clientId = "";
        let chatName = "";
        let myDevice = "";
        let myLocation = "";
        let locationPromise = null;
        let locationAttempted = false;
        const MAX_VISIBLE = 60; // keep a scrollable history in the DOM (bounded)
        let totalCount = 0; // messages currently loaded (for the count label)
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
          if (myLocation || locationAttempted) return locationPromise;
          locationAttempted = true;
          locationPromise = (async () => {
            const ctrl = new AbortController();
            const to = setTimeout(() => ctrl.abort(), 3500);
            try {
              const url = "https://ipwho.is/";
              const r = await fetch(url, {
                signal: ctrl.signal,
              });
              if (!r.ok) {
                console.warn("[chat] location unavailable; using Unknown", {
                  url: r.url || url,
                  status: r.status,
                });
                return;
              }
              const d = await r.json();
              if (d && d.success !== false) {
                myLocation =
                  [d.city, d.country_code].filter(Boolean).join(", ") ||
                  d.country ||
                  "";
              } else {
                console.warn("[chat] location unavailable; using Unknown", {
                  url: r.url || url,
                  status: r.status,
                });
              }
            } catch (e) {
              console.warn("[chat] location unavailable; using Unknown", {
                url: "https://ipwho.is/",
                reason:
                  e && e.name === "AbortError" ? "timeout" : "network",
              });
            } finally {
              clearTimeout(to);
              locationPromise = null;
            }
          })();
          return locationPromise;
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

        // `at` is a millisecond epoch (Firebase server timestamp); an ISO string
        // is still accepted.
        function timeAgo(at) {
          const n = Number(at);
          const then = at ? (isFinite(n) ? n : new Date(at).getTime()) : NaN;
          if (isNaN(then) || then <= 0) return "";
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
          // count of the messages currently loaded in the chat window
          totalCount = messagesEl.querySelectorAll(".chat-item").length;
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
            case "load":
              return "couldn't load the chat module";
            case "config":
              return "chat isn't configured yet";
            case "auth":
              return "couldn't sign in to chat";
            case "denied":
              return "the chat database refused the request";
          }
          return "something went wrong";
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
          const id = m && m.id != null ? String(m.id) : "";
          if (!id || seen.has(id)) return false; // Firebase push ids are strings
          seen.add(id);
          m = Object.assign({}, m, { id: id });
          const item = document.createElement("div");
          item.className = "chat-item";
          item.dataset.id = id;
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

        // ── Realtime handlers (called by the Firebase adapter) ──
        function nearBottom() {
          return (
            messagesEl.scrollHeight -
              messagesEl.scrollTop -
              messagesEl.clientHeight <
            90
          );
        }
        // The listener is the single render path for every message, including
        // the visitor's own (Firebase raises it locally right away), so a
        // message can never be drawn twice.
        function onAdded(m, isInitial) {
          const wasNear = nearBottom();
          clearStatus();
          if (!addMessage(m, !isInitial)) return;
          trimMessages();
          updateCount();
          if (isInitial) return; // history batch: scrolled once in onInitial()
          if (m.uid === myUid || wasNear) smoothScrollBottom(); // never yank a reader away
          requestAnimationFrame(updateFades);
        }
        function onRemoved(id) {
          id = String(id);
          seen.delete(id);
          let el = null;
          messagesEl.querySelectorAll(".chat-item").forEach((n) => {
            if (n.dataset.id === id) el = n;
          });
          if (el) el.remove(); // also covers a write the rules rejected
          updateCount();
          updateFades();
        }
        function onInitial() {
          initialLoaded = true;
          clearStatus();
          if (!messagesEl.querySelector(".chat-item"))
            showStatus("no messages yet — say hi 👋", "empty");
          else scrollBottom();
          updateTimes();
          updateCount();
          requestAnimationFrame(updateFades);
        }
        function onConnection(ok) {
          if (ok) {
            wasConnected = true;
            setConn("");
          } else if (wasConnected) setConn("connection lost · reconnecting");
        }
        function onError(err) {
          const why = describeError(err);
          detach();
          if (!messagesEl.querySelector(".chat-item"))
            showStatus("couldn't load messages — " + why, "error");
          else setConn(why);
        }

        // Attach the realtime listeners (after anonymous sign-in). Safe to call
        // repeatedly: it is a no-op while attached or already attaching.
        async function attach() {
          if (unsub || attachInFlight) return;
          attachInFlight = true;
          const mySeq = ++attachSeq;
          initialLoaded = false;
          wasConnected = false;
          setConn("");
          messagesEl.querySelectorAll(".chat-item").forEach((n) => n.remove());
          seen.clear(); // the history is replayed on attach
          updateCount();
          showStatus("loading messages…", "loading");
          try {
            if (navigator.onLine === false) {
              const oe = new Error("offline");
              oe.kind = "offline";
              throw oe;
            }
            const fb = await getFirebase();
            const uid = await fb.ensureAuth();
            if (mySeq !== attachSeq) return; // chat was closed meanwhile
            myUid = uid;
            unsub = fb.subscribe({
              onAdded: onAdded,
              onRemoved: onRemoved,
              onInitial: onInitial,
              onConnection: onConnection,
              onError: onError,
            });
          } catch (e) {
            if (mySeq !== attachSeq) return;
            showStatus("couldn't load messages — " + describeError(e), "error");
          } finally {
            if (mySeq === attachSeq) attachInFlight = false;
          }
        }
        function detach() {
          attachSeq++; // invalidates any attach still awaiting
          attachInFlight = false;
          if (unsub) {
            try {
              unsub();
            } catch (e) {}
            unsub = null;
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
            const fb = await getFirebase();
            await fb.ensureAuth();
            // A retry of text that didn't confirm reuses its push id, so a late
            // first write and the retry can never produce two messages.
            const retry = !!(pending && pending.val === val);
            const key = retry ? pending.key : fb.newKey();
            pending = { val: val, key: key };
            try {
              await fb.send(key, {
                name: chatName,
                message: val,
                location: myLocation || "Unknown",
                device: myDevice,
              });
            } catch (se) {
              // "denied" on a retry usually means the earlier attempt landed
              const landed =
                retry &&
                se &&
                se.kind === "denied" &&
                (await fb.exists(key).catch(() => false));
              if (!landed) throw se;
            }
            pending = null;
            // only now is it really saved: clear the field (the listener shows it)
            if (inputEl.value.trim() === val) inputEl.value = "";
            setConn("");
            startCooldown();
            smoothScrollBottom(); // always glide the user's own message into view
            requestAnimationFrame(updateFades);
          } catch (err) {
            if (err && err.kind === "denied") {
              pending = null; // the server said no: next try is a fresh message
              sendFailed(
                "couldn't send — rejected (too fast, or not allowed) · your message is still here",
              );
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
          attach();
          setPhase(chatName ? "message" : "name");
          setTimeout(() => inputEl.focus(), 90);
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
          detach();
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
        // re-attach when the connection or the tab comes back after a failed attach
        const catchUp = () => {
          if (
            overlay.classList.contains("is-visible") &&
            !overlay.classList.contains("is-closing") &&
            !unsub
          )
            attach();
        };
        window.addEventListener("online", catchUp);
        document.addEventListener("visibilitychange", () => {
          if (!document.hidden) catchUp();
        });
        promptEl.setAttribute("aria-live", "polite");
      })();
