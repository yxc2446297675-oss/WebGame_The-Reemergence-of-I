/**
 * 游戏主循环引擎与状态机 (Game Engine & State Machine)
 * 严格管理 q1 -> q2 -> q3 -> q4 -> q5 -> q6 -> q7 完整闭环
 */

import { WorldviewConfig, StaminaConfig, NightAttackConfig, AudioConfig, DeathRevealConfig } from "./config.js";
import { Sound } from "./audio.js";
import { CharacterRegistry } from "./characters.js";
import { LevelRegistry } from "./levels.js";
import { DialogueUI } from "./dialogueUI.js";
import { ExplorationEngine } from "./exploration.js";
import { SaveSystem } from "./saveSystem.js";
import { MapRenderer } from "./mapRenderer.js";
import { UnlockEvaluator } from "./unlockEvaluator.js";

export class GameEngine {
    constructor() {
        this.saveSystem = new SaveSystem();
        this.dialogueUI = new DialogueUI();
        this.explorationEngine = new ExplorationEngine(this);
        this.mapRenderer = null;
        this.hoveredMapNodeId = null;

        // 核心游戏状态
        this.currentLevel = null;
        this.phase = "menu"; // menu, q1_black, q2_intro, q3_explore, q4_inquiry, q5_judgement, q6_night, q7_day, victory, gameover
        this.dayCount = 1;
        this.stamina = 100;
        this.actionLogs = [];

        // 角色与队伍
        this.protagonist = null;
        this.teamMembers = []; // 队伍内所有成员（包含主角与已加入的NPC）
        this.allNpcMap = new Map(); // 关卡中所有NPC状态存储

        // 傍晚与夜间暂存数据
        this.eveningInquiryCount = 0; // 当前傍晚已询问人数 (0, 1, 2)
        this.eveningTargetNpc = null;
        this.confinedNpcId = null; // 今晚被禁锢的角色ID
        this.exiledNpcId = null;   // 今晚被放逐的角色ID
        this.nightProtectedNpcId = null; // 护卫守护目标
        this.nightTargetVictimId = null; // 伪人预定袭击目标
        this.witchSaved = false;         // 歌咏者是否施救

        // 人物特征/秘密图鉴与专属被动状态
        this.activePersonaCharId = "kaze";
        this.stepsWithNpc = {};
        this.nightCounterDeflected = false;
        this.nightModeDefended = false;

        this.initDomReferences();
        this.bindEvents();
    }

    initDomReferences() {
        // 界面大屏
        this.screenMenu = document.getElementById("screen-menu");
        this.screenBlack = document.getElementById("screen-q1-black");
        this.screenEveningBlack = document.getElementById("screen-evening-black");
        this.screenDeathBlack = document.getElementById("screen-death-black");
        this.deathBlackCallback = null;
        this.screenGame = document.getElementById("screen-game");

        // q1 黑屏白字
        this.blackTextContent = document.getElementById("q1-black-text");
        this.blackPrompt = document.getElementById("q1-click-prompt");

        // 顶栏与状态
        this.headerLocation = document.getElementById("header-current-location");
        this.headerStaminaFill = document.getElementById("header-stamina-fill");
        this.headerStaminaText = document.getElementById("header-stamina-text");
        this.headerTeamCount = document.getElementById("header-team-count");
        this.headerDayText = document.getElementById("header-day-text");

        // 左侧行动日志
        this.logListElement = document.getElementById("action-log-list");

        // 中间探索控制盘与操作台
        this.exploreControls = document.getElementById("exploration-controls");
        this.directionButtons = {
            forward: document.getElementById("btn-move-forward"),
            backward: document.getElementById("btn-move-backward"),
            left: document.getElementById("btn-move-left"),
            right: document.getElementById("btn-move-right")
        };

        // 模态弹窗们
        this.modalMap = document.getElementById("modal-map-view");
        this.modalEncounter = document.getElementById("modal-npc-encounter");
        this.modalInquiry = document.getElementById("modal-inquiry-select");
        this.modalJudgement = document.getElementById("modal-judgement");
        this.modalNight = document.getElementById("modal-night-action");
        this.modalResult = document.getElementById("modal-game-result");
        this.modalLevelSelect = document.getElementById("modal-level-select");
        this.levelGrid = document.getElementById("level-select-grid");
        this.btnOpenLevelSelect = document.getElementById("btn-menu-select-level");

        // 任务清单 DOM 引用
        this.btnViewMissions = document.getElementById("btn-view-missions");
        this.modalMissions = document.getElementById("modal-mission-checklist");
        this.btnCloseMissions = document.getElementById("btn-close-missions");
        this.missionsSidebarList = document.getElementById("missions-sidebar-list");
        this.missionModalList = document.getElementById("mission-modal-list");
        this.missionsSummaryTag = document.getElementById("missions-summary-tag");

        // 人物特征/秘密图鉴 DOM 引用
        this.btnMenuPersonaLog = document.getElementById("btn-menu-persona-log");
        this.modalPersonaLog = document.getElementById("modal-persona-log");
        this.btnClosePersonaLog = document.getElementById("btn-close-persona-log");
        this.personaCharTabs = document.getElementById("persona-char-tabs");
        this.personaCharDetail = document.getElementById("persona-char-detail");

        // 小地图战术微型雷达 DOM 引用
        this.hudMiniRadar = document.getElementById("hud-mini-radar");
        this.miniRadarCanvas = document.getElementById("mini-radar-canvas");
        this.btnRadarExpand = document.getElementById("btn-radar-expand");
        this.btnRadarToggle = document.getElementById("btn-radar-toggle");
        this.radarBodyWrap = document.getElementById("radar-body-wrap");
        this.radarPosTag = document.getElementById("radar-pos-tag");

        // 移动端横屏引导与旋转控制器 DOM
        this.screenOrientationHint = document.getElementById("screen-orientation-hint");
        this.btnForceLandscape = document.getElementById("btn-force-landscape");
        this.btnIgnoreOrientation = document.getElementById("btn-ignore-orientation");
        this.btnToggleLandscape = document.getElementById("btn-toggle-landscape");
    }

    bindEvents() {
        // 顶栏任务清单入口
        this.btnViewMissions?.addEventListener("click", () => {
            this.showMissionsModal();
        });
        this.btnCloseMissions?.addEventListener("click", () => {
            this.modalMissions?.classList.add("hidden");
        });

        // 主菜单：5x5 关卡选择弹窗入口
        this.btnOpenLevelSelect?.addEventListener("click", () => {
            this.showLevelSelectModal();
        });
        document.getElementById("btn-close-level-select")?.addEventListener("click", () => {
            this.modalLevelSelect?.classList.add("hidden");
        });

        // 主菜单：记忆图鉴 · 角色专属分支入口
        this.btnMenuPersonaLog?.addEventListener("click", () => {
            this.showPersonaLogModal();
        });
        this.btnClosePersonaLog?.addEventListener("click", () => {
            this.modalPersonaLog?.classList.add("hidden");
        });

        // 小地图战术微型雷达快捷交互
        this.btnRadarExpand?.addEventListener("click", () => {
            this.showMapModal();
        });
        this.miniRadarCanvas?.addEventListener("click", () => {
            this.showMapModal();
        });
        this.btnRadarToggle?.addEventListener("click", () => {
            this.toggleMiniRadar();
        });

        // 兼容原按钮直接触发 (Level 1 / Level 2)
        document.getElementById("btn-menu-new-game")?.addEventListener("click", () => {
            this.startNewGame(1);
        });

        document.getElementById("btn-menu-level2")?.addEventListener("click", () => {
            this.startNewGame(2);
        });

        document.getElementById("btn-menu-load-game")?.addEventListener("click", () => {
            this.loadGameProgress();
        });

        document.getElementById("btn-menu-exit")?.addEventListener("click", () => {
            alert("感谢体验《潜伏危机：循环伪装体》！您可以关闭此网页标签页。");
        });

        // 顶栏通用按钮
        document.getElementById("btn-view-map")?.addEventListener("click", () => {
            this.showMapModal();
        });
        document.getElementById("btn-close-map")?.addEventListener("click", () => {
            this.modalMap.classList.add("hidden");
        });

        // 地图 Tab 模式切换
        const tabLive = document.getElementById("btn-tab-live-map");
        const tabSketch = document.getElementById("btn-tab-sketch-map");
        const viewLive = document.getElementById("map-live-view");
        const viewSketch = document.getElementById("map-sketch-view");

        tabLive?.addEventListener("click", () => {
            tabLive.classList.add("active");
            tabSketch?.classList.remove("active");
            viewLive?.classList.remove("hidden");
            viewSketch?.classList.add("hidden");
            this.renderLiveMap();
        });

        tabSketch?.addEventListener("click", () => {
            tabSketch.classList.add("active");
            tabLive?.classList.remove("active");
            viewSketch?.classList.remove("hidden");
            viewLive?.classList.add("hidden");
        });

        // 实时地图 Canvas 点击与悬浮快速往返交互
        const liveCanvas = document.getElementById("live-map-canvas");
        liveCanvas?.addEventListener("click", (e) => {
            // 若当前正在移动动画中，由动画的 skipHandler 负责消费点击
            if (this.isMovingAnimation) return;

            const rect = liveCanvas.getBoundingClientRect ? liveCanvas.getBoundingClientRect() : { left: 0, top: 0, width: 680, height: 460 };
            const scaleX = (liveCanvas.width || 680) / (rect.width || 680 || 1);
            const scaleY = (liveCanvas.height || 460) / (rect.height || 460 || 1);
            const clientX = e.clientX !== undefined ? e.clientX : ((e.x || 0) + (rect.left || 0));
            const clientY = e.clientY !== undefined ? e.clientY : ((e.y || 0) + (rect.top || 0));
            const clickX = (clientX - (rect.left || 0)) * scaleX;
            const clickY = (clientY - (rect.top || 0)) * scaleY;

            if (this.mapRenderer) {
                const clickedNode = this.mapRenderer.getNodeAtPosition(clickX, clickY, this.currentLevel?.map);
                if (clickedNode) {
                    this.handleMapNodeClick(clickedNode);
                }
            }
        });

        liveCanvas?.addEventListener("mousemove", (e) => {
            if (this.isMovingAnimation || !this.mapRenderer) return;
            const rect = liveCanvas.getBoundingClientRect ? liveCanvas.getBoundingClientRect() : { left: 0, top: 0, width: 680, height: 460 };
            const scaleX = (liveCanvas.width || 680) / (rect.width || 680 || 1);
            const scaleY = (liveCanvas.height || 460) / (rect.height || 460 || 1);
            const clientX = e.clientX !== undefined ? e.clientX : ((e.x || 0) + (rect.left || 0));
            const clientY = e.clientY !== undefined ? e.clientY : ((e.y || 0) + (rect.top || 0));
            const mouseX = (clientX - (rect.left || 0)) * scaleX;
            const mouseY = (clientY - (rect.top || 0)) * scaleY;

            const node = this.mapRenderer.getNodeAtPosition(mouseX, mouseY, this.currentLevel?.map);
            const isVisited = node && this.explorationEngine.visitedNodes.has(node.id);
            const isCurrent = node && node.id === this.explorationEngine.currentNodeId;

            if (this.phase === "q3_explore" && isVisited && !isCurrent) {
                if (liveCanvas.style) liveCanvas.style.cursor = "pointer";
                if (this.hoveredMapNodeId !== node.id) {
                    this.hoveredMapNodeId = node.id;
                    this.renderLiveMap();
                }
            } else {
                if (liveCanvas.style) liveCanvas.style.cursor = "default";
                if (this.hoveredMapNodeId) {
                    this.hoveredMapNodeId = null;
                    this.renderLiveMap();
                }
            }
        });

        liveCanvas?.addEventListener("mouseleave", () => {
            if (liveCanvas.style) liveCanvas.style.cursor = "default";
            if (this.hoveredMapNodeId) {
                this.hoveredMapNodeId = null;
                this.renderLiveMap();
            }
        });

        document.getElementById("btn-save-progress")?.addEventListener("click", () => {
            this.saveGameProgress();
        });

        document.getElementById("btn-exit-to-menu")?.addEventListener("click", () => {
            if (confirm("确定要保存并返回主菜单吗？")) {
                this.saveGameProgress();
                this.showMenu();
            }
        });

        // 探索移动按钮绑定 (点击后打开地图并触发平移动画)
        Object.entries(this.directionButtons).forEach(([dir, btn]) => {
            btn?.addEventListener("click", () => {
                if (this.phase === "q3_explore") {
                    this.performMoveWithMapAnimation(dir);
                }
            });
        });

        // q1 黑屏白字点击推进
        this.screenBlack?.addEventListener("click", () => {
            this.handleQ1BlackClick();
        });

        // 傍晚来临全黑屏点击推进
        this.screenEveningBlack?.addEventListener("click", () => {
            this.handleEveningBlackClick();
        });

        // 遇害公布全黑屏死亡立绘点击推进
        this.screenDeathBlack?.addEventListener("click", () => {
            this.handleDeathBlackClick();
        });

        // 检查存档并激活“加载存档”按钮
        this.updateMenuButtons();

        // 移动端横屏自动检测与旋转控制
        this.initOrientationManager();
    }

