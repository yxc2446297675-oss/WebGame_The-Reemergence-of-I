/**
 * 游戏主控制器与视觉小说 UI 驱动 (Game Controller & Visual Novel UI)
 * 串联主菜单、评议会圆桌、打字机对话流、夜间自由行动、存档读档
 */
import { WorldviewConfig, LevelConfigs } from './config.js';
import { RoleFactory } from './roles.js';
import { Character, DefaultCharacterTemplates } from './characters.js';
import { GnosiaEngine } from './aiEngine.js';
import { Sound } from './audio.js';

class GameApp {
    constructor() {
        this.currentLevelIndex = 0;
        this.engine = null;
        this.activeSpeaker = null;
        this.selectedTargetForAction = null;
        this.isTyping = false;
        this.typewriterTimer = null;

        this.initDOMReferences();
        this.bindEvents();
        this.checkExistingSave();
    }

    initDOMReferences() {
        // 主菜单
        this.screenMenu = document.getElementById("screen-menu");
        this.btnStartGame = document.getElementById("btn-start-game");
        this.btnContinue = document.getElementById("btn-continue");
        this.btnLevelSelect = document.getElementById("btn-level-select");
        this.btnSettings = document.getElementById("btn-settings");
        this.levelSelectModal = document.getElementById("level-select-modal");
        this.settingsModal = document.getElementById("settings-modal");

        // 游戏主视口 (视觉小说与圆桌)
        this.screenGame = document.getElementById("screen-game");
        this.roundtableContainer = document.getElementById("roundtable-container");
        this.speakerAvatar = document.getElementById("speaker-avatar");
        this.speakerName = document.getElementById("speaker-name");
        this.speakerText = document.getElementById("speaker-text");
        this.speakerRoleBadge = document.getElementById("speaker-role-badge");
        this.debateLogList = document.getElementById("debate-log-list");
        this.headerDayText = document.getElementById("header-day-text");
        this.headerAliveText = document.getElementById("header-alive-text");

        // 玩家交互控制台
        this.btnDoubt = document.getElementById("btn-doubt");
        this.btnDefend = document.getElementById("btn-defend");
        this.btnAgree = document.getElementById("btn-agree");
        this.btnClaim = document.getElementById("btn-claim");
        this.btnNext = document.getElementById("btn-next");
        this.btnVoteNow = document.getElementById("btn-vote-now");

        // 弹窗模态框
        this.targetSelectModal = document.getElementById("target-select-modal");
        this.targetList = document.getElementById("target-list");
        this.modalTitle = document.getElementById("modal-title");
        this.voteModal = document.getElementById("vote-modal");
        this.voteTargetList = document.getElementById("vote-target-list");
        this.coldSleepModal = document.getElementById("cold-sleep-modal");
        this.coldSleepVictim = document.getElementById("cold-sleep-victim");
        this.nightModal = document.getElementById("night-modal");
        this.nightContent = document.getElementById("night-content");
        this.gameOverModal = document.getElementById("game-over-modal");
        this.gameOverTitle = document.getElementById("game-over-title");
        this.gameOverDesc = document.getElementById("game-over-desc");
    }

    bindEvents() {
        // 点击页面任何地方解锁音频
        document.addEventListener("click", () => Sound.unlock(), { once: true });

        // 主菜单按钮
        this.btnStartGame.onclick = () => this.startNewGame(0);
        this.btnContinue.onclick = () => this.loadGame();
        this.btnLevelSelect.onclick = () => this.openLevelSelect();
        this.btnSettings.onclick = () => this.openSettings();

        // 玩家辩论动作按钮
        this.btnDoubt.onclick = () => this.openTargetSelect("DOUBT");
        this.btnDefend.onclick = () => this.openTargetSelect("DEFEND");
        this.btnAgree.onclick = () => this.handlePlayerAgree();
        this.btnClaim.onclick = () => this.handlePlayerClaim();
        this.btnNext.onclick = () => this.proceedNextSpeaker();
        this.btnVoteNow.onclick = () => this.openVoteModal();

        // 静音切换
        const btnMute = document.getElementById("btn-mute");
        if (btnMute) {
            btnMute.onclick = () => {
                const muted = Sound.toggleMute();
                btnMute.innerText = muted ? "🔇 音效: 关" : "🔊 音效: 开";
            };
        }

        // 保存游戏
        const btnSave = document.getElementById("btn-save");
        if (btnSave) btnSave.onclick = () => this.saveGame();

        // 返回主菜单
        const btnExit = document.getElementById("btn-exit");
        if (btnExit) btnExit.onclick = () => this.returnToMenu();
    }

