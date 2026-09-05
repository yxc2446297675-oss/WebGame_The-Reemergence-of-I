/**
 * 游戏核心配置表 (Game Configuration)
 * 允许用户极简修改身份名称、世界观用词、体力与概率参数
 */

export const WorldviewConfig = {
    gameTitle: "潜伏危机：循环伪装体",
    protagonistName: "L.P.H",
    
    // 身份牌别名映射（改这里即可全局改动游戏内显示的身份名与世界观描述）
    roleNames: {
        wolf: {
            id: "wolf",
            name: "伪人",              // 传统狼人杀对应：狼人
            alias: "拟态感染体",
            team: "enemy",
            color: "#ff3366",
            desc: "潜伏在人类身边的未知拟态感染体，会伺机在夜晚猎杀同伴。"
        },
        villager: {
            id: "villager",
            name: "同伴",              // 传统狼人杀对应：村民 / 普通人类
            alias: "普通幸存者",
            team: "human",
            color: "#38bdf8",
            desc: "没有特殊能力的普通幸存者，依靠理智与信任求生。"
        },
        seer: {
            id: "seer",
            name: "魔镜",              // 传统狼人杀对应：预言家
            alias: "透视真理者",
            team: "human",
            color: "#facc15",
            desc: "每晚可以查验一名同伴的真身，看透其是否已被伪人替换。"
        },
        guard: {
            id: "guard",
            name: "护卫",              // 传统狼人杀对应：守卫
            alias: "守护天使",
            team: "human",
            color: "#4ade80",
            desc: "每晚可以设立护盾守护一名同伴，使其免于今晚的袭击。"
        },
        witch: {
            id: "witch",
            name: "歌咏者",            // 传统狼人杀对应：女巫
            alias: "生命救赎者",
            team: "human",
            color: "#c084fc",
            desc: "夜间能感知受到伪人袭击的濒死同伴，并决定是否施加救助。"
        }
    }
};

// 体力消耗与食物回复配置
export const StaminaConfig = {
    initialStamina: 100,
    maxStamina: 100,
    stepCost: 8, // 无论如何走都消耗 8 点体力
    fastTravelStepCost: 0, // 快速往返已探明区域消耗0点体力（不计入面临选择步数）
    
    // 食物回复数值：根据当前队伍人数递减
    // 1人50，2人45，3人38，4人35，5人32，6人28，7人25，8人22等
    foodRecoveryTable: {
        1: 50,
        2: 45,
        3: 38,
        4: 35,
        5: 32,
        6: 28,
        7: 25,
        8: 22
    },
    
    // 获取当前队伍人数对应的体力回复值
    getFoodRecovery(teamCount) {
        if (this.foodRecoveryTable[teamCount] !== undefined) {
            return this.foodRecoveryTable[teamCount];
        }
        // 超过8人按阶梯递减，最低不低于10
        return Math.max(10, 22 - (teamCount - 8) * 2);
    }
};

// 傍晚时刻触发概率（面临选择次数）
export const EveningTriggerConfig = {
    // 1,2次概率为0；3次40%，4次70%，5次100%
    chances: {
        1: 0.0,
        2: 0.0,
        3: 0.40,
        4: 0.70,
        5: 1.00
    },
    getChance(choiceCount) {
        if (choiceCount <= 2) return 0.0;
        if (choiceCount === 3) return 0.40;
        if (choiceCount === 4) return 0.70;
        return 1.00; // 5次及以上必触发
    }
};

// 夜间伪人袭击触发概率（根据队伍存活人数）
export const NightAttackConfig = {
    // 伪人每晚必定自主猎杀（无论玩家选择什么，必定刀人 100%）
    getChance(teamCount) {
        return 1.00;
    }
};

// =========================================================================
// 遇害展现与音效配置表 (Death Reveal & Audio Configuration)
// =========================================================================
export const AudioConfig = {
    // 1. 遇害死亡展示时的音效文件路径 (支持 mp3, wav, ogg 等格式)
    deathSoundUrl: "assets/audio/death.mp3",
    deathSoundVolume: 0.85,

    // 2. 物资获取/食物发现时的音效文件路径
    foodSoundUrl: "assets/audio/物资获取.wav",
    foodSoundVolume: 0.80,

    // 3. 广播发出警报/警告时的音效文件路径
    alarmSoundUrl: "assets/audio/警告.wav",
    alarmSoundVolume: 0.85,

    // 4. 移动探索时的脚步/位移音效文件路径
    moveSoundUrl: "assets/audio/移动.wav",
    moveSoundVolume: 0.65,

    // 是否在自定义音效文件未就绪时，使用内置的高质科幻合成音效作为兜底发声
    useFallbackSynthesizer: true
};

export const DeathRevealConfig = {
    // 夜晚行动结束后，纯黑屏悬念时长（毫秒，默认 2000 即 2 秒）
    blackScreenDurationMs: 2000,

    // 死者渐渐浮现动画过渡时长（毫秒，默认 1200 即 1.2 秒）
    fadeInDurationMs: 1200
};