    initOrientationManager() {
        const updateOrientationState = () => {
            if (typeof window === "undefined") return;
            const isPortrait = window.matchMedia && window.matchMedia("(orientation: portrait)").matches;
            const isNarrow = window.innerWidth <= 820 || (window.screen && window.screen.width <= 820);
            const isForceLandscape = document.body?.classList.contains("force-landscape");

            // 如果处于原生横屏状态，或者玩家已经开启了强制横屏旋转，则隐藏提示层
            if (!isPortrait || isForceLandscape) {
                this.screenOrientationHint?.classList.add("hidden");
            } else if (isPortrait && isNarrow) {
                let ignored = false;
                try {
                    ignored = sessionStorage.getItem("gnosia_ignore_orientation_hint") === "1";
                } catch (e) {}
                if (!ignored) {
                    this.screenOrientationHint?.classList.remove("hidden");
                }
            }
        };

        // 监听系统屏幕尺寸与旋转
        window.addEventListener("resize", () => {
            updateOrientationState();
            if (this.currentLevelMap && this.mapRenderer) {
                setTimeout(() => {
                    this.mapRenderer.render(this.currentLevelMap, this.explorationEngine?.visitedNodes, this.explorationEngine?.currentNodeId);
                }, 50);
            }
        });

        window.addEventListener("orientationchange", () => {
            setTimeout(updateOrientationState, 150);
        });

        // 提示层：强制横屏显示
        this.btnForceLandscape?.addEventListener("click", () => {
            document.body?.classList.add("force-landscape");
            this.screenOrientationHint?.classList.add("hidden");
            if (this.currentLevelMap && this.mapRenderer) {
                setTimeout(() => {
                    this.mapRenderer.render(this.currentLevelMap, this.explorationEngine?.visitedNodes, this.explorationEngine?.currentNodeId);
                }, 100);
            }
        });

        // 提示层：保持竖屏直接玩
        this.btnIgnoreOrientation?.addEventListener("click", () => {
            this.screenOrientationHint?.classList.add("hidden");
            try {
                sessionStorage.setItem("gnosia_ignore_orientation_hint", "1");
            } catch (e) {}
        });

        // 右上角浮动快捷旋转按钮：随时一键自由切换
        this.btnToggleLandscape?.addEventListener("click", () => {
            const nowForced = document.body?.classList.toggle("force-landscape");
            this.screenOrientationHint?.classList.add("hidden");
            if (this.currentLevelMap && this.mapRenderer) {
                setTimeout(() => {
                    this.mapRenderer.render(this.currentLevelMap, this.explorationEngine?.visitedNodes, this.explorationEngine?.currentNodeId);
                }, 100);
            }
        });

        // 首次加载检测
        setTimeout(updateOrientationState, 80);
    }

    updateMenuButtons() {
        const btnLoad = document.getElementById("btn-menu-load-game");
        if (btnLoad) {
            btnLoad.disabled = !this.saveSystem.hasSave();
        }
    }

    showMenu() {
        this.phase = "menu";
        this.screenMenu.classList.remove("hidden");
        this.screenBlack.classList.add("hidden");
        this.screenEveningBlack?.classList.add("hidden");
        this.screenDeathBlack?.classList.add("hidden");
        this.screenGame.classList.add("hidden");
        this.modalLevelSelect?.classList.add("hidden");
        this.modalMissions?.classList.add("hidden");
        this.modalPersonaLog?.classList.add("hidden");
        this.hudMiniRadar?.classList.add("hidden");
        this.updateMenuButtons();
    }

    /**
     * 打开当前关卡任务清单模态弹窗
     */
    showMissionsModal() {
        this.renderMissionsPanel();
        this.modalMissions?.classList.remove("hidden");
    }

    /**
     * 渲染当前关卡任务清单 (侧边栏及弹窗)
     */
    renderMissionsPanel() {
        const rules = this.currentLevel?.unlockRules || [];
        if (this.missionsSummaryTag) {
            this.missionsSummaryTag.textContent = `${rules.length}个解锁点`;
        }

        const activeNpcIds = this.teamMembers.filter(m => !m.isProtagonist && m.status === "active").map(m => m.id);
        const deadNpcIds = Array.from(this.allNpcMap.values()).filter(m => m.status === "dead").map(m => m.id);
        const allMimics = Array.from(this.allNpcMap.values()).filter(m => m.role === "wolf");
        const mimicsInTeam = allMimics.filter(m => activeNpcIds.includes(m.id));

        let sidebarHtml = "";
        let modalHtml = "";

        rules.forEach((rule, idx) => {
            const taskNumStr = ["一", "二", "三", "四", "五"][idx] || `${idx + 1}`;
            const taskName = rule.taskName || `任务${taskNumStr}：${rule.title || "特定撤离"}`;
            const taskObjective = rule.taskObjective || "达成特定撤离条件并到达终点大门";
            // 绝不预先透露解锁的是哪个具体关卡
            const taskReward = "解构未知深层扇区 🔒???";

            // 检查历史解锁状态
            const isUnlockedHistory = (rule.unlockLevelIds || []).every(id => this.saveSystem.isLevelUnlocked(id));

            // 当局实时队伍状态判定
            let realtimeStatus = "";
            let realtimeClass = "";
            const cond = rule.condition || { type: "clear_any" };

            if (cond.type === "clear_any") {
                realtimeStatus = "🏃 突破重叠回廊，开启终点折跃气闸即可达成";
                realtimeClass = "realtime-ready";
            } else if (cond.type === "require_npcs") {
                const reqIds = cond.npcIds || [];
                const allInTeam = reqIds.every(id => activeNpcIds.includes(id));
                const anyDead = reqIds.some(id => deadNpcIds.includes(id));
                if (allInTeam) {
                    const reqNames = reqIds.map(id => this.allNpcMap.get(id)?.name || id).join("、");
                    realtimeStatus = `🟢 [${reqNames}] 已接入队伍信标，抵达终点即可达成`;
                    realtimeClass = "realtime-ready";
                } else if (anyDead) {
                    realtimeStatus = `❌ 关键目标生命体征已湮灭（本循环无法达成）`;
                    realtimeClass = "realtime-failed";
                } else {
                    const missingNames = reqIds.filter(id => !activeNpcIds.includes(id)).map(id => this.allNpcMap.get(id)?.name || id).join("、");
                    realtimeStatus = `⏳ [${missingNames}] 尚未汇合（需在回廊中搜寻救助）`;
                    realtimeClass = "realtime-waiting";
                }
            } else if (cond.type === "require_all_mimics") {
                if (allMimics.length > 0 && mimicsInTeam.length === allMimics.length) {
                    realtimeStatus = `🟢 场上所有拟态伪装体 (${mimicsInTeam.length}/${allMimics.length}) 均在队内，抵达终点即可达成`;
                    realtimeClass = "realtime-ready";
                } else {
                    realtimeStatus = `🕵️ 拟态引渡同步率 (${mimicsInTeam.length}/${allMimics.length})`;
                    realtimeClass = "realtime-waiting";
                }
            } else if (cond.type === "solo_only") {
                if (activeNpcIds.length === 0) {
                    realtimeStatus = "🟢 当前仅孤身一人，抵达终点即可达成";
                    realtimeClass = "realtime-ready";
                } else {
                    realtimeStatus = "👥 当前有同伴随行（单人脱出要求零随行）";
                    realtimeClass = "realtime-waiting";
                }
            } else {
                realtimeStatus = "🎯 特殊条件待达成";
                realtimeClass = "realtime-waiting";
            }

            const statusBadgeText = isUnlockedHistory ? "● 已探明" : "🔒 待解锁";
            const statusBadgeClass = isUnlockedHistory ? "mission-status-unlocked" : "mission-status-locked";

            // 侧边栏精简卡片
            sidebarHtml += `
                <div class="mission-item-card ${isUnlockedHistory ? 'mission-completed' : ''}">
                    <div class="mission-card-top">
                        <span class="mission-name">${taskName}</span>
                        <span class="mission-status-tag ${statusBadgeClass}">${statusBadgeText}</span>
                    </div>
                    <div class="mission-objective">${taskObjective}</div>
                    <div class="mission-reward">🎁 奖励：${taskReward}</div>
                    <div class="mission-realtime ${realtimeClass}">${realtimeStatus}</div>
                </div>
            `;

            // 模态弹窗详细卡片
            modalHtml += `
                <div class="mission-modal-item ${isUnlockedHistory ? 'mission-completed' : ''}">
                    <div class="mission-card-top">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-size:1.1rem;">🎯</span>
                            <span class="mission-name" style="font-size:0.95rem;">${taskName}</span>
                        </div>
                        <span class="mission-status-tag ${statusBadgeClass}">${statusBadgeText}</span>
                    </div>
                    <div class="mission-objective" style="font-size:0.86rem; color:#cbd5e1;">目标描述：${taskObjective}</div>
                    <div class="mission-reward" style="font-size:0.82rem;">🎁 通关解锁报酬：${taskReward}</div>
                    <div class="mission-realtime ${realtimeClass}" style="font-size:0.82rem; padding:4px 8px; background:rgba(0,0,0,0.25); border-radius:4px;">
                        当前进展：${realtimeStatus}
                    </div>
                </div>
            `;
        });

        if (this.missionsSidebarList) {
            this.missionsSidebarList.innerHTML = sidebarHtml;
        }
        if (this.missionModalList) {
            this.missionModalList.innerHTML = modalHtml;
        }
    }

    /**
     * 打开 5×5 关卡选择弹窗
     */
    showLevelSelectModal() {
        if (!this.modalLevelSelect) return;
        this.renderLevelSelectGrid();
        this.modalLevelSelect.classList.remove("hidden");
    }

    /**
     * 渲染 5×5 关卡选择网格 (共25关，根据存储与条件动态解锁)
     */
    renderLevelSelectGrid() {
        if (!this.levelGrid) return;
        this.levelGrid.innerHTML = "";

        const unlockedLevels = this.saveSystem.getUnlockedLevels();

        const levelNames = [
            "残破遗迹", "深层重叠", "湮灭奇点", "高熵裂隙", "拟态深渊",
            "量子回声", "虚数空间", "超弦引力", "矩阵崩塌", "绝对零度",
            "暗物质界", "时间牢笼", "拟人茧房", "异构核心", "折叠维度",
            "因果律断", "空洞节点", "反转信标", "终极拟态", "意识海床",
            "镜像死局", "光锥视界", "高维裂解", "原初黑洞", "终焉回响"
        ];

        for (let i = 1; i <= 25; i++) {
            const card = document.createElement("button");
            const isUnlocked = unlockedLevels.includes(i);
            const levelNumStr = i < 10 ? `0${i}` : `${i}`;
            const levelName = levelNames[i - 1] || `扇区 ${levelNumStr}`;

            card.className = `level-card ${isUnlocked ? "level-unlocked" : "level-locked"} ${i === 2 ? "level-2" : ""} ${i === 14 ? "level-14" : ""}`;
            card.id = `btn-level-${i}`;
            if (i === 1) {
                card.setAttribute("data-legacy-id", "btn-menu-new-game");
            }
            if (i === 2) {
                card.setAttribute("data-legacy-id", "btn-menu-level2");
            }
            card.setAttribute("data-level", String(i));

            if (!isUnlocked) {
                card.disabled = true;
            }

            card.innerHTML = `
                <span class="card-num">SECTOR ${levelNumStr}</span>
                <span class="card-name">${levelName}</span>
                <span class="card-status">${isUnlocked ? "● 开放" : "🔒 待解锁"}</span>
            `;

            card.addEventListener("click", () => {
                if (isUnlocked) {
                    this.modalLevelSelect?.classList.add("hidden");
                    this.startNewGame(i);
                } else {
                    if (typeof Sound !== "undefined" && Sound.playTick) Sound.playTick();
                    alert(`【扇区 ${levelNumStr} 锁定】该关卡尚未解构，请在前面的关卡中寻找特定线索或带离关键人员脱离以解锁！`);
                }
            });

            this.levelGrid.appendChild(card);
        }
    }