    // ==========================================
    // 1. 初始化关卡与发牌 (Level Setup & Dealing)
    // ==========================================
    startNewGame(levelIndex = 0) {
        this.currentLevelIndex = levelIndex;
        const level = LevelConfigs[levelIndex];
        const count = level.playerCount;

        // 截取对应人数的角色模板
        const selectedTemplates = DefaultCharacterTemplates.slice(0, count);
        const characters = selectedTemplates.map(t => new Character(t));

        // 洗牌分配身份
        const rolePool = [];
        Object.entries(level.rolesDistribution).forEach(([roleId, num]) => {
            for (let i = 0; i < num; i++) rolePool.push(roleId);
        });
        // 随机打乱身份池
        for (let i = rolePool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rolePool[i], rolePool[j]] = [rolePool[j], rolePool[i]];
        }

        // 赋予角色对应身份
        characters.forEach((char, idx) => {
            const rId = rolePool[idx] || "villager";
            char.role = RoleFactory.create(rId);
            char.initPerception(characters);
        });

        this.engine = new GnosiaEngine(characters, level);

        // 切换界面
        this.screenMenu.classList.add("hidden");
        this.screenGame.classList.remove("hidden");

        // 广播突发事件
        this.debateLogList.innerHTML = "";
        this.appendLog(`【主控脑】：跃迁初始化完成，${level.title} 已加载！`);
        this.appendLog(`【飞船广播】：当前苏醒船员：${count}人。潜伏感染者已混入其中。`);
        if (level.possibleEvents && level.possibleEvents.length > 0) {
            const ev = level.possibleEvents[0];
            this.appendLog(`${ev.logMessage}（${ev.effectText}）`);
        }

        const player = this.engine.getPlayer();
        this.appendLog(`【机密终端】：L.P.H，你的本轮初始身份为：【${player.role.name}】（${player.role.description}）`);

