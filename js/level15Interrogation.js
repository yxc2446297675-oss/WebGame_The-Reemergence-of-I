/**
 * 第十五关 · 折叠维度 — 审讯 / 记忆核验 / 墨染星图专属玩法
 * 流程：黑屏旁白 → 四问核验（lerp 动效）→ HTML 全舰总地图拖入关卡槽墨染揭示
 */

const Level15Config = {
    // 使用游玩中的 MapRenderer 全舰蓝图，而非手绘 sketch
    useHtmlMasterMap: true,
    masterMapLevelId: 25,
    mapCaptureWidth: 1280,
    mapCaptureHeight: 800,
    introLines: [
        "队长！你终于醒了！",
        "看来成功了，对吗？",
        "等一下，以防万一...",
        "为了保证你的记忆没有出现问题",
        "请允许我问你几个问题，来证明你身体相关机能正常"
    ],
    questions: [
        {
            id: "q1",
            prompt: "我们的飞船遭遇了什么？",
            options: [
                { key: "A", text: "伪人入侵" },
                { key: "B", text: "停电爆炸" },
                { key: "C", text: "能源枯竭" },
                { key: "D", text: "迷失方向" }
            ],
            correct: "B"
        },
        {
            id: "q2",
            prompt: "我们失去了什么？",
            options: [
                { key: "A", text: "伪人资料" },
                { key: "B", text: "主控机芯片" },
                { key: "C", text: "一名伙伴" },
                { key: "D", text: "以上全对" }
            ],
            correct: "B"
        },
        {
            id: "q3",
            prompt: "你为什么会在飞船各个角落穿梭探索？",
            options: [
                { key: "A", text: "我拥有跨越时间的超能力" },
                { key: "B", text: "我得了精神病，这一切是幻觉" },
                { key: "C", text: "我通过休眠舱相关技术获取我们的过往" },
                { key: "D", text: "我不是飞船的一员，只是意外闯入的探索者" }
            ],
            correct: "C"
        },
        {
            id: "q4",
            prompt: "你为什么要获取我们的过往？",
            options: [
                { key: "A", text: "弄清楚飞船现在在哪里" },
                { key: "B", text: "弄清楚是谁造成停电并偷走了芯片" },
                { key: "C", text: "弄清楚谁引发了爆炸" },
                { key: "D", text: "弄清楚谁是伪人" }
            ],
            correct: "B"
        }
    ],
    slots: [
        {
            id: "slot-14",
            label: "1 — 4",
            hint: "左上甲板",
            regions: ["tl"],
            lore: "左上甲板苏醒：电力在此启航，气闸吞吐着进出港湾的光廊。"
        },
        {
            id: "slot-58",
            label: "5 — 8",
            hint: "下半舰体",
            regions: ["bl", "br"],
            lore: "下半舰体沉静：研械与高科在炉心交汇，把未知一点点点亮。"
        },
        {
            id: "slot-912",
            label: "9 — 12",
            hint: "右上生境",
            regions: ["tr"],
            lore: "右上生境长明：不息的脉搏与不朽的文明，在穹顶下彼此回响。"
        }
    ]
};

function l15Lerp(a, b, t) {
    return a + (b - a) * t;
}

function l15EaseOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function l15EaseInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * 线性插值动画（手机友好，单 RAF，无重布局风暴）
 */
