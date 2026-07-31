      // ── Ask overlay: ⌘K (Mac) / Alt+K (Windows) — ported from asdasd.html ──
      const askOverlay = document.getElementById("askOverlay");
      const askInput = document.getElementById("askInput");
      const askText = document.getElementById("askText");
      const askContent = askOverlay.querySelector(".ask-content");
      const askTitle = askOverlay.querySelector(".ask-title");
      const askCaret = askOverlay.querySelector(".ask-caret");
      const askLoader = document.getElementById("askLoader");
      const askHead = askOverlay.querySelector(".ask-head");
      const askField = askOverlay.querySelector(".ask-field");
      const askBubble = document.getElementById("askBubble");
      const askBubbleText = document.getElementById("askBubbleText");
      const askReveal = document.getElementById("askReveal");
      const ASK_DEFAULT_TITLE = "what do you want to ask?";
      let askSeq = 0; // bumped on open/close to cancel in-flight sequences
      let askBusy = false; // true while the "answer" sequence runs

      const askSleep = (ms) => new Promise((r) => setTimeout(r, ms));

      function askResetState() {
        askBusy = false;
        askInput.removeAttribute("readonly");
        askInput.value = "";
        askText.textContent = "";
        askCaret.style.display = "";
        askField.style.display = "";
        askBubble.classList.remove("is-on");
        askBubble.style.opacity = "";
        askBubble.style.filter = "";
        askBubble.style.transition = "";
        askBubbleText.textContent = "";
        askTitle.classList.remove("is-small");
        askHead.classList.remove("is-shimmer");
        askLoader.classList.remove("is-on");
        askTitle.style.transition = "";
        askTitle.style.opacity = "";
        askTitle.style.transform = "";
        askTitle.style.filter = "";
        askTitle.textContent = ASK_DEFAULT_TITLE;
        askReveal.style.display = "none";
        askReveal.innerHTML = "";
        askReveal.style.opacity = "";
        askReveal.style.transition = "";
        askHead.style.display = "";
        askHead.style.opacity = "";
        askHead.style.transition = "";
        askHead.style.filter = "";
      }

      async function askSetTitle(text, pulse) {
        askTitle.style.transition =
          "opacity .25s ease, transform .3s cubic-bezier(.16,1,.3,1)";
        askTitle.style.opacity = "0";
        askTitle.style.transform = "translateY(6px)";
        await askSleep(250);
        askTitle.textContent = text;
        if (pulse) {
          askTitle.classList.add("is-small");
          askLoader.classList.add("is-on");
          askHead.classList.add("is-shimmer");
          askTitle.style.transition = "";
          askTitle.style.opacity = "";
          askTitle.style.transform = "";
        } else {
          askLoader.classList.remove("is-on");
          askHead.classList.remove("is-shimmer");
          askTitle.classList.add("is-small");
          askTitle.style.opacity = "1";
          askTitle.style.transform = "none";
          await askSleep(300);
        }
      }

      // ── Sniff what the browser exposes (real data) ──
      function detectBrowser(ua) {
        if (/Edg\//.test(ua))
          return "Edge " + ((ua.match(/Edg\/(\d+)/) || [])[1] || "");
        if (/OPR\//.test(ua))
          return "Opera " + ((ua.match(/OPR\/(\d+)/) || [])[1] || "");
        if (/Firefox\//.test(ua))
          return "Firefox " + ((ua.match(/Firefox\/(\d+)/) || [])[1] || "");
        if (/Chrome\//.test(ua))
          return "Chrome " + ((ua.match(/Chrome\/(\d+)/) || [])[1] || "");
        if (/Safari\//.test(ua) && /Version\//.test(ua))
          return "Safari " + ((ua.match(/Version\/(\d+)/) || [])[1] || "");
        return "your browser";
      }
      function detectOS(ua) {
        if (/Windows/.test(ua)) return "Windows";
        if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
        if (/Mac OS X/.test(ua)) return "macOS";
        if (/Android/.test(ua)) return "Android";
        if (/Linux/.test(ua)) return "Linux";
        return "your device";
      }
      async function collectData() {
        const ua = navigator.userAgent;
        const data = {
          ip: "",
          city: "",
          region: "",
          country: "",
          isp: "",
          lat: "",
          lon: "",
          os: detectOS(ua),
          browser: detectBrowser(ua),
          screen: screen.width + "×" + screen.height,
          cores: navigator.hardwareConcurrency || "?",
          ramNum: navigator.deviceMemory || null,
          lang:
            navigator.language ||
            (navigator.languages && navigator.languages[0]) ||
            "—",
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "—",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          conn:
            (navigator.connection && navigator.connection.effectiveType) || "",
          referrer: "",
        };
        try {
          if (document.referrer)
            data.referrer = new URL(document.referrer).hostname;
        } catch (e) {}
        try {
          const ctrl = new AbortController();
          const to = setTimeout(() => ctrl.abort(), 3500);
          const res = await fetch("https://ipwho.is/", { signal: ctrl.signal });
          clearTimeout(to);
          const j = await res.json();
          if (j && j.success !== false) {
            data.ip = j.ip || "";
            data.city = j.city || "";
            data.region = j.region || "";
            data.country = j.country || "";
            data.isp = (j.connection && j.connection.isp) || j.org || "";
            data.lat = j.latitude;
            data.lon = j.longitude;
            if ((!data.tz || data.tz === "—") && j.timezone && j.timezone.id)
              data.tz = j.timezone.id;
          }
        } catch (e) {}
        return data;
      }

      // ── The plot twist: interrupt loading and reveal their data ──
      async function askInterrupt(data, mySeq) {
        askBubble.style.transition = "opacity .55s ease, filter .55s ease";
        askBubble.style.filter = "blur(8px)";
        askBubble.style.opacity = "0";
        askHead.style.transition = "opacity .55s ease, filter .55s ease";
        askHead.style.filter = "blur(8px)";
        askHead.style.opacity = "0";
        await askSleep(600);
        if (mySeq !== askSeq) return;

        askBubble.classList.remove("is-on");
        askBubble.style.transition = "";
        askBubble.style.filter = "";
        askBubble.style.opacity = "";
        askLoader.classList.remove("is-on");
        askHead.classList.remove("is-shimmer");
        askTitle.textContent = "";
        askTitle.classList.remove("is-small");
        askTitle.style.opacity = "";
        askTitle.style.transform = "";
        askTitle.style.filter = "";
        askHead.style.transition = "";
        askHead.style.filter = "";
        askHead.style.opacity = "";
        await askSleep(300);
        if (mySeq !== askSeq) return;

        const loc = [data.city, data.region, data.country]
          .filter(Boolean)
          .join(", ");
        const msgs = [
          "before i answer",
          "here is what your browser already shared the moment you opened this site",
        ];
        if (loc) msgs.push("you are currently in " + loc);
        if (data.ip) msgs.push("your public ip address is " + data.ip);
        if (data.isp) msgs.push("you are connected through " + data.isp);
        if (data.lat && data.lon)
          msgs.push(
            "your approximate coordinates are around " +
              (+data.lat).toFixed(2) +
              ", " +
              (+data.lon).toFixed(2),
          );
        msgs.push(
          "you are on a " +
            data.os +
            " device with " +
            data.cores +
            " processor cores" +
            (data.ramNum ? " and " + data.ramNum + "gb of memory" : ""),
        );
        msgs.push(
          "you are browsing with " + data.browser + " set to " + data.lang,
        );
        msgs.push(
          "your timezone is " +
            data.tz +
            " and it is around " +
            String(data.time).toLowerCase() +
            " where you are",
        );
        if (data.conn) msgs.push("you are on a " + data.conn + " connection");
        if (data.referrer) msgs.push("you arrived here from " + data.referrer);
        msgs.push("none of this needed your permission");
        msgs.push(
          "your browser shares it with every website you open, automatically",
        );
        msgs.push("so be mindful of what you click, and who you trust online");

        for (const m of msgs) {
          await askSetTitle(m, false);
          if (mySeq !== askSeq) return;
          await askSleep(2500);
          if (mySeq !== askSeq) return;
        }
      }

      async function askSubmit() {
        if (askBusy) return;
        const query = askInput.value.trim();
        if (!query) return;

        askBusy = true;
        const mySeq = askSeq;
        askInput.setAttribute("readonly", "");
        askCaret.style.display = "none";

        askBubbleText.textContent = query;
        askBubble.classList.add("is-on");
        askField.style.display = "none";

        const dataPromise = collectData();

        await askSetTitle("thinking...", true);
        await askSleep(1900);
        if (mySeq !== askSeq) return;

        await askSetTitle("analyzing...", true);
        await askSleep(1500);
        if (mySeq !== askSeq) return;

        const data = await dataPromise;
        if (mySeq !== askSeq) return;
        await askInterrupt(data, mySeq);
        if (mySeq !== askSeq) return;

        await askSetTitle("as for your question", false);
        await askSleep(2000);
        if (mySeq !== askSeq) return;

        await askSetTitle(
          "i don't want to waste tokens on that, search for it yourself :)",
          false,
        );
        await askSleep(2200);
        if (mySeq !== askSeq) return;

        window.open(
          "https://www.google.com/search?q=" + encodeURIComponent(query),
          "_blank",
          "noopener",
        );
      }

      function openAsk() {
        askSeq++;
        askResetState();
        askContent.style.transition = "";
        askContent.style.opacity = "";
        askContent.style.transform = "";
        askOverlay.classList.add("is-visible");
        document.documentElement.style.overflow = "hidden";
        requestAnimationFrame(() => askOverlay.classList.add("is-open"));
        setTimeout(() => askInput.focus(), 60);
      }
      function closeAsk() {
        askSeq++;
        document.documentElement.style.overflow = "";
        askInput.blur();
        askContent.style.transition = "opacity .22s ease, transform .22s ease";
        askContent.style.opacity = "0";
        askContent.style.transform = "translateY(6px)";
        setTimeout(() => askOverlay.classList.remove("is-open"), 210);
        setTimeout(() => {
          askOverlay.classList.remove("is-visible");
          askContent.style.transition = "";
          askContent.style.opacity = "";
          askContent.style.transform = "";
          askResetState();
        }, 640);
      }
      function focusAsk() {
        if (!askBusy) askInput.focus();
      }
      function askIsOpen() {
        return askOverlay.classList.contains("is-visible");
      }

      askInput.addEventListener("input", () => {
        askText.textContent = askInput.value;
      });
      askInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          askSubmit();
        }
      });

      // Alt+K / ⌘K opens or closes the Ask Anything quick action. It reuses
      // openQuickAction("ask") — the exact same handler the Quick Actions
      // button uses — so the button and the shortcut share identical logic.
      document.addEventListener("keydown", (e) => {
        if ((e.metaKey || e.altKey) && e.code === "KeyK") {
          var shortcutCard = document.querySelector(".portfolio-card");
          if (
            !shortcutCard ||
            !shortcutCard.classList.contains("identity-expanded")
          ) {
            return;
          }
          e.preventDefault();
          openQuickAction("ask");
          return;
        }
        if (e.key === "Escape" && askIsOpen()) closeAsk();
      });

      (function () {
        const isMac = /Mac|iPhone|iPad/.test(
          navigator.platform || navigator.userAgent || "",
        );
        document.querySelectorAll(".ask-mod-key").forEach((el) => {
          el.textContent = isMac ? "⌘" : "Alt";
        });
      })();