    // =========================================================================
    // Q1: 黑屏中间有白字
    // =========================================================================
    startNewGame(levelId = 1) {
        const levelConfig = LevelRegistry.find(l => l.levelId === levelId) || LevelRegistry[0];
        this.currentLevel = levelConfig;

        // 初始化主角
        this.protagonist = {
            ...CharacterRegistry.protagonist,
            role: levelConfig.defaultProtagonistRole || "seer",
            inquiryCount: 0,
            status: "active",
            fallbackSvg: CharacterRegistry.getAvatarSvg(CharacterRegistry.protagonist)
        };

        // 初始化候选NPC状态池与身份洗牌
        this.initCharactersForLevel(levelConfig);

        // 重置体力与天数
        this.stamina = levelConfig.initialStamina || StaminaConfig.initialStamina;
        this.dayCount = 1;
        this.actionLogs = [];
        this.stepsWithNpc = {};
        this.nightCounterDeflected = false;
        this.nightModeDefended = false;
        this.logAction(`【开始新循环】启动关卡：${levelConfig.title}。主角 L.P.H 身份：${WorldviewConfig.roleNames[this.protagonist.role].name}`);

        // 初始化地图
        this.explorationEngine.initLevelMap(levelConfig.map);

        // 进入 q1: 黑屏白字
        this.enterQ1BlackScreen();
    }

    initCharactersForLevel(levelConfig) {
        this.allNpcMap.clear();
        this.teamMembers = [this.protagonist];

        // 准备候选NPC
        const pool = [...levelConfig.candidateNPCs];

        // 计算本局潜伏伪人的实际数量 (支持随机范围 [min, max] 或固定数值)
        let actualWolfCount = 1;
        if (Array.isArray(levelConfig.wolfCountRange)) {
            const min = Math.max(0, levelConfig.wolfCountRange[0] || 0);
            const max = Math.max(min, levelConfig.wolfCountRange[1] !== undefined ? levelConfig.wolfCountRange[1] : min);
            actualWolfCount = Math.floor(Math.random() * (max - min + 1)) + min;
        } else if (Array.isArray(levelConfig.wolfCount)) {
            const min = Math.max(0, levelConfig.wolfCount[0] || 0);
            const max = Math.max(min, levelConfig.wolfCount[1] !== undefined ? levelConfig.wolfCount[1] : min);
            actualWolfCount = Math.floor(Math.random() * (max - min + 1)) + min;
        } else if (typeof levelConfig.wolfCount === 'number') {
            actualWolfCount = levelConfig.wolfCount;
        }

        // 边界保护：不超过候选NPC池的总人数
        actualWolfCount = Math.min(pool.length, actualWolfCount);
        console.log(`[关卡生成] 候选总数: ${pool.length}, 本局暗中生成的伪人数量: ${actualWolfCount}`);

        // 随机挑选指定数量作为伪人
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        shuffled.forEach((cand, idx) => {
            const rawChar = CharacterRegistry.npcs[cand.id];
            if (!rawChar) return;

            // 分配身份：优先看是否显式指定了 assignedRole，否则按随机抽出的 actualWolfCount 分配
            let role = cand.assignedRole;
            if (!role) {
                role = idx < actualWolfCount ? "wolf" : "villager";
            }

            const npcObj = {
                ...rawChar,
                role: role,
                inquiryCount: 0, // 被玩家选择询问的累计次数
                status: "unmet", // unmet(未遇), active(队内活人), confined(被禁锢), exiled(被放逐), dead(遇害)
                svgAvatar: CharacterRegistry.getAvatarSvg(rawChar),
                fallbackSvg: CharacterRegistry.getAvatarSvg(rawChar)
            };

            this.allNpcMap.set(npcObj.id, npcObj);
        });

        // 处理初始自带同伴
        if (levelConfig.initialTeam && levelConfig.initialTeam.length > 0) {
            levelConfig.initialTeam.forEach(npcId => {
                const npc = this.allNpcMap.get(npcId);
                if (npc) {
                    npc.status = "active";
                    this.teamMembers.push(npc);
                }
            });
        }
    }

    enterQ1BlackScreen() {
        this.phase = "q1_black";
        this.screenMenu.classList.add("hidden");
        this.screenGame.classList.add("hidden");
        this.screenBlack.classList.remove("hidden");

        this.q1Texts = this.currentLevel.blackScreenText || [
            "冷冻休眠仓的气压泄放声在空旷的回廊中回荡...",
            "警告：队伍中可能潜伏着未知的伪人拟态感染体。",
            "抵达终点脱离大门是唯一的逃生通路。",
            "——点击屏幕进入游戏。"
        ];
        this.q1Index = 0;
        this.renderQ1Text();
    }

    renderQ1Text() {
        if (this.q1Index < this.q1Texts.length) {
            this.blackTextContent.style.opacity = "0";
            setTimeout(() => {
                this.blackTextContent.textContent = this.q1Texts[this.q1Index];
                this.blackTextContent.style.opacity = "1";
            }, 150);
        } else {
            // 所有文字播放完毕，进入 q2 正式游戏页面
            this.enterQ2GameInit();
        }
    }

    handleQ1BlackClick() {
        if (this.phase !== "q1_black") return;
        this.q1Index++;
        this.renderQ1Text();
    }

    // =========================================================================
    // Q2: 点击后进入正式游戏页面
    // =========================================================================
    enterQ2GameInit() {
        this.phase = "q2_intro";
        this.screenBlack.classList.add("hidden");
        this.screenGame.classList.remove("hidden");

        this.updateHeaderUI();
        this.renderActionLogs();

        // 播放开局第一段视觉小说对话
        const startNode = this.explorationEngine.getCurrentNode();
        this.dialogueUI.playSequence([
            {
                speaker: { name: "环境广播", themeColor: "#38bdf8" },
                text: `系统自检完毕。当前定位坐标：${startNode ? startNode.name : "正门"}。`
            },
            {
                speaker: this.protagonist,
                text: `我已经苏醒。作为队伍的指挥者，我必须谨慎探索前进，并警惕潜伏在同伴之中的伪人。`
            }
        ], () => {
            // 对话完毕，进入 q3 肉鸽探索循环
            this.enterQ3Exploration();
        });
    }

    // =========================================================================
    // Q3: 探索走图、消耗体力与事件交互
    // =========================================================================
    enterQ3Exploration() {
        this.phase = "q3_explore";
        this.updateHeaderUI();
        this.renderExplorationControls();

        const currentNode = this.explorationEngine.getCurrentNode();
        if (currentNode) {
            this.dialogueUI.say(
                { name: "区域指引", themeColor: "#94a3b8" },
                `当前位于 [${currentNode.name}]。${currentNode.desc} 请选择行动方向。`
            );
        }
    }

    renderExplorationControls() {
        const available = this.explorationEngine.getAvailableDirections();
        const dirMap = {
            forward: "前 ⬆",
            backward: "后 ⬇",
            left: "左 ⬅",
            right: "右 ➡"
        };

        Object.entries(this.directionButtons).forEach(([dir, btn]) => {
            if (!btn) return;
            const targetId = available[dir];
            if (targetId) {
                const targetNode = this.currentLevel.map.nodes[targetId];
                btn.disabled = false;
                btn.classList.add("active-dir");
                btn.innerHTML = `${dirMap[dir]} <span class="dest-preview">(${targetNode ? targetNode.name : targetId})</span>`;
            } else {
                btn.disabled = true;
                btn.classList.remove("active-dir");
                btn.innerHTML = `${dirMap[dir]} <span class="dest-preview">(不可通行)</span>`;
            }
        });
    }