function l15Animate({ from = 0, to = 1, duration = 420, ease = l15EaseOutCubic, onUpdate, onComplete }) {
    const t0 = performance.now();
    let raf = 0;
    const tick = (now) => {
        const raw = Math.min(1, (now - t0) / Math.max(1, duration));
        const t = ease ? ease(raw) : raw;
        const v = l15Lerp(from, to, t);
        if (onUpdate) onUpdate(v, t);
        if (raw < 1) {
            raf = requestAnimationFrame(tick);
        } else if (onComplete) {
            onComplete(v);
        }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
}

class Level15InterrogationScene {
    /**
     * @param {Object} gameEngine
     * @param {{ onComplete?: Function }} [options]
     */
    constructor(gameEngine, options = {}) {
        this.engine = gameEngine;
        this.onComplete = options.onComplete || null;
        this.root = null;
        this.phase = "idle";
        this.introIndex = 0;
        this.questionIndex = 0;
        this.locked = false;
        this.placedSlots = new Set();
        this._drag = null;
        this._unsubs = [];
        this._masterMapUrl = null;
    }

    start() {
        this.ensureDom();
        this.root.classList.remove("hidden");
        this.phase = "intro";
        this.introIndex = 0;
        this.questionIndex = 0;
        this.placedSlots.clear();
        this.locked = false;

        this.root.querySelectorAll(".l15-phase").forEach((el) => el.classList.add("hidden"));
        const intro = this.root.querySelector("#l15-phase-intro");
        intro?.classList.remove("hidden");
        this.renderIntroLine(true);

        if (typeof Sound !== "undefined") {
            if (Sound.unlock) Sound.unlock();
            if (Sound.playDoubt) Sound.playDoubt();
        }
    }

    stop() {
        this._teardownDrag();
        this._unsubs.forEach((fn) => {
            try { fn(); } catch (e) { /* ignore */ }
        });
        this._unsubs = [];
        if (this.root) this.root.classList.add("hidden");
        this.phase = "idle";
    }

    ensureDom() {
        this.root = document.getElementById("screen-level15");
        if (!this.root) {
            this.root = document.createElement("div");
            this.root.id = "screen-level15";
            this.root.className = "l15-screen hidden";
            document.body.appendChild(this.root);
        }

        if (!this.root.querySelector("#l15-phase-intro")) {
            this.root.classList.add("l15-screen");
            this.root.innerHTML = `
            <div id="l15-phase-intro" class="l15-phase l15-intro">
                <div class="l15-intro-veil" aria-hidden="true"></div>
                <div class="l15-intro-orbit" aria-hidden="true"></div>
                <div class="l15-intro-center">
                    <div class="l15-intro-eyebrow">MEMORY INTEGRITY · 记忆核验</div>
                    <div id="l15-intro-text" class="l15-intro-text"></div>
                    <div class="l15-intro-prompt">触摸继续</div>
                </div>
            </div>

            <div id="l15-phase-quiz" class="l15-phase l15-quiz hidden">
                <div class="l15-quiz-atmosphere" aria-hidden="true">
                    <div class="l15-quiz-frame-line l15-quiz-frame-t"></div>
                    <div class="l15-quiz-frame-line l15-quiz-frame-b"></div>
                    <div class="l15-quiz-corner l15-c-tl"></div>
                    <div class="l15-quiz-corner l15-c-tr"></div>
                    <div class="l15-quiz-corner l15-c-bl"></div>
                    <div class="l15-quiz-corner l15-c-br"></div>
                    <div class="l15-quiz-glow"></div>
                </div>
                <div class="l15-quiz-shell">
                    <div class="l15-quiz-progress" id="l15-quiz-progress"></div>
                    <div class="l15-quiz-card" id="l15-quiz-card">
                        <div class="l15-quiz-ink" aria-hidden="true"></div>
                        <h2 class="l15-quiz-title" id="l15-quiz-title">核验提问</h2>
                        <p class="l15-quiz-prompt" id="l15-quiz-prompt"></p>
                        <div class="l15-quiz-options" id="l15-quiz-options"></div>
                    </div>
                </div>
            </div>

            <div id="l15-phase-map" class="l15-phase l15-map hidden">
                <div class="l15-lore-banner" id="l15-lore-banner" role="status" aria-live="polite"></div>
                <div class="l15-map-body">
                    <div class="l15-map-stage" id="l15-map-stage">
                        <div class="l15-map-stack">
                            <img class="l15-map-img l15-map-clear" id="l15-map-clear" alt="星舰总览" draggable="false">
                            <img class="l15-map-img l15-map-blur" id="l15-map-blur" alt="" draggable="false" aria-hidden="true">
                            <div class="l15-map-reveal l15-reveal-tl" data-region="tl"></div>
                            <div class="l15-map-reveal l15-reveal-tr" data-region="tr"></div>
                            <div class="l15-map-reveal l15-reveal-bl" data-region="bl"></div>
                            <div class="l15-map-reveal l15-reveal-br" data-region="br"></div>
                        </div>
                        <div class="l15-drop-zone" id="l15-drop-zone" aria-hidden="true">
                            <span>拖入此处 · 墨染开图</span>
                        </div>
                    </div>
                    <aside class="l15-slot-rail" id="l15-slot-rail" aria-label="关卡槽">
                        <div class="l15-slot-rail-title">关卡槽</div>
                        <div class="l15-slot-list" id="l15-slot-list"></div>
                    </aside>
                </div>
                <div class="l15-map-guide" id="l15-map-guide">将右侧关卡槽拖入地图中心</div>
            </div>
            `;
            this.root.dataset.bound = "";
        }

        this.bindOnce();
    }

    bindOnce() {
        if (this.root.dataset.bound === "1") return;
        this.root.dataset.bound = "1";

        const intro = this.root.querySelector("#l15-phase-intro");
        intro?.addEventListener("click", () => this.advanceIntro());

        // 拖拽委托在 map 阶段绑定
    }

    // -------------------------------------------------------------------------
    // Intro
    // -------------------------------------------------------------------------
    renderIntroLine(immediate = false) {
        const el = this.root.querySelector("#l15-intro-text");
        if (!el) return;
        const line = Level15Config.introLines[this.introIndex] || "";
        if (immediate) {
            el.textContent = line;
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
            return;
        }
        el.style.opacity = "0";
        el.style.transform = "translateY(10px)";
        l15Animate({
            from: 0,
            to: 1,
            duration: 380,
            onUpdate: (v) => {
                el.style.opacity = String(v);
                el.style.transform = `translateY(${l15Lerp(10, 0, v)}px)`;
                if (v > 0.15 && !el.dataset.swapped) {
                    el.textContent = line;
                    el.dataset.swapped = "1";
                }
            },
            onComplete: () => {
                el.textContent = line;
                delete el.dataset.swapped;
            }
        });
    }

    advanceIntro() {
        if (this.phase !== "intro" || this.locked) return;
        if (typeof Sound !== "undefined" && Sound.playTick) Sound.playTick();

        if (this.introIndex >= Level15Config.introLines.length - 1) {
            this.enterQuiz();
            return;
        }
        this.locked = true;
        const el = this.root.querySelector("#l15-intro-text");
        l15Animate({
            from: 1,
            to: 0,
            duration: 220,
            onUpdate: (v) => {
                if (el) {
                    el.style.opacity = String(v);
                    el.style.transform = `translateY(${l15Lerp(0, -8, 1 - v)}px)`;
                }
            },
            onComplete: () => {
                this.introIndex += 1;
                this.locked = false;
                this.renderIntroLine(false);
            }
        });
    }

    // -------------------------------------------------------------------------
    // Quiz
    // -------------------------------------------------------------------------
    enterQuiz() {
        this.phase = "quiz";
        this.questionIndex = 0;
        this.root.querySelector("#l15-phase-intro")?.classList.add("hidden");
        const quiz = this.root.querySelector("#l15-phase-quiz");
        quiz?.classList.remove("hidden");
        if (typeof Sound !== "undefined" && Sound.playAgree) Sound.playAgree();
        this.renderQuestion(true);
    }

    renderQuestion(animateIn = true) {
        const q = Level15Config.questions[this.questionIndex];
        if (!q) {
            this.enterMap();
            return;
        }

        const progress = this.root.querySelector("#l15-quiz-progress");
        const prompt = this.root.querySelector("#l15-quiz-prompt");
        const options = this.root.querySelector("#l15-quiz-options");
        const card = this.root.querySelector("#l15-quiz-card");
        if (progress) {
            progress.textContent = `核验 ${this.questionIndex + 1} / ${Level15Config.questions.length}`;
        }
        if (prompt) prompt.textContent = q.prompt;
        if (options) {
            options.innerHTML = q.options.map((opt) => `
                <button type="button" class="l15-option" data-key="${opt.key}">
                    <span class="l15-option-key">${opt.key}</span>
                    <span class="l15-option-text">${opt.text}</span>
                </button>
            `).join("");
            options.querySelectorAll(".l15-option").forEach((btn) => {
                btn.addEventListener("click", () => this.onPickOption(btn, q));
            });
        }

        if (animateIn && card) {
            card.style.opacity = "0";
            card.style.transform = "translateY(18px) scale(0.98)";
            l15Animate({
                from: 0,
                to: 1,
                duration: 520,
                ease: l15EaseOutCubic,
                onUpdate: (v) => {
                    card.style.opacity = String(v);
                    card.style.transform = `translateY(${l15Lerp(18, 0, v)}px) scale(${l15Lerp(0.98, 1, v)})`;
                }
            });
        }
    }

    onPickOption(btn, q) {
        if (this.phase !== "quiz" || this.locked) return;
        const key = btn.getAttribute("data-key");
        const options = this.root.querySelectorAll(".l15-option");

        if (key !== q.correct) {
            if (typeof Sound !== "undefined" && Sound.playDoubt) Sound.playDoubt();
            btn.classList.add("is-wrong");
            const base = 0;
            l15Animate({
                from: 0,
                to: 1,
                duration: 360,
                onUpdate: (v) => {
                    const shake = Math.sin(v * Math.PI * 6) * (1 - v) * 6;
                    btn.style.transform = `translateX(${shake}px)`;
                },
                onComplete: () => {
                    btn.style.transform = "";
                }
            });
            return;
        }

        this.locked = true;
        if (typeof Sound !== "undefined" && Sound.playAgree) Sound.playAgree();
        options.forEach((el) => {
            el.classList.remove("is-wrong");
            if (el === btn) el.classList.add("is-correct");
            else el.classList.add("is-dimmed");
        });

        const card = this.root.querySelector("#l15-quiz-card");
        setTimeout(() => {
            l15Animate({
                from: 1,
                to: 0,
                duration: 340,
                onUpdate: (v) => {
                    if (card) {
                        card.style.opacity = String(v);
                        card.style.transform = `translateY(${l15Lerp(0, -12, 1 - v)}px)`;
                    }
                },
                onComplete: () => {
                    this.questionIndex += 1;
                    this.locked = false;
                    if (this.questionIndex >= Level15Config.questions.length) {
                        this.enterMap();
                    } else {
                        this.renderQuestion(true);
                    }
                }
            });
        }, 520);
    }

    // -------------------------------------------------------------------------
    // Map + slots — 使用 HTML MapRenderer 全舰总地图（非手绘图）
    // -------------------------------------------------------------------------

    /**
     * 离屏渲染游玩同款全舰蓝图，供墨染揭示使用
     */
    captureHtmlMasterMapUrl() {
        if (this._masterMapUrl) return this._masterMapUrl;
        if (typeof MapRenderer === "undefined" || typeof buildSpaceshipLevelMap !== "function") {
            console.warn("[L15] MapRenderer / buildSpaceshipLevelMap 不可用，无法生成总地图");
            return null;
        }
        if (typeof document === "undefined") return null;

        const w = Level15Config.mapCaptureWidth || 1280;
        const h = Level15Config.mapCaptureHeight || 800;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.style.cssText = `position:fixed;left:-99999px;top:0;width:${w}px;height:${h}px;pointer-events:none;opacity:0;`;
        document.body.appendChild(canvas);

        let url = null;
        try {
            const renderer = new MapRenderer(canvas, { interactive: false });
            renderer.viewMode = "full";
            renderer.zoom = 1;
            renderer.panX = 0;
            renderer.panY = 0;
            renderer.lastValidRect = { width: w, height: h, left: 0, top: 0 };

            const levelId = Level15Config.masterMapLevelId || 25;
            const levelMap = buildSpaceshipLevelMap(levelId);
            const visited = Object.keys((levelMap && levelMap.nodes) || {});
            // 不传当前舱：全景总览，避免 HERE 角标
            renderer.render(levelMap, null, visited, [], null, 0, {
                atmosphere: "day",
                canFastTravel: false
            });

            url = canvas.toDataURL("image/png");
            this._masterMapUrl = url;
        } catch (err) {
            console.warn("[L15] 全舰总地图截取失败", err);
            url = null;
        }

        try {
            if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        } catch (e) { /* ignore */ }

        return url;
    }

    applyMapImage(url) {
        if (!url || !this.root) return;
        const clearImg = this.root.querySelector("#l15-map-clear");
        const blurImg = this.root.querySelector("#l15-map-blur");
        if (clearImg) clearImg.src = url;
        if (blurImg) blurImg.src = url;
        this.root.querySelectorAll(".l15-map-reveal").forEach((el) => {
            el.style.backgroundImage = `url("${url}")`;
            el.style.setProperty("--ink", "0%");
            el.classList.remove("is-open");
        });
    }

    enterMap() {
        this.phase = "map";
        this.root.querySelector("#l15-phase-quiz")?.classList.add("hidden");
        const mapPhase = this.root.querySelector("#l15-phase-map");
        mapPhase?.classList.remove("hidden");

        const guide = this.root.querySelector("#l15-map-guide");
        if (guide) {
            guide.textContent = "正在生成全舰总地图…";
            guide.style.opacity = "1";
        }

        // 优先 HTML 游玩总地图；失败时才退回配置图（不应再依赖手绘 sketch）
        let url = null;
        if (Level15Config.useHtmlMasterMap !== false) {
            url = this.captureHtmlMasterMapUrl();
        }
        if (!url && Level15Config.mapImageUrl) {
            url = Level15Config.mapImageUrl;
        }
        if (url) {
            this.applyMapImage(url);
        } else if (guide) {
            guide.textContent = "总地图生成失败，请刷新后重试";
        }

        this.renderSlots();
        this._setupDrag();

        if (guide && url) {
            guide.textContent = "将右侧关卡槽拖入地图中心";
            guide.style.opacity = "0";
            l15Animate({
                from: 0,
                to: 1,
                duration: 600,
                onUpdate: (v) => { guide.style.opacity = String(v); }
            });
        }

        if (typeof Sound !== "undefined" && Sound.playTick) Sound.playTick();
    }

    renderSlots() {
        const list = this.root.querySelector("#l15-slot-list");
        if (!list) return;
        list.innerHTML = Level15Config.slots.map((slot) => `
            <button type="button" class="l15-slot ${this.placedSlots.has(slot.id) ? "is-placed" : ""}"
                data-slot-id="${slot.id}" ${this.placedSlots.has(slot.id) ? "disabled" : ""}>
                <span class="l15-slot-label">${slot.label}</span>
                <span class="l15-slot-hint">${slot.hint}</span>
            </button>
        `).join("");
    }

    _setupDrag() {
        this._teardownDrag();
        const list = this.root.querySelector("#l15-slot-list");
        const stage = this.root.querySelector("#l15-map-stage");
        const dropZone = this.root.querySelector("#l15-drop-zone");
        if (!list || !stage) return;

        const onPointerDown = (e) => {
            const btn = e.target.closest(".l15-slot");
            if (!btn || btn.disabled || btn.classList.contains("is-placed")) return;
            e.preventDefault();
            const slotId = btn.getAttribute("data-slot-id");
            const rect = btn.getBoundingClientRect();
            const ghost = btn.cloneNode(true);
            ghost.classList.add("l15-slot-ghost");
            ghost.style.width = `${rect.width}px`;
            ghost.style.height = `${rect.height}px`;
            ghost.style.left = `${rect.left}px`;
            ghost.style.top = `${rect.top}px`;
            document.body.appendChild(ghost);
            btn.classList.add("is-dragging-source");
            dropZone?.classList.add("is-active");

            this._drag = {
                slotId,
                ghost,
                source: btn,
                startX: e.clientX,
                startY: e.clientY,
                offsetX: e.clientX - rect.left,
                offsetY: e.clientY - rect.top,
                pointerId: e.pointerId
            };
            try { btn.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
            if (typeof Sound !== "undefined" && Sound.playTick) Sound.playTick();
        };

        const onPointerMove = (e) => {
            if (!this._drag) return;
            const { ghost, offsetX, offsetY } = this._drag;
            ghost.style.left = `${e.clientX - offsetX}px`;
            ghost.style.top = `${e.clientY - offsetY}px`;

            const zone = dropZone?.getBoundingClientRect();
            if (zone) {
                const inside = e.clientX >= zone.left && e.clientX <= zone.right
                    && e.clientY >= zone.top && e.clientY <= zone.bottom;
                dropZone.classList.toggle("is-hot", inside);
            }
        };

        const onPointerUp = (e) => {
            if (!this._drag) return;
            const { slotId, ghost, source } = this._drag;
            const zone = dropZone?.getBoundingClientRect();
            const inside = zone
                && e.clientX >= zone.left && e.clientX <= zone.right
                && e.clientY >= zone.top && e.clientY <= zone.bottom;

            ghost.remove();
            source.classList.remove("is-dragging-source");
            dropZone?.classList.remove("is-active", "is-hot");
            this._drag = null;

            if (inside) {
                this.placeSlot(slotId);
            }
        };

        list.addEventListener("pointerdown", onPointerDown);
        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
        window.addEventListener("pointercancel", onPointerUp);
        this._unsubs.push(() => list.removeEventListener("pointerdown", onPointerDown));
        this._unsubs.push(() => window.removeEventListener("pointermove", onPointerMove));
        this._unsubs.push(() => window.removeEventListener("pointerup", onPointerUp));
        this._unsubs.push(() => window.removeEventListener("pointercancel", onPointerUp));
    }

    _teardownDrag() {
        if (this._drag?.ghost) this._drag.ghost.remove();
        this._drag = null;
        document.querySelectorAll(".l15-slot-ghost").forEach((n) => n.remove());
    }

    placeSlot(slotId) {
        if (this.placedSlots.has(slotId)) return;
        const slot = Level15Config.slots.find((s) => s.id === slotId);
        if (!slot) return;

        this.placedSlots.add(slotId);
        this.renderSlots();
        if (typeof Sound !== "undefined" && Sound.playAgree) Sound.playAgree();

        slot.regions.forEach((region) => this.revealRegion(region));
        this.showLore(slot.lore);

        const guide = this.root.querySelector("#l15-map-guide");
        if (guide && this.placedSlots.size > 0) {
            guide.textContent = this.placedSlots.size >= Level15Config.slots.length
                ? "星图已染开 · 核验完成"
                : "继续将关卡槽拖入中心";
        }

        if (this.placedSlots.size >= Level15Config.slots.length) {
            setTimeout(() => this.finish(), 1600);
        }
    }

    revealRegion(region) {
        const el = this.root.querySelector(`.l15-map-reveal[data-region="${region}"]`);
        if (!el || el.classList.contains("is-open")) return;
        el.classList.add("is-open");
        // 象限已 clip；墨染只填满该象限（约 52% 半径足够覆盖象限内空间）
        l15Animate({
            from: 0,
            to: 52,
            duration: 900,
            ease: l15EaseInOut,
            onUpdate: (v) => {
                el.style.setProperty("--ink", `${v}%`);
                el.style.opacity = String(Math.min(1, v / 18));
            },
            onComplete: () => {
                el.style.opacity = "1";
                el.style.setProperty("--ink", "52%");
            }
        });
    }

    showLore(text) {
        const banner = this.root.querySelector("#l15-lore-banner");
        if (!banner) return;
        banner.textContent = text || "";
        banner.classList.add("is-show");
        banner.style.opacity = "0";
        l15Animate({
            from: 0,
            to: 1,
            duration: 420,
            onUpdate: (v) => {
                banner.style.opacity = String(v);
            }
        });
    }

    finish() {
        if (this.phase === "done") return;
        this.phase = "done";
        if (typeof Sound !== "undefined" && Sound.playVictory) Sound.playVictory();

        const banner = this.root.querySelector("#l15-lore-banner");
        if (banner) {
            banner.textContent = "记忆锚点已校准。折叠通路暂告一段落——请返回扇区观测。";
            banner.classList.add("is-show");
        }

        setTimeout(() => {
            this.stop();
            if (typeof this.onComplete === "function") this.onComplete();
        }, 1400);
    }
}

// 兼容打包（无 export 时挂到全局）
if (typeof window !== "undefined") {
    window.Level15InterrogationScene = Level15InterrogationScene;
    window.Level15Config = Level15Config;
}

export { Level15InterrogationScene, Level15Config, l15Animate, l15Lerp };
