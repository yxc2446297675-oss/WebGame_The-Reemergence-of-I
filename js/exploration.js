/**
 * 地图探索与肉鸽事件驱动器 (Exploration & Roguelike Map Engine)
 * 负责移动、体力扣减、食物结算、救助NPC入队、终点胜利检定及傍晚步数概率检定
 */

import { StaminaConfig, EveningTriggerConfig } from "./config.js";
import { Sound } from "./audio.js";

export class ExplorationEngine {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.currentMap = null;
        this.currentNodeId = null;
        this.choiceCount = 0; // 面临选择步数计数器
        this.visitedNodes = new Set();
        this.consumedEvents = new Set(); // 已经触发过的食物/NPC事件记录
    }

    /**
     * 初始化关卡地图
     */
    initLevelMap(mapConfig) {
        this.currentMap = mapConfig;
        this.currentNodeId = mapConfig.startNodeId || Object.keys(mapConfig.nodes)[0];
        this.choiceCount = 0;
        this.visitedNodes.clear();
        this.consumedEvents.clear();
        this.visitedNodes.add(this.currentNodeId);
    }

    getCurrentNode() {
        if (!this.currentMap || !this.currentNodeId) return null;
        return this.currentMap.nodes[this.currentNodeId];
    }

    /**
     * 获取当前节点可通行的方向表
     */
    getAvailableDirections() {
        const node = this.getCurrentNode();
        if (!node || !node.connections) return {};
        return node.connections;
    }

    /**
     * 执行移动操作 (forward, backward, left, right)
     */
    moveTo(direction) {
        const node = this.getCurrentNode();
        if (!node || !node.connections || !node.connections[direction]) {
            return false;
        }

        const nextNodeId = node.connections[direction];
        const nextNode = this.currentMap.nodes[nextNodeId];
        if (!nextNode) return false;

        const isAlreadyExplored = this.visitedNodes.has(nextNodeId);

        // 1. 体力消耗规则：移动到已探索区域免除体力消耗；移动到未知区域消耗 8 点体力
        const cost = isAlreadyExplored ? 0 : StaminaConfig.stepCost;
        if (cost > 0) {
            this.gameEngine.stamina -= cost;
            if (this.gameEngine.stamina < 0) this.gameEngine.stamina = 0;
        }

        if (typeof Sound !== "undefined" && Sound.playMoveSound) {
            Sound.playMoveSound();
        }

        // 步数与同伴历练通知（用于人物记忆图鉴步数检定）
        if (this.gameEngine && this.gameEngine.onExploreStep) {
            this.gameEngine.onExploreStep();
        }

        const dirNames = {
            forward: "前方",
            backward: "后方",
            left: "左侧",
            right: "右侧"
        };
        const dirName = dirNames[direction] || direction;

        // 记录行动日志
        if (isAlreadyExplored) {
            this.gameEngine.logAction(
                `【安全折返】向${dirName}返回已探明区域 [${nextNode.name}]，免除体力消耗（不消耗面临选择次数，剩余 ${this.gameEngine.stamina}/${StaminaConfig.maxStamina}）`
            );
        } else {
            this.gameEngine.logAction(
                `【探索推进】向${dirName}踏入未知区域 [${nextNode.name}]，消耗体力 ${cost}点（剩余 ${this.gameEngine.stamina}/${StaminaConfig.maxStamina}）`
            );
        }

        // 2. 更新当前位置
        this.currentNodeId = nextNodeId;
        this.visitedNodes.add(nextNodeId);

        // 立即更新顶部状态栏（房间名、当前体力与百分比）
        this.gameEngine.updateHeaderUI();

        const isExitNode = !!(nextNode.isExit || (nextNode.event && nextNode.event.type === "exit"));
        const isPowerRestorationPending = (
            (this.gameEngine?.currentLevel?.levelId === 2 && !this.gameEngine.level2PowerRestored) ||
            (this.gameEngine?.currentLevel?.levelId === 3 && !this.gameEngine.level3PowerRestored)
        );
        const isLevel5ColtBarnesPending = (
            this.gameEngine?.currentLevel?.levelId === 5 &&
            !(
                this.gameEngine.getAliveTeamMembers().some(m => m.id === "colt") &&
                this.gameEngine.getAliveTeamMembers().some(m => m.id === "barnes")
            )
        );
        const isLevel6ElsaNoahPending = (
            this.gameEngine?.currentLevel?.levelId === 6 &&
            !(
                this.gameEngine.getAliveTeamMembers().some(m => m.id === "elsa") &&
                this.gameEngine.getAliveTeamMembers().some(m => m.id === "noah")
            )
        );
        const isLevel7BarnesPending = (
            this.gameEngine?.currentLevel?.levelId === 7 &&
            !this.gameEngine.getAliveTeamMembers().some(m => m.id === "barnes")
        );
        const isLevel8ColtPending = (
            this.gameEngine?.currentLevel?.levelId === 8 &&
            !this.gameEngine.getAliveTeamMembers().some(m => m.id === "colt")
        );
        const isLevel9PatrolPending = (
            this.gameEngine?.currentLevel?.levelId === 9 &&
            (this.gameEngine.level9PatrolStep || 0) < 2
        );
        const isLevel10Pending = (
            this.gameEngine?.currentLevel?.levelId === 10 &&
            (
                !this.gameEngine.level10KazeNightKilled ||
                this.gameEngine.getAliveNpcTeamMembers().length > 0
            )
        );
        const isLevel11Pending = (
            this.gameEngine?.currentLevel?.levelId === 11 &&
            (
                !this.gameEngine.level11LifeSupportVisited ||
                this.gameEngine.getAliveNpcTeamMembers().length > 0
            )
        );
        const isLevel12Pending = (
            this.gameEngine?.currentLevel?.levelId === 12 &&
            this.gameEngine.getAliveNpcTeamMembers().length < 3
        );
        // 如果终点节点包含未救助的NPC（如第五关主反应堆的伊莲），不可提前视为最终脱出阻断，必须步入触发NPC救助
        const nextRoomNpcId = (nextNode.event && nextNode.event.type === "npc" && nextNode.event.npcId) || nextNode.npcId;
        const targetNpc = nextRoomNpcId ? this.gameEngine.getNpcById(nextRoomNpcId) : null;
        const hasUnmetNpc = targetNpc && targetNpc.status === "unmet" && !this.consumedEvents.has(`${nextNode.id}_event`);

        const isEffectiveExit = isExitNode && !isPowerRestorationPending && !isLevel5ColtBarnesPending && !isLevel6ElsaNoahPending && !isLevel7BarnesPending && !isLevel8ColtPending && !isLevel9PatrolPending && !isLevel10Pending && !isLevel11Pending && !isLevel12Pending && !hasUnmetNpc;
        if (isEffectiveExit) {
            if (!isAlreadyExplored) {
                this.choiceCount++;
            }
            this.handleNodeEvents(nextNode, isAlreadyExplored);
            return true;
        }

        // 4. 检查体力是否耗尽（非有效终点情况下体力降至0则倒下）
        if (this.gameEngine.stamina <= 0) {
            this.gameEngine.triggerGameOver("体力耗尽！你在冰冷黑暗的走廊中耗尽了最后一丝力气，未能生还……");
            return true;
        }

        // 5. 增加面临选择次数：用户明确规定——点已探索区域不消耗面临选择次数，点未探索区域才消耗
        if (!isAlreadyExplored) {
            this.choiceCount++;
            console.log(`[面临选择计数] 探索新房间 [${nextNode.name}]，选择次数增至: ${this.choiceCount}`);
        } else {
            console.log(`[面临选择计数] 折返已探明房间 [${nextNode.name}]，安全通行，不消耗面临选择次数 (保持 ${this.choiceCount} 次)`);
        }

        // 6. 触发并检查当前节点事件
        this.handleNodeEvents(nextNode, isAlreadyExplored);

        return true;
    }

    /**
     * 处理节点事件（终点、食物、昏迷NPC）
     */
    handleNodeEvents(node, isAlreadyExplored = false) {
        // 更新左上角区域名称与UI
        this.gameEngine.updateHeaderUI();

        // 1. 特殊关卡机制：第二关与第三关停电始发地合闸通电特殊确认弹窗
        // 核心要求：完成修电任务需要有特殊弹窗提示确认，若NPC在上面则先触发修电弹窗再触发NPC选择
        const isPowerRestoreNeeded = (
            ((this.gameEngine?.currentLevel?.levelId === 2 && !this.gameEngine.level2PowerRestored) ||
             (this.gameEngine?.currentLevel?.levelId === 3 && !this.gameEngine.level3PowerRestored)) &&
            (node.id === "room_west_end" || node.isPowerOrigin)
        );

        if (isPowerRestoreNeeded) {
            this.gameEngine.showPowerRestoreModal(node, () => {
                if (this.gameEngine?.currentLevel?.levelId === 2) {
                    this.gameEngine.level2PowerRestored = true;
                } else if (this.gameEngine?.currentLevel?.levelId === 3) {
                    this.gameEngine.level3PowerRestored = true;
                }
                this.gameEngine.logAction(`【电源修复】抵达全舰停电始发地 [${node.name}]！手动合上高压母线总断路器，逃生系统主电网供电成功恢复！`);
                if (typeof Sound !== "undefined" && Sound.playAlarmSound) {
                    Sound.playAlarmSound();
                }
                if (this.gameEngine.showStageToast) {
                    this.gameEngine.showStageToast("⚡ [停电始发地] 主电网重合闸成功！逃生舱气动锁已解除！");
                }
                if (this.gameEngine.renderMissionsPanel) {
                    this.gameEngine.renderMissionsPanel();
                }
                // 修电确认完成后，再顺序触发该节点内的其他事件（如陆知行 NPC 救援选择）
                this.handleNodeEvents(node, isAlreadyExplored);
            });
            return;
        }

        // 2. 优先检查：如果该节点包含未救助的NPC (例如第五关重核聚变主反应堆的伊莲，或特勤套房的柯尔特&巴恩斯)
        const eventKey = `${node.id}_event`;
        const roomNpcId = (node.event && node.event.type === "npc" && node.event.npcId) || node.npcId;
        const targetNpc = roomNpcId ? this.gameEngine.getNpcById(roomNpcId) : null;
        const isNpcUnmet = targetNpc && targetNpc.status === "unmet" && !this.consumedEvents.has(eventKey);

        if (isNpcUnmet) {
            this.handleNpcEvent(node, eventKey, () => {
                this.processNodeAfterNpc(node, isAlreadyExplored, true);
            });
            return;
        }

        this.processNodeAfterNpc(node, isAlreadyExplored, false);
    }

    processNodeAfterNpc(node, isAlreadyExplored = false, skipNpc = false) {
        // A. 终点判定 (走到用户决定的地图终点即宣布成功)
        if (node.isExit || (node.event && node.event.type === "exit")) {
            // 第二关与第三关专属拦截：若尚未在停电始发地合闸通电，禁止撤离
            const isPowerRestorationPending = (
                (this.gameEngine?.currentLevel?.levelId === 2 && !this.gameEngine.level2PowerRestored) ||
                (this.gameEngine?.currentLevel?.levelId === 3 && !this.gameEngine.level3PowerRestored)
            );
            if (isPowerRestorationPending) {
                this.gameEngine.logAction(`【气动锁未解压】逃生舱主电源处于切断状态！气动锁未解压，无法启动撤离程序。请先前往停电始发地修复电源！`);
                this.gameEngine.dialogueUI?.say(
                    { name: "逃生舱控制终端", themeColor: "#f43f5e" },
                    "【警告：主能源离线】逃生舱主电源处于切断状态，舱门气动锁未解压，逃生折跃引擎无法启动！请前往【停电始发地】合上主电闸修复电源后再来撤离！"
                );
                this.gameEngine.renderExplorationControls();
                if (this.gameEngine.refreshStageMap) {
                    this.gameEngine.refreshStageMap();
                }
                return;
            }

            // 第四关专属通关校验：必须先行完成三大要害中枢（停机坪甲板、重力发生核、防护中枢）的巡检
            if (this.gameEngine.currentLevel && this.gameEngine.currentLevel.levelId === 4) {
                const count = this.gameEngine.level4PatrolVisited ? this.gameEngine.level4PatrolVisited.size : 0;
                if (count < 3) {
                    if (this.gameEngine.showStageToast) {
                        this.gameEngine.showStageToast(`⚠️ 巡检任务未完成！三大要害中枢尚有 ${3 - count} 处未排查！`);
                    }
                    this.gameEngine.logAction(`【巡检未竟】未完成全舰三大要害中枢巡检（${count}/3），动力操作台终端尚未解锁！`);
                    this.gameEngine.dialogueUI?.say(
                        { name: "动力操作台控制终端", themeColor: "#fbbf24" },
                        `【全舰巡检协议未闭环】巡检任务尚未完成（当前进度: ${count}/3）。在确认停机坪甲板、重力发生核与防护中枢的安全之前，动力操作台控制系统拒绝进入收工阶段！`
                    );
                    this.gameEngine.renderExplorationControls();
                    if (this.gameEngine.refreshStageMap) {
                        this.gameEngine.refreshStageMap();
                    }
                    return;
                }
            }

            // 第五关专属通关校验：必须带离柯尔特与巴恩斯撤离（不这样做就算踩上终点也不触发通过）
            if (this.gameEngine?.currentLevel?.levelId === 5) {
                const aliveTeam = this.gameEngine.getAliveTeamMembers();
                const hasColt = aliveTeam.some(m => m.id === "colt");
                const hasBarnes = aliveTeam.some(m => m.id === "barnes");
                if (!hasColt || !hasBarnes) {
                    if (this.gameEngine.showStageToast) {
                        this.gameEngine.showStageToast("⚠️ 撤离受阻！未能与柯尔特及巴恩斯汇合！");
                    }
                    this.gameEngine.logAction("【撤离受阻】未带离柯尔特与巴恩斯撤离，重核聚变主反应堆引渡通道拒绝开启！");
                    this.gameEngine.dialogueUI?.say(
                        { name: "主反应堆控制中枢", themeColor: "#fb923c" },
                        "【引渡协议拦截】柯尔特与巴恩斯未随队抵达！缺少全舰电路跳变与走私旁路授权，重核聚变主反应堆引渡通道无法开启！"
                    );
                    this.gameEngine.renderExplorationControls();
                    if (this.gameEngine.refreshStageMap) {
                        this.gameEngine.refreshStageMap();
                    }
                    return;
                }
            }

            // 第六关专属通关校验：必须带离艾尔莎与诺亚撤离（不这样做就算踩上终点也不触发通过）
            if (this.gameEngine?.currentLevel?.levelId === 6) {
                const aliveTeam = this.gameEngine.getAliveTeamMembers();
                const hasElsa = aliveTeam.some(m => m.id === "elsa");
                const hasNoah = aliveTeam.some(m => m.id === "noah");
                if (!hasElsa || !hasNoah) {
                    if (this.gameEngine.showStageToast) {
                        this.gameEngine.showStageToast("⚠️ 撤离受阻！尚未找到艾尔莎与诺亚！");
                    }
                    this.gameEngine.logAction("【撤离受阻】未带离艾尔莎与诺亚撤离，重核聚变主反应堆过热回路无法闭锁！");
                    this.gameEngine.dialogueUI?.say(
                        { name: "主反应堆控制中枢", themeColor: "#fb923c" },
                        "【紧急协议拦截】艾尔莎与诺亚未随队抵达！缺少生化抗核阻滞剂与超导超频阵列支持，主反应堆无法完成冷却降温，撤离通道拒绝开启！"
                    );
                    this.gameEngine.renderExplorationControls();
                    if (this.gameEngine.refreshStageMap) {
                        this.gameEngine.refreshStageMap();
                    }
                    return;
                }
            }

            // 第七关专属通关校验：必须带离巴恩斯撤离（不这样做就算踩上终点也不触发通过）
            if (this.gameEngine?.currentLevel?.levelId === 7) {
                const aliveTeam = this.gameEngine.getAliveTeamMembers();
                const hasBarnes = aliveTeam.some(m => m.id === "barnes");
                if (!hasBarnes) {
                    if (this.gameEngine.showStageToast) {
                        this.gameEngine.showStageToast("⚠️ 撤离受阻！未能保护搭档巴恩斯一同撤离！");
                    }
                    this.gameEngine.logAction("【撤离受阻】未带离巴恩斯撤离，防爆甬道气动闭锁拒绝开启！");
                    this.gameEngine.dialogueUI?.say(
                        { name: "防爆甬道门禁", themeColor: "#fb923c" },
                        "【逃生指令驳回】搭档巴恩斯未随队抵达！走私暗号与联络频段未完成双重校验，防爆甬道气动锁拒绝解锁！"
                    );
                    this.gameEngine.renderExplorationControls();
                    if (this.gameEngine.refreshStageMap) {
                        this.gameEngine.refreshStageMap();
                    }
                    return;
                }
            }

            // 第八关专属通关校验：必须带离柯尔特撤离（不这样做就算踩上终点也不触发通过）
            if (this.gameEngine?.currentLevel?.levelId === 8) {
                const aliveTeam = this.gameEngine.getAliveTeamMembers();
                const hasColt = aliveTeam.some(m => m.id === "colt");
                if (!hasColt) {
                    if (this.gameEngine.showStageToast) {
                        this.gameEngine.showStageToast("⚠️ 撤离受阻！未能保护搭档柯尔特一同撤离！");
                    }
                    this.gameEngine.logAction("【撤离受阻】未带离柯尔特撤离，防爆甬道气动闭锁拒绝开启！");
                    this.gameEngine.dialogueUI?.say(
                        { name: "防爆甬道门禁", themeColor: "#fb923c" },
                        "【逃生指令驳回】搭档柯尔特未随队抵达！缺少电子密钥与旁路密码，防爆甬道气动锁拒绝解锁！"
                    );
                    this.gameEngine.renderExplorationControls();
                    if (this.gameEngine.refreshStageMap) {
                        this.gameEngine.refreshStageMap();
                    }
                    return;
                }
            }

            // 第九关专属通关校验：必须先后前往【重力发生核】与【前沿技术科室】完成巡视排查
            if (this.gameEngine?.currentLevel?.levelId === 9) {
                const patrolStep = this.gameEngine.level9PatrolStep || 0;
                if (patrolStep < 2) {
                    const stepDesc = patrolStep === 0 ? "【重力发生核】与【前沿技术科室】" : "【前沿技术科室】";
                    if (this.gameEngine.showStageToast) {
                        this.gameEngine.showStageToast(`⚠️ 任务未完成！尚需静默前往${stepDesc}！`);
                    }
                    this.gameEngine.logAction(`【规避未竟】尚未抵达${stepDesc}排查，全自动急救台撤离程序尚未就绪！`);
                    this.gameEngine.dialogueUI?.say(
                        { name: "全自动急救台控制面板", themeColor: "#fbbf24" },
                        `【静默规避协议未完成】当前撤离条件未满足。在前往${stepDesc}完成静默规避与排查前，急救台冷冻撤离舱拒绝闭合！`
                    );
                    this.gameEngine.renderExplorationControls();
                    if (this.gameEngine.refreshStageMap) {
                        this.gameEngine.refreshStageMap();
                    }
                    return;
                }
            }

            // 第十关专属通关校验：必须使卡罗被伪人袭击死亡后独自撤离（不这样做就算踩上终点也不触发通过）
            if (this.gameEngine?.currentLevel?.levelId === 10) {
                const kazeNightKilled = this.gameEngine.level10KazeNightKilled;
                const aliveNpcs = this.gameEngine.getAliveNpcTeamMembers();
                if (!kazeNightKilled) {
                    if (this.gameEngine.showStageToast) {
                        this.gameEngine.showStageToast("⚠️ 撤离受阻！卡罗尚未被伪人袭击身亡！");
                    }
                    this.gameEngine.logAction("【撤离受阻】计划未完成！卡罗尚未在黑夜中被伪人袭击身亡，高危冷藏间气闸拒绝开启！");
                    this.gameEngine.dialogueUI?.say(
                        { name: "高危冷藏间门禁", themeColor: "#f43f5e" },
                        "【逃生指令驳回】卡罗尚未遭遇伪人袭击离场！根据既定计划，必须在夜间使卡罗遭到伪人袭击身亡后，方可启动冷藏间撤离程序！"
                    );
                    this.gameEngine.renderExplorationControls();
                    if (this.gameEngine.refreshStageMap) {
                        this.gameEngine.refreshStageMap();
                    }
                    return;
                }
                if (aliveNpcs.length > 0) {
                    if (this.gameEngine.showStageToast) {
                        this.gameEngine.showStageToast("⚠️ 撤离受阻！身边尚有其他存活同伴，必须独自撤离！");
                    }
                    this.gameEngine.logAction(`【撤离受阻】队伍中尚有 ${aliveNpcs.length} 名存活同伴随行，任务要求零同伴（伪人亦不可）独自脱离！`);
                    this.gameEngine.dialogueUI?.say(
                        { name: "高危冷藏间门禁", themeColor: "#f43f5e" },
                        "【逃生指令驳回】检测到随行生命体征！高危冷藏间撤离通道仅允许你一人独自撤离，队伍中不得有任何存活同伴（包括伪人）！"
                    );
                    this.gameEngine.renderExplorationControls();
                    if (this.gameEngine.refreshStageMap) {
                        this.gameEngine.refreshStageMap();
                    }
                    return;
                }
            }

            // 第十一关专属通关校验：必须先前往维生环境总控机房，再独自撤离（不这样做就算踩上终点也不触发通过）
            if (this.gameEngine?.currentLevel?.levelId === 11) {
                const lifeSupportVisited = !!this.gameEngine.level11LifeSupportVisited;
                const aliveNpcs = this.gameEngine.getAliveNpcTeamMembers();
                if (!lifeSupportVisited) {
                    if (this.gameEngine.showStageToast) {
                        this.gameEngine.showStageToast("⚠️ 撤离受阻！尚未抵达维生环境总控机房完成核检！");
                    }
                    this.gameEngine.logAction("【撤离受阻】维生环境总控机房尚未核检，重力发生核撤离程序拒绝启动！");
                    this.gameEngine.dialogueUI?.say(
                        { name: "重力发生核控制终端", themeColor: "#fbbf24" },
                        "【引力锁闭协议】维生环境总控机房核检尚未完成。在确认一号核心回路状态之前，重力发生核拒绝进入收工撤离阶段！"
                    );
                    this.gameEngine.renderExplorationControls();
                    if (this.gameEngine.refreshStageMap) {
                        this.gameEngine.refreshStageMap();
                    }
                    return;
                }
                if (aliveNpcs.length > 0) {
                    if (this.gameEngine.showStageToast) {
                        this.gameEngine.showStageToast("⚠️ 撤离受阻！身边尚有其他存活同伴，必须独自撤离！");
                    }
                    this.gameEngine.logAction(`【撤离受阻】队伍中尚有 ${aliveNpcs.length} 名存活同伴随行，任务要求零同伴（伪人亦不可）独自脱离！`);
                    this.gameEngine.dialogueUI?.say(
                        { name: "重力发生核控制终端", themeColor: "#f43f5e" },
                        "【逃生指令驳回】检测到随行生命体征！引力扰动区撤离通道仅允许你一人独自撤离，队伍中不得有任何存活同伴（包括伪人）！"
                    );
                    this.gameEngine.renderExplorationControls();
                    if (this.gameEngine.refreshStageMap) {
                        this.gameEngine.refreshStageMap();
                    }
                    return;
                }
            }

            // 第十二关专属通关校验：必须带离三名NPC撤离（不这样做就算踩上终点也不触发通过）
            if (this.gameEngine?.currentLevel?.levelId === 12) {
                const aliveNpcs = this.gameEngine.getAliveNpcTeamMembers();
                if (aliveNpcs.length < 3) {
                    if (this.gameEngine.showStageToast) {
                        this.gameEngine.showStageToast(`⚠️ 撤离受阻！随行同伴不足 3 人（当前: ${aliveNpcs.length}/3）！`);
                    }
                    this.gameEngine.logAction(`【撤离受阻】队伍中存活同伴仅有 ${aliveNpcs.length}/3 人，必须带离至少三名同伴一同返回绿光生态舱！`);
                    this.gameEngine.dialogueUI?.say(
                        { name: "绿光生态舱维生总控", themeColor: "#4ade80" },
                        `【生态避险回路锁定】当前随行同伴不足 3 人（当前: ${aliveNpcs.length}/3）。为了维持生态平衡并重启时空因果钟摆，必须搜寻并带领至少三名同伴返回此处！`
                    );
                    this.gameEngine.renderExplorationControls();
                    if (this.gameEngine.refreshStageMap) {
                        this.gameEngine.refreshStageMap();
                    }
                    return;
                }
            }

            this.gameEngine.logAction(`【通关突破】全员成功抵达目的地 [${node.name}]！准备跳跃！`);
            this.gameEngine.triggerVictory(node);
            return;
        }

        // 第四关专属要害巡检打卡判定 (停机坪甲板、重力发生核、防护中枢)
        if (this.gameEngine.currentLevel && this.gameEngine.currentLevel.levelId === 4) {
            const patrolTargets = ["room_hangar_deck", "room_gravity_well", "room_shields_emitter"];
            if (patrolTargets.includes(node.id)) {
                if (!this.gameEngine.level4PatrolVisited) {
                    this.gameEngine.level4PatrolVisited = new Set();
                }
                if (!this.gameEngine.level4PatrolVisited.has(node.id)) {
                    this.gameEngine.level4PatrolVisited.add(node.id);
                    const targetNames = {
                        room_hangar_deck: "停机坪甲板",
                        room_gravity_well: "重力发生核",
                        room_shields_emitter: "防护中枢"
                    };
                    const count = this.gameEngine.level4PatrolVisited.size;
                    if (this.gameEngine.showStageToast) {
                        this.gameEngine.showStageToast(`🎯 [巡检打卡] 已抵达【${targetNames[node.id] || node.name}】(${count}/3)`);
                    }
                    this.gameEngine.logAction(`【要害巡视】完成了对三大中枢之一 [${node.name}] 的静默巡查（当前进度: ${count}/3）！`);
                    this.gameEngine.updateHeaderUI();
                }
            }
        }

        // 第九关专属静默规避打卡判定 (先后前往单独亮起的【重力发生核】与【前沿技术科室】)
        if (this.gameEngine?.currentLevel && this.gameEngine.currentLevel.levelId === 9) {
            const currentStep = this.gameEngine.level9PatrolStep || 0;
            if (currentStep === 0 && node.id === "room_gravity_well") {
                this.gameEngine.level9PatrolStep = 1;
                if (this.gameEngine.showStageToast) {
                    this.gameEngine.showStageToast("🎯 [静默排查 1/2] 已抵达【重力发生核】！前沿技术科室已亮起！");
                }
                this.gameEngine.logAction(`【静默穿行】在未惊动任何人的情况下完成了对 [${node.name}] 的排查（进度: 1/2）！【前沿技术科室】已亮起！`);
                if (typeof Sound !== "undefined" && Sound.playAlarmSound) {
                    Sound.playAlarmSound();
                }
                this.gameEngine.updateHeaderUI();
                if (this.gameEngine.refreshStageMap) {
                    this.gameEngine.refreshStageMap();
                }
            } else if (currentStep === 1 && node.id === "room_decon_airlock") {
                this.gameEngine.level9PatrolStep = 2;
                if (this.gameEngine.showStageToast) {
                    this.gameEngine.showStageToast("🎯 [静默排查 2/2] 已抵达【前沿技术科室】！终点急救台已激活！");
                }
                this.gameEngine.logAction(`【静默穿行】成功深入并排查了 [${node.name}]（进度: 2/2）！撤离终点【全自动急救台】已激活就绪，请前往撤离！`);
                if (typeof Sound !== "undefined" && Sound.playAlarmSound) {
                    Sound.playAlarmSound();
                }
                this.gameEngine.updateHeaderUI();
                if (this.gameEngine.refreshStageMap) {
                    this.gameEngine.refreshStageMap();
                }
            }
        }

        // 第十关专属最高指挥殿堂输入密钥判定
        if (this.gameEngine?.currentLevel?.levelId === 10 && node.id === "room_bridge_main") {
            if (!this.gameEngine.level10KeyEntered && this.gameEngine.showKeySequenceModal) {
                this.gameEngine.showKeySequenceModal();
            }
        }

        // 第十一关专属：抵达维生环境总控机房完成核检打卡
        if (this.gameEngine?.currentLevel?.levelId === 11 && node.id === "room_life_support") {
            if (!this.gameEngine.level11LifeSupportVisited) {
                this.gameEngine.level11LifeSupportVisited = true;
                if (this.gameEngine.showStageToast) {
                    this.gameEngine.showStageToast("🎯 [维生核检] 已抵达【维生环境总控机房】！请独自前往重力发生核撤离！");
                }
                this.gameEngine.logAction("【维生核检】成功抵达维生环境总控机房，一号核心回路状态已记录！请确保零同伴随行后前往【重力发生核】撤离！");
                if (typeof Sound !== "undefined" && Sound.playAlarmSound) {
                    Sound.playAlarmSound();
                }
                if (this.gameEngine.renderMissionsPanel) {
                    this.gameEngine.renderMissionsPanel();
                }
                this.gameEngine.updateHeaderUI();
                if (this.gameEngine.refreshStageMap) {
                    this.gameEngine.refreshStageMap();
                }
            }
        }

        // B. 特殊生化检测室判定 (获知当前队伍里有几名伪人)
        if (node.isDetectionRoom) {
            const aliveTeam = this.gameEngine.getAliveTeamMembers();
            const wolfCount = aliveTeam.filter(m => m.role === "wolf").length;
            this.gameEngine.logAction(
                `【生化检测】在 [${node.name}] 终端完成基因测序：当前随行 ${aliveTeam.length} 人，检出 ${wolfCount} 名伪人拟态体！`
            );
            this.gameEngine.dialogueUI.say(
                { name: "生化检测终端", themeColor: "#34d399" },
                `【生化检测报告】全队生命体征扫描完毕。当前随行队伍共 ${aliveTeam.length} 人，检测到潜伏着 ${wolfCount} 名异质伪装体（伪人）！`
            );
        }

        // C. NPC 专属私人舱室日记读取 (独立翻页弹窗)
        if (node.isNpcRoom && node.diary && Array.isArray(node.diary) && node.diary.length > 0) {
            const ownerNames = {
                lph: "L.P.H", kaze: "卡罗", kaluo: "卡罗", shaokexin: "邵可欣", mode: "莫德",
                prof_lu: "陆知行", luzhixing: "陆知行", noah: "诺亚", sophia: "索菲亚",
                vivian: "薇薇安", elena: "伊莲", elsa: "艾尔莎", dr_elsa: "艾尔莎",
                colt: "柯尔特", barnes: "巴恩斯", colt_barnes: "柯尔特 & 巴恩斯"
            };
            const ownerColors = {
                lph: "#38bdf8", kaze: "#38bdf8", kaluo: "#38bdf8", shaokexin: "#f43f5e", mode: "#a855f7",
                prof_lu: "#10b981", luzhixing: "#10b981", noah: "#6366f1", sophia: "#ec4899",
                vivian: "#f43f5e", elena: "#fb923c", elsa: "#06b6d4", dr_elsa: "#06b6d4",
                colt: "#f59e0b", barnes: "#84cc16", colt_barnes: "#f59e0b"
            };
            const ownerName = ownerNames[node.npcOwnerId] || node.name;
            const ownerColor = ownerColors[node.npcOwnerId] || "#38bdf8";

            this.gameEngine.logAction(`【翻阅日志】在 [${node.name}] 发现了一份私人记录本（${ownerName}）。`);
            if (this.gameEngine.diaryUI) {
                setTimeout(() => {
                    this.gameEngine.diaryUI.open(ownerName, ownerColor, node.diary);
                }, 200);
            }
        }

        this.processRoomEvents(node, isAlreadyExplored, skipNpc);
    }

    /**
     * 处理房间内的常规事件（食物物资、NPC昏迷救助、傍晚检定）
     */
    processRoomEvents(node, isAlreadyExplored, skipNpc = false) {
        // 检查该节点的事件是否已被触发过
        const eventKey = `${node.id}_event`;
        if (node.event && !this.consumedEvents.has(eventKey)) {
            if (node.event.type === "food") {
                this.handleFoodEvent(node, eventKey);
                return;
            } else if (node.event.type === "npc" && !skipNpc) {
                this.handleNpcEvent(node, eventKey);
                return;
            }
        }

        // 如果是已探索过的安全房间，并且没有新事件阻断，则不计入面临选择，不触发傍晚检定
        if (isAlreadyExplored) {
            this.gameEngine.renderExplorationControls();
            if (this.gameEngine.refreshStageMap) {
                this.gameEngine.refreshStageMap();
            }
            return;
        }

        // 仅当踏入未探索区域时，才检定是否触发傍晚
        this.checkEveningTrigger();
    }

    /**
     * 遇到食物补给事件
     */
    handleFoodEvent(node, eventKey, afterCallback = null) {
        this.consumedEvents.add(eventKey);
        
        // 根据当前存活的队伍人数结算回复量
        const teamCount = this.gameEngine.getAliveTeamMembers().length;
        const recoveryAmount = StaminaConfig.getFoodRecovery(teamCount);
        const oldStamina = this.gameEngine.stamina;
        this.gameEngine.stamina = Math.min(StaminaConfig.maxStamina, this.gameEngine.stamina + recoveryAmount);
        const actualRecovered = this.gameEngine.stamina - oldStamina;

        // 【优化】物资补充时立即刷新UI上的体力值与体力条，而不是等下一次行动才刷新
        this.gameEngine.updateHeaderUI();
        if (this.gameEngine.headerStaminaFill) {
            this.gameEngine.headerStaminaFill.classList.remove("stamina-boost-pulse");
            if (this.gameEngine.headerStaminaFill.offsetWidth !== undefined) {
                void this.gameEngine.headerStaminaFill.offsetWidth;
            }
            this.gameEngine.headerStaminaFill.classList.add("stamina-boost-pulse");
        }

        // 播放物资获取专属音效 (物资获取.wav)
        if (typeof Sound !== "undefined" && Sound.playFoodSound) {
            Sound.playFoodSound();
        }

        this.gameEngine.logAction(
            `【发现食物】在 [${node.name}] 找到了 [${node.event.name || "高能给养"}]！队伍共 ${teamCount} 人，体力恢复了 +${actualRecovered} 点（当前: ${this.gameEngine.stamina}）`
        );

        // 播放视觉小说对白反馈
        this.gameEngine.dialogueUI.playSequence([
            {
                speaker: { name: "环境广播", themeColor: "#4ade80" },
                text: `在 [${node.name}] 发现留存的 [${node.event.name || "给养"}]！`
            },
            {
                speaker: this.gameEngine.protagonist,
                text: `根据当前 ${teamCount} 名同伴的配给均分，每人补充了水分与能量。体力回复了 ${actualRecovered} 点。`
            }
        ], () => {
            if (afterCallback) {
                afterCallback();
            } else {
                this.checkEveningTrigger();
            }
        });
    }

    /**
     * 遇到昏迷NPC事件
     */
    handleNpcEvent(node, eventKey, onHandledCallback = null) {
        const npcId = (node.event && node.event.npcId) || node.npcId;
        const npc = this.gameEngine.getNpcById(npcId);

        if (!npc) {
            if (onHandledCallback) onHandledCallback();
            else this.checkEveningTrigger();
            return;
        }

        // 第四关与第九关专属潜行规避逻辑：不可与任何NPC发生视线接触，若踩到NPC所在区域直接游戏结束“你被他人所凝视，复现失败”
        if (this.gameEngine?.currentLevel && (this.gameEngine.currentLevel.levelId === 4 || this.gameEngine.currentLevel.levelId === 9)) {
            this.gameEngine.triggerGameOver("你被他人所凝视，复现失败");
            return;
        }

        if (npc.status === "dead") {
            this.consumedEvents.add(eventKey);
            this.gameEngine.logAction(`【现场勘查】在 [${node.name}] 发现了已遇害的 [${npc.name}] 的遗体。`);
            this.gameEngine.dialogueUI.say(
                this.gameEngine.protagonist,
                `这里是 [${npc.name}] 最后的停留地……现场留下了激烈的搏斗痕迹，伪人抢先一步下了杀手。`,
                () => {
                    if (onHandledCallback) onHandledCallback();
                    else this.checkEveningTrigger();
                }
            );
            return;
        }

        if (npc.status !== "unmet") {
            if (onHandledCallback) onHandledCallback();
            else this.checkEveningTrigger();
            return;
        }

        // 弹出对话框并提示玩家选择：让其加入 / 不救助
        // 若选择救助入队，则标记该事件已消耗；若选择不救助/不理睬，则不标记消耗，允许之后再次踏入该区域时重新触发是否救助！
        this.gameEngine.showNpcEncounterModal(npc, node, (joined) => {
            if (joined) {
                this.consumedEvents.add(eventKey);
            }
            if (onHandledCallback) {
                onHandledCallback();
            } else {
                this.checkEveningTrigger();
            }
        });
    }

    /**
     * 检定是否触发傍晚时刻
     * 当面临选择次数大于等于3次后概率触发傍晚时刻 (1,2次0%; 3次40%; 4次70%; 5次100%)
     * 触发后重置 choiceCount，进入 q4 询问环节
     */
    checkEveningTrigger() {
        // 第四关与第九关专属优化：本关卡为全舰白昼静默巡检/深空静默规避，没有黑天时刻，没有死寂降临
        if (this.gameEngine?.currentLevel && (this.gameEngine.currentLevel.levelId === 4 || this.gameEngine.currentLevel.levelId === 9)) {
            this.gameEngine.renderExplorationControls();
            return;
        }

        const chance = EveningTriggerConfig.getChance(this.choiceCount);
        const roll = Math.random();

        console.log(`[探索步数计数]: ${this.choiceCount} 次, 傍晚触发概率: ${(chance * 100).toFixed(0)}%, 摇点: ${(roll * 100).toFixed(0)}%`);

        if (roll < chance) {
            // 触发傍晚！
            this.choiceCount = 0; // 重新开始计数面临选择
            this.gameEngine.logAction(`【天色渐暗】时针指向傍晚时刻，全员暂停探索，聚集商榷……`);
            this.gameEngine.enterEveningPhase();
        } else {
            // 继续探索阶段，刷新探索UI
            this.gameEngine.renderExplorationControls();
        }
    }

    /**
     * 基于已探明房间集合的 BFS 广度优先最短路径寻路
     * 确保快速往返路线全程只经过已探索的房间
     * @param {string} fromId 起点房间ID
     * @param {string} toId 目标房间ID
     * @returns {Array<string>|null} 完整节点序列，若无连通路径返回 null
     */
    findVisitedPath(fromId, toId) {
        if (!this.currentMap || !this.currentMap.nodes) return null;
        if (fromId === toId) return [fromId];
        if (!this.visitedNodes.has(fromId) || !this.visitedNodes.has(toId)) return null;

        const queue = [[fromId]];
        const visited = new Set([fromId]);
        const nodes = this.currentMap.nodes;

        while (queue.length > 0) {
            const path = queue.shift();
            const currId = path[path.length - 1];
            const currNode = nodes[currId];
            if (!currNode || !currNode.connections) continue;

            for (const neighborId of Object.values(currNode.connections)) {
                if (!this.visitedNodes.has(neighborId) || visited.has(neighborId)) continue;
                const newPath = [...path, neighborId];
                if (neighborId === toId) {
                    return newPath;
                }
                visited.add(neighborId);
                queue.push(newPath);
            }
        }

        return null;
    }

    /**
     * 执行地图快速往返
     * 核心规则：
     * 1. 绝不累加面临选择次数 choiceCount
     * 2. 绝不触发傍晚时刻判定 checkEveningTrigger
     * 3. 瞬时抵达安全区域并刷新探索控制盘
     * @param {string} targetNodeId 目标房间ID
     * @returns {Array<string>|null} 路径节点序列
     */
    fastTravelTo(targetNodeId) {
        if (!this.currentMap || !this.currentMap.nodes) return null;
        if (!this.visitedNodes.has(targetNodeId)) return null;
        if (this.currentNodeId === targetNodeId) return null;

        const path = this.findVisitedPath(this.currentNodeId, targetNodeId);
        if (!path || path.length < 2) return null;

        const targetNode = this.currentMap.nodes[targetNodeId];
        if (!targetNode) return null;

        // 体力消耗（快速往返消耗，默认 0）
        const costPerStep = (typeof StaminaConfig !== "undefined" && StaminaConfig.fastTravelStepCost !== undefined)
            ? StaminaConfig.fastTravelStepCost
            : 0;
        const totalCost = costPerStep * (path.length - 1);
        if (totalCost > 0) {
            this.gameEngine.stamina = Math.max(0, this.gameEngine.stamina - totalCost);
        }

        // 核心规则：快速往返绝对不累加面临选择次数 choiceCount，绝不触发傍晚时刻判定！
        this.currentNodeId = targetNodeId;

        // 记录行动日志
        this.gameEngine.logAction(
            `【快速往返】经由已探明路线快速返回至 [${targetNode.name}]（不计入面临选择次数，安全折返）`
        );

        // 立即更新顶部状态栏与罗盘方向控制面板
        this.gameEngine.updateHeaderUI();
        this.gameEngine.renderExplorationControls();

        // 检查目标房间是否有未消耗的事件（如之前暂缓救助的NPC或物资）
        const eventKey = `${targetNode.id}_event`;
        if (targetNode.event && !this.consumedEvents.has(eventKey)) {
            if (targetNode.event.type === "npc") {
                const npc = this.gameEngine.getNpcById(targetNode.event.npcId);
                if (npc && npc.status === "unmet") {
                    this.gameEngine.showNpcEncounterModal(npc, targetNode, (joined) => {
                        if (joined) {
                            this.consumedEvents.add(eventKey);
                        }
                    });
                }
            } else if (targetNode.event.type === "food") {
                this.handleFoodEvent(targetNode, eventKey, () => {
                    this.gameEngine.renderExplorationControls();
                });
            }
        }

        return path;
    }
}
