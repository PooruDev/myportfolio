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
        const CSRF = "3DH61Tz7oNGMG852QCCP67RNEtlkwUBOG5dMI9FU";
        let lastId = 0;
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
        const SEND_COOLDOWN = 8000; // min ms between a user's own messages (anti-spam)
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
          sendEl.disabled = true;
          setTimeout(() => {
            sendEl.disabled = false;
          }, SEND_COOLDOWN);
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
          const item = document.createElement("div");
          item.className = "chat-item";
          const img = document.createElement("img");
          img.className = "chat-avatar";
          img.alt = "";
          img.loading = "lazy";
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

        async function load(initial) {
          try {
            const res = await fetch(
              "/chat" + (lastId ? "?after=" + lastId : ""),
              { cache: "no-store" },
            );
            const data = await res.json();
            if (initial && typeof data.total === "number") {
              totalCount = data.total;
              updateCount();
            }
            if (
              initial &&
              data.messages.length === 0 &&
              messagesEl.children.length === 0
            ) {
              messagesEl.innerHTML =
                '<p class="chat-empty">no messages yet — say hi 👋</p>';
              return;
            }
            if (data.messages.length) {
              const empty = messagesEl.querySelector(".chat-empty");
              if (empty) empty.remove();
              const nearBottom =
                messagesEl.scrollHeight -
                  messagesEl.scrollTop -
                  messagesEl.clientHeight <
                90;
              data.messages.forEach((m) => addMessage(m, !initial));
              if (!initial) {
                totalCount += data.messages.length;
                updateCount();
              }
              trimMessages();
              updateTimes();
              if (initial) scrollBottom();
              else if (nearBottom) smoothScrollBottom();
              requestAnimationFrame(updateFades);
            }
          } catch (e) {}
        }

        async function send(e) {
          e.preventDefault();
          const val = inputEl.value.trim();
          if (!val) return;

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

          inputEl.value = "";
          try {
            const res = await fetch("/chat", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": CSRF,
                Accept: "application/json",
              },
              body: JSON.stringify({
                name: chatName,
                message: val,
                client_id: clientId,
                location: myLocation,
                device: myDevice,
              }),
            });
            if (res.ok) {
              const data = await res.json();
              const empty = messagesEl.querySelector(".chat-empty");
              if (empty) empty.remove();
              addMessage(data.message, true);
              totalCount += 1;
              updateCount();
              trimMessages();
              startCooldown();
              smoothScrollBottom(); // always glide the user's own message into view
              requestAnimationFrame(updateFades);
              inputEl.focus();
            } else if (res.status === 422) {
              const d = await res.json().catch(() => ({})); // server-side backstop
              if (d.reason === "link") {
                linkHint();
              } else {
                blockedHint();
                openKindnessTab();
              }
            } else {
              inputEl.value = val; // other failure — let them retry
            }
          } catch (e3) {
            inputEl.value = val;
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
          load(lastId === 0 && messagesEl.children.length === 0);
          setPhase(chatName ? "message" : "name");
          setTimeout(() => inputEl.focus(), 90);
          if (pollTimer) clearInterval(pollTimer);
          pollTimer = setInterval(() => load(false), 8000);
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
      })();
