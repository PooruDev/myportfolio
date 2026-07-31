      (function () {
        /* ── Audio elements (reuses same pattern as asdasd.html) ── */
        const SFX = {
          step: new Audio("resources/audio/step.wav"),
          collision: new Audio("resources/audio/collision.wav"),
        };
        Object.values(SFX).forEach(function (a) {
          a.volume = 0.13;
          a.preload = "auto";
        });

        let sfxUnlocked = false;
        let lastStep = 0;
        let lastColl = 0;
        let lastCollKey = "";

        function unlockSfx() {
          if (sfxUnlocked) return;
          sfxUnlocked = true;
          Object.values(SFX).forEach(function (a) {
            try {
              a.muted = true;
              var p = a.play();
              if (p && p.then)
                p.then(function () {
                  a.pause();
                  a.currentTime = 0;
                  a.muted = false;
                }).catch(function () {
                  a.muted = false;
                });
            } catch (e) {}
          });
        }

        function playSfx(name) {
          if (!sfxUnlocked) return;
          var a = SFX[name];
          if (!a) return;
          try {
            a.currentTime = 0;
            a.play();
          } catch (e) {}
        }

        function playStep(now) {
          if (now - lastStep >= 70) {
            lastStep = now;
            playSfx("step");
          }
        }

        function playCollision(key) {
          var now = Date.now();
          if (now - lastColl < 350 && key === lastCollKey) return;
          lastColl = now;
          lastCollKey = key;
          playSfx("collision");
        }

        /* ── Unlock on first user interaction ── */
        var unlockEvents = [
          "click",
          "keydown",
          "touchstart",
          "pointerdown",
          "mousedown",
        ];
        function onFirstGesture() {
          unlockSfx();
          unlockEvents.forEach(function (ev) {
            document.removeEventListener(ev, onFirstGesture, { capture: true });
          });
        }
        unlockEvents.forEach(function (ev) {
          document.addEventListener(ev, onFirstGesture, { capture: true });
        });

        /* ── Find all clickable / interactive elements and wire sounds ── */
        var INTERACTIVE_SELECTORS = [
          "a",
          "button",
          ".glass-card",
          ".glass-parent",
          ".marquee-item",
          ".tech-item",
          ".tag",
          ".social-btn",
          ".achievement-item",
          ".theme-opt",
          ".deck-card",
          ".expand-overlay",
          ".expand-content",
          ".identity-profile-card",
          ".identity-action-btn",
          ".competitions-close-btn",
          ".gallery-close-btn",
          ".projects-close-btn",
          ".tech-close-btn",
          ".identity-close-btn",
          ".gallery-item",
          ".project-doc-card",
          "[onclick]",
          "[data-lucide]",
        ].join(",");

        function initSounds() {
          var els = document.querySelectorAll(INTERACTIVE_SELECTORS);
          els.forEach(function (el) {
            el.classList.add("sfx-hover");
            el.addEventListener("click", function (e) {
              playStep(performance.now());
            });
          });

          // Also hook all elements with an onclick attribute that are <a>, <button>, or have cursor:pointer
          document.querySelectorAll("[onclick]").forEach(function (el) {
            // avoid double-wiring elements already covered above
            if (!el.classList.contains("sfx-hover")) {
              el.classList.add("sfx-hover");
              el.addEventListener("click", function (e) {
                playStep(performance.now());
              });
            }
          });

          // Keyboard shortcuts (⌘K, ⌘J, Escape) — step sound when they close/trigger overlays
          document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" || e.metaKey || e.altKey) {
              setTimeout(function () {
                playStep(performance.now());
              }, 50);
            }
          });
        }

        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", initSounds);
        } else {
          initSounds();
        }

        // Re-init sounds when expanded views are toggled (new interactive content appears)
        var origOpenExpand = window.openExpand;
        if (origOpenExpand) {
          window.openExpand = function (type, idx) {
            origOpenExpand(type, idx);
            setTimeout(initSounds, 200);
          };
        }
        var origProjectsExpanded = window.openProjectsExpanded;
        if (origProjectsExpanded) {
          window.openProjectsExpanded = function (idx) {
            origProjectsExpanded(idx);
            setTimeout(initSounds, 200);
          };
        }
        // Watch for identity overlay opening (which adds new clickable cards)
        var origIdentityOverlay = window.openIdentityOverlay;
        if (origIdentityOverlay) {
          window.openIdentityOverlay = function () {
            origIdentityOverlay();
            setTimeout(initSounds, 250);
          };
        }

        // Re-init sounds on expanded views after render
        var origCloseAll = window.closeAllExpanded;
        if (origCloseAll) {
          window.closeAllExpanded = function () {
            origCloseAll();
            setTimeout(initSounds, 150);
          };
        }
      })();
