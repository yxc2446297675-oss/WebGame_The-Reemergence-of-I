/**
 * 定锚科技树 (Talent / Tech Tree)
 * 通关获得「定锚点」——回溯循环中残留的稳定性残片，用于强化观测者自身。
 */

export const TalentCurrency = {
    id: "anchor_points",
    name: "定锚点",
    shortName: "定锚",
    flavor: "每一次成功观测并完成扇区，都会在循环裂隙中凝结一枚定锚点——用以加固你的回溯稳定性。"
};

/**
 * 三支王国保卫战式科技树：底部 1 点 → 顶部 3 点，需先点亮下层
 */
export const TalentTreeConfig = {
    branches: [
        {
            id: "rescue",
            name: "救助类",
            icon: "🩺",
            accent: "#38bdf8",
            blurb: "强化补给与绝境自救",
            nodes: [
                {
                    id: "rescue_1",
                    tier: 1,
                    cost: 1,
                    requires: [],
                    name: "高效补给",
                    desc: "从补给站获得的体力值额外增加 10 点。"
                },
                {
                    id: "rescue_2",
                    tier: 2,
                    cost: 3,
                    requires: ["rescue_1"],
                    name: "定锚残响",
                    desc: "被伪人夜间袭击时，可免疫一次死亡；你会明确感知到这次抹杀已被定锚残响挡下。"
                }
            ]
        },
        {
            id: "protect",
            name: "保身类",
            icon: "🛡️",
            accent: "#fbbf24",
            blurb: "强化禁锢裁决与舱内安保",
            nodes: [
                {
                    id: "protect_1",
                    tier: 1,
                    cost: 1,
                    requires: [],
                    name: "隔离护盾",
                    desc: "被你禁锢的目标遭遇伪人袭击时不会死亡。"
                },
                {
                    id: "protect_2",
                    tier: 2,
                    cost: 3,
                    requires: ["protect_1"],
                    name: "双舱封锁",
                    desc: "你可以最多同时禁锢两名同伴。"
                }
            ]
        },
        {
            id: "explore",
            name: "探索类",
            icon: "🧭",
            accent: "#a78bfa",
            blurb: "压缩行军消耗、推迟傍晚降临",
            nodes: [
                {
                    id: "explore_1",
                    tier: 1,
                    cost: 1,
                    requires: [],
                    name: "轻装行军",
                    desc: "探索未知区域时，行动消耗的体力从 8 点变为 6 点。"
                },
                {
                    id: "explore_2",
                    tier: 2,
                    cost: 3,
                    requires: ["explore_1"],
                    name: "延宕黄昏",
                    desc: "傍晚来临改为：4 次→30%，5 次→40%，6 次→60%，7 次及以上→100%。"
                }
            ]
        }
    ]
};

const DEFAULT_TALENT_STATE = () => ({
    points: 0,
    unlocked: [],
    awardedLevels: []
});

