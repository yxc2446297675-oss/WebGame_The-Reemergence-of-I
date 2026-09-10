/**
 * 视觉小说对话与立绘控制器 (Visual Novel Dialogue UI)
 * 严格按照用户需求：
 * 1. 占满屏幕正中底下的视觉小说对话框
 * 2. 对话框左上角人名标牌
 * 3. 每一个 NPC 与玩家专属的边框发光色与主题色
 * 4. 表情差分系统：NPC右上角立绘根据当前句子表情（angry, doubt, smile等）实时动态变脸！
 * 5. 点击推进下一句、打字机跳过机制与完成回调
 */

import { CharacterRegistry } from "./characters.js";
import { Sound } from "./audio.js";

// 全局立绘容错轮询处理器 (当优先候选文件不存在时，跳过已知失败项，无缝尝试下一个)
if (typeof window !== "undefined") {
    window.handlePortraitError = function(img) {
        if (!img) return;
        try {
            if (typeof CharacterRegistry !== "undefined" && CharacterRegistry.failedImages) {
                const bad = img.getAttribute("data-current-url") || img.getAttribute("src");
                if (bad) CharacterRegistry.failedImages.add(decodeURI(bad));
            }
            let raw = img.getAttribute("data-candidates");
            if (raw) {
                if (typeof raw === "string" && raw.includes("&quot;")) {
                    raw = raw.replace(/&quot;/g, '"');
                }
                const candidates = (typeof raw === "string") ? JSON.parse(raw) : raw;
                let idx = parseInt(img.getAttribute("data-index") || "0", 10) + 1;
                if (Array.isArray(candidates)) {
                    while (idx < candidates.length) {
                        const next = candidates[idx];
                        const failed = typeof CharacterRegistry !== "undefined"
                            && CharacterRegistry.failedImages
                            && CharacterRegistry.failedImages.has(next);
                        if (next && !failed) {
                            img.setAttribute("data-index", String(idx));
                            img.setAttribute("data-current-url", next);
                            img.src = encodeURI(next);
                            return;
                        }
                        idx++;
                    }
                }
            }
        } catch (e) {
            console.warn("[Portrait] 尝试候选立绘失败:", e);
        }
        const fallback = img.getAttribute("data-fallback");
        if (fallback && img.src !== fallback) {
            img.src = fallback;
        }
    };
}

export class DialogueUI {
    constructor() {
        this.boxElement = document.getElementById("vn-dialogue-box");
        this.nameElement = document.getElementById("vn-speaker-name");
        this.textElement = document.getElementById("vn-dialogue-text");
        this.portraitElement = document.getElementById("vn-speaker-portrait");
        this.cornerAvatarElement = document.getElementById("vn-dialogue-corner-avatar");
        this.advanceIndicator = document.getElementById("vn-advance-cursor");

        this.currentQueue = [];
        this.currentIndex = 0;
        this.onCompleteCallback = null;

        this.isTyping = false;
        this.typingTimer = null;
        this.fullTextOfCurrentLine = "";

        this.bindEvents();
        this.hideBox(); // 初始默认隐藏对话框，不占用任何探索界面与导航按键空间
    }

    bindEvents() {
        if (!this.boxElement) return;

        let touchStartX = 0;
        let touchStartY = 0;
        let isTouchDrag = false;
        let lastTouchDragTime = 0;

        this.boxElement.addEventListener("touchstart", (e) => {
            if (e.touches && e.touches.length > 0) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                isTouchDrag = false;
            }
        }, { passive: true });

        this.boxElement.addEventListener("touchmove", (e) => {
            if (e.touches && e.touches.length > 0) {
                const dx = e.touches[0].clientX - touchStartX;
                const dy = e.touches[0].clientY - touchStartY;
                if (Math.hypot(dx, dy) > 8) {
                    isTouchDrag = true;
                    lastTouchDragTime = Date.now();
                }
            }
        }, { passive: true });

        this.boxElement.addEventListener("touchend", () => {
            if (isTouchDrag) {
                lastTouchDragTime = Date.now();
            }
        }, { passive: true });