        this.refreshRoundtable();
        this.updateHeaderUI();
        this.startDayPhase();
    }

    // ==========================================
    // 2. 评议会流转与打字机动画 (Debate Loop)
    // ==========================================
    startDayPhase() {
        this.updateHeaderUI();
        this.appendLog(`—— 第 ${this.engine.currentDay} 日全员评议会开始 ——`);
        this.engine.currentTurnIndex = 0;
        this.proceedNextSpeaker();
    }

    proceedNextSpeaker() {
        const alive = this.engine.getAliveCharacters();
        if (alive.length === 0) return;

        // 检查是否已达到当日辩论轮数上限，若是则强制开启投票
        if (this.engine.currentRound > this.engine.maxDebateRoundsPerDay) {
            this.openVoteModal();
            return;
        }

        const currentSpeaker = alive[this.engine.currentTurnIndex % alive.length];
        this.engine.currentTurnIndex++;

        // 若一整圈角色都发言了一次，轮数增加
        if (this.engine.currentTurnIndex % alive.length === 0) {
            this.engine.currentRound++;
        }

        this.highlightCharacterOnTable(currentSpeaker.id);

        if (currentSpeaker.isPlayer) {
            // 轮到玩家发言：激活全部交互指令
            this.activeSpeaker = currentSpeaker;
            this.showDialogue(currentSpeaker, "「轮到你发言了，L.P.H。请选择你的论点与行动。」");
            this.enablePlayerActions(true);
        } else {
            // 轮到 NPC 发言：由 AI 决策
            this.enablePlayerActions(false);
            const decision = this.engine.makeAIDecision(currentSpeaker);
            if (decision) {
                this.engine.lastAction = decision;
                this.showDialogue(currentSpeaker, decision.text);
                this.appendLog(`【${currentSpeaker.name}】：${decision.text}`);
                this.refreshRoundtable();
            }
        }
    }

    // 打字机流式呈现对话
    showDialogue(character, text) {
        if (this.typewriterTimer) clearInterval(this.typewriterTimer);
        this.speakerAvatar.innerHTML = character.getAvatarHTML();
        this.speakerName.innerText = character.name;
        this.speakerName.style.color = character.themeColor;
        this.speakerRoleBadge.innerText = character.isPlayer ? `身份：${character.role.name}` : (character.claimedRole ? `自称：${character.claimedRole}` : "身份未公开");

        this.speakerText.innerText = "";
        let charIndex = 0;
        this.isTyping = true;
        Sound.playTick();

        this.typewriterTimer = setInterval(() => {
            if (charIndex < text.length) {
                this.speakerText.innerText += text[charIndex];
                charIndex++;
            } else {
                clearInterval(this.typewriterTimer);
                this.isTyping = false;
            }
        }, 22);
    }

    enablePlayerActions(enable) {
        this.btnDoubt.disabled = !enable;
        this.btnDefend.disabled = !enable;
        this.btnAgree.disabled = !enable || !this.engine.lastAction || !this.engine.lastAction.target;
        this.btnClaim.disabled = !enable || this.engine.getPlayer().claimedRole !== null;
    }

    // 玩家动作处理
    openTargetSelect(actionType) {
        this.selectedActionType = actionType;
        this.modalTitle.innerText = actionType === "DOUBT" ? "选择你要怀疑的对象：" : "选择你要辩护的对象：";
        this.targetList.innerHTML = "";
        const player = this.engine.getPlayer();
        const targets = this.engine.getAliveCharacters().filter(c => c.id !== player.id);

        targets.forEach(target => {
            const btn = document.createElement("button");
            btn.className = "target-btn";
            btn.innerHTML = `<span class="target-name">${target.name}</span> <span class="target-title">${target.title}</span>`;
            btn.onclick = () => {
                this.targetSelectModal.classList.add("hidden");
                if (actionType === "DOUBT") {
                    const action = this.engine.playerDoubt(target);
                    this.showDialogue(player, action.text);
                    this.appendLog(`【${player.name}】：${action.text}`);
                } else if (actionType === "DEFEND") {
                    const action = this.engine.playerDefend(target);
                    this.showDialogue(player, action.text);
                    this.appendLog(`【${player.name}】：${action.text}`);
                }
                this.refreshRoundtable();
                this.enablePlayerActions(false);
            };
            this.targetList.appendChild(btn);
        });

        this.targetSelectModal.classList.remove("hidden");
    }

    handlePlayerAgree() {
        const action = this.engine.playerAgree();
        if (action) {
            const player = this.engine.getPlayer();
            this.showDialogue(player, action.text);
            this.appendLog(`【${player.name}】：${action.text}`);
            this.refreshRoundtable();
            this.enablePlayerActions(false);
        }
    }

    handlePlayerClaim() {
        const action = this.engine.playerClaim();
        if (action) {
            const player = this.engine.getPlayer();
            this.showDialogue(player, action.text);
            this.appendLog(`【${player.name}】：${action.text}`);
            this.refreshRoundtable();
            this.enablePlayerActions(false);
        }
    }

    // ==========================================
    // 3. 投票冷冻阶段 (Voting Phase)
    // ==========================================
    openVoteModal() {
        this.voteTargetList.innerHTML = "";
        const alive = this.engine.getAliveCharacters();
        alive.forEach(c => {
            const btn = document.createElement("button");
            btn.className = "vote-btn";
            btn.innerHTML = `
                <div class="vote-avatar">${c.getAvatarHTML()}</div>
                <div class="vote-info">
                    <strong>${c.name}</strong> ${c.isPlayer ? "(你自己)" : ""}
                    <small style="display:block; color:#888;">${c.title}</small>
                </div>
            `;
            btn.onclick = () => this.executeVote(c.id);
            this.voteTargetList.appendChild(btn);
        });
        this.voteModal.classList.remove("hidden");
    }

    executeVote(playerTargetId) {
        this.voteModal.classList.add("hidden");
        const res = this.engine.resolveVote(playerTargetId);

        // 播报全员投票详细信息
        this.appendLog("—— 全员无记名投票结果公示 ——");
        res.voteDetails.forEach(v => {
            this.appendLog(`【${v.voter}】 投票给了 ➔ 【${v.target}】`);
        });

        // 冷冻动画弹窗展示
        this.coldSleepVictim.innerHTML = `
            ${res.frozenCharacter.getAvatarHTML()}
            <h2 style="color:${res.frozenCharacter.themeColor}; margin:10px 0;">${res.frozenCharacter.name}</h2>
            <p>最高票当选（获得 ${res.frozenCharacter.votesCount} 票），正式执行【冷冻休眠】！</p>
            <p style="color:#aaa; font-style:italic;">「${res.frozenCharacter.name}：……如果这是大家的决定，我接受。」</p>
        `;
        this.coldSleepModal.classList.remove("hidden");

        document.getElementById("btn-confirm-freeze").onclick = () => {
            this.coldSleepModal.classList.add("hidden");
            this.refreshRoundtable();
            this.updateHeaderUI();

            // 检查游戏是否结束
            const over = this.engine.checkGameOver();
            if (over.isGameOver) {
                this.showGameOver(over);
            } else {
                this.startNightPhase();
            }
        };
    }

    // ==========================================
    // 4. 夜间自由行动与技能释放 (Night Phase)
    // ==========================================
    startNightPhase() {
        this.appendLog(`—— 夜间自由巡航开始（全舰进入低能耗静音巡航） ——`);
        const player = this.engine.getPlayer();
        const alive = this.engine.getAliveCharacters();

        let nightHtml = `
            <h3>夜间行动中心</h3>
            <p>此时大部分船员已返回各自寝室。你可以选择释放你的身份能力，或前往特定区域拜访船员。</p>
        `;

        // 若玩家拥有夜间技能 (狼人杀人、预言家查验、守卫守护)
        if (player.role.hasNightAction && player.isAlive && !player.isFrozen) {
            const roleActionTitle = player.role.id === "wolf" ? "【古诺西亚暗杀协议】选择抹杀目标：" : (player.role.id === "seer" ? "【工程师中枢扫描】选择查验目标：" : "【防护力场】选择守护目标：");
            nightHtml += `<div class="night-action-box">
                <h4>${roleActionTitle}</h4>
                <div class="night-buttons">`;
            const validTargets = alive.filter(c => c.id !== player.id);
            validTargets.forEach(target => {
                nightHtml += `<button class="night-skill-btn" data-target-id="${target.id}">${target.name} (${target.title})</button>`;
            });
            nightHtml += `</div></div>`;
        }

        // 自由探访区域
        nightHtml += `
            <div class="night-visit-box">
                <h4>前往舰船区域探访同伴：</h4>
                <div class="night-visit-buttons">
        `;
        alive.filter(c => !c.isPlayer).forEach(npc => {
            nightHtml += `<button class="visit-btn" data-npc-id="${npc.id}">探访 ${npc.name}</button>`;
        });
        nightHtml += `</div></div>`;

        nightHtml += `<div style="text-align:center; margin-top:20px;">
            <button id="btn-night-sleep" class="action-btn" style="background:#00d2ff; color:#000;">进入深度睡眠，迎来清晨 ➔</button>
        </div>`;

        this.nightContent.innerHTML = nightHtml;
        this.nightModal.classList.remove("hidden");

        // 绑定技能点击
        let selectedSkillTarget = null;
        this.nightContent.querySelectorAll(".night-skill-btn").forEach(b => {
            b.onclick = () => {
                this.nightContent.querySelectorAll(".night-skill-btn").forEach(x => x.style.borderColor = "#333");
                b.style.borderColor = "#00f0ff";
                selectedSkillTarget = b.getAttribute("data-target-id");
                Sound.playTick();
            };
        });

        // 绑定探访对话
        this.nightContent.querySelectorAll(".visit-btn").forEach(b => {
            b.onclick = () => {
                const npcId = b.getAttribute("data-npc-id");
                const npc = this.engine.getCharacter(npcId);
                if (npc) {
                    const line = npc.dialogues.night || `「L.P.H，明天评议会见吧。今晚早点休息。」`;
                    alert(`${npc.name}：\n\n${line}`);
                }
            };
        });

        // 进入清晨结算
        document.getElementById("btn-night-sleep").onclick = () => {
            this.nightModal.classList.add("hidden");
            const nightRes = this.engine.resolveNight(selectedSkillTarget);

            // 晨间通报
            this.appendLog("—— 晨间系统诊断报告 ——");
            nightRes.logs.forEach(l => this.appendLog(l));

            this.refreshRoundtable();
            this.updateHeaderUI();

            const over = this.engine.checkGameOver();
            if (over.isGameOver) {
                this.showGameOver(over);
            } else {
                this.startDayPhase();
            }
        };
    }

    // ==========================================
    // 5. 辅助 UI 渲染 (UI Rendering & Helpers)
    // ==========================================
    refreshRoundtable() {
        this.roundtableContainer.innerHTML = "";
        this.engine.characters.forEach(char => {
            const card = document.createElement("div");
            card.id = `char-card-${char.id}`;
            card.className = `seat-card ${char.isAlive ? "" : "dead"} ${char.isFrozen ? "frozen" : ""}`;
            card.style.borderColor = char.themeColor;

            card.innerHTML = `
                <div class="seat-avatar">${char.getAvatarHTML()}</div>
                <div class="seat-name" style="color:${char.themeColor}">${char.name}</div>
                <div class="seat-status">
                    ${char.isFrozen ? '<span class="badge-frozen">已冷冻</span>' : (!char.isAlive ? '<span class="badge-dead">已阵亡</span>' : (char.claimedRole ? `<span class="badge-claim">${char.claimedRole}</span>` : '<span class="badge-alive">正常</span>'))}
                </div>
            `;
            this.roundtableContainer.appendChild(card);
        });
    }

    highlightCharacterOnTable(charId) {
        document.querySelectorAll(".seat-card").forEach(c => c.classList.remove("active-speaker"));
        const activeCard = document.getElementById(`char-card-${charId}`);
        if (activeCard) activeCard.classList.add("active-speaker");
    }

    updateHeaderUI() {
        const alive = this.engine.getAliveCharacters();
        this.headerDayText.innerText = `第 ${this.engine.currentDay} 循环`;
        this.headerAliveText.innerText = `存活: ${alive.length} / ${this.engine.characters.length} 人`;
    }

    appendLog(text) {
        const li = document.createElement("li");
        li.innerText = text;
        this.debateLogList.appendChild(li);
        this.debateLogList.scrollTop = this.debateLogList.scrollHeight;
    }

    showGameOver(res) {
        this.gameOverTitle.innerText = res.title;
        this.gameOverTitle.style.color = res.winner === "human" ? "#00ff88" : "#ff3366";
        this.gameOverDesc.innerText = res.message;
        this.gameOverModal.classList.remove("hidden");

        document.getElementById("btn-restart").onclick = () => {
            this.gameOverModal.classList.add("hidden");
            this.returnToMenu();
        };
    }

    // ==========================================
    // 6. 存档/读档/关卡模态框 (Save & Load)
    // ==========================================
    saveGame() {
        if (!this.engine) return;
        const saveData = {
            currentLevelIndex: this.currentLevelIndex,
            currentDay: this.engine.currentDay,
            characters: this.engine.characters.map(c => ({
                id: c.id,
                name: c.name,
                isAlive: c.isAlive,
                isFrozen: c.isFrozen,
                roleId: c.role.id,
                claimedRole: c.claimedRole,
                trustScores: c.trustScores,
                suspicionScores: c.suspicionScores
            }))
        };
        localStorage.setItem("gnosia_ai_save", JSON.stringify(saveData));
        alert("【系统提示】：当前航行日志与生体状态已完整持久化保存！");
    }

    loadGame() {
        const str = localStorage.getItem("gnosia_ai_save");
        if (!str) {
            alert("未检测到本地有效存档！");
            return;
        }
        try {
            const data = JSON.parse(str);
            this.startNewGame(data.currentLevelIndex || 0);
            this.engine.currentDay = data.currentDay;
            // 恢复角色状态
            data.characters.forEach(savedChar => {
                const c = this.engine.getCharacter(savedChar.id);
                if (c) {
                    c.isAlive = savedChar.isAlive;
                    c.isFrozen = savedChar.isFrozen;
                    c.claimedRole = savedChar.claimedRole;
                    c.trustScores = savedChar.trustScores;
                    c.suspicionScores = savedChar.suspicionScores;
                }
            });
            this.refreshRoundtable();
            this.updateHeaderUI();
            this.appendLog("【系统自愈】：已成功自本地镜像恢复评议会现场！");
        } catch (e) {
            alert("存档解析损坏，请开始新游戏。");
        }
    }

    checkExistingSave() {
        if (localStorage.getItem("gnosia_ai_save")) {
            this.btnContinue.disabled = false;
        } else {
            this.btnContinue.disabled = true;
        }
    }

    openLevelSelect() {
        const list = document.getElementById("level-list");
        list.innerHTML = "";
        LevelConfigs.forEach((lvl, idx) => {
            const btn = document.createElement("button");
            btn.className = "level-card-btn";
            btn.innerHTML = `
                <h4>${lvl.title} (${lvl.playerCount}人)</h4>
                <p>${lvl.description}</p>
            `;
            btn.onclick = () => {
                this.levelSelectModal.classList.add("hidden");
                this.startNewGame(idx);
            };
            list.appendChild(btn);
        });
        this.levelSelectModal.classList.remove("hidden");
        document.getElementById("btn-close-level-modal").onclick = () => {
            this.levelSelectModal.classList.add("hidden");
        };
    }

    openSettings() {
        this.settingsModal.classList.remove("hidden");
        document.getElementById("btn-close-settings").onclick = () => {
            this.settingsModal.classList.add("hidden");
        };
    }

    returnToMenu() {
        this.screenGame.classList.add("hidden");
        this.screenMenu.classList.remove("hidden");
        this.checkExistingSave();
    }
}

// 启动游戏实例
window.addEventListener("DOMContentLoaded", () => {
    window.gameApp = new GameApp();
});