    // 遇到昏迷NPC交互弹窗
    showNpcEncounterModal(npc, node, onHandled) {
        if (!this.modalEncounter) return;

        const titleElem = document.getElementById("encounter-npc-name");
        const avatarElem = document.getElementById("encounter-npc-avatar");
        const descElem = document.getElementById("encounter-npc-dialogue");
        const btnJoin = document.getElementById("btn-encounter-accept");
        const btnIgnore = document.getElementById("btn-encounter-reject");

        const firstLineParsed = CharacterRegistry.parseDialogueLine(npc.introDialogue && npc.introDialogue[0]);
        titleElem.textContent = `发现昏迷人员：${npc.name}`;
        titleElem.style.color = npc.themeColor;

        const exp = firstLineParsed.expression || "clam";
        const candidates = CharacterRegistry.getCharacterImageCandidates(npc, exp);
        const fallbackSvg = CharacterRegistry.getAvatarSvg(npc, exp);
        const candidatesAttr = JSON.stringify(candidates).replace(/"/g, '&quot;');
        avatarElem.innerHTML = `<img src="${candidates[0] || fallbackSvg}" data-candidates="${candidatesAttr}" data-index="0" data-fallback="${fallbackSvg}" alt="${npc.name}" onerror="window.handlePortraitError && window.handlePortraitError(this)">`;
        avatarElem.style.filter = `drop-shadow(0 0 12px ${npc.themeColor}80)`;

        descElem.textContent = firstLineParsed.text || "发现一名失去知觉的乘员倒在此处。";

        this.modalEncounter.classList.remove("hidden");

        const cleanup = () => {
            this.modalEncounter.classList.add("hidden");
            btnJoin.onclick = null;
            btnIgnore.onclick = null;
        };

        btnJoin.onclick = () => {
            cleanup();
            // 让其加入队伍
            npc.status = "active";
            this.teamMembers.push(npc);
            this.logAction(`【营救同伴】救醒了 [${npc.name}]，加入队伍！当前队伍人数: ${this.getAliveTeamMembers().length} 人`);
            this.updateHeaderUI();

            // 触发人物图鉴历练检定 (如邵可欣救援入队)
            this.checkPersonaSecretUnlocks("suffer_fate", { charId: npc.id, type: "rescued" });

            // 播放入队对话
            const lines = (npc.introDialogue || []).slice(1).map(raw => {
                const parsed = CharacterRegistry.parseDialogueLine(raw);
                return {
                    speaker: npc,
                    text: parsed.text,
                    expression: parsed.expression
                };
            });
            if (lines.length === 0) {
                lines.push({ speaker: npc, text: `谢谢你救了我，L.P.H！我愿意跟随你一起撤离！`, expression: "happy" });
            }

            this.dialogueUI.playSequence(lines, () => {
                if (onHandled) onHandled(true);
            });
        };

        btnIgnore.onclick = () => {
            cleanup();
            this.logAction(`【暂不救助】你决定暂不唤醒昏迷的 [${npc.name}]，队伍继续前进。`);
            this.dialogueUI.say(
                this.protagonist,
                `情况不明，我们现在还没有多余的精力照顾他。稍后需要时可以再回来救助。`,
                () => {
                    if (onHandled) onHandled(false);
                }
            );
        };
    }

    // =========================================================================
    // Q4: 傍晚询问环节 (先黑屏白字，点击后再进入)
    // =========================================================================
    enterEveningPhase() {
        this.phase = "evening_black";
        this.eveningInquiryCount = 0;
        this.updateHeaderUI();

        // 切换至全黑屏转场视口
        this.screenGame.classList.add("hidden");
        this.screenEveningBlack?.classList.remove("hidden");
    }

    handleEveningBlackClick() {
        if (this.phase !== "evening_black") return;
        this.phase = "q4_inquiry";
        this.screenEveningBlack?.classList.add("hidden");
        this.screenGame.classList.remove("hidden");

        this.dialogueUI.say(
            { id: "broadcast", isBroadcast: true, name: "全员集结", themeColor: "#f59e0b" },
            `傍晚时分，幸存者们聚集在暂歇区。你可以选择与 1~2 名同伴单独交谈打探线索，或者直接跳过进入裁决。`,
            () => {
                this.showInquiryModal();
            }
        );
    }

    showInquiryModal() {
        const aliveNpcs = this.getAliveNpcTeamMembers();
        const listContainer = document.getElementById("inquiry-target-list");
        const btnSkip = document.getElementById("btn-inquiry-skip");
        const statusHint = document.getElementById("inquiry-status-hint");

        statusHint.textContent = `当前已询问：${this.eveningInquiryCount} / 2 名同伴`;

        listContainer.innerHTML = "";

        if (aliveNpcs.length === 0) {
            listContainer.innerHTML = `<div style="color:#94a3b8; padding:15px; text-align:center;">当前队伍中没有其他存活同伴可供询问。</div>`;
        } else {
            aliveNpcs.forEach(npc => {
                const card = document.createElement("div");
                card.className = "inquiry-card";
                card.style.borderColor = npc.themeColor;
                card.innerHTML = `
                    <div class="inquiry-card-avatar" style="border-color:${npc.themeColor}">
                        <img src="${npc.svgAvatar}" alt="${npc.name}">
                    </div>
                    <div class="inquiry-card-info">
                        <div class="inquiry-card-name" style="color:${npc.themeColor}">${npc.name}</div>
                        <div class="inquiry-card-times">已交谈次数: ${npc.inquiryCount} 次</div>
                    </div>
                    <button class="inquiry-card-btn" style="background:${npc.themeColor}33; border-color:${npc.themeColor}; color:${npc.themeColor}">交谈 ➔</button>
                `;

                card.querySelector("button").onclick = () => {
                    this.executeInquiryDialogue(npc);
                };
                listContainer.appendChild(card);
            });
        }

        btnSkip.onclick = () => {
            this.modalInquiry.classList.add("hidden");
            this.logAction(`【傍晚时刻】决定结束询问交谈，直接进入裁决阶段。`);
            this.enterQ5Judgement();
        };

        this.modalInquiry.classList.remove("hidden");
    }

    executeInquiryDialogue(npc) {
        this.modalInquiry.classList.add("hidden");
        this.eveningInquiryCount++;

        // 获取该 NPC 对应的第 N 次询问台词
        const count = npc.inquiryCount;
        let dialogueArray = [];
        if (npc.inquiryDialogues && npc.inquiryDialogues.length > 0) {
            // 如果超出设定次数，取最后一条
            const idx = Math.min(count, npc.inquiryDialogues.length - 1);
            dialogueArray = npc.inquiryDialogues[idx];
        } else {
            dialogueArray = [`（${npc.name} 保持着沉默，注视着你的眼睛）`];
        }

        // 被询问次数累加
        npc.inquiryCount++;

        this.logAction(`【深入交谈】与同伴 [${npc.name}] 进行了第 ${npc.inquiryCount} 次交谈。`);

        // 检定交谈特征解构
        this.checkPersonaSecretUnlocks("inquiry_count", { charId: npc.id, count: npc.inquiryCount });

        // 构建对白队列
        const seq = dialogueArray.map(item => {
            const parsed = CharacterRegistry.parseDialogueLine(item);
            return {
                speaker: npc,
                text: parsed.text,
                expression: parsed.expression
            };
        });

        this.dialogueUI.playSequence(seq, () => {
            // 判断是否还可以继续询问第2位
            if (this.eveningInquiryCount < 2 && this.getAliveNpcTeamMembers().length > 1) {
                // 提示是否继续
                this.showInquiryModal();
            } else {
                // 已经询问满2人，进入裁决
                this.enterQ5Judgement();
            }
        });
    }

    // =========================================================================
    // Q5: 裁决阶段 (禁锢 / 放逐 / 放弃裁决)
    // =========================================================================
    enterQ5Judgement() {
        this.phase = "q5_judgement";
        this.modalInquiry.classList.add("hidden");

        this.dialogueUI.say(
            { name: "全员审决", themeColor: "#ef4444" },
            `进入裁决阶段。作为队长，你可以选择【禁锢一人】限制其夜间行动、或【放逐一人】永久除名，亦可【放弃裁决】。`,
            () => {
                this.showJudgementModal();
            }
        );
    }

    showJudgementModal() {
        const aliveNpcs = this.getAliveNpcTeamMembers();
        const container = document.getElementById("judgement-target-list");
        const btnPass = document.getElementById("btn-judgement-pass");

        container.innerHTML = "";

        if (aliveNpcs.length === 0) {
            container.innerHTML = `<div style="color:#94a3b8; text-align:center; padding:15px;">暂无其他同伴可裁决。</div>`;
        } else {
            aliveNpcs.forEach(npc => {
                const item = document.createElement("div");
                item.className = "judgement-item";
                item.style.borderColor = npc.themeColor;
                item.innerHTML = `
                    <div class="judgement-info">
                        <span class="judgement-name" style="color:${npc.themeColor}">${npc.name}</span>
                        <span class="judgement-role-hint">嫌疑观测中</span>
                    </div>
                    <div class="judgement-actions">
                        <button class="judge-btn btn-confine" title="限制其夜间活动，若其为伪人则今晚无法袭击">🔒 禁锢今夜</button>
                        <button class="judge-btn btn-exile" title="将其永久驱逐出队伍">🚪 永久放逐</button>
                    </div>
                `;

                // 禁锢按钮
                item.querySelector(".btn-confine").onclick = () => {
                    this.executeConfine(npc);
                };

                // 放逐按钮
                item.querySelector(".btn-exile").onclick = () => {
                    this.executeExile(npc);
                };

                container.appendChild(item);
            });
        }

        // 放弃裁决
        btnPass.onclick = () => {
            this.modalJudgement.classList.add("hidden");
            this.confinedNpcId = null;
            this.logAction(`【放弃裁决】出于信任与谨慎，你决定今晚不处分任何同伴。`);
            this.dialogueUI.say(
                this.protagonist,
                `没有确凿证据前不能盲目自相残杀，今夜全员各自回舱待命！`,
                () => {
                    this.enterQ6Night();
                }
            );
        };

        this.modalJudgement.classList.remove("hidden");
    }

    executeConfine(npc) {
        this.modalJudgement.classList.add("hidden");
        this.confinedNpcId = npc.id;

        const isWolf = (npc.role === "wolf");
        this.logAction(`【执行禁锢】将同伴 [${npc.name}] 锁入隔离舱禁闭，限制其夜间行动。`);

        // 触发受难历练检定 (如卡泽/莫德被禁锢)
        this.checkPersonaSecretUnlocks("suffer_fate", { charId: npc.id, type: "confined" });

        this.dialogueUI.playSequence([
            {
                speaker: this.protagonist,
                text: `[${npc.name}]，为了大家的安全，今夜请在封锁舱中度过。`
            },
            {
                speaker: npc,
                text: isWolf ? `……（眼神中闪过一丝阴鸷的冷光，顺从地走进了禁闭室）` : `既然是队长的决定，我遵守安排……但请一定要小心！`,
                expression: isWolf ? "happy" : "sad"
            }
        ], () => {
            this.enterQ6Night();
        });
    }

    executeExile(npc) {
        this.modalJudgement.classList.add("hidden");
        this.exiledNpcId = npc.id;
        npc.status = "exiled"; // 永久除名

        this.logAction(`【执行放逐】将同伴 [${npc.name}] 驱逐出队伍！队伍存活人数变更: ${this.getAliveTeamMembers().length} 人`);

        // 触发放逐伪人历练检定 (卡泽在队且放逐伪人)
        this.checkPersonaSecretUnlocks("exile_wolf_with", { isExiledWolf: npc.role === "wolf", charId: npc.id });

        this.dialogueUI.playSequence([
            {
                speaker: this.protagonist,
                text: `你的疑点太大，队伍不能承担被全灭的风险。请交出给养，独自离开这支队伍。`
            },
            {
                speaker: npc,
                text: `你会为今天的决定后悔的……祝你们好运。`,
                expression: "angry"
            }
        ], () => {
            this.updateHeaderUI();
            this.enterQ6Night();
        });
    }

    // =========================================================================
    // Q6: 黑夜阶段 (根据玩家身份发动夜间技能)
    // =========================================================================
    enterQ6Night() {
        this.phase = "q6_night";
        this.nightProtectedNpcId = null;
        this.witchSaved = false;

        // 先预计算伪人的拟袭击目标 (用于歌咏者女巫感知)
        this.calculateNightWolfPlan();

        this.dialogueUI.say(
            { name: "夜深人静", themeColor: "#818cf8" },
            `夜幕降临，舱内灯光切换为暗红色睡眠模式。作为【${WorldviewConfig.roleNames[this.protagonist.role].name}】，开始执行夜间行动。`,
            () => {
                this.showNightActionModal();
            }
        );
    }

    calculateNightWolfPlan() {
        this.nightTargetVictimId = null;

        // 核心规则：队伍里有伪人才能刀人！
        // 1. 检查队伍中存活的伪人
        const wolvesInTeam = this.getAliveTeamMembers().filter(m => m.role === "wolf");
        if (wolvesInTeam.length === 0) {
            console.log("[夜间伪人行动] 当前队伍中没有伪人，平安无事，绝不刀人。");
            return;
        }

        // 2. 检查队伍中的伪人是否全部被禁锢
        const activeWolvesInTeam = wolvesInTeam.filter(w => w.id !== this.confinedNpcId);
        if (activeWolvesInTeam.length === 0) {
            console.log("[夜间伪人行动] 队伍中的伪人今晚已被禁锢，无法行动。");
            return;
        }

        // 3. 队伍中有具备行动能力的伪人：必定自主猎杀队伍内的同伴（100% 刀人，绝不漏刀）
        // 目标优先级：
        // 优先 1：队伍中存活的普通人类同伴（非伪人、非主角）
        const teamHumanCandidates = this.getAliveNpcTeamMembers().filter(m => m.role !== "wolf");
        
        let target = null;
        if (teamHumanCandidates.length > 0) {
            target = teamHumanCandidates[Math.floor(Math.random() * teamHumanCandidates.length)];
        } else {
            // 优先 2：若当前队伍除伪人外已无其他同伴，伪人直接猎杀主角！
            target = this.protagonist;
        }

        if (target) {
            this.nightTargetVictimId = target.id;
            console.log(`[伪人队内猎杀] 队伍中的伪人已锁定刀人目标: ${target.name} (ID: ${target.id})`);
        }
    }

    showNightActionModal() {
        const role = this.protagonist.role;
        const titleElem = document.getElementById("night-modal-title");
        const descElem = document.getElementById("night-modal-desc");
        const listElem = document.getElementById("night-target-list");
        const btnPass = document.getElementById("btn-night-skip");

        const aliveNpcs = this.getAliveNpcTeamMembers();

        listElem.innerHTML = "";

        if (role === "seer") {
            // 魔镜 (预言家)
            titleElem.textContent = "🔮 魔镜真理检视";
            descElem.textContent = "选择一名存活同伴查验其真实身份，探明其是否已被伪人替换：";
            
            aliveNpcs.forEach(npc => {
                const btn = document.createElement("button");
                btn.className = "night-choice-btn";
                btn.style.borderColor = npc.themeColor;
                btn.innerHTML = `<span style="color:${npc.themeColor}">${npc.name}</span> <span>查验真身 ➔</span>`;
                btn.onclick = () => {
                    this.executeSeerInspect(npc);
                };
                listElem.appendChild(btn);
            });
        } else if (role === "guard") {
            // 护卫 (守卫)
            titleElem.textContent = "🛡️ 护卫守备防御";
            descElem.textContent = "选择一名存活同伴（或守护自己）通宵设防，今夜若其遭到伪人袭击将毫发无伤：";

            const guardCandidates = [...aliveNpcs, this.protagonist];
            guardCandidates.forEach(member => {
                const btn = document.createElement("button");
                btn.className = "night-choice-btn";
                btn.style.borderColor = member.themeColor || "#38bdf8";
                btn.innerHTML = `<span style="color:${member.themeColor || "#38bdf8"}">${member.name}${member.isProtagonist ? " (你自己)" : ""}</span> <span>设立护盾 ➔</span>`;
                btn.onclick = () => {
                    this.executeGuardProtect(member);
                };
                listElem.appendChild(btn);
            });
        } else if (role === "witch") {
            // 歌咏者 (女巫)
            titleElem.textContent = "✨ 歌咏者生命感知";
            if (this.nightTargetVictimId) {
                const victim = (this.nightTargetVictimId === this.protagonist.id)
                    ? this.protagonist
                    : this.getNpcById(this.nightTargetVictimId);
                descElem.innerHTML = `感知到微弱的呼救脑波！今晚同伴 <strong style="color:#ef4444">[${victim ? victim.name : "某人"}]</strong> 遭遇了致命袭击！是否施展歌咏之力挽救生命？`;

                const btnSave = document.createElement("button");
                btnSave.className = "night-choice-btn btn-save-action";
                btnSave.innerHTML = `<span>✨ 施加生命救助 (救赎 ${victim ? victim.name : ""})</span>`;
                btnSave.onclick = () => {
                    this.executeWitchSave(victim);
                };
                listElem.appendChild(btnSave);
            } else {
                descElem.textContent = "今夜舱内静谧，未感知到濒死危机。没有同伴受到致命威胁。";
            }
        } else {
            // 普通人
            titleElem.textContent = "🌙 闭目待晓";
            descElem.textContent = "你保持着警惕，静静等待黎明到来。";
        }

        btnPass.textContent = role === "witch" && this.nightTargetVictimId ? "保留神力 (不施救)" : "跳过行动";
        btnPass.onclick = () => {
            this.modalNight.classList.add("hidden");
            this.logAction(`【黑夜度过】你选择在舱室内闭目养神，静待黎明到来。`);
            this.enterQ7Day();
        };

        this.modalNight.classList.remove("hidden");
    }

    executeSeerInspect(npc) {
        this.modalNight.classList.add("hidden");
        const isWolf = (npc.role === "wolf");
        const roleInfo = WorldviewConfig.roleNames[npc.role] || { name: "普通同伴" };

        this.logAction(`【魔镜查验】查验了同伴 [${npc.name}] 的真身：${isWolf ? "【伪人！！】" : "【正常人类】"}`);

        this.dialogueUI.playSequence([
            {
                speaker: this.protagonist,
                text: `启动魔镜扫描仪，锁定 [${npc.name}] 的细胞反射波长……`
            },
            {
                speaker: { id: "broadcast", isBroadcast: true, name: "魔镜终端", themeColor: isWolf ? "#ff3366" : "#4ade80" },
                text: isWolf
                    ? `⚠️ 警报！检测到高熵拟态神经束！[${npc.name}] 确定为【${WorldviewConfig.roleNames.wolf.name}】！`
                    : `✅ 扫描结果：生体特征完全正常，[${npc.name}] 是【人类同伴】。`
            }
        ], () => {
            this.enterQ7Day();
        });
    }

    executeGuardProtect(npc) {
        this.modalNight.classList.add("hidden");
        this.nightProtectedNpcId = npc.id;

        this.logAction(`【护卫守备】通宵设防，重点守护了同伴 [${npc.name}]。`);

        this.dialogueUI.say(
            this.protagonist,
            `我在 [${npc.name}] 的门前布设了高频防御力场，今晚他不会有生命危险。`,
            () => {
                this.enterQ7Day();
            }
        );
    }

    executeWitchSave(victim) {
        this.modalNight.classList.add("hidden");
        this.witchSaved = true;

        this.logAction(`【歌咏救赎】消耗生命灵药，成功挽救了险遭抹杀的 [${victim ? victim.name : "同伴"}]！`);

        this.dialogueUI.say(
            this.protagonist,
            `咏唱生命回路，生体血清注入……成功将 [${victim ? victim.name : "同伴"}] 从死亡边缘拉了回来！`,
            () => {
                this.enterQ7Day();
            }
        );
    }

    // =========================================================================
    // Q7: 白天阶段 (公布夜晚结果，伤亡结算，全屏黑屏死亡特写，重置计数回到Q3)
    // =========================================================================
    enterDeathBlackPhase(victim, onProceed) {
        this.phase = "death_black";
        this.deathBlackCallback = onProceed;
        this.deathRevealed = false;
        if (this.deathRevealTimer) {
            clearTimeout(this.deathRevealTimer);
            this.deathRevealTimer = null;
        }

        const img = document.getElementById("death-portrait-img");
        const titleElem = document.getElementById("death-victim-name");
        const textElem = document.getElementById("death-black-text");
        const suspenseLayer = document.getElementById("death-suspense-layer");
        const contentContainer = document.getElementById("death-content-container");

        if (titleElem) {
            titleElem.textContent = `【同伴遇害：${victim.name}】`;
        }
        if (textElem) {
            textElem.innerHTML = `生活舱深处传来刺耳的蜂鸣警报，晨曦中发现了一具冰冷的遗体……<br>同伴 [${victim.name}] 昨夜遭遇潜伏伪人残酷袭击，生命体征已完全终止。`;
        }

        const exp = "dead";
        const candidates = (typeof CharacterRegistry !== "undefined" && CharacterRegistry.getCharacterImageCandidates)
            ? CharacterRegistry.getCharacterImageCandidates(victim, exp)
            : [];
        const fallbackSvg = (typeof CharacterRegistry !== "undefined" && CharacterRegistry.getAvatarSvg)
            ? CharacterRegistry.getAvatarSvg(victim, exp)
            : "";
        if (img) {
            img.onerror = () => {
                if (window.handlePortraitError) {
                    window.handlePortraitError(img);
                }
            };
            img.setAttribute("data-candidates", JSON.stringify(candidates));
            img.setAttribute("data-index", "0");
            img.setAttribute("data-fallback", fallbackSvg);
            img.src = candidates[0] || fallbackSvg;
        }

        // 核心表现优化：黑夜行动结束后，先纯黑屏2秒，之后再渐渐浮现死者，并播放音效
        suspenseLayer?.classList.remove("fade-out");
        contentContainer?.classList.remove("death-content-revealed");
        contentContainer?.classList.add("death-content-hidden");

        this.screenGame?.classList.add("hidden");
        this.screenDeathBlack?.classList.remove("hidden");

        const blackDuration = (typeof DeathRevealConfig !== "undefined" && DeathRevealConfig.blackScreenDurationMs !== undefined)
            ? DeathRevealConfig.blackScreenDurationMs
            : 2000;

        // 设置2秒黑屏悬念定时器
        this.deathRevealTimer = setTimeout(() => {
            this.revealDeathContent();
        }, blackDuration);
    }

    /**
     * 2秒黑屏后渐渐浮现死者，并触发相应配置音效
     */
    revealDeathContent() {
        if (this.deathRevealed) return;
        this.deathRevealed = true;

        if (this.deathRevealTimer) {
            clearTimeout(this.deathRevealTimer);
            this.deathRevealTimer = null;
        }

        const suspenseLayer = document.getElementById("death-suspense-layer");
        const contentContainer = document.getElementById("death-content-container");

        suspenseLayer?.classList.add("fade-out");
        contentContainer?.classList.remove("death-content-hidden");
        contentContainer?.classList.add("death-content-revealed");

        // 播放死者展示专属音效 (支持用户在 config.js 中自由配置音频文件)
        try {
            if (typeof Sound !== "undefined" && Sound.playDeathSound) {
                Sound.playDeathSound();
            }
        } catch (err) {
            console.warn("[DeathSound] 播放音效异常:", err);
        }
    }

    handleDeathBlackClick() {
        if (this.phase !== "death_black") return;

        // 若尚处于2秒黑屏期，玩家点击屏幕可快速跳过黑屏等待，立即浮现死者
        if (!this.deathRevealed) {
            this.revealDeathContent();
            return;
        }

        // 死者已浮现状态下，点击推进至白天对话
        this.phase = "q7_day";
        this.screenDeathBlack?.classList.add("hidden");
        this.screenGame?.classList.remove("hidden");

        const cb = this.deathBlackCallback;
        this.deathBlackCallback = null;
        if (cb) cb();
    }

    enterQ7Day() {
        this.phase = "q7_day";
        this.dayCount++;

        // 结算夜晚袭击
        let victimName = null;
        let survivedReason = null; // "confined", "guarded", "witch_saved", "no_attack"

        // 核心规则：队伍里有伪人才能刀人！
        const wolvesInTeam = this.getAliveTeamMembers().filter(m => m.role === "wolf");
        const activeWolvesInTeam = wolvesInTeam.filter(w => w.id !== this.confinedNpcId);

        if (wolvesInTeam.length === 0) {
            survivedReason = "no_attack"; // 队伍里没有伪人，全员安全度过黑夜
        } else if (activeWolvesInTeam.length === 0) {
            survivedReason = "confined"; // 队伍内的伪人已被白天裁决禁锢限制
        }

        let victimObj = null;
        if (!survivedReason) {
            if (!this.nightTargetVictimId) {
                survivedReason = "no_attack";
            } else if (this.nightProtectedNpcId === this.nightTargetVictimId) {
                survivedReason = "guarded"; // 护卫守护
            } else if (this.witchSaved) {
                survivedReason = "witch_saved"; // 女巫救助
            } else if (this.nightTargetVictimId === "kaze" && this.saveSystem.isCharacterPassiveUnlocked("kaze") && Math.random() < 0.35) {
                survivedReason = "kaze_counter"; // 卡泽【战术反制】成功化解！
                this.logAction("【战术反制】卡泽敏锐识破了伪装体的暗夜突袭，凭借特战直觉破门格挡反制，化险为夷！");
            } else if (this.nightTargetVictimId === this.protagonist.id && this.getAliveNpcTeamMembers().some(m => m.id === "mode") && this.saveSystem.isCharacterPassiveUnlocked("mode")) {
                survivedReason = "mode_shield"; // 莫德【防爆坚守】挺身格挡！
                this.logAction("【防爆坚守】潜伏伪装体企图暗算队长！莫德以重装防爆盾死死扼守住舱门，替队长挡下了致命抹杀！");
            } else {
                // 遇害离场
                if (this.nightTargetVictimId === this.protagonist.id) {
                    this.triggerGameOver("生活区已无其他人类同伴生还……潜伏在队伍中的伪人撕下伪装向你扑来。你在绝望中倒下了。");
                    return;
                }
                const victim = this.getNpcById(this.nightTargetVictimId);
                if (victim) {
                    victim.status = "dead";
                    victimName = victim.name;
                    victimObj = victim;
                }
            }
        }

        // 清空当晚临时状态
        const prevReason = survivedReason;
        this.confinedNpcId = null;
        this.nightProtectedNpcId = null;
        this.witchSaved = false;
        this.nightTargetVictimId = null;

        // 更新顶栏与UI
        this.updateHeaderUI();

        if (victimObj) {
            this.logAction(`【黎明公布】第 ${this.dayCount} 天：同伴 [${victimObj.name}] 昨夜遇袭身亡，当前队伍存活: ${this.getAliveTeamMembers().length} 人`);

            // 触发人物图鉴历练检定 (同伴遇害牺牲)
            this.checkPersonaSecretUnlocks("suffer_fate", { charId: victimObj.id, type: "dead" });

            // 核心优化：全屏黑屏中间展示死亡立绘特写（比例适中，不要太大也不要太小）
            this.enterDeathBlackPhase(victimObj, () => {
                const lines = [
                    {
                        speaker: { id: "broadcast", isBroadcast: true, name: "黎明广播", themeColor: "#38bdf8" },
                        text: `第 ${this.dayCount} 循环黎明到来，全员重新集结。`
                    },
                    {
                        speaker: { id: "broadcast", isBroadcast: true, name: "警报广播", themeColor: "#ef4444" },
                        text: `⚠️ 警报！检测到乘员生命体征中断，在生活舱发现了遗体……`
                    }
                ];

                // 存活同伴目睹死亡后的随机反应台词 (随机触发存活NPC的专属特殊语句)
                const aliveNpcs = this.getAliveNpcTeamMembers().filter(m => m.id !== victimObj.id);
                if (aliveNpcs.length > 0) {
                    // 随机打乱存活同伴顺序
                    const shuffled = [...aliveNpcs].sort(() => 0.5 - Math.random());
                    const reactor1 = shuffled[0];
                    const reaction1 = CharacterRegistry.getRandomDeathReaction(reactor1, victimObj);
                    if (reaction1) {
                        lines.push({
                            speaker: reactor1,
                            expression: reaction1.expression,
                            text: reaction1.text
                        });
                        this.logAction(`【同伴哀痛】[${reactor1.name}] 对 [${victimObj.name}] 的牺牲做出了反应。`);
                    }

                    // 若队伍还有其他存活NPC，有几率追加第 2 人的感叹
                    if (shuffled.length > 1 && Math.random() < 0.5) {
                        const reactor2 = shuffled[1];
                        const reaction2 = CharacterRegistry.getRandomDeathReaction(reactor2, victimObj);
                        if (reaction2) {
                            lines.push({
                                speaker: reactor2,
                                expression: reaction2.expression,
                                text: reaction2.text
                            });
                        }
                    }
                }

                this.dialogueUI.playSequence(lines, () => {
                    // 循环回到 q3 探索，步数已在傍晚时清零，开启全新一天的选择
                    this.enterQ3Exploration();
                });
            });
        } else {
            // 平安夜判定
            this.checkPersonaSecretUnlocks("peaceful_night_with", { isPeaceful: true });

            // 用户明确要求：禁锢的就算是伪人，也不要在白天广播时说出来，就说平安夜就行
            let reasonText = "平安夜！昨夜没有任何同伴遇害。";
            if (prevReason === "kaze_counter") {
                reasonText = "昨夜暗影突袭被防区特战本能挫败，平安度过！";
            } else if (prevReason === "mode_shield") {
                reasonText = "重装防爆力场彻底拦截了暗夜突袭，平安度过！";
            }

            const lines = [
                {
                    speaker: { id: "broadcast", isBroadcast: true, name: "广播通信", themeColor: "#4ade80" },
                    text: `✅ ${reasonText}`
                }
            ];

            if (prevReason === "kaze_counter") {
                const kazeNpc = this.getNpcById("kaze");
                if (kazeNpc) {
                    lines.push({
                        speaker: kazeNpc,
                        expression: "angry",
                        text: "昨晚有东西试图从通风口摸进来。不过被我短刀反制割裂了表皮，已经逃窜了。"
                    });
                }
            } else if (prevReason === "mode_shield") {
                const modeNpc = this.getNpcById("mode");
                if (modeNpc) {
                    lines.push({
                        speaker: modeNpc,
                        expression: "angry",
                        text: "队长，昨晚那帮拟态杂碎摸到你舱门前了。老子把防爆盾砸它脸上，给老子夹着尾巴滚了！"
                    });
                }
            }

            this.logAction(`【黎明公布】第 ${this.dayCount} 天：${reasonText}`);

            this.dialogueUI.playSequence(lines, () => {
                // 循环回到 q3 探索，步数已在傍晚时清零，开启全新一天的选择
                this.enterQ3Exploration();
            });
        }
    }

    // =========================================================================
    // 胜利与失败结算
    // =========================================================================
    triggerVictory(exitNode) {
        this.phase = "victory";
        const aliveMembers = this.getAliveTeamMembers();
        const wolfAlive = aliveMembers.filter(m => m.role === "wolf");
        const currentLvlId = this.currentLevel ? this.currentLevel.levelId : 1;

        // 收集人员撤离与伪人状态上下文
        const evacuatedNpcs = aliveMembers.filter(m => !m.isProtagonist);
        const evacuatedNpcIds = evacuatedNpcs.map(m => m.id);
        const allLevelMimics = Array.from(this.allNpcMap.values()).filter(m => m.role === "wolf");
        const allLevelNpcs = Array.from(this.allNpcMap.values());
        const isSolo = (evacuatedNpcIds.length === 0);

        const evalContext = {
            evacuatedNpcIds,
            evacuatedNpcs,
            allLevelMimics,
            allLevelNpcs,
            isSolo
        };

        // 检定非线性关卡解锁规则
        const unlockResult = UnlockEvaluator.evaluate(this.currentLevel?.unlockRules || [], evalContext);
        const newlyUnlocked = this.saveSystem.unlockLevels(unlockResult.unlockedLevelIds);

        // 检定同伴撤离深度档案解构 (带领卡泽/邵可欣/莫德撤离)
        this.checkPersonaSecretUnlocks("evacuate_with", { evacuatedNpcIds });

        let msg = "";
        if (wolfAlive.length > 0) {
            msg = "气闸开启，门外仍是起点长廊。时钟倒流，身后的拟态伪装体在阴影中露出微笑。";
        } else {
            msg = "气闸开启，门外仍是起点长廊。抓痕未愈，时钟倒流——观测者，你从未逃脱循环。";
        }

        this.showResultModal("🌀 奇点坍缩 · 循环重置 (OBSERVATION)", msg, true, { unlockResult, newlyUnlocked });
    }

    triggerGameOver(reason) {
        this.phase = "gameover";
        this.logAction(`【任务失败】${reason}`);
        this.showResultModal("💀 探索中止 (GAME OVER)", reason, false);
    }

    showResultModal(title, message, isVictory, unlockData = {}) {
        const titleElem = document.getElementById("result-title");
        const msgElem = document.getElementById("result-message");
        const btnNext = document.getElementById("btn-result-next");
        const btnLevelSelect = document.getElementById("btn-result-level-select");
        const btnRestart = document.getElementById("btn-result-restart");
        const btnLoad = document.getElementById("btn-result-load");

        titleElem.textContent = title;
        titleElem.style.color = isVictory ? "#38bdf8" : "#ff3366";
        msgElem.textContent = message;

        const currentLvlId = this.currentLevel ? this.currentLevel.levelId : 1;
        const newlyUnlocked = unlockData.newlyUnlocked || [];

        const unlockNoticeElem = document.getElementById("result-unlock-notice");
        if (unlockNoticeElem) {
            if (isVictory && unlockData.unlockResult && unlockData.unlockResult.triggeredRules && unlockData.unlockResult.triggeredRules.length > 0) {
                unlockNoticeElem.classList.remove("hidden");
                let html = `<div style="font-weight: bold; margin-bottom: 6px; color: #38bdf8;">🌌 扇区拓扑解析 · 观测网络重构</div>`;
                unlockData.unlockResult.triggeredRules.forEach(rule => {
                    const isNew = (rule.unlockLevelIds || []).some(id => newlyUnlocked.includes(id));
                    html += `<div style="margin: 2px 0;">✦ ${rule.title || "扇区信标"}：${rule.toast || "信标激活"} ${isNew ? '<span style="color: #4ade80; font-weight: bold;">【✨ 新解锁】</span>' : '<span style="color: #94a3b8;">【已探明】</span>'}</div>`;
                });
                unlockNoticeElem.innerHTML = html;
            } else {
                unlockNoticeElem.classList.add("hidden");
                unlockNoticeElem.innerHTML = "";
            }
        }

        // 检视 5x5 矩阵按钮
        if (btnLevelSelect) {
            if (isVictory) {
                btnLevelSelect.classList.remove("hidden");
                btnLevelSelect.onclick = () => {
                    this.modalResult.classList.add("hidden");
                    this.showMenu();
                    this.showLevelSelectModal();
                };
            } else {
                btnLevelSelect.classList.add("hidden");
            }
        }

        if (btnNext) {
            if (isVictory) {
                btnNext.classList.remove("hidden");
                // 优先指引踏入新解锁的目标扇区
                let targetLvl = null;
                if (newlyUnlocked.length > 0) {
                    targetLvl = newlyUnlocked[0];
                } else if (currentLvlId === 1 && this.saveSystem.isLevelUnlocked(2)) {
                    targetLvl = 2;
                }

                if (targetLvl && targetLvl > 0) {
                    const targetLvlConfig = LevelRegistry.find(l => l.levelId === targetLvl);
                    const targetName = targetLvlConfig ? targetLvlConfig.title : `扇区 ${targetLvl < 10 ? '0' + targetLvl : targetLvl}`;
                    btnNext.textContent = `🌌 踏入新解锁扇区 (进入 ${targetName.split("：")[0]})`;
                    btnNext.onclick = () => {
                        this.modalResult.classList.add("hidden");
                        this.startNewGame(targetLvl);
                    };
                } else {
                    btnNext.textContent = "🔄 重构奇点 (重新进入此循环)";
                    btnNext.onclick = () => {
                        this.modalResult.classList.add("hidden");
                        this.startNewGame(currentLvlId);
                    };
                }
            } else {
                btnNext.classList.add("hidden");
            }
        }

        btnRestart.onclick = () => {
            this.modalResult.classList.add("hidden");
            this.startNewGame(this.currentLevel ? this.currentLevel.levelId : 1);
        };

        btnLoad.onclick = () => {
            this.modalResult.classList.add("hidden");
            this.loadGameProgress();
        };

        this.modalResult.classList.remove("hidden");
    }

    // =========================================================================
    // 存档与读档实现
    // =========================================================================
    saveGameProgress() {
        const state = {
            levelId: this.currentLevel ? this.currentLevel.levelId : 1,
            phase: this.phase,
            dayCount: this.dayCount,
            stamina: this.stamina,
            choiceCount: this.explorationEngine.choiceCount,
            currentNodeId: this.explorationEngine.currentNodeId,
            visitedNodes: Array.from(this.explorationEngine.visitedNodes),
            consumedEvents: Array.from(this.explorationEngine.consumedEvents),
            actionLogs: this.actionLogs,
            protagonistRole: this.protagonist.role,
            teamNpcIds: this.teamMembers.filter(m => !m.isProtagonist).map(m => m.id),
            npcs: Array.from(this.allNpcMap.values()).map(npc => ({
                id: npc.id,
                role: npc.role,
                status: npc.status,
                inquiryCount: npc.inquiryCount
            }))
        };

        const success = this.saveSystem.saveGame(state);
        if (success) {
            alert("进度已成功保存在本地存储中！");
            this.logAction(`【系统存档】游戏进度与当前状态保存成功。`);
        } else {
            alert("存档保存失败，请检查浏览器存储权限。");
        }
    }

    loadGameProgress() {
        const data = this.saveSystem.loadGame();
        if (!data) {
            alert("未找到可用的历史存档记录。");
            return;
        }

        const levelConfig = LevelRegistry.find(l => l.levelId === data.levelId) || LevelRegistry[0];
        this.currentLevel = levelConfig;

        // 恢复主角
        this.protagonist = {
            ...CharacterRegistry.protagonist,
            role: data.protagonistRole || "seer",
            inquiryCount: 0,
            status: "active",
            fallbackSvg: CharacterRegistry.getAvatarSvg(CharacterRegistry.protagonist)
        };

        // 恢复NPC
        this.allNpcMap.clear();
        this.teamMembers = [this.protagonist];

        (data.npcs || []).forEach(item => {
            const rawChar = CharacterRegistry.npcs[item.id];
            if (!rawChar) return;
            const npcObj = {
                ...rawChar,
                role: item.role,
                status: item.status,
                inquiryCount: item.inquiryCount || 0,
                svgAvatar: CharacterRegistry.getAvatarSvg(rawChar),
                fallbackSvg: CharacterRegistry.getAvatarSvg(rawChar)
            };
            this.allNpcMap.set(npcObj.id, npcObj);

            if (npcObj.status === "active") {
                this.teamMembers.push(npcObj);
            }
        });

        // 恢复数值
        this.stamina = data.stamina;
        this.dayCount = data.dayCount;
        this.actionLogs = data.actionLogs || [];

        // 恢复地图状态
        this.explorationEngine.initLevelMap(levelConfig.map);
        this.explorationEngine.currentNodeId = data.currentNodeId;
        this.explorationEngine.choiceCount = data.choiceCount || 0;
        this.explorationEngine.visitedNodes = new Set(data.visitedNodes || []);
        this.explorationEngine.consumedEvents = new Set(data.consumedEvents || []);

        this.screenMenu.classList.add("hidden");
        this.screenBlack.classList.add("hidden");
        this.screenEveningBlack?.classList.add("hidden");
        this.screenDeathBlack?.classList.add("hidden");
        this.screenGame.classList.remove("hidden");

        this.logAction(`【读档成功】恢复至第 ${this.dayCount} 天，当前位置：${this.explorationEngine.getCurrentNode()?.name || "未知"}`);

        this.enterQ3Exploration();
    }

    // =========================================================================
    // 工具辅助函数
    // =========================================================================
    getNpcById(id) {
        return this.allNpcMap.get(id);
    }

    // 获取当前在队伍中且存活的所有成员（含主角）
    getAliveTeamMembers() {
        return this.teamMembers.filter(m => m.status === "active");
    }

    // 获取当前在队伍中且存活的NPC同伴（不含主角）
    getAliveNpcTeamMembers() {
        return this.teamMembers.filter(m => !m.isProtagonist && m.status === "active");
    }

    updateHeaderUI() {
        const currentNode = this.explorationEngine.getCurrentNode();
        if (this.headerLocation) {
            this.headerLocation.textContent = currentNode ? currentNode.name : "未知区域";
        }

        if (this.headerStaminaFill && this.headerStaminaText) {
            const pct = Math.max(0, Math.min(100, (this.stamina / StaminaConfig.maxStamina) * 100));
            this.headerStaminaFill.style.width = `${pct}%`;
            this.headerStaminaText.textContent = `${this.stamina} / ${StaminaConfig.maxStamina}`;
            if (this.stamina <= 24) {
                this.headerStaminaFill.style.background = "#ef4444";
            } else if (this.stamina <= 50) {
                this.headerStaminaFill.style.background = "#f59e0b";
            } else {
                this.headerStaminaFill.style.background = "#38bdf8";
            }
        }

        if (this.headerTeamCount) {
            const alive = this.getAliveTeamMembers().length;
            this.headerTeamCount.textContent = `队伍幸存: ${alive} 人`;
        }

        if (this.headerDayText) {
            this.headerDayText.textContent = `第 ${this.dayCount} 循环`;
        }

        // 保持侧边栏与弹窗的任务清单实时刷新
        this.renderMissionsPanel();

        // 实时刷新战术微型雷达
        this.updateMiniRadar();
    }

    logAction(text) {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const entry = { time: timeStr, text: text };
        this.actionLogs.push(entry);
        this.renderActionLogs();
    }

    renderActionLogs() {
        if (!this.logListElement) return;
        this.logListElement.innerHTML = "";
        this.actionLogs.slice(-40).forEach(log => {
            const li = document.createElement("li");
            li.className = "log-entry";
            li.innerHTML = `<span class="log-time">[${log.time}]</span> <span class="log-text">${log.text}</span>`;
            this.logListElement.appendChild(li);
        });
        // 自动滚动到底部
        this.logListElement.scrollTop = this.logListElement.scrollHeight;
    }

    /**
     * 选择移动方向时：自动打开地图并播放类似 Unity DoTween 的平移动画
     */
    performMoveWithMapAnimation(direction) {
        if (this.phase !== "q3_explore" || this.isMovingAnimation) return;

        const currentNode = this.explorationEngine.getCurrentNode();
        if (!currentNode || !currentNode.connections || !currentNode.connections[direction]) {
            return;
        }

        const nextNodeId = currentNode.connections[direction];
        const nextNode = this.currentLevel && this.currentLevel.map && this.currentLevel.map.nodes[nextNodeId];
        if (!nextNode) return;

        const isExitNode = !!(nextNode.isExit || (nextNode.event && nextNode.event.type === "exit"));

        // 若体力已耗尽且不是通往终点，直接触发结算倒下
        if (this.stamina <= 0 && !isExitNode) {
            this.explorationEngine.moveTo(direction);
            return;
        }

        this.isMovingAnimation = true;

        // 播放移动探索脚步音效 (移动.wav)
        if (typeof Sound !== "undefined" && Sound.playMoveSound) {
            Sound.playMoveSound();
        }

        // 打开地图弹窗并执行平移位移动画
        this.showMapModalForMove(currentNode, nextNode, () => {
            this.isMovingAnimation = false;
            // 动画完成，关闭地图弹窗并执行真实状态结算
            this.modalMap?.classList.add("hidden");
            this.explorationEngine.moveTo(direction);
        });
    }

    /**
     * 专属地图位移动画弹窗
     */
    showMapModalForMove(fromNode, toNode, onFinished) {
        const banner = document.getElementById("map-move-banner");
        const bannerText = document.getElementById("map-move-text");
        const tabLive = document.getElementById("btn-tab-live-map");
        const tabSketch = document.getElementById("btn-tab-sketch-map");
        const viewLive = document.getElementById("map-live-view");
        const viewSketch = document.getElementById("map-sketch-view");

        // 切换至实时定位蓝图模式
        tabLive?.classList.add("active");
        tabSketch?.classList.remove("active");
        viewLive?.classList.remove("hidden");
        viewSketch?.classList.add("hidden");

        const fromName = (fromNode && fromNode.name) || "当前位置";
        const toName = (toNode && toNode.name) || "目标位置";
        const fromId = fromNode?.id || (fromNode ? String(fromNode) : "");
        const toId = toNode?.id || (toNode ? String(toNode) : "");

        if (banner && bannerText) {
            banner.classList.remove("hidden");
            bannerText.innerHTML = `🧭 正在行进：<span style="color:#38bdf8">[${fromName}]</span> ➔ <span style="color:#4ade80">[${toName}]</span>...`;
        }

        this.modalMap.classList.remove("hidden");

        if (!this.mapRenderer) {
            const canvas = document.getElementById("live-map-canvas");
            if (canvas) {
                this.mapRenderer = new MapRenderer(canvas);
            }
        }

        let finished = false;
        const completeOnce = () => {
            if (finished) return;
            finished = true;
            if (banner) banner.classList.add("hidden");
            if (onFinished) onFinished();
        };

        const canvasElem = document.getElementById("live-map-canvas");
        const skipHandler = () => {
            if (this.mapRenderer && this.mapRenderer.skipAnimation) {
                this.mapRenderer.skipAnimation();
            }
        };

        canvasElem?.addEventListener("click", skipHandler, { once: true });

        if (this.mapRenderer && typeof requestAnimationFrame !== "undefined" && fromId && toId) {
            this.mapRenderer.animateMove(
                this.currentLevel.map,
                fromId,
                toId,
                this.explorationEngine.visitedNodes,
                this.teamMembers,
                () => {
                    canvasElem?.removeEventListener("click", skipHandler);
                    if (bannerText) {
                        bannerText.innerHTML = `📍 已抵达：<span style="color:#4ade80">[${toName}]</span>`;
                    }
                    setTimeout(() => {
                        completeOnce();
                    }, 380);
                }
            );
        } else {
            completeOnce();
        }
    }

    showMapModal() {
        const banner = document.getElementById("map-move-banner");
        const bannerText = document.getElementById("map-move-text");
        if (banner && bannerText) {
            if (this.phase === "q3_explore") {
                banner.classList.remove("hidden");
                bannerText.innerHTML = `🟢 <b>快速往返已就绪：</b>点击地图上已探索的方块，即可快速安全折返（不计入面临选择次数）`;
            } else {
                banner.classList.add("hidden");
            }
        }

        const img = document.getElementById("modal-map-img");
        if (img && this.currentLevel) {
            img.src = this.currentLevel.mapImageUrl || "assets/level1_sketch.jpg";
        }

        const notesElem = document.querySelector(".map-notes");
        if (notesElem && this.currentLevel) {
            if (this.currentLevel.levelId === 2) {
                notesElem.innerHTML = `<span>起点：深潜次级减压闸</span> ｜ <span>终点：超弦共振核心</span> ｜ <span>深层散落：莫德、邵可欣、卡泽</span>`;
            } else {
                notesElem.innerHTML = `<span>起点：下层中央大厅</span> ｜ <span>终点：北侧脱离大门</span> ｜ <span>沿途：卡泽(NPC1)、邵可欣(NPC2)、莫德(NPC3)</span>`;
            }
        }
        const tabSketch = document.getElementById("btn-tab-sketch-map");
        if (tabSketch && this.currentLevel) {
            tabSketch.style.display = this.currentLevel.mapImageUrl ? "" : "none";
        }

        this.modalMap.classList.remove("hidden");
        // 默认显示实时蓝图并绘制
        this.renderLiveMap();
    }

    renderLiveMap() {
        if (!this.mapRenderer) {
            const canvas = document.getElementById("live-map-canvas");
            if (canvas) {
                this.mapRenderer = new MapRenderer(canvas);
            }
        }

        if (this.mapRenderer && this.currentLevel && this.currentLevel.map) {
            this.mapRenderer.render(
                this.currentLevel.map,
                this.explorationEngine.currentNodeId,
                this.explorationEngine.visitedNodes,
                this.teamMembers,
                null,
                0,
                {
                    canFastTravel: this.phase === "q3_explore",
                    hoveredNodeId: this.hoveredMapNodeId
                }
            );
        }
    }

    /**
     * 处理点击地图房间节点触发快速往返
     */
    handleMapNodeClick(node) {
        if (!node) return;

        // 1. 阶段约束：快速往返只能在白天自由探索（q3_explore）使用，傍晚时刻、裁决、询问、黑夜均不可使用
        if (this.phase !== "q3_explore") {
            const banner = document.getElementById("map-move-banner");
            const bannerText = document.getElementById("map-move-text");
            if (banner && bannerText) {
                banner.classList.remove("hidden");
                bannerText.innerHTML = `⚠️ <span style="color:#ef4444">快速往返锁定：</span>该功能仅限白昼探索时段使用，当前时段（傍晚/裁决/黑夜）禁止使用！`;
                setTimeout(() => {
                    if (!this.isMovingAnimation) banner.classList.add("hidden");
                }, 2400);
            }
            if (typeof Sound !== "undefined" && Sound.playTick) Sound.playTick();
            return;
        }

        // 2. 区域探明约束：只能前往已探索区域
        if (!this.explorationEngine.visitedNodes.has(node.id)) {
            const banner = document.getElementById("map-move-banner");
            const bannerText = document.getElementById("map-move-text");
            if (banner && bannerText) {
                banner.classList.remove("hidden");
                bannerText.innerHTML = `⚠️ <span style="color:#f59e0b">[未探明迷雾]</span> 只能快速往返于已经探索过的安全房间！`;
                setTimeout(() => {
                    if (!this.isMovingAnimation) banner.classList.add("hidden");
                }, 2200);
            }
            if (typeof Sound !== "undefined" && Sound.playTick) Sound.playTick();
            return;
        }

        // 3. 当前位置校验：若点击的就是当前所在房间
        if (node.id === this.explorationEngine.currentNodeId) {
            const banner = document.getElementById("map-move-banner");
            const bannerText = document.getElementById("map-move-text");
            if (banner && bannerText) {
                banner.classList.remove("hidden");
                bannerText.innerHTML = `📍 <span style="color:#38bdf8">你当前已在 [${node.name}]！</span>无需折返。`;
                setTimeout(() => {
                    if (!this.isMovingAnimation) banner.classList.add("hidden");
                }, 1800);
            }
            return;
        }

        // 4. 寻路校验：寻找经由已探索房间的最短路径
        const path = this.explorationEngine.findVisitedPath(this.explorationEngine.currentNodeId, node.id);
        if (!path || path.length < 2) {
            const banner = document.getElementById("map-move-banner");
            const bannerText = document.getElementById("map-move-text");
            if (banner && bannerText) {
                banner.classList.remove("hidden");
                bannerText.innerHTML = `⚠️ 暂无连通的已探索路线前往 [${node.name}]！`;
                setTimeout(() => {
                    if (!this.isMovingAnimation) banner.classList.add("hidden");
                }, 2200);
            }
            return;
        }

        // 5. 开始执行带动画与音效的快速往返
        this.performFastTravel(node.id, path);
    }

    /**
     * 执行带多段平移动画与脚步音效的快速往返穿梭
     */
    performFastTravel(targetNodeId, path) {
        if (this.isMovingAnimation) return;
        this.isMovingAnimation = true;

        const startNode = this.explorationEngine.getCurrentNode();
        const destNode = this.currentLevel.map.nodes[targetNodeId];
        const banner = document.getElementById("map-move-banner");
        const bannerText = document.getElementById("map-move-text");
        const tabLive = document.getElementById("btn-tab-live-map");
        const tabSketch = document.getElementById("btn-tab-sketch-map");
        const viewLive = document.getElementById("map-live-view");
        const viewSketch = document.getElementById("map-sketch-view");

        // 确保切换至实时定位蓝图
        tabLive?.classList.add("active");
        tabSketch?.classList.remove("active");
        viewLive?.classList.remove("hidden");
        viewSketch?.classList.add("hidden");

        const startName = startNode ? startNode.name : "当前位置";
        const destName = destNode ? destNode.name : targetNodeId;

        if (banner && bannerText) {
            banner.classList.remove("hidden");
            bannerText.innerHTML = `🧭 正在快速往返：<span style="color:#38bdf8">[${startName}]</span> ➔ <span style="color:#4ade80">[${destName}]</span> (途经 ${path.length - 1} 间安全走廊)... ⚡ 点击画面可跳过`;
        }

        this.modalMap?.classList.remove("hidden");

        if (!this.mapRenderer) {
            const canvas = document.getElementById("live-map-canvas");
            if (canvas) {
                this.mapRenderer = new MapRenderer(canvas);
            }
        }

        let finished = false;
        const completeOnce = () => {
            if (finished) return;
            finished = true;
            this.isMovingAnimation = false;
            this.skipFastTravelAnimation = null;
            if (banner) banner.classList.add("hidden");
            this.modalMap?.classList.add("hidden");

            // 执行快速往返状态结算（不累加面临选择次数）
            this.explorationEngine.fastTravelTo(targetNodeId);

            // 视觉小说对白反馈
            this.dialogueUI.say(
                { name: "区域指引", themeColor: "#4ade80" },
                `已快速返回至 [${destName}]。${destNode?.desc || ""} 请选择下一步行动方向。`
            );
        };

        const canvasElem = document.getElementById("live-map-canvas");
        const skipHandler = () => {
            if (finished) return;
            if (this.mapRenderer && this.mapRenderer.skipAnimation) {
                this.mapRenderer.skipAnimation();
            }
            completeOnce();
        };

        this.skipFastTravelAnimation = skipHandler;
        canvasElem?.addEventListener("click", skipHandler, { once: true });

        // 播放首个区段脚步音效 (移动.wav)
        if (typeof Sound !== "undefined" && Sound.playMoveSound) {
            Sound.playMoveSound();
        }

        if (this.mapRenderer && typeof requestAnimationFrame !== "undefined" && path && path.length >= 2) {
            this.mapRenderer.animatePath(
                this.currentLevel.map,
                path,
                this.explorationEngine.visitedNodes,
                this.teamMembers,
                (segIdx, fromId, toId) => {
                    // 每段移动播放移动脚步音效 (与普通走路声一致)
                    if (typeof Sound !== "undefined" && Sound.playMoveSound) {
                        Sound.playMoveSound();
                    }
                    if (bannerText) {
                        const toN = this.currentLevel.map.nodes[toId];
                        bannerText.innerHTML = `🧭 正在快速往返：<span style="color:#38bdf8">[${startName}]</span> ➔ <span style="color:#4ade80">[${destName}]</span> (正在经过: ${toN?.name || toId})... ⚡ 点击跳过`;
                    }
                },
                () => {
                    canvasElem?.removeEventListener("click", skipHandler);
                    if (bannerText) {
                        bannerText.innerHTML = `📍 已安全抵达：<span style="color:#4ade80">[${destName}]</span>`;
                    }
                    setTimeout(() => {
                        completeOnce();
                    }, 350);
                }
            );
        } else {
            completeOnce();
        }
    }

    // =========================================================================
    // 战术微型雷达 (Mini-map Radar)
    // =========================================================================
    onExploreStep() {
        this.getAliveNpcTeamMembers().forEach(npc => {
            this.stepsWithNpc[npc.id] = (this.stepsWithNpc[npc.id] || 0) + 1;
            this.checkPersonaSecretUnlocks("steps_with", { charId: npc.id, steps: this.stepsWithNpc[npc.id] });
        });
    }

    toggleMiniRadar() {
        if (!this.radarBodyWrap || !this.btnRadarToggle) return;
        const isCollapsed = this.radarBodyWrap.classList.contains("hidden");
        if (isCollapsed) {
            this.radarBodyWrap.classList.remove("hidden");
            this.btnRadarToggle.textContent = "−";
            this.btnRadarToggle.title = "折叠雷达";
        } else {
            this.radarBodyWrap.classList.add("hidden");
            this.btnRadarToggle.textContent = "+";
            this.btnRadarToggle.title = "展开雷达";
        }
    }

    updateMiniRadar() {
        if (!this.hudMiniRadar || !this.currentLevel || !this.currentLevel.map) return;

        // 仅在游戏主界面非隐藏状态下显示悬浮雷达
        const inGame = this.screenGame && !this.screenGame.classList.contains("hidden");
        if (!inGame || this.phase === "menu" || this.phase === "victory" || this.phase === "gameover") {
            this.hudMiniRadar.classList.add("hidden");
            return;
        }

        this.hudMiniRadar.classList.remove("hidden");

        const currentNodeId = this.explorationEngine.currentNodeId;
        const currNode = this.currentLevel.map.nodes[currentNodeId];

        // 刷新坐标微标牌
        if (this.radarPosTag && currNode) {
            if (currNode.coord) {
                this.radarPosTag.textContent = `[X: ${currNode.coord.x}, Y: ${currNode.coord.y}]`;
            } else {
                this.radarPosTag.textContent = `[${currNode.name ? currNode.name.slice(0, 8) : '当前'}]`;
            }
        }

        // 检定邵可欣被动技能【第六感预警 (Intuitive Pulse)】
        // 若邵可欣存活且在队内、且被动已觉醒，侦测四周未探索邻居房间是否有潜伏伪装体
        let isNearMimic = false;
        const isShaokexinActive = this.getAliveNpcTeamMembers().some(m => m.id === "shaokexin");
        const isShaokexinPassiveUnlocked = this.saveSystem.isCharacterPassiveUnlocked("shaokexin");

        if (isShaokexinActive && isShaokexinPassiveUnlocked && currNode && currNode.connections) {
            const conns = Object.values(currNode.connections);
            for (const neighborId of conns) {
                if (!this.explorationEngine.visitedNodes.has(neighborId)) {
                    const nNode = this.currentLevel.map.nodes[neighborId];
                    if (nNode && nNode.event && nNode.event.type === "npc") {
                        const targetNpc = this.allNpcMap.get(nNode.event.npcId);
                        if (targetNpc && targetNpc.role === "wolf") {
                            isNearMimic = true;
                            break;
                        }
                    }
                }
            }
        }

        if (!this.mapRenderer) {
            const liveCanvas = document.getElementById("live-map-canvas");
            this.mapRenderer = new MapRenderer(liveCanvas || this.miniRadarCanvas);
        }

        if (this.mapRenderer && this.miniRadarCanvas) {
            this.mapRenderer.renderMiniRadar(
                this.miniRadarCanvas,
                this.currentLevel.map,
                currentNodeId,
                this.explorationEngine.visitedNodes,
                isNearMimic
            );
        }
    }

    // =========================================================================
    // 人物特征 / 秘密图鉴 (Persona Log)
    // =========================================================================
    checkPersonaSecretUnlocks(triggerType, context = {}) {
        if (typeof CharacterRegistry === "undefined" || !CharacterRegistry.npcs) return;

        Object.values(CharacterRegistry.npcs).forEach(char => {
            if (!char || !char.persona || !Array.isArray(char.persona.secrets)) return;

            char.persona.secrets.forEach(secret => {
                if (this.saveSystem.isPersonaSecretUnlocked(char.id, secret.id)) return;
                let shouldUnlock = false;

                if (secret.unlockType === "inquiry_count" && triggerType === "inquiry_count") {
                    if (context.charId === char.id && (context.count || 0) >= secret.threshold) {
                        shouldUnlock = true;
                    }
                } else if (secret.unlockType === "evacuate_with" && triggerType === "evacuate_with") {
                    const evacuatedNpcIds = context.evacuatedNpcIds || [];
                    if (evacuatedNpcIds.includes(char.id)) {
                        shouldUnlock = true;
                    }
                } else if (secret.unlockType === "exile_wolf_with" && triggerType === "exile_wolf_with") {
                    const kazeInTeam = this.getAliveNpcTeamMembers().some(m => m.id === "kaze");
                    if (char.id === "kaze" && kazeInTeam && context.isExiledWolf) {
                        shouldUnlock = true;
                    }
                } else if (secret.unlockType === "peaceful_night_with" && triggerType === "peaceful_night_with") {
                    const shaoInTeam = this.getAliveNpcTeamMembers().some(m => m.id === "shaokexin");
                    if (char.id === "shaokexin" && shaoInTeam && context.isPeaceful) {
                        shouldUnlock = true;
                    }
                } else if (secret.unlockType === "suffer_fate" && triggerType === "suffer_fate") {
                    if (context.charId === char.id) {
                        shouldUnlock = true;
                    }
                } else if (secret.unlockType === "steps_with" && triggerType === "steps_with") {
                    if (context.charId === char.id && (context.steps || 0) >= secret.threshold) {
                        shouldUnlock = true;
                    }
                }

                if (shouldUnlock) {
                    const newlyUnlocked = this.saveSystem.unlockPersonaSecret(char.id, secret.id);
                    if (newlyUnlocked) {
                        this.logAction(`【档案解构】解开了 [${char.name}] 的深层记忆档案：【${secret.title}】！`);
                        this.showPersonaToast(char, secret);

                        if (this.saveSystem.isCharacterPassiveUnlocked(char.id)) {
                            this.logAction(`【特质完全觉醒】[${char.name}] 达成全记忆解构！觉醒专属被动【${char.persona.passiveSkill.name}】并开启专属剧情分支！`);
                        }
                    }
                }
            });
        });
    }

    showPersonaToast(char, secret) {
        if (typeof document === "undefined") return;

        let toast = document.getElementById("persona-unlock-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "persona-unlock-toast";
            toast.className = "persona-toast";
            document.body.appendChild(toast);
        }

        const isFullyAwakened = this.saveSystem.isCharacterPassiveUnlocked(char.id);
        toast.innerHTML = `
            <div class="persona-toast-title">
                <span>✨ 记忆图鉴解构 · ${char.name}</span>
            </div>
            <div class="persona-toast-body">
                <span>解锁档案：<b>【${secret.title}】</b></span><br>
                <span style="font-size:0.75rem; color:#94a3b8;">${secret.desc.slice(0, 36)}...</span>
                ${isFullyAwakened ? `<div style="color:#fbbf24; font-weight:bold; margin-top:4px;">🌟 达成全部解构！觉醒被动【${char.persona.passiveSkill.name}】！</div>` : ''}
            </div>
        `;

        toast.classList.remove("fade-out", "hidden");
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }

        this.toastTimeout = setTimeout(() => {
            toast.classList.add("fade-out");
            setTimeout(() => {
                toast.classList.add("hidden");
            }, 450);
        }, 3600);
    }