        this.boxElement.addEventListener("click", () => {
            // 如果用户正在手指滑动查看长文本，不触发推进
            if (isTouchDrag || (Date.now() - lastTouchDragTime < 300)) {
                isTouchDrag = false;
                return;
            }
            this.handleClick();
        });
    }

    /**
     * 播放一段或多段对话
     * @param {Array<{speaker: Object, text: string}>} dialogueLines 
     * @param {Function} onComplete 播放完毕后的回调
     */
    playSequence(dialogueLines, onComplete = null) {
        if (!dialogueLines || dialogueLines.length === 0) {
            this.hideBox();
            if (onComplete) onComplete();
            return;
        }

        this.currentQueue = dialogueLines;
        this.currentIndex = 0;
        this.onCompleteCallback = onComplete;
        this.showBox();
        this.renderCurrentLine();
    }

    /**
     * 快捷播放单条对话
     */
    say(speaker, text, onComplete = null) {
        if (!text || (typeof text === "string" && text.trim() === "")) {
            this.hideBox();
            if (onComplete) onComplete();
            return;
        }
        this.playSequence([{ speaker, text }], onComplete);
    }

    showBox() {
        if (this.boxElement) {
            this.boxElement.classList.remove("vn-hidden");
        }
        const screenGame = document.getElementById("screen-game");
        if (screenGame) {
            screenGame.classList.add("has-dialogue-active");
        }
    }

    hideBox() {
        if (this.boxElement) {
            this.boxElement.classList.add("vn-hidden");
            this.boxElement.classList.remove("has-portrait");
        }
        if (this.portraitElement) {
            this.portraitElement.classList.add("portrait-hidden");
        }
        if (this.cornerAvatarElement) {
            this.cornerAvatarElement.classList.add("portrait-hidden");
        }
        const screenGame = document.getElementById("screen-game");
        if (screenGame) {
            screenGame.classList.remove("has-dialogue-active");
        }
    }

    renderCurrentLine() {
        if (this.currentIndex >= this.currentQueue.length) {
            this.finishSequence();
            return;
        }

        const item = this.currentQueue[this.currentIndex];
        const speaker = item.speaker || { name: "系统", themeColor: "#38bdf8" };

        // 解析当前文本与绑定的表情 (支持直接传 item.expression 或 文本内包含 [生气] 等标签，无指示时默认用 clam)
        let parsed = { text: "", expression: "clam" };
        if (item.expression) {
            parsed.text = item.text || "";
            parsed.expression = (typeof CharacterRegistry !== "undefined" && CharacterRegistry.normalizeExpression)
                ? CharacterRegistry.normalizeExpression(item.expression)
                : item.expression;
        } else if (typeof CharacterRegistry !== "undefined" && CharacterRegistry.parseDialogueLine) {
            parsed = CharacterRegistry.parseDialogueLine(item.text !== undefined ? item.text : item);
        } else {
            parsed.text = item.text || "";
            parsed.expression = "clam";
        }

        this.fullTextOfCurrentLine = parsed.text;

        // 1. 设置说话人姓名与主题色 (死亡时呈现告警红色)
        this.nameElement.textContent = (parsed.expression === "dead") ? `${speaker.name} [已遇害]` : speaker.name;
        this.applySpeakerTheme(speaker, parsed.expression);

        // 2. 渲染立绘 (主角不展示，NPC在对话框右上角展示对应表情立绘，遇害时展示 dead 立绘)
        this.renderPortrait(speaker, parsed.expression);

        // 3. 广播发出警报时播放专属警报音效 (警告.wav)
        const isAlarmLine = (
            (speaker.name && /警报|警告|警示|ALERT/i.test(speaker.name)) ||
            (this.isBroadcastOrSystem(speaker) && /⚠️|警报|警告/i.test(this.fullTextOfCurrentLine))
        );
        if (isAlarmLine && typeof Sound !== "undefined" && Sound.playAlarmSound) {
            Sound.playAlarmSound();
        }

        // 4. 开始打字机动画
        this.startTypewriter(this.fullTextOfCurrentLine);
    }

    applySpeakerTheme(speaker, expression = "clam") {
        const isDead = (expression === "dead");
        const themeColor = isDead ? "#ef4444" : (speaker.themeColor || "#38bdf8");
        const boxBorderColor = isDead ? "rgba(239, 68, 68, 0.9)" : (speaker.boxBorderColor || `rgba(56, 189, 248, 0.85)`);
        const boxBgGlow = isDead ? "rgba(239, 68, 68, 0.25)" : (speaker.boxBgGlow || `rgba(56, 189, 248, 0.15)`);

        // 动态修改对话框和名字牌的专属主题风格
        this.nameElement.style.color = themeColor;
        this.nameElement.style.borderColor = themeColor;
        this.nameElement.style.boxShadow = `0 0 12px ${themeColor}40`;

        this.boxElement.style.borderColor = boxBorderColor;
        this.boxElement.style.boxShadow = `0 -8px 24px ${boxBgGlow}, inset 0 0 20px ${boxBgGlow}`;
    }

    isBroadcastOrSystem(speaker) {
        if (!speaker) return true;
        if (speaker.isBroadcast || speaker.isSystem) return true;
        if (speaker.id === "system" || speaker.id === "broadcast") return true;
        const name = speaker.name || "";
        return /广播|系统|终端|通信|审决|全员/i.test(name);
    }

    renderPortrait(speaker, expression = "clam") {
        // 系统广播、警报广播、终端通知等一律严禁展示立绘
        if (this.isBroadcastOrSystem(speaker)) {
            if (this.cornerAvatarElement) {
                this.cornerAvatarElement.classList.add("portrait-hidden");
                this.cornerAvatarElement.innerHTML = "";
            }
            if (this.portraitElement) {
                this.portraitElement.classList.add("portrait-hidden");
            }
            if (this.boxElement) {
                this.boxElement.classList.remove("has-portrait");
            }
            return;
        }

        // 角色/NPC 说话时：立绘展示在对话框左上角！用户明确要求：不要标注“生气/平静”等字样
        if (this.cornerAvatarElement) {
            this.cornerAvatarElement.classList.remove("portrait-hidden");
            if (this.boxElement) {
                this.boxElement.classList.add("has-portrait");
            }

            const color = speaker.themeColor || "#38bdf8";
            const exp = (typeof CharacterRegistry !== "undefined" && CharacterRegistry.normalizeExpression)
                ? CharacterRegistry.normalizeExpression(expression)
                : (expression || "clam");
            
            // 获取候选立绘队列，并优先选用已预热成功的 URL（避免手机上 onerror 连环探测）
            const candidates = (typeof CharacterRegistry !== "undefined" && CharacterRegistry.getCharacterImageCandidates)
                ? CharacterRegistry.getCharacterImageCandidates(speaker, exp)
                : [(speaker.expressions && speaker.expressions[exp]) || speaker.avatarUrl || ""];

            // 备用差分SVG
            const fallbackSvg = (typeof CharacterRegistry !== "undefined" && CharacterRegistry.getAvatarSvg)
                ? CharacterRegistry.getAvatarSvg(speaker, exp)
                : (speaker.fallbackSvg || "");

            const isDead = (exp === "dead");
            const borderColor = isDead ? "#ef4444" : color;
            const shadowGlow = isDead
                ? "0 0 24px rgba(239, 68, 68, 0.95), inset 0 0 16px rgba(239, 68, 68, 0.6)"
                : `0 0 16px ${color}80, inset 0 0 12px ${color}40`;

            const primaryUrl = (typeof CharacterRegistry !== "undefined" && CharacterRegistry.getBestPortraitUrl)
                ? (CharacterRegistry.getBestPortraitUrl(speaker, exp) || candidates[0] || fallbackSvg)
                : (candidates[0] || fallbackSvg);
            const startIndex = Math.max(0, candidates.indexOf(primaryUrl));
            const candidatesAttr = JSON.stringify(candidates).replace(/"/g, '&quot;');
            const safePrimary = primaryUrl && !String(primaryUrl).startsWith("data:")
                ? encodeURI(primaryUrl)
                : primaryUrl;

            // 优化 DOM 节点复用：同角色同表情连续发言时，完全保留已有 DOM 树，杜绝销毁重绘导致的白屏与解码延迟
            const speakerKey = `${speaker.id || speaker.name || 'char'}_${exp}`;
            if (this.currentSpeakerKey !== speakerKey || !this.cornerAvatarElement.innerHTML) {
                this.currentSpeakerKey = speakerKey;
                this.cornerAvatarElement.innerHTML = `
                    <div class="corner-avatar-frame ${isDead ? 'avatar-frame-dead' : ''}" style="border-color:${borderColor}; box-shadow:${shadowGlow};">
                        <img src="${safePrimary}"
                             loading="eager"
                             decoding="async"
                             data-candidates="${candidatesAttr}"
                             data-index="${startIndex}"
                             data-current-url="${primaryUrl || ""}"
                             data-fallback="${fallbackSvg}"
                             alt="${speaker.name}"
                             class="corner-portrait-img ${isDead ? 'dead-portrait-img' : ''}"
                             onerror="window.handlePortraitError && window.handlePortraitError(this)">
                    </div>
                `;
            }
        }
    }

    startTypewriter(text) {
        if (this.typingTimer) {
            clearInterval(this.typingTimer);
        }

        this.isTyping = true;
        this.textElement.textContent = "";
        if (this.textElement) {
            this.textElement.scrollTop = 0;
        }
        if (this.advanceIndicator) {
            this.advanceIndicator.classList.add("indicator-hidden");
        }

        let charIdx = 0;
        const speed = 24; // 毫秒/字

        this.typingTimer = setInterval(() => {
            if (charIdx < text.length) {
                this.textElement.textContent += text.charAt(charIdx);
                charIdx++;
                if (this.textElement) {
                    this.textElement.scrollTop = this.textElement.scrollHeight;
                }
            } else {
                this.finishTyping();
            }
        }, speed);
    }

    finishTyping() {
        if (this.typingTimer) {
            clearInterval(this.typingTimer);
            this.typingTimer = null;
        }
        this.isTyping = false;
        this.textElement.textContent = this.fullTextOfCurrentLine;
        if (this.textElement) {
            this.textElement.scrollTop = this.textElement.scrollHeight;
        }
        if (this.advanceIndicator) {
            this.advanceIndicator.classList.remove("indicator-hidden");
        }
    }

    handleClick() {
        // 如果正在打字，点击立即显示整句
        if (this.isTyping) {
            this.finishTyping();
            return;
        }

        // 如果已经打完，点击前进至下一句
        this.currentIndex++;
        this.renderCurrentLine();
    }

    finishSequence() {
        this.currentQueue = [];
        this.currentIndex = 0;
        this.hideBox();
        if (this.advanceIndicator) {
            this.advanceIndicator.classList.add("indicator-hidden");
        }
        if (this.onCompleteCallback) {
            const cb = this.onCompleteCallback;
            this.onCompleteCallback = null;
            cb();
        }
    }
}
