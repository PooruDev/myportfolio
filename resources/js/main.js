      function hydrateIcons(root) {
        const icons = {
          github:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-6a4.9 4.9 0 0 0-1.1-3.2 4.4 4.4 0 0 0-.1-3.2s-1-.3-3.3 1.3a11.3 11.3 0 0 0-6 0C7.2 1.3 6.2 1.6 6.2 1.6a4.4 4.4 0 0 0-.1 3.2A4.9 4.9 0 0 0 5 8c0 4 3 6 6 6a4.8 4.8 0 0 0-1 3.5v4"/><path d="M9 18c-4.5 2-5-2-7-2"/></svg>',
          linkedin:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6Z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>',
          discord:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 18c-1.5 1.1-3.1 2-4 2s-2.5-.9-4-2"/><path d="M7 18c-1.9-1.7-3-4-3-7 0-2 .8-4 2.2-5.4C7.3 4.8 9.3 4 12 4s4.7.8 5.8 1.6C19.2 7 20 9 20 11c0 3-1.1 5.3-3 7"/><path d="M9 11h.01"/><path d="M15 11h.01"/><path d="M9.5 14c1 .7 3 .7 5 0"/></svg>',
          mail: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
          instagram:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17.5" cy="6.5" r="1"/></svg>',
          facebook:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v9h4v-9h3.2l.8-4H14V8a1 1 0 0 1 1-1Z"/></svg>',
          twitter:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 4s-1.5 1-3 1.5c0 0-1.2-2.5-4.5-2.5-2.5 0-4.5 2-4.5 4.5 0 .5 0 1 .2 1.4C6.7 9.6 4 8 2 5.5c0 0-2 7 5 10.5-1.4 1-3 1.5-5 1.5 7 4 15 0 17-6 .7-2.2.8-4.5.3-6.5.7-.5 1.7-1.5 2.7-3Z"/></svg>',
          x: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
          trophy:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M17 4H7v3a5 5 0 0 0 10 0V4Z"/><path d="M5 6H3a2 2 0 0 0 2 2"/><path d="M19 6h2a2 2 0 0 1-2 2"/></svg>',
          sparkles:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>',
          keyboard:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="M6 8h.01"/><path d="M10 8h.01"/><path d="M14 8h.01"/><path d="M18 8h.01"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/><path d="M7 16h10"/></svg>',
          users:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        };
        const scope = root || document;
        scope.querySelectorAll("[data-lucide]").forEach(function (el) {
          var name = el.getAttribute("data-lucide");
          var markup = icons[name];
          if (!markup) return;
          var wrapper = document.createElement("span");
          wrapper.innerHTML = markup;
          var svg = wrapper.firstElementChild;
          if (svg) el.replaceWith(svg);
        });
      }

      // Data
      var projects = [
        {
          title: "Ignivox SOS",
          role: "Full-Stack Developer & UI/UX Designer",
          desc: "Real-time emergency response and alert management web application for the Bureau of Fire Protection Philippines.",
          tags: ["React", "Laravel", "MySQL", "Tailwind CSS", "Firebase"],
        },
        {
          title: "PawCare",
          role: "Frontend Developer & System Designer",
          desc: "Veterinary appointment and pet healthcare booking web platform.",
          tags: [
            "Next.js",
            "TypeScript",
            "PostgreSQL",
            "Prisma",
            "Framer Motion",
          ],
        },
        {
          title: "Silent Petals",
          role: "Game Developer & Narrative Designer",
          desc: "Choice-based 2D anime romance and mystery adventure game.",
          tags: [
            "Unity",
            "C#",
            "Dialogue System",
            "Pixel Art",
            "Story Branching",
          ],
        },
        {
          title: "Kairova",
          role: "Frontend Developer & Product Designer",
          desc: "Modern manhwa reader platform with immersive digital reading experience.",
          tags: ["Vue.js", "Node.js", "MongoDB", "Express", "Cloudinary"],
        },
      ];

      var techStack = [
        "TypeScript",
        "Rust",
        "Go",
        "React",
        "Node.js",
        "PostgreSQL",
        "Redis",
        "Docker",
        "K8s",
        "gRPC",
        "GraphQL",
        "AWS",
      ];

      var competitions = [
        {
          name: "Dean's Lister",
          rank: "Rank 1",
          scope: "1st Year • 1st Semester",
          percentile: "GWA 1.23",
          year: "",
          summary:
            "Achieved the highest academic standing through outstanding performance in foundational information technology courses.",
        },
        {
          name: "Dean's Lister",
          rank: "Rank 1",
          scope: "1st Year • 2nd Semester",
          percentile: "GWA 1.18",
          year: "",
          summary:
            "Maintained exceptional academic excellence with consistent performance across programming and core IT subjects.",
        },
        {
          name: "Dean's Lister",
          rank: "Rank 1",
          scope: "2nd Year • 1st Semester",
          percentile: "GWA 1.20",
          year: "",
          summary:
            "Demonstrated strong academic consistency while completing more advanced technical coursework and laboratory projects.",
        },
        {
          name: "Dean's Lister",
          rank: "Rank 1",
          scope: "2nd Year • 2nd Semester",
          percentile: "GWA 1.16",
          year: "",
          summary:
            "Earned the highest academic distinction through outstanding achievement in database systems, networking, and software development.",
        },
        {
          name: "Dean's Lister",
          rank: "Rank 1",
          scope: "3rd Year • 1st Semester",
          percentile: "GWA 1.14",
          year: "",
          summary:
            "Sustained top academic performance while balancing leadership responsibilities and complex technical projects.",
        },
        {
          name: "Dean's Lister",
          rank: "Rank 1",
          scope: "3rd Year • 2nd Semester",
          percentile: "GWA 1.11",
          year: "",
          summary:
            "Finished the semester with continued academic excellence, reflecting dedication, discipline, and consistent high achievement.",
        },
      ];

      // Render marquee
      function renderMarquee() {
        var track = document.getElementById("marqueeTrack");
        if (!track) {
          console.log("marqueeTrack not found");
          return;
        }
        track.innerHTML =
          projects
            .map(function (p, i) {
              return (
                '<div class="marquee-item" onclick="openProjectsExpanded(' +
                i +
                ')">' +
                "<div style=\"color:rgba(255,255,255,0.25);font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1px;margin-bottom:6px;text-transform:uppercase;flex-shrink:0;\">" +
                p.role.toUpperCase() +
                "</div>" +
                '<h4 style="color:rgba(255,255,255,0.85);font-size:16px;font-weight:600;margin:0 0 6px 0;line-height:1.2;flex-shrink:0;">' +
                p.title +
                "</h4>" +
                '<p style="color:rgba(255,255,255,0.35);font-size:12px;line-height:1.45;margin:0 0 6px 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;flex-grow:1;">' +
                p.desc +
                "</p>" +
                '<div class="flex flex-wrap gap-2">' +
                p.tags
                  .map(function (t) {
                    return (
                      '<span class="tag" style="font-size:10px;padding:4px 9px;">' +
                      t +
                      "</span>"
                    );
                  })
                  .join("") +
                "</div>" +
                "</div>"
              );
            })
            .join("") +
          projects
            .map(function (p, i) {
              return (
                '<div class="marquee-item" onclick="openProjectsExpanded(' +
                i +
                ')">' +
                "<div style=\"color:rgba(255,255,255,0.25);font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1px;margin-bottom:6px;text-transform:uppercase;flex-shrink:0;\">" +
                p.role.toUpperCase() +
                "</div>" +
                '<h4 style="color:rgba(255,255,255,0.85);font-size:16px;font-weight:600;margin:0 0 6px 0;line-height:1.2;flex-shrink:0;">' +
                p.title +
                "</h4>" +
                '<p style="color:rgba(255,255,255,0.35);font-size:12px;line-height:1.45;margin:0 0 6px 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;flex-grow:1;">' +
                p.desc +
                "</p>" +
                '<div class="flex flex-wrap gap-2">' +
                p.tags
                  .map(function (t) {
                    return (
                      '<span class="tag" style="font-size:10px;padding:4px 9px;">' +
                      t +
                      "</span>"
                    );
                  })
                  .join("") +
                "</div>" +
                "</div>"
              );
            })
            .join("");
        syncMarqueeSpeed(track, 60);
      }

      function syncMarqueeSpeed(track, pxPerSecond) {
        if (!track) return;
        var singleLapWidth = track.scrollWidth / 2;
        if (!singleLapWidth) return;
        track.style.animationDuration =
          Math.max(singleLapWidth / pxPerSecond, 8) + "s";
      }

      // Vertical equivalent used by the achievement scroll — same px/s pacing
      // as syncMarqueeSpeed (used for the tech stack), but measured by track
      // height instead of width.
      function syncVerticalMarqueeSpeed(track, pxPerSecond) {
        if (!track) return;
        var singleLapHeight = track.scrollHeight / 2;
        if (!singleLapHeight) return;
        track.style.animationDuration =
          Math.max(singleLapHeight / pxPerSecond, 8) + "s";
      }

      // Render tech marquee
      function renderTech() {
        var track = document.getElementById("techMarqueeTrack");
        if (!track) {
          console.log("techMarqueeTrack not found");
          return;
        }
        track.innerHTML =
          techStack
            .map(function (t) {
              return '<span class="tech-item">' + t + "</span>";
            })
            .join("") +
          techStack
            .map(function (t) {
              return '<span class="tech-item">' + t + "</span>";
            })
            .join("");
        syncMarqueeSpeed(track, 50);
      }

      // Render achievement vertical scroll
      function renderComps() {
        var scrollTrack = document.getElementById("achievementScrollTrack");
        if (!scrollTrack) {
          console.log("achievementScrollTrack not found");
          return;
        }
        var html = competitions
          .map(function (c, i) {
            return (
              '<div class="achievement-item" onclick="openExpand(\'competitions\')">' +
              '<div class="achievement-details">' +
              '<div class="achievement-name">' +
              c.name +
              "</div>" +
              '<div class="achievement-result"><span>' +
              c.scope +
              '</span><span class="achievement-year">' +
              c.year +
              "</span></div>" +
              "</div></div>"
            );
          })
          .join("");
        scrollTrack.innerHTML = html + html;
        hydrateIcons(scrollTrack);
        syncVerticalMarqueeSpeed(scrollTrack, 50);
      }

      // startAchievementMarquee - pause/resume on hover
      function startAchievementMarquee() {
        var track = document.getElementById("achievementScrollTrack");
        if (!track) return;
        var nested = track.closest(".achievement-nested-container");
        if (!nested) return;
        track.style.animationPlayState = "running";
        nested.addEventListener("mouseenter", function () {
          track.style.animationPlayState = "paused";
        });
        nested.addEventListener("mouseleave", function () {
          track.style.animationPlayState = "running";
        });
      }

      // Gallery preview loop
      var galleryPreviewItems = [];
      var galleryPreviewIndex = 0;
      var galleryPreviewTimer = null;
      var galleryPreviewSlots = [];

      function initGalleryPreview() {
        var items = document.querySelectorAll(
          ".gallery-expanded-view .gallery-grid .gallery-item",
        );
        items.forEach(function (item) {
          var img = item.querySelector("img");
          var title = item.querySelector(".gallery-card-title");
          var meta = item.querySelector(".gallery-card-meta");
          var copy = item.querySelector(".gallery-card-copy");
          if (!img || !img.src) return;
          galleryPreviewItems.push({
            src: img.src,
            alt:
              img.alt || (title ? title.textContent.trim() : "Gallery preview"),
            title: title ? title.textContent.trim() : "",
            meta: meta ? meta.textContent.trim() : "",
            copy: copy ? copy.textContent.trim() : "",
          });
        });
        galleryPreviewSlots = [
          document.getElementById("galleryPreviewImageA"),
          document.getElementById("galleryPreviewImageB"),
        ].filter(Boolean);
        if (galleryPreviewItems.length === 0 || galleryPreviewSlots.length < 2)
          return;
        galleryPreviewSlots[0].src = galleryPreviewItems[0].src;
        galleryPreviewSlots[0].alt = galleryPreviewItems[0].alt;
        galleryPreviewSlots[0].classList.add("visible");
        startGalleryPreviewLoop();
      }

      function renderGalleryPreviewItem(index) {
        if (!galleryPreviewItems.length || galleryPreviewSlots.length < 2)
          return;
        var nextSlot = galleryPreviewSlots[0].classList.contains("visible")
          ? 1
          : 0;
        var currentSlot = 1 - nextSlot;
        galleryPreviewIndex = index % galleryPreviewItems.length;
        var preview = galleryPreviewItems[galleryPreviewIndex];
        galleryPreviewSlots[nextSlot].src = preview.src;
        galleryPreviewSlots[nextSlot].alt = preview.alt;
        galleryPreviewSlots[nextSlot].classList.add("visible");
        galleryPreviewSlots[currentSlot].classList.remove("visible");
      }

      function startGalleryPreviewLoop() {
        stopGalleryPreviewLoop();
        if (galleryPreviewItems.length === 0) return;
        galleryPreviewTimer = window.setInterval(function () {
          var nextIndex =
            (galleryPreviewIndex + 1) % galleryPreviewItems.length;
          renderGalleryPreviewItem(nextIndex);
        }, 5800);
      }

      function stopGalleryPreviewLoop() {
        if (galleryPreviewTimer) {
          clearInterval(galleryPreviewTimer);
          galleryPreviewTimer = null;
        }
      }

      // Render competitions expanded grid
      function renderCompetitionsExpandedContent() {
        var grid = document.getElementById("competitionsGrid");
        if (!grid) return;
        grid.innerHTML = competitions
          .map(function (c) {
            return (
              '<article class="competitions-card">' +
              '<div class="competitions-card-title">' +
              c.name +
              "</div>" +
              '<div class="competitions-card-meta">' +
              '<span class="competitions-card-scope">' +
              c.scope +
              "</span>" +
              '<span class="competitions-card-percentile">' +
              c.percentile +
              "</span>" +
              '<span class="achievement-year">' +
              c.year +
              "</span></div>" +
              '<p class="competitions-card-summary">' +
              c.summary +
              "</p></article>"
            );
          })
          .join("");
      }

      // Expand system
      function closeAllExpanded() {
        var card = document.querySelector(".portfolio-card");
        if (!card) return;
        card.classList.remove(
          "projects-expanded",
          "identity-expanded",
          "tech-expanded",
          "competitions-expanded",
          "gallery-expanded",
        );
        delete card.dataset.projectsIndex;
      }

      function openExpand(type, idx) {
        if (type === "project") {
          openProjectsExpanded(idx);
          return;
        }
        if (type === "gallery") {
          openGalleryExpanded();
          return;
        }
        if (type === "tech") {
          openTechExpanded();
          return;
        }
        if (type === "competitions") {
          openCompetitionsExpanded();
          return;
        }
        if (type === "identity") {
          openIdentityExpanded();
          return;
        }
      }

      function openGalleryExpanded() {
        closeAllExpanded();
        var card = document.querySelector(".portfolio-card");
        if (!card) return;
        card.classList.add("gallery-expanded");
        hydrateIcons(card);
      }
      function openTechExpanded() {
        closeAllExpanded();
        var card = document.querySelector(".portfolio-card");
        if (!card) return;
        card.classList.add("tech-expanded");
        hydrateIcons(card);
      }
      function openCompetitionsExpanded() {
        closeAllExpanded();
        var card = document.querySelector(".portfolio-card");
        if (!card) return;
        card.classList.add("competitions-expanded");
        renderCompetitionsExpandedContent();
        hydrateIcons(card);
      }
      function closeCompetitionsExpanded() {
        closeAllExpanded();
      }
      function openProjectsExpanded(idx) {
        if (idx === undefined) idx = 0;
        closeAllExpanded();
        var card = document.querySelector(".portfolio-card");
        if (!card) return;
        card.classList.add("projects-expanded");
        card.dataset.projectsIndex = String(idx);
        hydrateIcons(card);
      }
      function closeProjectsExpanded() {
        closeAllExpanded();
      }
      function closeTechExpanded() {
        closeAllExpanded();
      }
      function closeGalleryExpanded() {
        closeAllExpanded();
      }
      function closeExpand(e) {
        var el = document.getElementById("expandOverlay");
        if (e && el && e.target !== el) return;
        if (el) el.classList.remove("active");
      }

      function openIdentityExpanded() {
        closeAllExpanded();
        var card = document.querySelector(".portfolio-card");
        if (!card) return;
        card.classList.add("identity-expanded");
        hydrateIcons(card);
      }
      function closeIdentityExpanded() {
        closeAllExpanded();
      }
      function openIdentityLink(url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      function copyIdentityValue(value) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(value);
        }
      }

      // Quick Actions (Identity Expanded View)
      function openQuickAction(action) {
        // Hook real destinations up here as they become available.
        switch (action) {
          case "ask":
            // Keep the Identity Expanded View open and active — only trigger
            // the Ask Anything overlay, never collapse or navigate away.
            // Mirrors the Typing Test / Community Chat cases (and the Alt+K
            // shortcut) so the button and shortcut share the same logic.
            if (typeof askIsOpen === "function" && askIsOpen()) {
              closeAsk();
            } else {
              openAsk();
            }
            break;
          case "typing":
            // Keep the Identity Expanded View open and active — only trigger
            // the Typing Test overlay, never collapse or navigate away.
            if (typeof typingIsOpen === "function" && typingIsOpen()) {
              closeTyping();
            } else {
              openTyping();
            }
            break;
          case "community":
            // Keep the Identity Expanded View open and active — only trigger
            // the Community Chat overlay, never collapse or navigate away.
            if (typeof chatIsOpen === "function" && chatIsOpen()) {
              closeChat();
            } else {
              openChat();
            }
            break;
        }
      }

      // Alt+J opens the Typing Test quick action, Alt+L opens the Community
      // Chat quick action. Alt+K / ⌘K is owned by the Ask Anything overlay
      // (see its ported script block above) so the two handlers never
      // double-fire on the same keypress.
      document.addEventListener("keydown", function (e) {
        if (!e.altKey) return;
        var shortcutCard = document.querySelector(".portfolio-card");
        if (
          !shortcutCard ||
          !shortcutCard.classList.contains("identity-expanded")
        ) {
          return;
        }
        var key = e.key.toLowerCase();
        if (key === "j") {
          e.preventDefault();
          openQuickAction("typing");
        } else if (key === "l") {
          e.preventDefault();
          openQuickAction("community");
        }
      });

      // Identity Overlay (used by the separate overlay below page-shell)
      function closeIdentityOverlay(e) {
        var overlay = document.getElementById("identityOverlay");
        if (!overlay) return;
        if (e && e.target !== overlay) return;
        overlay.classList.remove("active");
        overlay.style.display = "none";
      }

      function openIdentityOverlay() {
        var overlay = document.getElementById("identityOverlay");
        if (!overlay) return;
        overlay.style.display = "";
        // force reflow
        void overlay.offsetWidth;
        overlay.classList.add("active");
      }

      // Default config
      var defaultConfig = {
        background_color: "#0a0a0a",
        surface_color: "#121212",
        text_color: "#ebebeb",
        primary_action_color: "#ffffff",
        secondary_action_color: "#666666",
        font_family: "DM Sans",
        font_size: 14,
        developer_name: "Paul Calang",
        developer_role: "Full-Stack Web Developer & QA Tester",
        developer_bio:
          "A detail-oriented developer focused on building reliable, user-friendly web applications with an emphasis on quality assurance and clean, maintainable code. Passionate about improving system performance, debugging complex issues, and delivering smooth user experiences from front-end to back-end.",
        project_1_title: "Ignivox SOS",
        project_2_title: "PawCare",
        project_3_title: "Silent Petals",
        project_4_title: "Kairova",
      };

      function applyConfig(config) {
        var c = Object.assign({}, defaultConfig, config);
        var bodyEl = document.body;
        if (bodyEl) bodyEl.style.backgroundColor = c.background_color;
        var nameEl = document.getElementById("devName");
        var roleEl = document.getElementById("devRole");
        var bioEl = document.getElementById("devBio");
        if (nameEl) {
          nameEl.textContent = c.developer_name;
          nameEl.style.color = c.text_color;
          nameEl.style.fontFamily = c.font_family + ", DM Sans, sans-serif";
        }
        if (roleEl) {
          roleEl.textContent = c.developer_role;
        }
        if (bioEl) {
          bioEl.textContent = c.developer_bio;
          bioEl.style.fontFamily = c.font_family + ", DM Sans, sans-serif";
          bioEl.style.fontSize =
            "clamp(13px, 0.2vw + 12.4px, " + c.font_size + "px)";
        }
        if (c.project_1_title) projects[0].title = c.project_1_title;
        if (c.project_2_title) projects[1].title = c.project_2_title;
        if (c.project_3_title) projects[2].title = c.project_3_title;
        renderMarquee();
      }

      // Element SDK integration
      if (window.elementSdk && window.elementSdk.init) {
        window.elementSdk.init({
          defaultConfig: defaultConfig,
          onConfigChange: function (config) {
            applyConfig(config);
          },
          mapToCapabilities: function (config) {
            return {
              recolorables: [
                {
                  get: function () {
                    return (
                      config.background_color || defaultConfig.background_color
                    );
                  },
                  set: function (v) {
                    config.background_color = v;
                    window.elementSdk.setConfig({ background_color: v });
                  },
                },
                {
                  get: function () {
                    return config.surface_color || defaultConfig.surface_color;
                  },
                  set: function (v) {
                    config.surface_color = v;
                    window.elementSdk.setConfig({ surface_color: v });
                  },
                },
                {
                  get: function () {
                    return config.text_color || defaultConfig.text_color;
                  },
                  set: function (v) {
                    config.text_color = v;
                    window.elementSdk.setConfig({ text_color: v });
                  },
                },
                {
                  get: function () {
                    return (
                      config.primary_action_color ||
                      defaultConfig.primary_action_color
                    );
                  },
                  set: function (v) {
                    config.primary_action_color = v;
                    window.elementSdk.setConfig({ primary_action_color: v });
                  },
                },
                {
                  get: function () {
                    return (
                      config.secondary_action_color ||
                      defaultConfig.secondary_action_color
                    );
                  },
                  set: function (v) {
                    config.secondary_action_color = v;
                    window.elementSdk.setConfig({ secondary_action_color: v });
                  },
                },
              ],
              borderables: [],
              fontEditable: {
                get: function () {
                  return config.font_family || defaultConfig.font_family;
                },
                set: function (v) {
                  config.font_family = v;
                  window.elementSdk.setConfig({ font_family: v });
                },
              },
              fontSizeable: {
                get: function () {
                  return config.font_size || defaultConfig.font_size;
                },
                set: function (v) {
                  config.font_size = v;
                  window.elementSdk.setConfig({ font_size: v });
                },
              },
            };
          },
          mapToEditPanelValues: function (config) {
            return new Map([
              [
                "developer_name",
                config.developer_name || defaultConfig.developer_name,
              ],
              [
                "developer_role",
                config.developer_role || defaultConfig.developer_role,
              ],
              [
                "developer_bio",
                config.developer_bio || defaultConfig.developer_bio,
              ],
              [
                "project_1_title",
                config.project_1_title || defaultConfig.project_1_title,
              ],
              [
                "project_2_title",
                config.project_2_title || defaultConfig.project_2_title,
              ],
              [
                "project_3_title",
                config.project_3_title || defaultConfig.project_3_title,
              ],
            ]);
          },
        });
      }

      // Init
      renderMarquee();
      renderTech();
      renderComps();
      hydrateIcons();
      startAchievementMarquee();
      initGalleryPreview();

      // Resize handler for marquees
      var marqueeResizeTimer = null;
      window.addEventListener("resize", function () {
        clearTimeout(marqueeResizeTimer);
        marqueeResizeTimer = setTimeout(function () {
          syncMarqueeSpeed(document.getElementById("marqueeTrack"), 60);
          syncMarqueeSpeed(document.getElementById("techMarqueeTrack"), 50);
          syncVerticalMarqueeSpeed(
            document.getElementById("achievementScrollTrack"),
            50,
          );
        }, 200);
      });

      // Background video play
      var bgVideo = document.getElementById("bgVideo");
      if (bgVideo) {
        setTimeout(function () {
          bgVideo.play().catch(function (e) {
            console.log("Background video play blocked:", e);
          });
        }, 50);
      }

      // Keyboard close
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          // While Ask Anything is open, Escape only closes the Ask overlay —
          // it must never collapse the expanded view underneath it.
          if (typeof askIsOpen === "function" && askIsOpen()) return;
          // While the Typing Test is open, Escape only closes the Typing Test —
          // it must never collapse the expanded view underneath it.
          if (typeof typingIsOpen === "function" && typingIsOpen()) return;
          // While the Community Chat is open, Escape only closes the chat — it
          // must never collapse the expanded view underneath it.
          if (typeof chatIsOpen === "function" && chatIsOpen()) return;
          var card = document.querySelector(".portfolio-card");
          var expandOverlay = document.getElementById("expandOverlay");
          var identityOverlay = document.getElementById("identityOverlay");
          if (card) {
            if (card.classList.contains("tech-expanded")) {
              closeTechExpanded();
              return;
            }
            if (card.classList.contains("projects-expanded")) {
              closeProjectsExpanded();
              return;
            }
            if (card.classList.contains("competitions-expanded")) {
              closeCompetitionsExpanded();
              return;
            }
            if (card.classList.contains("identity-expanded")) {
              closeIdentityExpanded();
              return;
            }
            if (card.classList.contains("gallery-expanded")) {
              closeGalleryExpanded();
              return;
            }
          }
          if (identityOverlay && identityOverlay.classList.contains("active")) {
            closeIdentityOverlay();
            return;
          }
          if (expandOverlay) {
            expandOverlay.classList.remove("active");
          }
        }
      });