    showPersonaLogModal(selectedCharId = null) {
        if (!this.modalPersonaLog) return;
        if (selectedCharId) {
            this.activePersonaCharId = selectedCharId;
        } else if (!this.activePersonaCharId) {
            this.activePersonaCharId = "kaze";
        }
        this.renderPersonaLogModal(this.activePersonaCharId);
        this.modalPersonaLog.classList.remove("hidden");
    }

    renderPersonaLogModal(selectedCharId = "kaze") {
        if (!this.personaCharTabs || !this.personaCharDetail) return;
        this.activePersonaCharId = selectedCharId;

        const npcs = CharacterRegistry.npcs;
        const charKeys = ["kaze", "shaokexin", "mode"];

        // 1. 渲染角色切换 Tab 按钮
        this.personaCharTabs.innerHTML = "";
        charKeys.forEach(key => {
            const char = npcs[key];
            if (!char || !char.persona) return;

            const unlockedList = this.saveSystem.getUnlockedSecrets(char.id);
            const count = unlockedList.length;
            const total = char.persona.secrets.length;
            const isFull = count >= total;

            const tab = document.createElement("button");
            tab.className = `persona-tab-btn ${key === this.activePersonaCharId ? "active" : ""}`;
            tab.style.borderColor = key === this.activePersonaCharId ? char.themeColor : "";
            tab.innerHTML = `
                <span class="tab-char-name" style="color:${char.themeColor}">${char.name}</span>
                <span class="tab-char-count ${isFull ? 'count-complete' : ''}">(${count}/${total})</span>
            `;

            tab.addEventListener("click", () => {
                this.renderPersonaLogModal(key);
            });
            this.personaCharTabs.appendChild(tab);
        });

        // 2. 渲染选定角色的完整档案面
        const activeChar = npcs[this.activePersonaCharId];
        if (!activeChar || !activeChar.persona) return;

        const persona = activeChar.persona;
        const unlockedList = this.saveSystem.getUnlockedSecrets(activeChar.id);
        const unlockedCount = unlockedList.length;
        const totalSecrets = persona.secrets.length;
        const pct = Math.round((unlockedCount / totalSecrets) * 100);
        const isPassiveUnlocked = this.saveSystem.isCharacterPassiveUnlocked(activeChar.id);

        let secretsHtml = "";
        persona.secrets.forEach((s, idx) => {
            const isUnlocked = this.saveSystem.isPersonaSecretUnlocked(activeChar.id, s.id);
            secretsHtml += `
                <div class="persona-secret-card ${isUnlocked ? 'secret-unlocked' : 'secret-locked'}">
                    <div class="persona-secret-top">
                        <span class="persona-secret-title">
                            ${isUnlocked ? `✦ ${s.title}` : `🔒 深度记忆 #${idx + 1}`}
                        </span>
                        <span class="persona-secret-status ${isUnlocked ? 'status-unlocked' : 'status-locked'}">
                            ${isUnlocked ? '已解构' : '待探明'}
                        </span>
                    </div>
                    <div class="persona-secret-desc">
                        ${isUnlocked ? s.desc : '……此处记忆神经回路发生熵阻断裂，无法读取。'}
                    </div>
                    ${!isUnlocked ? `<div class="persona-secret-hint">💡 解锁线索：${s.hint}</div>` : ''}
                </div>
            `;
        });

        const branch = persona.exclusiveBranch;

        this.personaCharDetail.innerHTML = `
            <!-- 头部概览卡 -->
            <div class="persona-hero-card" style="border-left-color: ${activeChar.themeColor};">
                <div class="persona-hero-avatar" style="border-color: ${activeChar.themeColor};">
                    <img src="${activeChar.svgAvatar}" alt="${activeChar.name}">
                </div>
                <div class="persona-hero-info">
                    <div class="persona-hero-title-row">
                        <span class="persona-hero-name" style="color:${activeChar.themeColor};">${activeChar.name}</span>
                        <span class="persona-hero-role-tag" style="background:${activeChar.themeColor}26; border-color:${activeChar.themeColor}; color:${activeChar.themeColor};">${persona.title}</span>
                    </div>
                    <div class="persona-progress-wrap">
                        <div class="persona-progress-bar-bg">
                            <div class="persona-progress-bar-fill" style="width:${pct}%; background:${activeChar.themeColor};"></div>
                        </div>
                        <span class="persona-progress-text">记忆拼合进度: ${unlockedCount} / ${totalSecrets} (${pct}%)</span>
                    </div>
                </div>
            </div>

            <!-- 4 条核心深层记忆卡片网格 -->
            <div class="persona-secrets-grid">
                ${secretsHtml}
            </div>

            <!-- 专属保命被动技能与专属分支启航栏 -->
            <div class="persona-reward-deck">
                <div class="persona-passive-box ${isPassiveUnlocked ? 'active-skill' : ''}">
                    <div class="persona-passive-header">
                        <span>${persona.passiveSkill.icon}</span>
                        <span>专属特质：${persona.passiveSkill.name}</span>
                        <span style="font-size:0.75rem; margin-left:auto; color:${isPassiveUnlocked ? '#4ade80' : '#94a3b8'};">
                            ${isPassiveUnlocked ? '【✨ 已激活】' : '【🔒 需集齐4项记忆】'}
                        </span>
                    </div>
                    <div class="persona-passive-desc">${persona.passiveSkill.desc}</div>
                </div>

                <div class="persona-branch-action">
                    <button id="btn-launch-exclusive-branch" 
                            class="btn-launch-branch ${isPassiveUnlocked ? 'enabled' : 'disabled'}"
                            ${isPassiveUnlocked ? '' : 'disabled'}>
                        ${isPassiveUnlocked ? `🚀 开启专属分支：${branch.badge}` : `🔒 需完整拼合记忆解锁分支`}
                    </button>
                </div>
            </div>
        `;

        // 绑定专属分支进入按钮
        const btnLaunch = document.getElementById("btn-launch-exclusive-branch");
        if (btnLaunch && isPassiveUnlocked) {
            btnLaunch.onclick = () => {
                this.modalPersonaLog?.classList.add("hidden");
                this.startExclusiveBranch(branch.levelId);
            };
        }
    }

    startExclusiveBranch(levelId) {
        if (!levelId) return;
        // 自动解锁此专属关卡并启动新游戏
        this.saveSystem.unlockLevels([levelId]);
        this.screenMenu?.classList.add("hidden");
        this.startNewGame(levelId);
    }
}

