      // ── Typing test: ⌘J (Mac) / Alt+J (Windows) — logic ported from asdasd.html ──
      (function () {
        const overlay = document.getElementById("typingOverlay");
        if (!overlay) return;
        const wordsEl = document.getElementById("ttWords");
        const kbEl = document.getElementById("ttKeyboard");
        const elWpm = document.getElementById("ttWpm"),
          elAcc = document.getElementById("ttAcc"),
          elTime = document.getElementById("ttTime");
        const rWpm = document.getElementById("ttResWpm"),
          rAcc = document.getElementById("ttResAcc"),
          rRaw = document.getElementById("ttResRaw"),
          rTime = document.getElementById("ttResTime");
        const verdictEl = document.getElementById("ttVerdict");
        const BRYL_WPM = 140;

        const WORD_BANK =
          "the be of and a to in he have it that for they with as not on she at by this we you do but from or which one would all will there say who make when can more if no out other so what time up go about than into could state only new year some take come these know see use get like then first any work now may such give over think most even find day also after way many must look before great back through long where much should well people down own just because good each those feel seem how high too place little world very still hand old life tell write become here show house both between need mean call under last right move thing school never same begin while number part turn real leave might want point form off child few small since against ask late home large person end open public follow during without again hold around possible head consider word program problem however lead system set order eye plan run keep face fact group play stand early course change help line".split(
            " ",
          );

        const KB_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
        const N_WORDS = 26;

        let words = [],
          wordEls = [],
          wi = 0,
          ci = 0;
        let started = false,
          finished = false,
          startTime = 0,
          rafId = null;
        let raw = 0,
          correct = 0;
        let dispWpm = 0,
          dispAcc = 100,
          dispTime = 0,
          lastStatWrite = 0;
        let isOpen = false,
          pendingRestart = false,
          closeT1 = null,
          closeT2 = null;
        const caretEl = document.createElement("span");
        caretEl.className = "tt-caret";
        function setConfirm(on) {
          pendingRestart = on;
          overlay.classList.toggle("is-confirming", on);
        }

        function rand(n) {
          return Math.floor(Math.random() * n);
        }
        function genWords() {
          words = Array.from(
            { length: N_WORDS },
            () => WORD_BANK[rand(WORD_BANK.length)],
          );
        }

        function buildKeyboard() {
          kbEl.innerHTML = "";
          let idx = 0;
          KB_ROWS.forEach((row) => {
            const r = document.createElement("div");
            r.className = "tt-krow";
            for (const ch of row) {
              const k = document.createElement("span");
              k.className = "tt-key";
              k.dataset.key = ch;
              k.textContent = ch;
              k.style.animationDelay = idx * 7 + "ms";
              r.appendChild(k);
              idx++;
            }
            kbEl.appendChild(r);
          });
          const r = document.createElement("div");
          r.className = "tt-krow";
          const sp = document.createElement("span");
          sp.className = "tt-key space";
          sp.dataset.key = " ";
          sp.textContent = "space";
          sp.style.animationDelay = idx * 7 + "ms";
          r.appendChild(sp);
          kbEl.appendChild(r);
        }
        function keyEl(ch) {
          try {
            return kbEl.querySelector(
              '.tt-key[data-key="' + (ch === " " ? " " : ch) + '"]',
            );
          } catch (e) {
            return null;
          }
        }
        function flashKey(ch) {
          const k = keyEl(ch);
          if (k) {
            k.classList.add("active");
            setTimeout(() => k.classList.remove("active"), 110);
          }
        }
        function highlightNext() {
          kbEl
            .querySelectorAll(".tt-key.next")
            .forEach((k) => k.classList.remove("next"));
          if (finished) return;
          const cur = wordEls[wi];
          let nc = null;
          if (ci < cur.word.length) nc = cur.word[ci];
          else if (wi < words.length - 1) nc = " ";
          if (nc) {
            const k = keyEl(nc);
            if (k) k.classList.add("next");
          }
        }

        function buildText() {
          wordsEl.innerHTML = "";
          wordEls = [];
          words.forEach((w) => {
            const wEl = document.createElement("span");
            wEl.className = "tt-word";
            const chars = [];
            for (const ch of w) {
              const c = document.createElement("span");
              c.className = "tt-char";
              c.textContent = ch;
              wEl.appendChild(c);
              chars.push(c);
            }
            wordsEl.appendChild(wEl);
            wordEls.push({ el: wEl, chars: chars, word: w });
          });
          wordsEl.appendChild(caretEl);
        }

        function moveCaret() {
          const cur = wordEls[wi];
          let left, top;
          if (ci < cur.chars.length) {
            const el = cur.chars[ci];
            left = el.offsetLeft;
            top = el.offsetTop;
          } else {
            const el = cur.chars[cur.chars.length - 1];
            left = el.offsetLeft + el.offsetWidth;
            top = el.offsetTop;
          }
          caretEl.style.left = left + "px";
          caretEl.style.top = top + "px";
        }

        function start() {
          started = true;
          startTime = Date.now();
          wordsEl.classList.add("is-typing");
          cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(statsLoop);
        }
        function statsLoop(now) {
          const ms = now || 0;
          const t = started ? (Date.now() - startTime) / 1000 : 0;
          const tgtWpm = started && t > 0.5 ? correct / 5 / (t / 60) : 0;
          const tgtAcc = raw ? (correct / raw) * 100 : 100;
          dispWpm += (tgtWpm - dispWpm) * 0.16;
          dispAcc += (tgtAcc - dispAcc) * 0.16;
          dispTime += (t - dispTime) * 0.4;
          if (Math.abs(tgtWpm - dispWpm) < 0.5) dispWpm = tgtWpm;
          if (Math.abs(tgtAcc - dispAcc) < 0.5) dispAcc = tgtAcc;
          if (ms - lastStatWrite >= 240) {
            lastStatWrite = ms;
            elWpm.textContent = Math.round(dispWpm);
            elAcc.textContent = Math.round(dispAcc);
            elTime.textContent = Math.floor(dispTime + 1e-4);
          }
          if (isOpen && !finished) rafId = requestAnimationFrame(statsLoop);
        }

        function afterInput() {
          moveCaret();
          highlightNext();
          const cur = wordEls[wi];
          if (wi === words.length - 1 && ci >= cur.word.length) finish();
        }

        function handleChar(k) {
          if (finished) return;
          if (!started) start();
          const cur = wordEls[wi];
          if (ci < cur.word.length) {
            const el = cur.chars[ci];
            const ok = k === cur.word[ci];
            el.classList.add(ok ? "correct" : "incorrect");
            raw++;
            if (ok) correct++;
            ci++;
          } else if (cur.chars.length - cur.word.length < 8) {
            const ex = document.createElement("span");
            ex.className = "tt-char extra";
            ex.textContent = k;
            cur.el.appendChild(ex);
            cur.chars.push(ex);
            raw++;
            ci++;
          }
          afterInput();
        }
        function handleSpace() {
          if (finished || !started) return;
          if (wi < words.length - 1) {
            wi++;
            ci = 0;
            afterInput();
          }
        }
        function handleBackspace() {
          if (finished) return;
          if (ci > 0) {
            ci--;
            const cur = wordEls[wi];
            if (ci >= cur.word.length) {
              const ex = cur.chars.pop();
              if (ex) ex.remove();
            } else cur.chars[ci].classList.remove("correct", "incorrect");
          } else if (wi > 0) {
            wi--;
            ci = wordEls[wi].chars.length;
          }
          moveCaret();
          highlightNext();
        }

        function finish() {
          if (finished) return;
          finished = true;
          cancelAnimationFrame(rafId);
          wordsEl.classList.remove("is-typing");
          const el = Math.max(0.001, (Date.now() - startTime) / 1000);
          const wpm = Math.round(correct / 5 / (el / 60));
          const rawWpm = Math.round(raw / 5 / (el / 60));
          const acc = raw ? Math.round((correct / raw) * 100) : 100;
          rAcc.textContent = acc;
          rRaw.textContent = rawWpm;
          rTime.textContent = el.toFixed(1);
          const beat = wpm >= BRYL_WPM;
          const icon = beat
            ? '<svg class="tt-vicon" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
            : '<svg class="tt-vicon" viewBox="0 0 24 24" fill="none"><path d="M7 7l10 10M17 7L7 17" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
          verdictEl.className = "tt-verdict" + (beat ? " beat" : " miss");
          verdictEl.innerHTML =
            icon +
            "<span>" +
            (beat
              ? "you beat paul · 140 wpm"
              : "you didn't beat paul · 140 wpm") +
            "</span>";
          overlay.classList.add("show-results");
          countUp(rWpm, wpm, 750);
        }
        function countUp(el, target, dur) {
          const t0 = performance.now();
          (function tick(now) {
            const p = Math.min(1, (now - t0) / dur);
            const e = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * e);
            if (p < 1) requestAnimationFrame(tick);
            else el.textContent = target;
          })(t0);
        }

        function reset() {
          finished = false;
          started = false;
          startTime = 0;
          wi = 0;
          ci = 0;
          raw = 0;
          correct = 0;
          cancelAnimationFrame(rafId);
          overlay.classList.remove("show-results");
          setConfirm(false);
          dispWpm = 0;
          dispAcc = 100;
          dispTime = 0;
          lastStatWrite = 0;
          elWpm.textContent = "0";
          elAcc.textContent = "100";
          elTime.textContent = "0";
          genWords();
          buildText();
          requestAnimationFrame(() => {
            moveCaret();
            highlightNext();
          });
        }
        window.ttRestart = reset;

        window.openTyping = function () {
          clearTimeout(closeT1);
          clearTimeout(closeT2);
          overlay.classList.remove("is-closing");
          // Keep the Identity Tech Expanded View open and active — never
          // collapse, hide, or navigate away from it. Only close the ancillary
          // Ask Anything overlay (same behavior as the original).
          if (window.closeAsk)
            try {
              window.closeAsk();
            } catch (e) {}
          // Same as the original asdasd.html: opening the Typing Test also
          // closes the Community Chat overlay (never the expanded view).
          if (window.closeChat)
            try {
              window.closeChat();
            } catch (e) {}
          overlay.classList.add("is-visible");
          document.documentElement.style.overflow = "hidden";
          requestAnimationFrame(() => overlay.classList.add("is-open"));
          isOpen = true;
          reset();
        };
        window.closeTyping = function () {
          if (!isOpen) return;
          isOpen = false;
          cancelAnimationFrame(rafId);
          setConfirm(false);
          document.documentElement.style.overflow = "";
          overlay.classList.add("is-closing");
          closeT1 = setTimeout(() => {
            overlay.classList.remove("is-open");
            closeT2 = setTimeout(() => {
              overlay.classList.remove("is-visible", "is-closing");
            }, 380);
          }, 280);
        };
        // true while the overlay is on screen (open OR closing) so the global
        // Escape handler never collapses the expanded view underneath it.
        window.typingIsOpen = function () {
          return isOpen || overlay.classList.contains("is-visible");
        };

        buildKeyboard();

        // Alt+J / ⌘J is owned by index.html's openQuickAction() in the main
        // script (it toggles openTyping/closeTyping) — this handler only owns
        // the in-test keystrokes so the two never double-fire on one keypress.
        document.addEventListener("keydown", (e) => {
          if (!isOpen) return;
          if (e.key === "Escape") {
            e.preventDefault();
            if (pendingRestart) setConfirm(false);
            else closeTyping();
            return;
          }
          if (e.metaKey || e.ctrlKey || e.altKey) return;
          if (e.key === "Tab") {
            e.preventDefault();
            if (started && !finished) setConfirm(true);
            else reset();
            return;
          }
          if (e.key === "Enter") {
            if (pendingRestart || finished) {
              e.preventDefault();
              reset();
            }
            return;
          }
          if (pendingRestart) return;
          if (e.key === "Backspace") {
            e.preventDefault();
            flashKey("backspace");
            handleBackspace();
            return;
          }
          if (e.key === " ") {
            e.preventDefault();
            flashKey(" ");
            finished ? reset() : handleSpace();
            return;
          }
          if (e.key.length === 1) {
            const ch = e.key.toLowerCase();
            if (/[a-z]/.test(ch)) {
              e.preventDefault();
              flashKey(ch);
              if (!finished) handleChar(ch);
            }
          }
        });
      })();
