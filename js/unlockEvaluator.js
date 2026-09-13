/**
 * 关卡非线性解锁规则检定器 (UnlockEvaluator)
 * 纯函数/无状态工具类，负责根据玩家通关结算上下文与关卡规则列表计算本次解锁的关卡
 */

export class UnlockEvaluator {
    /**
     * 检定关卡解锁规则
     * @param {Array} rules 关卡配置的 unlockRules 列表
     * @param {Object} context 通关上下文
     *   @param {Array<string>} context.evacuatedNpcIds 存活随主角撤离的 NPC ID 列表
     *   @param {Array<Object>} context.evacuatedNpcs 存活随主角撤离的 NPC 对象数组
     *   @param {Array<Object>} context.allLevelMimics 本关暗中生成的全部伪人 NPC 数组
     *   @param {Array<Object>} context.allLevelNpcs 本关全部 NPC 数组
     *   @param {boolean} context.isSolo 是否仅主角一人撤离 (无任何NPC存活在队)
     * @returns {Object} { triggeredRules: Array, unlockedLevelIds: Array<number> }
     */
    static evaluate(rules = [], context = {}) {
        if (!Array.isArray(rules) || rules.length === 0) {
            return {
                triggeredRules: [],
                unlockedLevelIds: []
            };
        }

        const evacuatedNpcIds = context.evacuatedNpcIds || [];
        const evacuatedNpcs = context.evacuatedNpcs || [];
        const allLevelMimics = context.allLevelMimics || [];
        const allLevelNpcs = context.allLevelNpcs || [];
        const isSolo = context.isSolo ?? (evacuatedNpcIds.length === 0);

        const triggeredRules = [];
        const unlockedIdsSet = new Set();

        for (const rule of rules) {
            const condition = rule.condition || { type: "clear_any" };
            let isSatisfied = false;

            switch (condition.type) {
                // 1. 无论带谁或自己一人，只要通关即满足
                case "clear_any":
                    isSatisfied = true;
                    break;

                // 2. 仅主角一人独身撤离 (孤狼)
                case "solo_only":
                    isSatisfied = isSolo;
                    break;

                // 3. 必须包含指定的 NPC (默认包含即可)
                case "require_npcs": {
                    const reqIds = condition.npcIds || [];
                    if (reqIds.length > 0) {
                        isSatisfied = reqIds.every(id => evacuatedNpcIds.includes(id));
                    }
                    break;
                }

                // 4. 必须带离场上所有伪人 (全伪人引渡)
                case "require_all_mimics": {
                    if (allLevelMimics.length > 0) {
                        isSatisfied = allLevelMimics.every(mimic => evacuatedNpcIds.includes(mimic.id));
                    } else {
                        // 若本关本身无伪人，则不满足此特异条件
                        isSatisfied = false;
                    }
                    break;
                }

                // 5. 纯人类队伍 (撤离队伍中没有任何伪人)
                case "require_no_mimics": {
                    isSatisfied = evacuatedNpcs.every(npc => npc.role !== "wolf");
                    break;
                }

                // 6. 存活撤离的 NPC 数量检定 (例如至少带出 4 名同伴)
                case "require_npc_count": {
                    const minCount = condition.count || condition.minCount || 1;
                    isSatisfied = evacuatedNpcIds.length >= minCount;
                    break;
                }

                // 6c. 本关全部 NPC 必须存活随行撤离
                case "require_all_level_npcs": {
                    if (allLevelNpcs.length > 0) {
                        isSatisfied = allLevelNpcs.every(npc => evacuatedNpcIds.includes(npc.id));
                    } else {
                        isSatisfied = false;
                    }
                    break;
                }

                // 6b. 撤离同伴数量达标且队伍中无伪人
                case "require_npc_count_no_mimics": {
                    const minCount = condition.count || condition.minCount || 1;
                    const enough = evacuatedNpcIds.length >= minCount;
                    const clean = evacuatedNpcs.every(npc => npc.role !== "wolf");
                    isSatisfied = enough && clean;
                    break;
                }

                // 7. 自定义回调判定
                case "custom": {
                    if (typeof condition.matcher === "function") {
                        isSatisfied = !!condition.matcher(context);
                    }
                    break;
                }

                // 8. 第十关：使卡罗被夜杀后独自撤离
                case "level10_solo_kaze_dead": {
                    isSatisfied = !!context.level10KazeNightKilled && isSolo;
                    break;
                }

                // 9. 第十关：在最高指挥殿堂查阅并记录密钥
                case "level10_key_viewed": {
                    isSatisfied = !!context.level10KeyEntered;
                    break;
                }

                // 10. 第十一关：先完成维生环境总控机房核检，再独自撤离
                case "level11_solo_after_life_support": {
                    isSatisfied = !!context.level11LifeSupportVisited && isSolo;
                    break;
                }

                // 11. 第十三关：主电站已合闸
                case "level13_power_restored": {
                    isSatisfied = !!context.level13PowerRestored;
                    break;
                }

                // 12. 第十四关：主电站已合闸
                case "level14_power_restored": {
                    isSatisfied = !!context.level14PowerRestored;
                    break;
                }

                // 第十六关：主电站已合闸
                case "level16_power_restored": {
                    isSatisfied = !!context.level16PowerRestored;
                    break;
                }

                // 第十七关：主电站已合闸
                case "level17_power_restored": {
                    isSatisfied = !!context.level17PowerRestored;
                    break;
                }

                case "level18_power_restored": {
                    isSatisfied = !!context.level18PowerRestored;
                    break;
                }

                case "level19_life_support_visited": {
                    isSatisfied = !!context.level19LifeSupportVisited;
                    break;
                }

                case "level19_power_restored": {
                    isSatisfied = !!context.level19PowerRestored;
                    break;
                }

                case "level20_life_support_visited": {
                    isSatisfied = !!context.level20LifeSupportVisited;
                    break;
                }

                case "level20_power_restored": {
                    isSatisfied = !!context.level20PowerRestored;
                    break;
                }

                case "level21_life_support_visited": {
                    isSatisfied = !!context.level21LifeSupportVisited;
                    break;
                }

                case "level21_power_restored": {
                    isSatisfied = !!context.level21PowerRestored;
                    break;
                }

                case "level22_avoided_outage_origin": {
                    isSatisfied = context.level22AvoidedOutageOrigin !== false;
                    break;
                }

                case "level23_avoided_life_support": {
                    isSatisfied = context.level23AvoidedLifeSupport !== false;
                    break;
                }

                case "level23_power_restored": {
                    isSatisfied = !!context.level23PowerRestored;
                    break;
                }

                default:
                    console.warn(`[UnlockEvaluator] 未知的解锁条件类型: ${condition.type}`);
                    isSatisfied = false;
            }

            if (isSatisfied) {
                triggeredRules.push(rule);
                const targetIds = rule.unlockLevelIds || [];
                targetIds.forEach(id => {
                    const numId = Number(id);
                    if (!isNaN(numId) && numId > 0) {
                        unlockedIdsSet.add(numId);
                    }
                });
            }
        }

        return {
            triggeredRules,
            unlockedLevelIds: Array.from(unlockedIdsSet).sort((a, b) => a - b)
        };
    }

    /**
     * 第十五关元解锁：除第 15、25 关外，其余关卡（1–14、16–24）均已通关时开放。
     * @param {Array<number>} completedLevels
     * @returns {{ shouldUnlock: boolean, requiredIds: number[], missingIds: number[], rule: Object|null }}
     */
    static evaluateLevel15MetaUnlock(completedLevels = []) {
        const requiredIds = [];
        for (let id = 1; id <= 24; id++) {
            if (id === 15) continue;
            requiredIds.push(id);
        }
        const completedSet = new Set((completedLevels || []).map(Number).filter(n => !isNaN(n)));
        const missingIds = requiredIds.filter(id => !completedSet.has(id));
        const shouldUnlock = missingIds.length === 0;
        return {
            shouldUnlock,
            requiredIds,
            missingIds,
            rule: shouldUnlock ? {
                id: "meta_l15_all_clear_except_15_25",
                unlockLevelIds: [15],
                title: "折叠信标共振",
                toast: "除终焉节点外的全部扇区均已观测完成！深层折叠通路开启——【第十五关】现已开放！"
            } : null
        };
    }
}
