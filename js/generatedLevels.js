/**
 * 自动生成的高维关卡地图拓扑表 (Levels 3 to 25)
 * 基于统一宇宙飞船基地母蓝图系统 (SpaceshipMasterMap) 驱动：
 * - 关卡 3~5：第一梯级 (11~16间)，局部甲板封锁
 * - 关卡 6~10：第二梯级 (22~26间)，双甲板贯通互联
 * - 关卡 11~15：第三梯级 (36~42间)，三甲板大型网状贯通与异化变体
 * - 关卡 16~20：第四梯级 (44~48间)，四甲板大贯通，大半星舰解锁
 * - 关卡 21~25：第五梯级 (52~58间)，全舰大通关终极决战
 */

import { buildSpaceshipLevelMap, LEVEL_SECTOR_SPECS } from "./spaceshipMasterMap.js";

export const GeneratedLevels = [];

for (let lvlId = 9; lvlId <= 25; lvlId++) {
    const spec = LEVEL_SECTOR_SPECS[lvlId] || LEVEL_SECTOR_SPECS[1];
    const lvlMap = buildSpaceshipLevelMap(lvlId);

    const levelObj = {
        levelId: lvlId,
        title: spec.title || `第${lvlId}关：深空扇区 · 矩阵回响`,
        subtitle: spec.subtitle || `母星舰深层分区 · 扇区 ${lvlId}`,
        blackScreenText: [
            `……防爆气密闸在身后轰然闭锁。`,
            `这里是【${spec.title || "扇区 " + lvlId}】。`,
            `飞船基地深处的高熵异动在暗处蔓延，生命信标显示失散同伴正昏迷在附近舱室。`,
            `搜寻通路，救出同伴，识破混入队伍的伪人，最终穿梭抵达脱离终点。`,
            `——触摸屏幕，开始行动。`
        ],
        initialStamina: 100,
        initialTeam: [],
        protagonistRolePool: ["seer", "guard", "witch"],
        defaultProtagonistRole: "seer",
        wolfCountRange: [1, 3],
        candidateNPCs: [
            { id: "kaze", assignedRole: null },
            { id: "shaokexin", assignedRole: null },
            { id: "mode", assignedRole: null }
        ],
        mapImageUrl: null,
        map: lvlMap,
        unlockRules: [
            {
                id: `l${lvlId}_basic_clear`,
                condition: { type: "clear_any" },
                unlockLevelIds: lvlId < 25 ? [lvlId + 1] : [],
                taskName: "任务一：成功撤离 (战术突破)",
                taskObjective: "穿越封锁甲板，抵达终点气密大门完成脱出",
                title: "常规路线探明",
                toast: lvlId < 25 ? `已探明深层通路，开放【第 ${lvlId + 1} 关】！` : `全关卡已全部通关！`
            }
        ]
    };

    GeneratedLevels.push(levelObj);
}
