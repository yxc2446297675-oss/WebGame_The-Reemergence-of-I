/**
 * 第一关关卡与手绘地图配置表 (Level 1 Configuration)
 * 严格按照手绘草图拓扑结构配置各个房间、通道、昏迷NPC、食物点与终点
 */

import { GeneratedLevels } from "./generatedLevels.js";

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
        wolfCountRange: [1, 3],
        candidateNPCs: [
            { id: "kaze", assignedRole: null },       // NPC1: 卡泽 (男，蓝框)
            { id: "shaokexin", assignedRole: null },  // NPC2: 邵可欣 (女，粉框)
            { id: "mode", assignedRole: null }        // NPC3: 莫德 (男，紫框，文件夹 mode)
        ],

        // 手绘原稿参考图
        mapImageUrl: "assets/level1_sketch.jpg",

        // 地图拓扑网络 (100% 对应手绘图上的 11 个方块节点)
        map: {
            startNodeId: "room_start",
            nodes: {
                // 1. 起点 (手绘图上的“起点...”)
                "room_start": {
                    id: "room_start",
                    name: "【起点】苏醒密封厅",
                    desc: "你从剧烈的震荡中醒来，周围是变形的金属支架。空气中充满烧焦的味道。",
                    connections: {
                        left: "room_corridor_w1", // 向左去往西走廊 (通向NPC1)
                        right: "room_corner_se",  // 向右去往右下拐角 (通向NPC2)
                        forward: "room_hub_n1"    // 向上去往北枢纽
                    },
                    event: null,
                    // 平面图渲染坐标 (列 col: 0~4, 行 row: 0~4)
                    coord: { x: 3, y: 3 }
                },

                // 2. 右侧下拐角
                "room_corner_se": {
                    id: "room_corner_se",
                    name: "【东下拐角】管线通道",
                    desc: "粗大的冷却管线在头顶发出嗡鸣，地面有些积水，通往东侧舱室。",
                    connections: {
                        left: "room_start",
                        forward: "room_npc2"
                    },
                    event: null,
                    coord: { x: 4, y: 3 }
                },

                // 3. NPC 2 房间 (手绘图上的“NPC2.” - 发现邵可欣)
                "room_npc2": {
                    id: "room_npc2",
                    name: "【东侧备勤室】医护角落",
                    desc: "这里似乎曾是一处临时急救点，一名系着救援缎带的少女正昏迷在桌旁。",
                    connections: {
                        backward: "room_corner_se",
                        left: "room_hub_n1"
                    },
                    event: {
                        type: "npc",
                        npcId: "shaokexin"
                    },
                    coord: { x: 4, y: 2 }
                },

                // 4. 起点北侧枢纽
                "room_hub_n1": {
                    id: "room_hub_n1",
                    name: "【中区枢纽】分流控制室",
                    desc: "正前方是紧闭的物资库防爆闸门，右侧通道与东侧急救点相通。",
                    connections: {
                        backward: "room_start",
                        right: "room_npc2",
                        forward: "room_storage_ne"
                    },
                    event: null,
                    coord: { x: 3, y: 2 }
                },

                // 5. 东北尽头储藏室 (食物给养)
                "room_storage_ne": {
                    id: "room_storage_ne",
                    name: "【东北储藏室】应急给养站",
                    desc: "货架上存放着完好无损的自热战备口粮与纯净水储罐！",
                    connections: {
                        backward: "room_hub_n1"
                    },
                    event: {
                        type: "food",
                        name: "自热高能战备餐"
                    },
                    coord: { x: 3, y: 1 }
                },

                // 6. 西侧走廊 (从起点向左走)
                "room_corridor_w1": {
                    id: "room_corridor_w1",
                    name: "【西侧走廊】狭长甬道",
                    desc: "灯光昏暗闪烁，墙壁上有明显的划痕与爆炸熏黑痕迹，继续向西可通向西区整备室。",
                    connections: {
                        right: "room_start",
                        left: "room_npc1"
                    },
                    event: null,
                    coord: { x: 2, y: 3 }
                },

                // 7. NPC 1 房间 (手绘图上的“NPC1.” - 发现卡泽)
                "room_npc1": {
                    id: "room_npc1",
                    name: "【西区整备间】动力操作台",
                    desc: "一名穿着战术外衣的青年男子瘫靠在控制柜边，冷峻的脸庞上沾染着灰尘。",
                    connections: {
                        right: "room_corridor_w1",
                        left: "room_west_end",
                        forward: "room_junction_nw"
                    },
                    event: {
                        type: "npc",
                        npcId: "kaze"
                    },
                    coord: { x: 1, y: 3 }
                },

                // 8. 西侧尽头机房 (食物给养)
                "room_west_end": {
                    id: "room_west_end",
                    name: "【西端休歇舱】配电副室",
                    desc: "角落里的储物柜中藏着未受损的能量棒与电解质水饮料！",
                    connections: {
                        right: "room_npc1"
                    },
                    event: {
                        type: "food",
                        name: "浓缩能量棒物资箱"
                    },
                    coord: { x: 0, y: 3 }
                },

                // 9. 西北岔路枢纽 (从NPC1向上走)
                "room_junction_nw": {
                    id: "room_junction_nw",
                    name: "【西北岔路】通风十字口",
                    desc: "通道在此向左通往隔离室，向右折向上层出口通道，冷风从北面灌入。",
                    connections: {
                        backward: "room_npc1",
                        left: "room_npc3",
                        right: "room_path_e"
                    },
                    event: null,
                    coord: { x: 1, y: 2 }
                },

                // 10. NPC 3 房间 (手绘图上的“NPC3” - 发现莫尔德)
                "room_npc3": {
                    id: "room_npc3",
                    name: "【西北隔离舱】安全避难室",
                    desc: "厚重的隔音门虚掩着，里面倒着一名身材高大、身着防爆背心的男人。",
                    connections: {
                        right: "room_junction_nw"
                    },
                    event: {
                        type: "npc",
                        npcId: "mode"
                    },
                    coord: { x: 0, y: 2 }
                },

                // 11. 北向联络回廊 (从西北岔路向右走)
                "room_path_e": {
                    id: "room_path_e",
                    name: "【北向连接道】中继过渡间",
                    desc: "脚下的合金格栅发出空洞的回响，前方通向东北侧拐弯口。",
                    connections: {
                        left: "room_junction_nw",
                        forward: "room_corner_ne"
                    },
                    event: null,
                    coord: { x: 2, y: 2 }
                },

                // 12. 东北折返点 (手绘图右上方拐角)
                "room_corner_ne": {
                    id: "room_corner_ne",
                    name: "【东北拐角哨所】跃迁前厅",
                    desc: "这里的应急指示灯亮起显眼的绿色，左侧就是通向地表的终点气密门！",
                    connections: {
                        backward: "room_path_e",
                        left: "room_exit"
                    },
                    event: null,
                    coord: { x: 2, y: 1 }
                },

                // 13. 终点 (手绘图上标有箭头的“终点”)
                "room_exit": {
                    id: "room_exit",
                    name: "【脱离大门】主跃迁逃生舱 (终点)",
                    desc: "主控台绿灯恒定，折跃引擎待命中！只要启动操作杆即可彻底脱离废墟！",
                    connections: {
                        right: "room_corner_ne"
                    },
                    event: {
                        type: "exit",
                        name: "主折跃逃生大门"
                    },
                    isExit: true,
                    coord: { x: 1, y: 1 }
                }
            }
        },

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
            { id: "kaze", assignedRole: null },       // NPC1: 卡泽 (男，蓝框)
            { id: "shaokexin", assignedRole: null },  // NPC2: 邵可欣 (女，粉框)
            { id: "mode", assignedRole: null }        // NPC3: 莫德 (男，紫框)
        ],

        mapImageUrl: null, // 第二关完全基于高精实时战术蓝图呈现

        // 地图拓扑网络 (16个节点，5列x4行，比第一关13个节点稍大一点点，完全随机生成后固化)
        map: {
            startNodeId: "room2_start",
            nodes: {
                // Row 4: 南侧下层
                "room2_start": {
                    id: "room2_start",
                    name: "【深潜起点】次级减压闸",
                    desc: "你站在湿冷的减压舱正中，身后的气阀已经被彻底锁死，前方是向深处延伸的导引光缆。",
                    connections: {
                        right: "room2_corridor_s1",
                        forward: "room2_hub_s"
                    },
                    event: null,
                    coord: { x: 1, y: 4 }
                },
                "room2_corridor_s1": {
                    id: "room2_corridor_s1",
                    name: "【南侧走廊】重力偏转廊",
                    desc: "脚下的重力场轻微起伏，右侧隔离舱门半开着，似乎传来了人类微弱的气息。",
                    connections: {
                        left: "room2_start",
                        right: "room2_npc_a"
                    },
                    event: null,
                    coord: { x: 2, y: 4 }
                },
                "room2_npc_a": {
                    id: "room2_npc_a",
                    name: "【生化隔离区】样本保全舱",
                    desc: "防爆玻璃碎裂一地，穿着防爆战术背心的高大男人正昏迷在坍塌的立柱边。",
                    connections: {
                        left: "room2_corridor_s1",
                        forward: "room2_lab_east"
                    },
                    event: {
                        type: "npc",
                        npcId: "mode" // 莫德
                    },
                    coord: { x: 3, y: 4 }
                },

                // Row 3: 中下回廊
                "room2_food_w": {
                    id: "room2_food_w",
                    name: "【西翼补给点】水培增殖站",
                    desc: "无土栽培槽中依然生长着合成作物，储物箱里整齐码放着应急战备口粮！",
                    connections: {
                        right: "room2_hub_s"
                    },
                    event: {
                        type: "food",
                        name: "高维脱水战备口粮"
                    },
                    coord: { x: 0, y: 3 }
                },
                "room2_hub_s": {
                    id: "room2_hub_s",
                    name: "【下层分流口】主环路十字口",
                    desc: "这里是四通八达的换乘枢纽，地面的冷凝管道向各个方向延伸分支。",
                    connections: {
                        backward: "room2_start",
                        left: "room2_food_w",
                        right: "room2_central_hall",
                        forward: "room2_shaft_w"
                    },
                    event: null,
                    coord: { x: 1, y: 3 }
                },
                "room2_central_hall": {
                    id: "room2_central_hall",
                    name: "【中央主殿】坍缩观测环厅",
                    desc: "穹顶上巨大的环形投影正在播放静止的星图，左通分流口，右连东部管廊，北向前通高维天桥。",
                    connections: {
                        left: "room2_hub_s",
                        right: "room2_lab_east",
                        forward: "room2_core_bridge"
                    },
                    event: null,
                    coord: { x: 2, y: 3 }
                },
                "room2_lab_east": {
                    id: "room2_lab_east",
                    name: "【东部连廊】等离子管道",
                    desc: "紫色的辉光在粗壮的绝缘管道中奔流，空气中充满电离后的刺鼻气味。",
                    connections: {
                        backward: "room2_npc_a",
                        left: "room2_central_hall",
                        right: "room2_npc_b",
                        forward: "room2_east_junction"
                    },
                    event: null,
                    coord: { x: 3, y: 3 }
                },
                "room2_npc_b": {
                    id: "room2_npc_b",
                    name: "【深空天线室】折射观测哨",
                    desc: "巨大的反射天线基座下，一名系着救援丝带的少女正抱着通讯终端陷入重度昏迷。",
                    connections: {
                        left: "room2_lab_east",
                        forward: "room2_east_turret"
                    },
                    event: {
                        type: "npc",
                        npcId: "shaokexin" // 邵可欣
                    },
                    coord: { x: 4, y: 3 }
                },

                // Row 2: 中上回廊
                "room2_food_nw": {
                    id: "room2_food_nw",
                    name: "【西北储物舱】冷凝胶囊库",
                    desc: "角落里的低温储物柜尚未断电，里面存放着高纯度电解质能量合剂！",
                    connections: {
                        right: "room2_shaft_w"
                    },
                    event: {
                        type: "food",
                        name: "高能抗逆电解质合剂"
                    },
                    coord: { x: 0, y: 2 }
                },
                "room2_shaft_w": {
                    id: "room2_shaft_w",
                    name: "【西区竖井】磁吸升降通道",
                    desc: "竖直向上的升降导轨一眼望不到顶，冷风从上方算力机房阵列呼啸倒灌。",
                    connections: {
                        backward: "room2_hub_s",
                        left: "room2_food_nw",
                        right: "room2_core_bridge",
                        forward: "room2_npc_c"
                    },
                    event: null,
                    coord: { x: 1, y: 2 }
                },
                "room2_core_bridge": {
                    id: "room2_core_bridge",
                    name: "【核心连桥】高维共振天桥",
                    desc: "悬空在深渊之上的钢构天桥，下方翻滚着幽蓝色的能量迷雾，正前方通向前哨厅。",
                    connections: {
                        backward: "room2_central_hall",
                        left: "room2_shaft_w",
                        right: "room2_east_junction",
                        forward: "room2_pre_exit"
                    },
                    event: null,
                    coord: { x: 2, y: 2 }
                },
                "room2_east_junction": {
                    id: "room2_east_junction",
                    name: "【东侧分歧口】中微子屏蔽室",
                    desc: "铅灰色的吸波墙壁阻隔了几乎所有电磁信号，东边通往外壁悬廊。",
                    connections: {
                        backward: "room2_lab_east",
                        left: "room2_core_bridge",
                        right: "room2_east_turret"
                    },
                    event: null,
                    coord: { x: 3, y: 2 }
                },
                "room2_east_turret": {
                    id: "room2_east_turret",
                    name: "【外壁巡视台】虚空了望悬廊",
                    desc: "防辐射舷窗外是一片扭曲成圆环的奇异星光，静止得仿佛一幅画卷。",
                    connections: {
                        backward: "room2_npc_b",
                        left: "room2_east_junction"
                    },
                    event: null,
                    coord: { x: 4, y: 2 }
                },

                // Row 1: 北侧顶层终点区
                "room2_npc_c": {
                    id: "room2_npc_c",
                    name: "【量子矩阵室】算力机房副厅",
                    desc: "庞大的服务器阵列发出低沉的运算嗡鸣，冷峻的青年军官正倒在主控键盘前，失去了意识。",
                    connections: {
                        backward: "room2_shaft_w",
                        right: "room2_pre_exit"
                    },
                    event: {
                        type: "npc",
                        npcId: "kaze" // 卡泽
                    },
                    coord: { x: 1, y: 1 }
                },
                "room2_pre_exit": {
                    id: "room2_pre_exit",
                    name: "【前置缓冲厅】临界光压前哨",
                    desc: "绿色的应急指示灯疯狂频闪，右侧就是那扇散发着扭曲力场的终点奇点大门！",
                    connections: {
                        backward: "room2_core_bridge",
                        left: "room2_npc_c",
                        right: "room2_exit"
                    },
                    event: null,
                    coord: { x: 2, y: 1 }
                },
                "room2_exit": {
                    id: "room2_exit",
                    name: "【奇点之门】超弦共振核心 (终点)",
                    desc: "门框周围的空间发生着肉眼可见的光学折叠。无论门后是什么，踏入即是最终的坍缩。",
                    connections: {
                        left: "room2_pre_exit"
                    },
                    event: {
                        type: "exit",
                        name: "奇点折叠共振大门"
                    },
                    isExit: true,
                    coord: { x: 3, y: 1 }
                }
            }
        },

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
        subtitle: "卡泽主导视角 · 单兵诱敌潜入回廊",
        blackScreenText: [
            "……在第07巡逻区撕裂的烟尘中，卡泽握紧了手中的脉冲震荡匕首。",
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
                    desc: "卡泽端起微型战术冲锋枪在前方引路，四周回荡着机械齿轮的啮合低鸣。",
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
                    desc: "角落的锁柜被卡泽用军用匕首撬开，里面留存着高纯度军用肾上腺凝胶与干粮！",
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
                taskObjective: "与卡泽并肩作战，突破感染重灾区并破坏广播信标",
                title: "孤狼战术达成",
                toast: "成功完成卡泽专属突破分支！获得了卡泽的深层因果共鸣印记！"
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

