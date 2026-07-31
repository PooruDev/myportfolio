        // ── Playground mini-game: WASD/arrow movement, simulated visitors
        // named after recent chat participants — logic ported 1:1 from
        // asdasd.html. Lives inside the Community Chat overlay; opening or
        // playing it never closes the Identity Tech Expanded View. Sprites
        // load from the shared asset set (same as asdasd.html) with a
        // lightweight procedural fallback so the game is fully playable even
        // before they arrive (or when running fully offline).
        (function () {
          const wrap = document.getElementById("pgWrap");
          const box = document.getElementById("pgBox");
          const canvas = document.getElementById("pgCanvas");
          if (!canvas) return;
          const ctx = canvas.getContext("2d");

          // ── config (ported from asdasd.html) ──
          const CELL = 32,
            SCALE = 2; // sprite-sheet cell / draw scale (player ≈ 64px)
          const TILE = 36; // visual grid + furniture unit
          const SUB = 2,
            STEP = TILE / SUB; // 2×2 movement sub-cells per tile → finer movement
          const MOVE_SPEED = 95; // ms per movement step (one STEP)
          const IDLE_SPEED = 800,
            WALK_SPEED = 150;
          const ROW = {
            IDLE_DOWN: 0,
            IDLE_RIGHT: 32,
            IDLE_UP: 64,
            WALK_DOWN: 96,
            WALK_RIGHT: 128,
            WALK_UP: 160,
          };
          const MAP_W = 18,
            MAP_H = 18; // map size in tiles
          const MAP_CW = MAP_W * SUB,
            MAP_CH = MAP_H * SUB; // movement grid in sub-cells (36×36)
          const DIRS = ["up", "down", "left", "right"];
          const NPC_ALPHA = 0.6; // "other players" a bit lighter than the local player

          let VIEW_W = 460,
            VIEW_H = 380;

          // ── sprites (shared asset set, same as asdasd.html) ──
          const charImg = new Image(),
            shadowImg = new Image();
          const furn = {};
          const FURN_BASE = "https://bryllim.com/images/game/";
          let assetsReady = false,
            loadedCt = 0;
          function assetLoaded() {
            if (++loadedCt >= 2) assetsReady = true;
          }
          function ensureAssets() {
            if (charImg.src) return;
            charImg.onload = assetLoaded;
            charImg.src = FURN_BASE + "character.png";
            shadowImg.onload = assetLoaded;
            shadowImg.src = FURN_BASE + "character_shadow.png";
            [
              "desk",
              "table",
              "computer",
              "big_table",
              "cabinet_1",
              "cabinet_2",
              "cabinet_3",
            ].forEach((n) => {
              const img = new Image();
              img.src = FURN_BASE + n + ".png";
              furn[n] = img;
            });
          }

          // ── placed furniture (footprint in tiles) + collision (in sub-cells) ──
          const FOOT = {
            desk: { w: 2, h: 1 },
            table: { w: 2, h: 1 },
            bigtable: { w: 2, h: 2 },
            cabinet: { w: 1, h: 1 },
          };
          const OBJECTS = [
            { type: "desk", x: 3, y: 2 },
            { type: "desk", x: 13, y: 2 },
            { type: "cabinet", x: 2, y: 6, v: 1 },
            { type: "cabinet", x: 15, y: 6, v: 2 },
            { type: "table", x: 4, y: 14, computer: true },
            { type: "bigtable", x: 11, y: 12 },
            { type: "cabinet", x: 14, y: 15, v: 3 },
          ];
          // block the footprint in sub-cells, but leave the BOTTOM sub-row walkable so the
          // player can stand at (and tuck behind) the base of each object.
          const blocked = new Set();
          for (const o of OBJECTS) {
            const f = FOOT[o.type];
            const ox = o.x * SUB,
              oy = o.y * SUB,
              fw = f.w * SUB,
              fh = f.h * SUB;
            for (let yy = 0; yy < fh - 1; yy++)
              for (let xx = 0; xx < fw; xx++)
                blocked.add(ox + xx + "," + (oy + yy));
          }
          function furnImg(o) {
            if (o.type === "desk") return furn.desk;
            if (o.type === "table") return furn.table;
            if (o.type === "bigtable") return furn.big_table;
            return furn["cabinet_" + (o.v || 1)];
          }

          // ── audio (step / collision) — unlock on first gesture ──
          const SFX_VOLUME_MULTIPLIER = 6;
          const SFX = {
            step: new Audio("resources/audio/step.wav"),
            collision: new Audio("resources/audio/collision.wav"),
          };
          Object.values(SFX).forEach((a) => {
            a.volume = Math.min(1, 0.13 * SFX_VOLUME_MULTIPLIER);
            a.preload = "auto";
          });
          let sfxUnlocked = false,
            lastStep = 0,
            lastColl = 0,
            lastCollKey = "";
          function unlockSfx() {
            if (sfxUnlocked) return;
            sfxUnlocked = true;
            Object.values(SFX).forEach((a) => {
              try {
                a.muted = true;
                const p = a.play();
                if (p && p.then)
                  p.then(() => {
                    a.pause();
                    a.currentTime = 0;
                    a.muted = false;
                  }).catch(() => {
                    a.muted = false;
                  });
              } catch (e) {}
            });
          }
          function playSfx(name) {
            if (!sfxUnlocked) return;
            const a = SFX[name];
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
            const now = Date.now();
            if (now - lastColl < 350 && key === lastCollKey) return;
            lastColl = now;
            lastCollKey = key;
            playSfx("collision");
          }

          // ── actors (local player + simulated others) — positions in sub-cell coords ──
          function makeActor(cx, cy) {
            return {
              cellX: cx,
              cellY: cy,
              pixelX: cx * STEP,
              pixelY: cy * STEP,
              direction: "down",
              isMoving: false,
              animationFrame: 0,
              animationTime: 0,
              moveAnim: null,
              stepCount: 0,
            };
          }
          function pickStart() {
            const ccx = (MAP_CW / 2) | 0,
              ccy = (MAP_CH / 2) | 0;
            let best = null,
              bestD = Infinity;
            for (let y = 0; y < MAP_CH; y++)
              for (let x = 0; x < MAP_CW; x++) {
                if (blocked.has(x + "," + y)) continue;
                const d = (x - ccx) * (x - ccx) + (y - ccy) * (y - ccy);
                if (d < bestD) {
                  bestD = d;
                  best = [x, y];
                }
              }
            return best || [ccx, ccy];
          }
          const _start = pickStart();
          const player = makeActor(_start[0], _start[1]);
          let npcs = [];
          let actors = [player];
          let npcsSpawned = false;
          let pgName = "";
          let lastMove = 0,
            raf = null,
            running = false,
            lastT = 0;
          const keys = { w: false, a: false, s: false, d: false };

          function clamp(v, lo, hi) {
            return v < lo ? lo : v > hi ? hi : v;
          }

          function theme() {
            // The portfolio is a fixed dark theme — mirror asdasd.html's dark palette.
            return {
              grid: "rgba(240,240,245,0.09)",
              name: "#f4f4f5",
              npcName: "#a6a6ad",
              nameShadow: "rgba(0,0,0,.85)",
              objShadow: "rgba(0,0,0,0.32)",
            };
          }

          function frame(actor) {
            const d = actor.direction,
              moving = actor.isMoving;
            let rowY, count;
            if (moving) {
              rowY =
                d === "up"
                  ? ROW.WALK_UP
                  : d === "down"
                    ? ROW.WALK_DOWN
                    : ROW.WALK_RIGHT;
              count = 4;
            } else {
              rowY =
                d === "up"
                  ? ROW.IDLE_UP
                  : d === "down"
                    ? ROW.IDLE_DOWN
                    : ROW.IDLE_RIGHT;
              count = 2;
            }
            const cf = Math.floor(actor.animationFrame || 0) % count;
            return { x: cf * CELL, y: rowY, flip: d === "left" };
          }

          function canMoveTo(cx, cy, mover) {
            if (cx < 0 || cx >= MAP_CW || cy < 0 || cy >= MAP_CH) return false;
            if (blocked.has(cx + "," + cy)) return false;
            // sprites are 64px on an 18px sub-grid — keep actors ~1 tile apart
            for (const a of actors) {
              if (a === mover) continue;
              if (Math.abs(a.cellX - cx) < SUB && Math.abs(a.cellY - cy) < SUB)
                return false;
            }
            return true;
          }
          function startSlide(actor, tPX, tPY) {
            const sX = actor.pixelX,
              sY = actor.pixelY,
              st = performance.now();
            (function anim(t) {
              const p = Math.min((t - st) / MOVE_SPEED, 1),
                e = 1 - Math.pow(1 - p, 2);
              actor.pixelX = sX + (tPX - sX) * e;
              actor.pixelY = sY + (tPY - sY) * e;
              if (p < 1) actor.moveAnim = requestAnimationFrame(anim);
              else {
                actor.pixelX = tPX;
                actor.pixelY = tPY;
                actor.moveAnim = null;
              }
            })(st);
          }

          // local player — keyboard driven
          function handleMovement() {
            let dir = null;
            if (keys.s) dir = "down";
            if (keys.d) dir = "right";
            if (keys.w) dir = "up";
            if (keys.a) dir = "left";
            if (!dir) {
              player.isMoving = false;
              return;
            }
            if (player.moveAnim) {
              player.isMoving = true;
              return;
            }
            player.direction = dir;
            const atTarget =
              Math.abs(player.pixelX - player.cellX * STEP) < 0.5 &&
              Math.abs(player.pixelY - player.cellY * STEP) < 0.5;
            if (!atTarget) {
              player.isMoving = true;
              return;
            }
            const now = Date.now();
            if (now - lastMove < MOVE_SPEED * 0.3) return;
            let nx = player.cellX,
              ny = player.cellY;
            if (dir === "up") ny--;
            else if (dir === "down") ny++;
            else if (dir === "left") nx--;
            else nx++;
            if (!canMoveTo(nx, ny, player)) {
              player.isMoving = false;
              playCollision(dir);
              return;
            }
            player.isMoving = true;
            player.cellX = nx;
            player.cellY = ny;
            lastMove = now;
            player.stepCount++;
            if (player.stepCount % SUB === 0) playStep(now);
            startSlide(player, nx * STEP, ny * STEP);
          }

          // simulated others — random wander AI (natural pauses + short bursts)
          function npcStep(npc) {
            if (npc.moveAnim) {
              npc.isMoving = true;
              return;
            }
            const atTarget =
              Math.abs(npc.pixelX - npc.cellX * STEP) < 0.5 &&
              Math.abs(npc.pixelY - npc.cellY * STEP) < 0.5;
            if (!atTarget) {
              npc.isMoving = true;
              return;
            }
            const now = Date.now(),
              b = npc.brain;
            if (now < b.pauseUntil) {
              npc.isMoving = false;
              return;
            }
            if (b.steps <= 0 || !b.dir) {
              if (Math.random() < 0.34) {
                b.pauseUntil = now + 700 + Math.random() * 2600;
                b.dir = null;
                npc.isMoving = false;
                return;
              }
              b.dir = DIRS[(Math.random() * 4) | 0];
              b.steps = SUB * (1 + ((Math.random() * 4) | 0));
            }
            npc.direction = b.dir;
            let nx = npc.cellX,
              ny = npc.cellY;
            if (b.dir === "up") ny--;
            else if (b.dir === "down") ny++;
            else if (b.dir === "left") nx--;
            else nx++;
            if (!canMoveTo(nx, ny, npc)) {
              b.steps = 0;
              b.dir = null;
              b.pauseUntil = now + 250 + Math.random() * 800;
              npc.isMoving = false;
              return;
            }
            npc.isMoving = true;
            npc.cellX = nx;
            npc.cellY = ny;
            b.steps--;
            startSlide(npc, nx * STEP, ny * STEP);
          }

          function recentChatNames() {
            const els = document.querySelectorAll(
              "#chatMessages .chat-item .chat-name-txt",
            );
            const names = [];
            for (let i = els.length - 1; i >= 0 && names.length < 5; i--) {
              const n = (els[i].textContent || "").trim();
              if (n && n !== pgName && !names.includes(n)) names.push(n);
            }
            return names;
          }
          function spawnNPCs() {
            const names = recentChatNames();
            const placed = [[player.cellX, player.cellY]];
            const farEnough = (tx, ty) =>
              placed.every(
                ([px, py]) =>
                  Math.abs(px - tx) >= SUB || Math.abs(py - ty) >= SUB,
              );
            npcs = [];
            for (let i = 0; i < 5; i++) {
              let tx = 1,
                ty = 1,
                tries = 0,
                ok = false;
              do {
                tx = 1 + ((Math.random() * (MAP_CW - 2)) | 0);
                ty = 1 + ((Math.random() * (MAP_CH - 2)) | 0);
                tries++;
                ok = !blocked.has(tx + "," + ty) && farEnough(tx, ty);
              } while (!ok && tries < 300);
              placed.push([tx, ty]);
              const npc = makeActor(tx, ty);
              npc.direction = DIRS[(Math.random() * 4) | 0];
              npc.animationFrame = (Math.random() * 4) | 0;
              npc.name = names[i] || "guest " + (i + 1);
              npc.brain = {
                dir: null,
                steps: 0,
                pauseUntil: Date.now() + Math.random() * 1800,
              };
              npcs.push(npc);
            }
            actors = [player, ...npcs];
          }
          function refreshNpcNames() {
            const names = recentChatNames();
            if (!names.length) return;
            npcs.forEach((n, i) => {
              if (names[i]) n.name = names[i];
            });
          }

          function updateAnim(dt) {
            for (const a of actors) {
              a.animationTime += dt;
              if (a.animationTime >= (a.isMoving ? WALK_SPEED : IDLE_SPEED)) {
                a.animationFrame = (a.animationFrame || 0) + 1;
                a.animationTime = 0;
              }
            }
          }

          function drawFrame(img, f, x, y, w, h) {
            if (f.flip) {
              ctx.save();
              ctx.scale(-1, 1);
              ctx.drawImage(img, f.x, f.y, CELL, CELL, -x - w, y, w, h);
              ctx.restore();
            } else ctx.drawImage(img, f.x, f.y, CELL, CELL, x, y, w, h);
          }

          // fallback avatar so the game is visible before the sprite sheet
          // arrives (or when running fully offline)
          function drawFallbackActor(x, y, w, h, alpha) {
            const rr = x + w * 0.18,
              ry = y + h * 0.14,
              rw = w * 0.64,
              rh = h * 0.7;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = "rgba(0,0,0,0.25)";
            ctx.beginPath();
            ctx.ellipse(
              x + w / 2,
              y + h - h * 0.12,
              w * 0.3,
              h * 0.08,
              0,
              0,
              Math.PI * 2,
            );
            ctx.fill();
            ctx.fillStyle = "rgba(255,255,255,0.46)";
            if (ctx.roundRect) {
              ctx.beginPath();
              ctx.roundRect(rr, ry, rw, rh, w * 0.24);
              ctx.fill();
            } else ctx.fillRect(rr, ry, rw, rh);
            ctx.fillStyle = "rgba(255,255,255,0.72)";
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h * 0.3, w * 0.13, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          function actorDraw(a, camX, camY) {
            const isPlayer = a === player,
              f = frame(a),
              w = CELL * SCALE,
              h = CELL * SCALE;
            a._dx = Math.round(a.pixelX + (STEP - w) / 2 - camX);
            a._dy = Math.round(a.pixelY + (STEP - h) / 2 - camY);
            if (shadowImg.complete) {
              ctx.save();
              ctx.globalAlpha = isPlayer ? 0.9 : 0.45;
              drawFrame(shadowImg, f, a._dx, a._dy, w, h);
              ctx.restore();
            }
            if (charImg.complete) {
              ctx.save();
              ctx.globalAlpha = isPlayer ? 1 : NPC_ALPHA;
              drawFrame(charImg, f, a._dx, a._dy, w, h);
              ctx.restore();
            } else {
              drawFallbackActor(
                a._dx,
                a._dy,
                w,
                h,
                isPlayer ? 1 : NPC_ALPHA * 0.9,
              );
            }
          }
          function actorName(a, c) {
            if (!a.name) return;
            const isPlayer = a === player,
              w = CELL * SCALE;
            ctx.save();
            ctx.font = '600 11px "JetBrains Mono", ui-monospace, monospace';
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.shadowColor = c.nameShadow;
            ctx.shadowBlur = 3;
            ctx.shadowOffsetY = 1;
            ctx.globalAlpha = isPlayer ? 1 : 0.9;
            ctx.fillStyle = isPlayer ? c.name : c.npcName;
            ctx.fillText(a.name, a._dx + w / 2, a._dy + 8);
            ctx.restore();
          }
          function drawObject(o, camX, camY, c) {
            const img = furnImg(o);
            const f = FOOT[o.type];
            const px = Math.round(o.x * TILE - camX),
              py = Math.round(o.y * TILE - camY);
            const w = f.w * TILE,
              h = f.h * TILE;
            ctx.fillStyle = c.objShadow;
            ctx.fillRect(px + 2, py + 2, w, h);
            if (img && img.complete) {
              ctx.drawImage(img, px, py, w, h);
            } else {
              // fallback furniture block before sprites arrive
              ctx.fillStyle = "rgba(255,255,255,0.05)";
              ctx.fillRect(px, py, w, h);
              ctx.strokeStyle = "rgba(255,255,255,0.12)";
              ctx.lineWidth = 1;
              ctx.strokeRect(px + 0.5, py + 0.5, w - 1, h - 1);
            }
            if (o.computer && furn.computer && furn.computer.complete)
              ctx.drawImage(furn.computer, px, py - TILE / 2, 2 * TILE, TILE);
          }

          function render() {
            const c = theme();
            ctx.imageSmoothingEnabled = false;
            const camX = clamp(
              player.pixelX + STEP / 2 - VIEW_W / 2,
              0,
              MAP_W * TILE - VIEW_W,
            );
            const camY = clamp(
              player.pixelY + STEP / 2 - VIEW_H / 2,
              0,
              MAP_H * TILE - VIEW_H,
            );

            ctx.clearRect(0, 0, VIEW_W, VIEW_H); // transparent — blends with the chat backdrop

            ctx.strokeStyle = c.grid;
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (
              let x = Math.floor(camX / TILE) * TILE;
              x <= camX + VIEW_W;
              x += TILE
            ) {
              const sx = Math.round(x - camX) + 0.5;
              ctx.moveTo(sx, 0);
              ctx.lineTo(sx, VIEW_H);
            }
            for (
              let y = Math.floor(camY / TILE) * TILE;
              y <= camY + VIEW_H;
              y += TILE
            ) {
              const sy = Math.round(y - camY) + 0.5;
              ctx.moveTo(0, sy);
              ctx.lineTo(VIEW_W, sy);
            }
            ctx.stroke();

            // depth: interleave actors + furniture by their front-edge world Y, so an actor
            // standing at/below a piece's base draws in FRONT of it, and behind it when north.
            const drawables = [];
            for (const a of actors)
              drawables.push({
                y: a.pixelY + STEP + 0.5,
                run: () => actorDraw(a, camX, camY),
              });
            for (const o of OBJECTS)
              drawables.push({
                y: (o.y + FOOT[o.type].h) * TILE,
                run: () => drawObject(o, camX, camY, c),
              });
            drawables.sort((p, q) => p.y - q.y);
            for (const d of drawables) d.run();

            // names always on top so a label is never hidden behind furniture
            const order = actors.slice().sort((a, b) => a.pixelY - b.pixelY);
            for (const a of order) actorName(a, c);
          }

          function loop(t) {
            const dt = Math.min(64, t - lastT);
            lastT = t;
            handleMovement();
            for (const npc of npcs) npcStep(npc);
            updateAnim(dt);
            render();
            if (running) raf = requestAnimationFrame(loop);
          }

          function setupCanvas() {
            const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
            const cw = canvas.clientWidth,
              ch = canvas.clientHeight;
            if (!cw || !ch) return false;
            VIEW_W = cw;
            VIEW_H = ch;
            canvas.width = Math.round(cw * dpr);
            canvas.height = Math.round(ch * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            return true;
          }

          function start() {
            ensureAssets();
            if (!setupCanvas()) return;
            if (pgName) player.name = pgName;
            if (!npcsSpawned) {
              spawnNPCs();
              npcsSpawned = true;
              setTimeout(refreshNpcNames, 1600);
            } else refreshNpcNames();
            if (running) return;
            running = true;
            lastT = performance.now();
            raf = requestAnimationFrame(loop);
          }
          function stop() {
            running = false;
            if (raf) cancelAnimationFrame(raf);
            raf = null;
            keys.w = keys.a = keys.s = keys.d = false;
            box.classList.remove("is-playing");
          }

          function keyFor(e) {
            switch (e.key) {
              case "w":
              case "W":
              case "ArrowUp":
                return "w";
              case "a":
              case "A":
              case "ArrowLeft":
                return "a";
              case "s":
              case "S":
              case "ArrowDown":
                return "s";
              case "d":
              case "D":
              case "ArrowRight":
                return "d";
            }
            return null;
          }
          canvas.addEventListener("keydown", (e) => {
            const k = keyFor(e);
            if (k) {
              e.preventDefault();
              keys[k] = true;
            }
          });
          canvas.addEventListener("keyup", (e) => {
            const k = keyFor(e);
            if (k) {
              e.preventDefault();
              keys[k] = false;
            }
          });
          canvas.addEventListener("focus", () =>
            box.classList.add("is-playing"),
          );
          canvas.addEventListener("blur", () => {
            keys.w = keys.a = keys.s = keys.d = false;
            box.classList.remove("is-playing");
          });
          canvas.addEventListener("click", () => {
            unlockSfx();
            canvas.focus();
          });
          window.addEventListener("resize", () => {
            if (running) setupCanvas();
          });

          window.playgroundShow = function (name) {
            if (typeof name === "string" && name.trim()) {
              pgName = name.trim();
              player.name = pgName;
            }
            wrap.classList.add("is-on");
            wrap.setAttribute("aria-hidden", "false");
            requestAnimationFrame(start);
          };
          window.playgroundHide = function () {
            wrap.classList.remove("is-on");
            wrap.setAttribute("aria-hidden", "true");
            if (document.activeElement === canvas) canvas.blur();
            stop();
          };
        })();
