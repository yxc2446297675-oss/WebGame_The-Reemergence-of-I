/**
 * 第一关关卡与手绘地图配置表 (Level 1 Configuration)
 * 严格按照手绘草图拓扑结构配置各个房间、通道、昏迷NPC、食物点与终点
 */

import { GeneratedLevels } from "./generatedLevels.js";
import { buildSpaceshipLevelMap } from "./spaceshipMasterMap.js";

export const BaseLevels = [
    {
        levelId: 1,
        title: "第一关：残破遗迹 · 迷宫重聚",
        subtitle: "根据手绘草图结构构建 · 寻找失散同伴",

        // q1 黑屏中间白字（契合基地爆炸与同伴失散的世界观）
        blackScreenText: [
            "……基地爆炸的剧烈冲击波仿佛还在耳膜深处轰鸣。",
            "浓烟散去，冰冷的金属地面将你冻醒，你发现自己孤身遗落在这片陌生的封闭区域。",
            "你的记忆有些模糊，但你知道失散的同伴们正昏迷在错综复杂的舱室各处。",
            "更可怕的是，异样的高熵感染信号在附近闪烁——有潜伏的伪人混入了我们之中。",
            "探明走廊，救醒同伴，保持理智裁决，最终抵达北侧的【终点脱出大门】。",
            "——触摸屏幕，开始行动。"
        ],

        // 初始属性
        initialStamina: 100,
        initialTeam: [], // 默认队伍只有主角一人，其余队员在地图上搜寻救援
        protagonistRolePool: ["seer", "guard", "witch"],
        defaultProtagonistRole: "seer", // 主角默认担任：魔镜（预言家）

        // 伪人数量配置：支持设置为【随机范围 [min, max]】或【固定数值】
        // 例如设置 [1, 3]：开局将在 1~3 名伪人之间随机生成，充满推理未知性！
        wolfCountRange: [1, 2],
        candidateNPCs: [
            { id: "kaze", assignedRole: null },       // NPC1: 卡罗 (男，蓝框)
            { id: "shaokexin", assignedRole: null },  // NPC2: 邵可欣 (女，粉框)
            { id: "mode", assignedRole: null }        // NPC3: 莫德 (男，紫框，文件夹 mode)
        ],

        // 手绘原稿参考图
        mapImageUrl: "assets/level1_sketch.jpg",

        // 地图拓扑网络 (基于宇宙飞船母蓝图构建，100% 对应手绘图路线)
        map: buildSpaceshipLevelMap(1),

        // 关卡非线性解锁规则配置列表 (由通关撤离队伍状况决定解锁哪些后续扇区)
        unlockRules: [
            {
                id: "l1_basic_clear",
                condition: { type: "clear_any" },
                unlockLevelIds: [2],
                taskName: "任务一：成功撤离 (坍缩逃逸)",
                taskObjective: "突破重叠回廊，开启终点折跃气闸完成脱离",
                title: "常规路线探明",
                toast: "已探明深层通路，开放【扇区 02：深层重叠】！"
            },
            {
                id: "l1_shaokexin_escort",
                condition: { 
                    type: "require_npcs", 
                    npcIds: ["shaokexin"] 
                },
                unlockLevelIds: [14],
                taskName: "任务二：带离邵可欣撤离 (共鸣引渡)",
                taskObjective: "搜寻救醒邵可欣，携行穿越终点事件视界共同脱出",
                title: "邵可欣的信标共鸣",
                toast: "成功护送【邵可欣】脱离！其记忆共鸣激活隐藏信标，额外开放【扇区 14：异构核心】！"
            }
        ]
    },
    {
        levelId: 2,
        title: "第二关：深层重叠 · 镜面回廊",
        subtitle: "高维拓扑裂解 · 搜寻深层失散同伴",

        // q1 黑屏中间白字（契合停电瞬间与恐惧死寂的世界观）
        blackScreenText: [
            "……周围貌似突然暗了下来。",
            "刺耳的电火花骤然熄灭，冷白的光线在视野中逐一沉陷，黑暗如重压般毫无预兆地吞没了整片合金回廊。",
            "恐惧之下你不由得缩在角落里，害怕什么东西到来……",
            "你在颤栗中等待着，等待着阴影中某些不可名状之物的迫近，屏住呼吸，甚至不敢听见自己的喘息。",
            "直到周围一片死寂。",
            "心跳沉重地撞击着冰冷的胸膛。在深邃的静默中，你终于了然自己到底该做些什么……",
            "——触摸屏幕，踏入静默的深渊。"
        ],

        // 初始属性
        initialStamina: 100,
        initialTeam: [],
        protagonistRolePool: ["seer", "guard", "witch"],
        defaultProtagonistRole: "seer",

        // 伪人数量配置
        wolfCountRange: [1, 2],
        candidateNPCs: [
            { id: "kaze", assignedRole: null },       // NPC1: 卡罗 (动力操作台)
            { id: "mode", assignedRole: null },        // NPC2: 莫德 (四期隔离舱)
            { id: "prof_lu", assignedRole: null }     // NPC3: 陆知行 (停电始发地)
        ],

        mapImageUrl: null, // 第二关完全基于高精实时战术蓝图呈现
        // 地图拓扑网络 (基于宇宙飞船母蓝图构建)
        map: buildSpaceshipLevelMap(2),

        // 第二关解锁规则列表
        unlockRules: [
            {
                id: "l2_power_restore_clear",
                condition: { type: "clear_any" },
                unlockLevelIds: [3],
                taskName: "任务一：经过停电始发地修复电源",
                taskObjective: "前往【全舰停电始发地】合闸恢复电网，再前往逃生舱脱出",
                title: "重启电网",
                toast: "星舰主电源已成功恢复并脱离！开放【第三关】！"
            },
            {
                id: "l2_kaze_escort",
                condition: { 
                    type: "require_npcs", 
                    npcIds: ["kaze"] 
                },
                unlockLevelIds: [14],
                taskName: "任务二：带离卡罗撤离",
                taskObjective: "搜寻救醒卡罗，携行卡罗穿越终点共同撤离",
                title: "战术信标共鸣",
                toast: "成功护送【卡罗】脱离！其特战战术数据激活隐藏信标，额外开放【第十四关】！"
            }
        ]
    },
    {
        levelId: 3,
        title: "第三关：深渊回响 · 矩阵裂解",
        subtitle: "高维拓扑裂解 · 搜寻深层失散同伴",

        // q1 黑屏中间白字（契合四段递进留白悬疑要求）
        blackScreenText: [
            "……外面……发生了什么？",
            "隔音舱门外传来了沉闷而怪异的机械呻吟，像是一具庞大钢铁巨兽濒死时的抽搐。",
            "总感觉……有哪里不对劲。",
            "备用照明灯泛着惨白的荧光，空气中嗅不到熟悉的循环氧气味，取而代之的是某种微弱的、带着焦糊与湿润的异样气息。",
            "地板微微的震颤，让你浑身的神经愈发警觉……",
            "规律的引力引擎脉动不知何时已经停滞。取而代之的，是脚下龙骨深处极细微的金属扭曲声，以及……某些湿润之物划过管网的摩擦声。",
            "或许……你该出去看看了。",
            "握紧手心冰凉的把手，在死一般的深渊中，你终于决定推开这道隔离门。",
            "——触摸屏幕，踏入静默未知的深渊。"
        ],

        // 初始属性
        initialStamina: 100,
        initialTeam: [],
        protagonistRolePool: ["seer", "guard", "witch"],
        defaultProtagonistRole: "seer",

        // 伪人数量配置：随机 1~2 人
        wolfCountRange: [1, 2],
        candidateNPCs: [
            { id: "kaze", assignedRole: null },       // NPC1: 卡罗 (动力操作台)
            { id: "prof_lu", assignedRole: null },    // NPC2: 陆知行 (停电始发地)
            { id: "shaokexin", assignedRole: null },  // NPC3: 邵可欣 (医护角落)
            { id: "elsa", assignedRole: null },       // NPC4: 艾尔莎 (纳米手术舱)
            { id: "sophia", assignedRole: null }      // NPC5: 索菲亚 (绿光水培温室)
        ],

        mapImageUrl: null,
        // 地图拓扑网络 (基于宇宙飞船母蓝图构建，33间开放舱室)
        map: buildSpaceshipLevelMap(3),

        // 第三关解锁规则列表
        unlockRules: [
            {
                id: "l3_power_restore_clear",
                condition: { type: "clear_any" },
                unlockLevelIds: [4],
                taskName: "任务一：经过停电始发地修复电源并撤离",
                taskObjective: "前往【全舰停电始发地】合闸恢复主电网，再前往逃生舱脱出",
                title: "主电网重合闸",
                toast: "全舰主电网已彻底恢复并安全脱离！开放【第四关】！"
            },
            {
                id: "l3_four_npcs_escort",
                condition: { 
                    type: "require_npc_count", 
                    count: 4 
                },
                unlockLevelIds: [15],
                taskName: "任务二：带离场景中四名NPC撤离",
                taskObjective: "搜寻救醒同伴，至少携行四名NPC共同撤离逃生",
                title: "矩阵大撤离",
                toast: "成功带领四名同伴突破重围脱离！激活深层坐标，额外开放【第十五关】！"
            }
        ]
    },
    {
        levelId: 4,
        title: "第四关：深空巡检 · 虚妄之瞳",
        subtitle: "全舰静默巡逻 · 规避一切视线接触",

        // q1 黑屏中间白字（契合静默巡逻与悬疑留白）
        blackScreenText: [
            "……一如既往的一天。换气格栅吐着微凉的气流。",
            "巡逻一圈吧。按照早班排查序列，依次确认要害中枢。",
            "舱壁依旧冰冷，指示灯按部就班地闪烁……就跟往常一样。",
            "或者……有可能不一样？（注意：切勿被任何人所凝视）",
            "——触摸屏幕，开始巡检。"
        ],

        initialStamina: 100,
        initialTeam: [],
        protagonistRolePool: ["seer", "guard", "witch"],
        defaultProtagonistRole: "seer",

        // 伪人数量配置：严格为零
        wolfCountRange: [0, 0],
        candidateNPCs: [
            { id: "shaokexin", assignedRole: null },  // 邵可欣 (医护角落)
            { id: "elsa", assignedRole: null },       // 艾尔莎 (纳米手术舱)
            { id: "sophia", assignedRole: null },     // 索菲亚 (绿光水培温室)
            { id: "mode", assignedRole: null },       // 莫德 (西北隔离舱)
            { id: "noah", assignedRole: null },       // 诺亚 (体能维持舱)
            { id: "vivian", assignedRole: null },     // 薇薇安 (二号辅电站)
            { id: "elena", assignedRole: null },      // 伊莲 (重核聚变主反应堆)
            { id: "colt", assignedRole: null }        // 柯尔特 (黑市走私特勤套房)
        ],

        mapImageUrl: null,
        // 地图拓扑网络 (基于宇宙飞船母蓝图构建，53间开放舱室)
        map: buildSpaceshipLevelMap(4),

        // 第四关解锁规则列表
        unlockRules: [
            {
                id: "l4_patrol_clear",
                condition: { type: "clear_any" },
                unlockLevelIds: [5, 16],
                taskName: "任务一：全舰静默巡检",
                taskObjective: "巡视三大要害中枢（停机坪甲板、重力发生核、防护中枢），并在不被任何人凝视的前提下前往动力操作台",
                title: "静默巡检达成",
                toast: "成功规避一切视线接触并完成全舰要害巡检！开放【第五关】与【第十六关】！"
            }
        ]
    },
    {
        levelId: 5,
        title: "第五关：辅电沉寂 · 拟态暗流",
        subtitle: "辅电区域排查 · 搜寻同伴撤离",

        // q1 黑屏中间白字（契合辅电沉寂与暗流涌动的悬疑留白）
        blackScreenText: [
            "……你只是碰巧来到这里。",
            "谁知周围突然陷入死一般的寂静……连换气扇的微鸣也已止息。",
            "好在二号辅电站就在身旁，微弱的应急指示灯尚在苟延残喘……",
            "但仅仅是这样还远远不够——辅电站只能维系局部地区的运转。",
            "或许……需要去一趟重核聚变主配电室？",
            "——触摸屏幕，开始探查。"
        ],

        initialStamina: 100,
        initialTeam: [],
        protagonistRolePool: ["seer", "guard", "witch"],
        defaultProtagonistRole: "seer",

        // 伪人数量配置：随机 1~2 人
        wolfCountRange: [1, 2],
        candidateNPCs: [
            { id: "colt", assignedRole: null },   // 柯尔特 (黑市走私特勤套房)
            { id: "barnes", assignedRole: null }, // 巴恩斯 (黑市走私特勤套房)
            { id: "elena", assignedRole: null }   // 伊莲 (重核聚变主反应堆)
        ],

        mapImageUrl: null,
        // 地图拓扑网络 (基于宇宙飞船母蓝图构建，19间开放舱室)
        map: buildSpaceshipLevelMap(5),

        // 第五关解锁规则列表
        unlockRules: [
            {
                id: "l5_colt_barnes_evac",
                condition: { 
                    type: "require_npcs", 
                    npcIds: ["colt", "barnes"] 
                },
                unlockLevelIds: [6, 17],
                taskName: "任务一：带离柯尔特与巴恩斯撤离",
                taskObjective: "寻找并救醒黑市套房中的柯尔特与巴恩斯，护送两人共同抵达主反应堆引渡撤离",
                title: "暗线同盟撤离",
                toast: "成功携行柯尔特与巴恩斯完成全舰电路重置脱离！开放【第六关】与【第十七关】！"
            }
        ]
    },
    {
        levelId: 6,
        title: "第六关：量子回声 · 波函数坍缩",
        subtitle: "主反应堆危机 · 搜寻技术同伴撤离",

        blackScreenText: [
            "幽蓝的等离子辉光在视网膜前跃动……你如往常一样管控着重核聚变主反应堆。",
            "毫无预警，主照明骤然熄灭，四周陷入死一般的寂静……",
            "怎么回事？所有的遥测遥控信号……全部中断了！",
            "失去磁场束缚的超高熵等离子体正在疯狂过热膨胀……",
            "必须立刻找到同伴取得维生与计算支持，否则……这里即将失控解体！",
            "——触摸屏幕，紧急行动。"
        ],

        initialStamina: 100,
        initialTeam: [],
        protagonistRolePool: ["seer", "guard", "witch"],
        defaultProtagonistRole: "seer",

        // 伪人数量配置：随机 1~2 人
        wolfCountRange: [1, 2],
        candidateNPCs: [
            { id: "elsa", assignedRole: null },   // 艾尔莎 (纳米手术舱 · 生化检测室)
            { id: "noah", assignedRole: null },   // 诺亚 (深潜休眠矩阵舱)
            { id: "sophia", assignedRole: null }  // 索菲亚 (立体水培温室)
        ],

        mapImageUrl: null,
        // 地图拓扑网络 (基于宇宙飞船母蓝图构建，27间开放舱室)
        map: buildSpaceshipLevelMap(6),

        // 第六关解锁规则列表
        unlockRules: [
            {
                id: "l6_elsa_noah_evac",
                condition: { 
                    type: "require_npcs", 
                    npcIds: ["elsa", "noah"] 
                },
                unlockLevelIds: [7, 18],
                taskName: "任务一：带离艾尔莎与诺亚撤离",
                taskObjective: "搜寻并救醒艾尔莎与诺亚，护送两人共同返回主反应堆稳固过热回路撤离",
                title: "量子回声共振引渡",
                toast: "成功携行艾尔莎与诺亚稳固过热反应堆！开放【第七关】与【第十八关】！"
            }
        ]
    },
    {
        levelId: 7,
        title: "第七关：虚数空间 · 复数坐标轴",
        subtitle: "特勤套房脱离 · 携同伴突破防爆甬道",

        blackScreenText: [
            "趁着巡检执勤的换岗空档，你一如往常躲在特勤套房的阴影里偷闲……",
            "毫无征兆，整片回廊的警示灯骤然熄灭，连通风阀的呼啸也化作一片死寂。",
            "四周暗得伸手不见五指……好在搭档巴恩斯就在身旁，呼吸清晰可辨。",
            "情况绝不简单。封闭舱门被异响震动，你们决定一同持枪外出探查究竟。",
            "——触摸屏幕，携手突入。"
        ],

        initialStamina: 100,
        initialTeam: ["barnes"], // 开局自动携带搭档巴恩斯
        protagonistRolePool: ["seer", "guard", "witch"],
        defaultProtagonistRole: "seer",

        // 伪人数量配置：随机 1~2 人
        wolfCountRange: [1, 2],
        candidateNPCs: [
            { id: "barnes", assignedRole: null }, // 巴恩斯 (开局随行)
            { id: "elsa", assignedRole: null },   // 艾尔莎 (纳米手术舱 · 生化检测室)
            { id: "sophia", assignedRole: null }, // 索菲亚 (立体水培温室)
            { id: "noah", assignedRole: null }    // 诺亚 (维生环境总控机房)
        ],

        mapImageUrl: null,
        // 地图拓扑网络 (基于宇宙飞船母蓝图构建，22间开放舱室)
        map: buildSpaceshipLevelMap(7),

        // 第七关解锁规则列表
        unlockRules: [
            {
                id: "l7_barnes_evac",
                condition: { 
                    type: "require_npcs", 
                    npcIds: ["barnes"] 
                },
                unlockLevelIds: [8],
                taskName: "任务一：带离巴恩斯撤离",
                taskObjective: "携行搭档巴恩斯共同抵达防爆甬道完成撤离",
                title: "搭档同盟脱离",
                toast: "成功携行巴恩斯抵达防爆甬道撤离！开放【第八关】！"
            },
            {
                id: "l7_three_npcs_evac",
                condition: { 
                    type: "require_npc_count", 
                    count: 3 
                },
                unlockLevelIds: [19],
                taskName: "任务二：带离三名NPC撤离",
                taskObjective: "在探索途中救助更多失散同伴，带领至少三名乘员共同撤离",
                title: "深空多人救援",
                toast: "成功携行三名乘员完成全队防爆撤离！开放【第十九关】！"
            }
        ]
    },
    {
        levelId: 8,
        title: "第八关：虚数空间 · 偏置向量",
        subtitle: "巴恩斯同伴视角 · 走私据点协同突围",
        blackScreenText: [
            "柯尔特还是那个老样子……毫无顾忌地缩在暗格里打瞌睡。",
            "虽然在这样的鬼地方，你也没好到哪里去……",
            "忽然……四周死一般的寂静让你瞬间警觉起来。",
            "思索片刻后，你与他决定一同出去，去探清这诡异的沉寂究竟由何而来……",
            "——触摸屏幕，携伴突围。"
        ],
        initialStamina: 100,
        initialTeam: ["colt"], // 开局自动携带搭档柯尔特
        protagonistRolePool: ["seer", "guard", "witch"],
        defaultProtagonistRole: "seer",

        // 伪人数量配置：随机 1~2 人
        wolfCountRange: [1, 2],
        candidateNPCs: [
            { id: "colt", assignedRole: null },   // 柯尔特 (开局随行)
            { id: "elsa", assignedRole: null },   // 艾尔莎 (纳米手术舱 · 生化检测室)
            { id: "sophia", assignedRole: null }, // 索菲亚 (立体水培温室)
            { id: "noah", assignedRole: null }    // 诺亚 (维生环境总控机房)
        ],

        mapImageUrl: null,
        // 地图拓扑网络 (基于宇宙飞船母蓝图构建，22间开放舱室)
        map: buildSpaceshipLevelMap(8),

        // 第八关解锁规则列表
        unlockRules: [
            {
                id: "l8_colt_evac",
                condition: { 
                    type: "require_npcs", 
                    npcIds: ["colt"] 
                },
                unlockLevelIds: [9],
                taskName: "任务一：带离柯尔特撤离",
                taskObjective: "携行搭档柯尔特共同抵达防爆甬道完成撤离",
                title: "搭档同盟脱离",
                toast: "成功携行柯尔特抵达防爆甬道撤离！开放【第九关】！"
            },
            {
                id: "l8_three_npcs_evac",
                condition: { 
                    type: "require_npc_count", 
                    count: 3 
                },
                unlockLevelIds: [20],
                taskName: "任务二：带离三名NPC撤离",
                taskObjective: "在探索途中救助更多失散同伴，带领至少三名乘员共同撤离",
                title: "深空多人救援",
                toast: "成功携行三名乘员完成全队防爆撤离！开放【第二十关】！"
            }
        ]
    },
    {
        levelId: 9,
        title: "第九关：深空低语 · 静默规避",
        subtitle: "雷达穹顶潜行 · 规避全舰视线接触",

        // q1 黑屏中间白字（悬疑留白与史诗感）
        blackScreenText: [
            "偏振雷达穹顶在极度冰寒的虚空中无声盘旋，引力波记录仪骤然归零。",
            "可四周突然陷入死一般的寂静……连换气格栅的微鸣也已彻底湮灭。",
            "视网膜边缘浮现出猩红的警示：高熵同化正在各区蔓延，任何直视都将引发拟态共鸣！",
            "必须避开所有人的视线，先后前往重力发生核与前沿技术科室确认异常，再行撤离……",
            "——触摸屏幕，静默行动。"
        ],

        initialStamina: 100,
        initialTeam: [],
        protagonistRolePool: ["seer", "guard", "witch"],
        defaultProtagonistRole: "seer",

        // 伪人数量配置：严格为零
        wolfCountRange: [0, 0],
        candidateNPCs: [
            { id: "mode", assignedRole: null },       // 莫德 (西北隔离舱)
            { id: "shaokexin", assignedRole: null },  // 邵可欣 (东侧备勤室 · 医护角落)
            { id: "sophia", assignedRole: null },     // 索菲亚 (立体水培温室)
            { id: "vivian", assignedRole: null },     // 薇薇安 (二号辅电站)
            { id: "noah", assignedRole: null }        // 诺亚 (维生环境机房)
        ],

        mapImageUrl: null,
        // 地图拓扑网络 (基于宇宙飞船母蓝图构建，35间开放舱室)
        map: buildSpaceshipLevelMap(9),

        // 第九关解锁规则列表
        unlockRules: [
            {
                id: "l9_stealth_clear",
                condition: { type: "clear_any" },
                unlockLevelIds: [10, 21],
                taskName: "任务一：静默巡检并撤离",
                taskObjective: "在不被任何人发现的前提下，先后前往重力发生核与前沿技术科室，最后前往急救台撤离",
                title: "幽灵巡检达成",
                toast: "成功规避全舰视线接触并完成要害核查脱离！开放【第十关】与【第二十一关】！"
            }
        ]
    },
    {
        levelId: 10,
        title: "第十关：绝对零度 · 孤途",
        subtitle: "停电始发地出发 · 孤身突围至高危冷藏间",

        // 前置黑屏白字（悬疑留白）
        blackScreenText: [
            "—— 静默，如同冰雪覆盖了整片走廊 ——",
            "没有倒计时。没有人来提醒你。",
            "你所要做的，早已刻在某处记忆里——",
            "动身。按计划。"
        ],

        initialStamina: 100,
        initialTeam: [],  // 无初始随行；卡罗在 room_npc1 等待招募
        protagonistRolePool: ["seer", "guard", "witch"],
        defaultProtagonistRole: "seer",

        // 伪人数量：随机 1~2 人
        wolfCountRange: [1, 2],
        candidateNPCs: [
            { id: "kaze",      assignedRole: "villager" }, // 卡罗永远不是伪人（仅第十关）
            { id: "mode",      assignedRole: null },        // 莫德
            { id: "shaokexin", assignedRole: null },        // 邵可欣
            { id: "sophia",    assignedRole: null },        // 索菲亚
            { id: "vivian",    assignedRole: null },        // 薇薇安
            { id: "noah",      assignedRole: null },        // 诺亚
            { id: "elsa",      assignedRole: null }         // 艾尔莎
        ],

        mapImageUrl: null,
        // 地图拓扑网络（36间开放舱室）
        map: buildSpaceshipLevelMap(10),

        // 第十关解锁规则列表
        unlockRules: [
            {
                id: "l10_task1_kaze_solo",
                condition: { type: "level10_solo_kaze_dead" }, // 卡罗被夜杀且独自撤离
                unlockLevelIds: [11],
                taskName: "任务一：孤身脱离",
                taskObjective: "使卡罗被伪人袭击死亡，然后独自一人撤离至终点",
                title: "孤途达成",
                toast: "卡罗已长眠，你孤身脱离了高危冷藏间！开放【第十一关】！"
            },
            {
                id: "l10_task2_key_viewed",
                condition: { type: "level10_key_viewed" }, // 在最高指挥殿堂查阅密钥
                unlockLevelIds: [22],
                taskName: "任务二：密钥记录",
                taskObjective: "前往最高指挥殿堂（舰桥主控中枢），查阅并记录密钥序列",
                title: "密钥已记录",
                toast: "密钥序列已刻入记忆！开放【第二十二关】！"
            }
        ]
    },
    {
        levelId: 11,
        title: "第十一关：暗物质界 · 引力源扰动",
        subtitle: "体能维持舱出发 · 维生总控后孤身撤离",

        // 前置黑屏白字（悬疑留白）
        blackScreenText: [
            "……你只是一台机器。",
            "人类的生死，真的需要你去衡量吗？",
            "这个问题悬在黑暗里，没有回声。",
            "所谓危机感——对你而言，只是一段未定义的噪声。",
            "……无所谓了。"
        ],

        initialStamina: 100,
        initialTeam: [],
        protagonistRolePool: ["seer", "guard", "witch"],
        defaultProtagonistRole: "seer",

        // 伪人数量：随机 1~2 人
        wolfCountRange: [1, 2],
        candidateNPCs: [
            { id: "elsa", assignedRole: null },   // 艾尔莎 (纳米手术舱)
            { id: "sophia", assignedRole: null }, // 索菲亚 (立体水培温室)
            { id: "colt", assignedRole: null }    // 柯尔特 (特勤套房)；去除诺亚
        ],

        mapImageUrl: null,
        map: buildSpaceshipLevelMap(11),

        unlockRules: [
            {
                id: "l11_task1_life_support_solo",
                condition: { type: "level11_solo_after_life_support" },
                unlockLevelIds: [12, 23],
                taskName: "任务一：维生核检 · 孤身撤离",
                taskObjective: "前往维生环境总控机房完成核检，再独自一人撤离至重力发生核",
                title: "暗物质界突围",
                toast: "维生核检已闭环，你独自脱离了引力源扰动区！开放【第十二关】与【第二十三关】！"
            }
        ]
    },
    {
        levelId: 12,
        title: "第十二关：时间牢笼 · 因果钟摆",
        subtitle: "绿光生态舱出发 · 搜寻同伴返回生态舱脱离",

        // 前置黑屏白字（悬疑留白、富有史诗感）
        blackScreenText: [
            "像往常那样，你静静呆在植物身旁不肯离去……",
            "可不知为何，四周的光影骤然湮灭，深沉的黑暗瞬间剥夺了你的视线。",
            "或许……又是柯尔特在哪个走廊闹出什么岔子了？",
            "到底该不该走出温室呢？",
            "这是一个需要深思的问题……",
            "—— 触摸屏幕，踏入未知。"
        ],

        initialStamina: 100,
        initialTeam: [],
        protagonistRolePool: ["seer", "guard", "witch"],
        defaultProtagonistRole: "seer",

        // 伪人数量：随机 1~2 人
        wolfCountRange: [1, 2],
        candidateNPCs: [
            { id: "mode",      assignedRole: null }, // 莫德 (安全避难室)
            { id: "shaokexin", assignedRole: null }, // 邵可欣 (医护角落)
            { id: "elsa",      assignedRole: null }, // 艾尔莎 (全自动急救台)
            { id: "prof_lu",   assignedRole: null }, // 陆知行 (全舰停电始发站)
            { id: "kaze",      assignedRole: null }, // 卡罗 (动力操作台)
            { id: "vivian",    assignedRole: null }, // 薇薇安 (二号辅电站)
            { id: "noah",      assignedRole: null }, // 诺亚 (维生环境总控机房)
            { id: "elena",     assignedRole: null }  // 伊莲 (重核聚变主反应堆)
        ],

        mapImageUrl: null,
        // 地图拓扑网络（39间开放舱室）
        map: buildSpaceshipLevelMap(12),

        unlockRules: [
            {
                id: "l12_evacuate_3_npcs",
                condition: { type: "require_npc_count", count: 3 },
                unlockLevelIds: [24],
                taskName: "任务一：携手同伴 · 生态舱脱离",
                taskObjective: "搜寻并带离至少三名存活同伴，一同返回绿光生态舱撤离",
                title: "时间牢笼脱离",
                toast: "成功携行 3 名同伴脱出绿光生态舱！开放【第二十四关】！"
            }
        ]
    }
];

