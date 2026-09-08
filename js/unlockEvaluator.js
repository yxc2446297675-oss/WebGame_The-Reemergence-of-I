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

                // 7. 自定义回调判定
                case "custom": {
                    if (typeof condition.matcher === "function") {
                        isSatisfied = !!condition.matcher(context);
                    }
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
}