export const TalentSystem = {
    saveSystem: null,
    _runDeathWardUsed: false,

    bindSaveSystem(saveSystem) {
        this.saveSystem = saveSystem || null;
        // 兼容旧档：已完成关卡若尚未发过定锚点，一次性补发
        if (this.saveSystem && typeof this.saveSystem.getCompletedLevels === "function") {
            const completed = this.saveSystem.getCompletedLevels() || [];
            completed.forEach(id => this.awardForLevelClear(id));
        }
    },

    resetRunFlags() {
        this._runDeathWardUsed = false;
    },

    _readState() {
        if (this.saveSystem && typeof this.saveSystem.getTalentState === "function") {
            return this.saveSystem.getTalentState();
        }
        return DEFAULT_TALENT_STATE();
    },

    _writeState(state) {
        if (this.saveSystem && typeof this.saveSystem.setTalentState === "function") {
            this.saveSystem.setTalentState(state);
        }
    },

    getPoints() {
        return Number(this._readState().points) || 0;
    },

    getUnlockedIds() {
        const list = this._readState().unlocked;
        return Array.isArray(list) ? list.slice() : [];
    },

    has(talentId) {
        return this.getUnlockedIds().includes(talentId);
    },

    getNode(talentId) {
        for (const branch of TalentTreeConfig.branches) {
            const node = branch.nodes.find(n => n.id === talentId);
            if (node) return { branch, node };
        }
        return null;
    },

    canUnlock(talentId) {
        if (this.has(talentId)) return { ok: false, reason: "已点亮" };
        const found = this.getNode(talentId);
        if (!found) return { ok: false, reason: "未知天赋" };
        const { node } = found;
        for (const req of node.requires || []) {
            if (!this.has(req)) {
                return { ok: false, reason: "需先点亮前置天赋" };
            }
        }
        if (this.getPoints() < node.cost) {
            return { ok: false, reason: `${TalentCurrency.name}不足` };
        }
        return { ok: true, reason: "" };
    },

    unlock(talentId) {
        const check = this.canUnlock(talentId);
        if (!check.ok) return { success: false, message: check.reason };
        const found = this.getNode(talentId);
        const state = this._readState();
        state.points = Math.max(0, (Number(state.points) || 0) - found.node.cost);
        if (!Array.isArray(state.unlocked)) state.unlocked = [];
        if (!state.unlocked.includes(talentId)) state.unlocked.push(talentId);
        this._writeState(state);
        return {
            success: true,
            message: `已点亮【${found.node.name}】，消耗 ${found.node.cost} ${TalentCurrency.name}`
        };
    },

    /**
     * 首次通关某关奖励 1 定锚点
     */
    awardForLevelClear(levelId) {
        const numId = Number(levelId);
        if (!numId || numId <= 0) {
            return { awarded: false, pointsGained: 0, total: this.getPoints() };
        }
        const state = this._readState();
        if (!Array.isArray(state.awardedLevels)) state.awardedLevels = [];
        if (state.awardedLevels.includes(numId)) {
            return { awarded: false, pointsGained: 0, total: Number(state.points) || 0 };
        }
        state.awardedLevels.push(numId);
        state.points = (Number(state.points) || 0) + 1;
        this._writeState(state);
        return { awarded: true, pointsGained: 1, total: state.points };
    },

    getStepCost() {
        return this.has("explore_1") ? 6 : 8;
    },

    getFoodBonus() {
        return this.has("rescue_1") ? 10 : 0;
    },

    getMaxConfineSlots() {
        return this.has("protect_2") ? 2 : 1;
    },

    hasConfineGuard() {
        return this.has("protect_1");
    },

    hasDeathWard() {
        return this.has("rescue_2");
    },

    canUseDeathWard() {
        return this.hasDeathWard() && !this._runDeathWardUsed;
    },

    consumeDeathWard() {
        if (!this.canUseDeathWard()) return false;
        this._runDeathWardUsed = true;
        return true;
    },

    getEveningChance(choiceCount) {
        const n = Number(choiceCount) || 0;
        if (this.has("explore_2")) {
            if (n <= 3) return 0.0;
            if (n === 4) return 0.30;
            if (n === 5) return 0.40;
            if (n === 6) return 0.60;
            return 1.00;
        }
        if (typeof EveningTriggerConfig !== "undefined" && EveningTriggerConfig.getChance) {
            return EveningTriggerConfig.getChance(n);
        }
        if (n <= 2) return 0.0;
        if (n === 3) return 0.40;
        if (n === 4) return 0.70;
        return 1.00;
    },

    getAllNodesFlat() {
        const list = [];
        TalentTreeConfig.branches.forEach(branch => {
            branch.nodes.forEach(node => list.push({ branch, node }));
        });
        return list;
    }
};

if (typeof window !== "undefined") {
    window.TalentSystem = TalentSystem;
    window.TalentTreeConfig = TalentTreeConfig;
    window.TalentCurrency = TalentCurrency;
}