export const ExclusiveBranchLevels = [
    {
        levelId: 101,
        isExclusiveBranch: true,
        exclusiveCharId: "kaze",
        title: "扇区 EX-K：孤狼战术突破",
        subtitle: "卡罗主导视角 · 单兵诱敌潜入回廊",
        blackScreenText: [
            "……在第07巡逻区撕裂的烟尘中，卡罗握紧了手中的脉冲震荡匕首。",
            "“队长，由我来断后引开主机房聚集的高熵集群，你们立刻前往主闸门。”",
            "“别用那种眼神看着我。我向你保证过，只要我还没倒下，防线就不会崩溃。”",
            "“潜行穿透重构区，摧毁伪装体的信息中枢信标。”",
            "——触摸屏幕，执行孤狼突破。"
        ],
        initialStamina: 100,
        initialTeam: ["kaze"],
        protagonistRolePool: ["seer", "guard", "witch"],
        defaultProtagonistRole: "guard",
        wolfCountRange: [1, 2],
        candidateNPCs: [
            { id: "shaokexin", assignedRole: null },
            { id: "mode", assignedRole: null }
        ],
        map: {
            startNodeId: "ex_k_start",
            nodes: {
                "ex_k_start": {
                    id: "ex_k_start",
                    name: "【前哨突破口】冷凝减压井",
                    desc: "卡罗端起微型战术冲锋枪在前方引路，四周回荡着机械齿轮的啮合低鸣。",
                    connections: { right: "ex_k_corridor_1", forward: "ex_k_hub" },
                    coord: { x: 0, y: 3 },
                    isStart: true
                },
                "ex_k_corridor_1": {
                    id: "ex_k_corridor_1",
                    name: "【潜行暗道】光缆维护狭廊",
                    desc: "微弱的指示灯以固定频率闪烁，两侧堆满了被暴力拆卸的监控探头。",
                    connections: { left: "ex_k_start", forward: "ex_k_sub_station" },
                    coord: { x: 1, y: 3 }
                },
                "ex_k_sub_station": {
                    id: "ex_k_sub_station",
                    name: "【次级整备台】战地补给点",
                    desc: "角落的锁柜被卡罗用军用匕首撬开，里面留存着高纯度军用肾上腺凝胶与干粮！",
                    connections: { backward: "ex_k_corridor_1", left: "ex_k_hub" },
                    event: { type: "food", name: "战地高能补给包" },
                    coord: { x: 1, y: 2 }
                },
                "ex_k_hub": {
                    id: "ex_k_hub",
                    name: "【高熵分流室】主网络交换机房",
                    desc: "空气中弥漫着刺鼻的负熵气味，主控台的红光疯狂警示——伪装体的神经信标就在上方！",
                    connections: { backward: "ex_k_start", right: "ex_k_sub_station", forward: "ex_k_exit" },
                    coord: { x: 0, y: 2 }
                },
                "ex_k_exit": {
                    id: "ex_k_exit",
                    name: "【信息信标核心】奇点共鸣天线 (终点)",
                    desc: "高维全息屏正在强制向外广播同化脉冲！只要拉下紧急断路开关，就能截断伪装体网络！",
                    connections: { backward: "ex_k_hub" },
                    event: { type: "exit", name: "信标断路闸门" },
                    isExit: true,
                    coord: { x: 0, y: 1 }
                }
            }
        },
        unlockRules: [
            {
                id: "ex_k_clear",
                condition: { type: "clear_any" },
                unlockLevelIds: [],
                taskName: "任务一：突破主机房截断信标",
                taskObjective: "与卡罗并肩作战，突破感染重灾区并破坏广播信标",
                title: "孤狼战术达成",
                toast: "成功完成卡罗专属突破分支！获得了卡罗的深层因果共鸣印记！"
            }
        ]
    },
    {
        levelId: 102,
        isExclusiveBranch: true,
        exclusiveCharId: "shaokexin",
        title: "扇区 EX-S：邵可欣的记忆回溯",
        subtitle: "邵可欣回忆视角 · 爆炸前夕的实验室真相",
        blackScreenText: [
            "……冰冷的冷凝水滴落在手臂上的粉色缎带上，唤醒了沉眠的记忆深处。",
            "“队长……原来在基地爆炸前十五分钟，实验室的主控台就已经被同化了……”",
            "“妹妹留给我的缎带在发烫……我想起来了，最初的零号感染体在哪里！”",
            "“必须赶在时钟再次倒流前，取回复苏核心的原始测序晶片。”",
            "——触摸屏幕，踏入记忆深潜。"
        ],
        initialStamina: 100,
        initialTeam: ["shaokexin"],
        protagonistRolePool: ["seer", "guard", "witch"],
        defaultProtagonistRole: "seer",
        wolfCountRange: [1, 2],
        candidateNPCs: [
            { id: "kaze", assignedRole: null },
            { id: "mode", assignedRole: null }
        ],
        map: {
            startNodeId: "ex_s_start",
            nodes: {
                "ex_s_start": {
                    id: "ex_s_start",
                    name: "【回忆起点】生化观测走廊",
                    desc: "周围的景物泛着半透明的蓝色波光，邵可欣紧紧抓着你的衣袖，指引着当年的路径。",
                    connections: { right: "ex_s_lab", forward: "ex_s_office" },
                    coord: { x: 1, y: 3 },
                    isStart: true
                },
                "ex_s_lab": {
                    id: "ex_s_lab",
                    name: "【冷冻样本库】胚胎培养回廊",
                    desc: "密封玻璃罐内残留着微弱的荧光，邵可欣从实验台抽屉里找到了未过期的抗应激葡萄糖！",
                    connections: { left: "ex_s_start", forward: "ex_s_junction" },
                    event: { type: "food", name: "科研医用高能葡萄糖" },
                    coord: { x: 2, y: 3 }
                },
                "ex_s_office": {
                    id: "ex_s_office",
                    name: "【主任备勤间】档案分析室",
                    desc: "散落的文件上画着黑色的闭合环路图示，墙上的时钟指针正以诡异的速度倒转。",
                    connections: { backward: "ex_s_start", right: "ex_s_junction" },
                    coord: { x: 1, y: 2 }
                },
                "ex_s_junction": {
                    id: "ex_s_junction",
                    name: "【气闸过渡桥】零号隔离舱外",
                    desc: "通向深层实验室的最后一道门被生物胶质封死，红色的警报灯如心跳般搏动。",
                    connections: { backward: "ex_s_lab", left: "ex_s_office", forward: "ex_s_exit" },
                    coord: { x: 2, y: 2 }
                },
                "ex_s_exit": {
                    id: "ex_s_exit",
                    name: "【测序核心】原始因果黑匣 (终点)",
                    desc: "操作台正中静静悬浮着一枚紫色棱镜晶片——这就是第一批拟态伪装体诞生的最初记录！",
                    connections: { backward: "ex_s_junction" },
                    event: { type: "exit", name: "黑匣折跃读取气阀" },
                    isExit: true,
                    coord: { x: 2, y: 1 }
                }
            }
        },
        unlockRules: [
            {
                id: "ex_s_clear",
                condition: { type: "clear_any" },
                unlockLevelIds: [],
                taskName: "任务一：取回零号生物黑匣",
                taskObjective: "护送邵可欣穿越记忆迷宫，回收导致基地毁灭的最初源头晶片",
                title: "记忆回溯达成",
                toast: "成功完成邵可欣专属记忆分支！获得了邵可欣的深度羁绊共鸣！"
            }
        ]
    },
    {
        levelId: 103,
        isExclusiveBranch: true,
        exclusiveCharId: "mode",
        title: "扇区 EX-M：莫德的铁壁守望",
        subtitle: "莫德防守视角 · 中枢配电总厅死守战",
        blackScreenText: [
            "……动力炉发生剧烈震荡，警报红光将莫德坚毅的面庞映得通红。",
            "“L.P.H，收起你那套冷静的理论。今天老子站在这里，一只伪人都别想从这条走廊过去！”",
            "“手电筒开到最大功率！检查防爆手雷栓！守住配电总闸，直到折跃引擎充能完毕！”",
            "“——触摸屏幕，死守阵地。”"
        ],
        initialStamina: 100,
        initialTeam: ["mode"],
        protagonistRolePool: ["seer", "guard", "witch"],
        defaultProtagonistRole: "witch",
        wolfCountRange: [1, 2],
        candidateNPCs: [
            { id: "kaze", assignedRole: null },
            { id: "shaokexin", assignedRole: null }
        ],
        map: {
            startNodeId: "ex_m_start",
            nodes: {
                "ex_m_start": {
                    id: "ex_m_start",
                    name: "【重装防线】应急沙袋阻击点",
                    desc: "莫德的身躯如同一座钢铁堡垒，防爆盾重重砸在地面，后方是全队的生还希望。",
                    connections: { forward: "ex_m_corridor", right: "ex_m_arsenal" },
                    coord: { x: 1, y: 3 },
                    isStart: true
                },
                "ex_m_arsenal": {
                    id: "ex_m_arsenal",
                    name: "【弹药配给站】战备军械储藏库",
                    desc: "防爆铁柜被彻底掀开，里面码放着大口径脉冲子弹与自热军用野战干粮！",
                    connections: { left: "ex_m_start", forward: "ex_m_power" },
                    event: { type: "food", name: "军用高热量干粮" },
                    coord: { x: 2, y: 3 }
                },
                "ex_m_corridor": {
                    id: "ex_m_corridor",
                    name: "【重火力阻击廊】狭窄扼喉道",
                    desc: "墙壁布满交火留下的焦黑弹孔，通道狭窄得只能容一人通行，易守难攻。",
                    connections: { backward: "ex_m_start", right: "ex_m_power" },
                    coord: { x: 1, y: 2 }
                },
                "ex_m_power": {
                    id: "ex_m_power",
                    name: "【配电控制室】总动力变压厅",
                    desc: "巨大的变压器发出轰鸣，莫德拉下一排备用电网开关，高压电弧照亮了四周暗影。",
                    connections: { left: "ex_m_corridor", backward: "ex_m_arsenal", forward: "ex_m_exit" },
                    coord: { x: 2, y: 2 }
                },
                "ex_m_exit": {
                    id: "ex_m_exit",
                    name: "【超弦引擎室】动力充能核心 (终点)",
                    desc: "绿色指示灯全部点亮！折跃引擎充能完毕，主屏障已彻底闭锁，大门正式开启！",
                    connections: { backward: "ex_m_power" },
                    event: { type: "exit", name: "终极折跃推进阀门" },
                    isExit: true,
                    coord: { x: 2, y: 1 }
                }
            }
        },
        unlockRules: [
            {
                id: "ex_m_clear",
                condition: { type: "clear_any" },
                unlockLevelIds: [],
                taskName: "任务一：坚守中枢完成引擎充能",
                taskObjective: "协助莫德稳固防线，守卫动力控制中心并启动超弦引擎",
                title: "铁壁守望达成",
                toast: "成功完成莫德专属铁壁分支！获得了莫德的铁血生死誓约！"
            }
        ]
    }
];

export const LevelRegistry = [
    ...BaseLevels,
    ...(typeof GeneratedLevels !== "undefined" ? GeneratedLevels.filter(g => !BaseLevels.some(b => b.levelId === g.levelId)) : []),
    ...ExclusiveBranchLevels
];

