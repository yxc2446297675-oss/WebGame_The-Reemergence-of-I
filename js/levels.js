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

        // q1 黑屏中间白字（契合循环重构与更深层迷宫的世界观）
        blackScreenText: [
            "……气闸闭合的沉闷重响再次灌入耳道，但重力感却全然错位。",
            "眼前的合金走廊更加深邃、更加庞大，无数发光的管线如同垂死的神经网络在穹顶蔓延。",
            "通讯仪中传出断断续续的电流杂音，三个微弱的同伴生命信标再度分散在这片更广袤的结构深处。",
            "不可思议的是，你隐约感觉眼前发生的一切，你似乎早已在某个未曾抵达的未来‘经历’过……",
            "潜伏的伪装体并未远去，他们的呼吸声在更暗的角落隐匿。救出同伴，踏向深处的奇点核心。",
            "——触摸屏幕，踏入第二重回响。"
        ],

        // 初始属性
        initialStamina: 100,
        initialTeam: [],
        protagonistRolePool: ["seer", "guard", "witch"],
        defaultProtagonistRole: "seer",

        // 伪人数量配置
        wolfCountRange: [1, 3],
        candidateNPCs: [
            { id: "kaze", assignedRole: null },       // NPC1: 卡罗 (男，蓝框)
            { id: "shaokexin", assignedRole: null },  // NPC2: 邵可欣 (女，粉框)
            { id: "mode", assignedRole: null }        // NPC3: 莫德 (男，紫框)
        ],

        mapImageUrl: null, // 第二关完全基于高精实时战术蓝图呈现
        // 地图拓扑网络 (基于宇宙飞船母蓝图构建)
        map: buildSpaceshipLevelMap(2),

        // 第二关解锁规则列表
        unlockRules: [
            {
                id: "l2_basic_clear",
                condition: { type: "clear_any" },
                unlockLevelIds: [3],
                taskName: "任务一：成功撤离 (镜面穿透)",
                taskObjective: "突破镜面折射回廊，抵达终点奇点之门并脱出",
                title: "突破镜面",
                toast: "成功突破镜面回廊，开放【扇区 03：湮灭奇点】！"
            },
            {
                id: "l2_all_mimics_escort",
                condition: { type: "require_all_mimics" },
                unlockLevelIds: [5],
                taskName: "任务二：引渡全员伪人撤离 (深渊诱捕)",
                taskObjective: "同化或引领，携行场上全部潜伏拟态伪装体一同脱出",
                title: "深渊引渡者",
                toast: "全员伪人被引渡带出！深层异动引发共鸣，额外开放【扇区 05：拟态深渊】！"
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
    ...(typeof GeneratedLevels !== "undefined" ? GeneratedLevels : []),
    ...ExclusiveBranchLevels
];

