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
        const isEffectiveExit = isExitNode && !isPowerRestorationPending && !isLevel5ColtBarnesPending;
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

                // 踩上终点且已带离柯尔特与巴恩斯，若伊莲处于昏迷未遇状态，在此引渡汇合并带离
                const elenaNpc = this.gameEngine.getNpcById("elena");
                if (elenaNpc && elenaNpc.status === "unmet") {
                    elenaNpc.status = "active";
                    if (!this.gameEngine.teamMembers.some(m => m.id === "elena")) {
                        this.gameEngine.teamMembers.push(elenaNpc);
                    }
                    this.gameEngine.logAction(`【引渡汇合】在终点重核聚变主反应堆找到了守候在此的 [伊莲]，救醒并带上一同撤离！`);
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

        // D. 特殊关卡机制：第二关与第三关停电始发地合闸通电特殊确认弹窗
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
                this.processRoomEvents(node, isAlreadyExplored);
            });
            return;
        }

        this.processRoomEvents(node, isAlreadyExplored);
    }

    /**
     * 处理房间内的常规事件（食物物资、NPC昏迷救助、傍晚检定）
     */
    processRoomEvents(node, isAlreadyExplored) {
        // 检查该节点的事件是否已被触发过
        const eventKey = `${node.id}_event`;
        if (node.event && !this.consumedEvents.has(eventKey)) {
            if (node.event.type === "food") {
                this.handleFoodEvent(node, eventKey);
                return;
            } else if (node.event.type === "npc") {
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
    handleNpcEvent(node, eventKey) {
        const npcId = node.event.npcId;
        const npc = this.gameEngine.getNpcById(npcId);

        if (!npc) {
            this.checkEveningTrigger();
            return;
        }

        // 第四关专属潜行规避逻辑：不可与任何NPC发生视线接触，若踩到NPC所在区域直接游戏结束“你被他人所凝视，复现失败”
        if (this.gameEngine.currentLevel && this.gameEngine.currentLevel.levelId === 4) {
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
                    this.checkEveningTrigger();
                }
            );
            return;
        }

        if (npc.status !== "unmet") {
            this.checkEveningTrigger();
            return;
        }

        // 弹出对话框并提示玩家选择：让其加入 / 不救助
        // 若选择救助入队，则标记该事件已消耗；若选择不救助/不理睬，则不标记消耗，允许之后再次踏入该区域时重新触发是否救助！
        this.gameEngine.showNpcEncounterModal(npc, node, (joined) => {
            if (joined) {
                this.consumedEvents.add(eventKey);
            }
            this.checkEveningTrigger();
        });
    }

    /**
     * 检定是否触发傍晚时刻
     * 当面临选择次数大于等于3次后概率触发傍晚时刻 (1,2次0%; 3次40%; 4次70%; 5次100%)
     * 触发后重置 choiceCount，进入 q4 询问环节
     */
    checkEveningTrigger() {
        // 第四关专属优化：本关卡为全舰白昼静默巡检，没有黑天时刻，没有死寂降临
        if (this.gameEngine?.currentLevel?.levelId === 4) {
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
