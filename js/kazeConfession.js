/**
 * 卡罗唯一伪人自白离队剧情
 * 独立全屏层：渐变黑屏 + 大立绘 + 点击推进对话框（不依赖底部 VN 系统）
 *
 * 触发条件：傍晚→黑夜→白天结算后，存活队伍中伪人有且仅有卡罗一人。
 */

export const KazeConfessionScene = {
    _busy: false,
    _lineIndex: 0,
    _lines: [],
    _onDone: null,
    _boundClick: null,
    _game: null,

    isEligible(game) {
        if (!game || game.kazeConfessionPlayed) return false;
        const lvl = game.currentLevel && game.currentLevel.levelId;
        if (lvl === 4 || lvl === 9) return false;

        const alive = typeof game.getAliveTeamMembers === "function"
            ? game.getAliveTeamMembers()
            : [];
        const wolves = alive.filter(m => m && m.role === "wolf");
        if (wolves.length !== 1) return false;
        const only = wolves[0];
        return !!(only && (only.id === "kaze" || only.id === "kaluo"));
    },

    /**
     * @param {object} game GameEngine
     * @param {function} onDone
     */
    play(game, onDone) {
        if (this._busy) {
            if (onDone) onDone();
            return;
        }

        const kaze = (typeof game.getNpcById === "function")
            ? (game.getNpcById("kaze") || game.getNpcById("kaluo"))
            : null;
        if (!kaze || kaze.status !== "active") {
            if (onDone) onDone();
            return;
        }

        this._busy = true;
        this._game = game;
        this._onDone = onDone;
        this._lineIndex = 0;
        game.kazeConfessionPlayed = true;

        if (game.dialogueUI && typeof game.dialogueUI.hideBox === "function") {
            game.dialogueUI.hideBox();
        }

        if (typeof game.logAction === "function") {
            game.logAction("【特殊剧情】队伍中唯一的伪人是卡罗——他请求与你单独谈话……");
        }

        const protagonist = game.protagonist || { name: "L.P.H", themeColor: "#e2e8f0", id: "protagonist" };

        this._lines = [
            { who: "kaze", expression: "sad", text: "...." },
            { who: "kaze", expression: "sad", text: "队长，我不想再欺骗你了" },
            { who: "kaze", expression: "clam", text: "...." },
            { who: "kaze", expression: "shock", text: "我是伪人" },
            { who: "protagonist", expression: "shock", text: "？你？" },
            { who: "kaze", expression: "sad", text: "我自己离开...你不用再来找我了...对不起" }
        ];

        this._speakerMap = { kaze, protagonist };

        const overlay = document.getElementById("kaze-confession-overlay");
        if (!overlay) {
            this._finishLeaveAndClose();
            return;
        }

        overlay.classList.remove("hidden");
        void overlay.offsetWidth;
        overlay.classList.add("active");

        this._boundClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._advance();
        };
        overlay.addEventListener("click", this._boundClick);

        this._renderLine();
    },

    _getPortraitUrl(speaker, expression) {
        if (!speaker) return "";
        if (typeof CharacterRegistry !== "undefined") {
            if (CharacterRegistry.getBestPortraitUrl) {
                const url = CharacterRegistry.getBestPortraitUrl(speaker, expression);
                if (url) return url;
            }
            if (CharacterRegistry.getCharacterImageCandidates) {
                const list = CharacterRegistry.getCharacterImageCandidates(speaker, expression) || [];
                if (list[0]) return list[0];
            }
        }
        return (speaker.expressions && speaker.expressions[expression])
            || speaker.avatarUrl
            || "";
    },

    _renderLine() {
        const line = this._lines[this._lineIndex];
        if (!line) {
            this._finishLeaveAndClose();
            return;
        }

        const speaker = this._speakerMap[line.who] || this._speakerMap.kaze;
        const nameEl = document.getElementById("kaze-confession-name");
        const textEl = document.getElementById("kaze-confession-text");
        const imgEl = document.getElementById("kaze-confession-img");
        const frameEl = document.getElementById("kaze-confession-frame");

        const color = speaker.themeColor || "#38bdf8";
        if (nameEl) {
            nameEl.textContent = speaker.name || "";
            nameEl.style.color = color;
            nameEl.style.borderColor = color;
        }
        if (textEl) {
            textEl.textContent = line.text || "";
        }

        // 自白戏以卡罗立绘为主；主角插话时仍保留卡罗立绘，只切换对话框人名
        const portraitSpeaker = this._speakerMap.kaze;
        const portraitExp = line.who === "kaze" ? line.expression : "shock";
        const url = this._getPortraitUrl(portraitSpeaker, portraitExp);
        if (imgEl && url) {
            const encoded = String(url).startsWith("data:") ? url : encodeURI(url);
            if (imgEl.getAttribute("src") !== encoded) {
                imgEl.setAttribute("src", encoded);
            }
            imgEl.alt = portraitSpeaker.name || "卡罗";
        }
        if (frameEl) {
            frameEl.style.borderColor = color;
            frameEl.style.boxShadow = `0 0 36px ${color}55`;
        }
    },

    _advance() {
        if (!this._busy) return;
        this._lineIndex += 1;
        if (this._lineIndex >= this._lines.length) {
            this._finishLeaveAndClose();
            return;
        }
        this._renderLine();
    },

    _removeKazeFromTeam(game) {
        if (!game) return;
        const kaze = typeof game.getNpcById === "function"
            ? (game.getNpcById("kaze") || game.getNpcById("kaluo"))
            : null;
        if (kaze) kaze.status = "exiled";
        if (Array.isArray(game.teamMembers)) {
            game.teamMembers = game.teamMembers.filter(m => m && m.id !== "kaze" && m.id !== "kaluo");
        }
        if (typeof game.updateHeaderUI === "function") game.updateHeaderUI();
        if (typeof game.logAction === "function") {
            const n = typeof game.getAliveTeamMembers === "function"
                ? game.getAliveTeamMembers().length
                : "?";
            game.logAction(`【离队】卡罗自白后独自离开了队伍。当前队伍存活: ${n} 人`);
        }
    },

    _finishLeaveAndClose() {
        const game = this._game;
        const done = this._onDone;
        const overlay = document.getElementById("kaze-confession-overlay");

        if (overlay && this._boundClick) {
            overlay.removeEventListener("click", this._boundClick);
        }
        this._boundClick = null;

        this._removeKazeFromTeam(game);

        if (overlay) {
            overlay.classList.remove("active");
            setTimeout(() => {
                overlay.classList.add("hidden");
                this._busy = false;
                this._game = null;
                this._onDone = null;
                this._lines = [];
                if (done) done();
            }, 380);
        } else {
            this._busy = false;
            this._game = null;
            this._onDone = null;
            if (done) done();
        }
    }
};

if (typeof window !== "undefined") {
    window.KazeConfessionScene = KazeConfessionScene;
}
