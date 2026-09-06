/**
 * 宇宙飞船基地母蓝图系统 (Spaceship Master Map Blueprint)
 * 包含整舰 58 间功能舱室的完整几何拓扑、房间外观类型、透视微缩机械设备，
 * 以及支持 5 个梯级（1~5, 6~10, 11~15, 16~20, 21~25）的子区域解锁裁剪机制。
 */

export const MASTER_ROOM_DEFS = {
    // =========================================================================
    // 1. 舰艏指挥中枢 (Bow: Command & Sensor Array, Y=0)
    // =========================================================================
    "room_sensor_array": {
        id: "room_sensor_array",
        name: "【深空雷达穹顶】舰艏天线阵列",
        zone: "bow",
        coord: { x: 1, y: 0 },
        shape: "octagon",
        equipment: "sensor_dome",
        desc: "巨大的偏振抛物面天线正在缓慢旋转，收集来自深空深处的微弱引力波信号。"
    },
    "room_tactical_plan": {
        id: "room_tactical_plan",
        name: "【战术推演室】星域沙盘厅",
        zone: "bow",
        coord: { x: 2, y: 0 },
        shape: "lab",
        equipment: "tactical_sandtable",
        desc: "中央沙盘悬浮着当前星区的立体投影，红蓝光标标示着可能的空间坍缩节点。"
    },
    "room_bridge_sub": {
        id: "room_bridge_sub",
        name: "【副官值班舱】战备前哨台",
        zone: "bow",
        coord: { x: 3, y: 0 },
        shape: "corridor_h",
        equipment: "sub_helm",
        desc: "用于紧急戒备状态下的参谋值班席，防爆格栅防护完好。"
    },
    "room_bridge_main": {
        id: "room_bridge_main",
        name: "【舰桥主控中枢】最高指挥殿堂",
        zone: "bow",
        coord: { x: 4, y: 0 },
        shape: "bridge",
        equipment: "bridge_console",
        desc: "环形落地观测舷窗正对苍茫星海，弧形主控台上的数千控键闪烁着冰蓝微光。"
    },
    "room_ai_core": {
        id: "room_ai_core",
        name: "【超脑计算核心】主逻辑阵列",
        zone: "bow",
        coord: { x: 5, y: 0 },
        shape: "lab",
        equipment: "server_rack",
        desc: "数百组浸泡在液氮中的超导处理器机柜静默嗡鸣，飞船的中枢意识在此奔流。"
    },
    "room_comm_center": {
        id: "room_comm_center",
        name: "【量子通信总站】深空信标井",
        zone: "bow",
        coord: { x: 6, y: 0 },
        shape: "corridor_h",
        equipment: "comm_station",
        desc: "高频纠缠光子发射管直指天顶，应急警报红光断断续续闪烁。"
    },
    "room_observation": {
        id: "room_observation",
        name: "【环景天象台】星穹眺望厅",
        zone: "bow",
        coord: { x: 7, y: 0 },
        shape: "octagon",
        equipment: "star_lens",
        desc: "大角度曲面观察舱，浩瀚的星云与流动的虚数裂缝在此一览无余。"
    },

    // =========================================================================
    // 2. 舰体西翼：生物医疗与科研区 (Port: Research & Bio-Science, Y=1~2)
    // =========================================================================
    "room_specimen_vault": {
        id: "room_specimen_vault",
        name: "【异构标本保全库】高危冷藏间",
        zone: "research",
        coord: { x: 0, y: 1 },
        shape: "storage",
        equipment: "cargo_grid",
        desc: "多重气锁密封的低温样本柜中，散发着微弱荧光的未知晶体被安全束缚。"
    },
    // Level 1 原版节点 13: 终点脱离大门
    "room_exit": {
        id: "room_exit",
        name: "【脱离大门】主跃迁逃生舱 (终点)",
        zone: "hub",
        coord: { x: 1, y: 1 },
        shape: "airlock",
        equipment: "airlock_dock",
        desc: "主控台绿灯恒定，折跃引擎待命中！只要启动操作杆即可彻底脱离废墟！",
        isExit: true
    },
    // Level 1 原版节点 12: 东北折返点
    "room_corner_ne": {
        id: "room_corner_ne",
        name: "【东北拐角哨所】跃迁前厅",
        zone: "hub",
        coord: { x: 2, y: 1 },
        shape: "corridor_v",
        equipment: "security_gate",
        desc: "这里的应急指示灯亮起显眼的绿色，左侧就是通向地表的终点气密门！"
    },
    // Level 1 原版节点 5: 东北尽头储藏室 (食物)
    "room_storage_ne": {
        id: "room_storage_ne",
        name: "【东北储藏室】应急给养站",
        zone: "hub",
        coord: { x: 3, y: 1 },
        shape: "storage",
        equipment: "cargo_grid",
        desc: "货架上存放着完好无损的自热战备口粮与纯净水储罐！"
    },
    "room_bio_corridor": {
        id: "room_bio_corridor",
        name: "【生化联络走廊】气压过渡廊",
        zone: "research",
        coord: { x: 4, y: 1 },
        shape: "corridor_v",
        equipment: "airlock_dock",
        desc: "喷雾消杀喷嘴在感应到移动时发出嘶嘶轻响，地面整洁冰冷。"
    },
    "room_med_surgery": {
        id: "room_med_surgery",
        name: "【纳米手术舱】全自动急救台",
        zone: "medical",
        coord: { x: 5, y: 1 },
        shape: "medical",
        equipment: "medical_bed",
        desc: "悬吊的纳米机械臂保持着待机姿态，无影灯在手术台上投下清冷光晕。"
    },
    "room_cryo_stasis": {
        id: "room_cryo_stasis",
        name: "【深潜冷冻基阵】休眠矩阵",
        zone: "living",
        coord: { x: 6, y: 1 },
        shape: "quarters",
        equipment: "cryo_pods",
        desc: "数十具人体工学冷冻舱整齐排布，冰雾在透明面罩上结成晶莹白霜。"
    },
    "room_decon_airlock": {
        id: "room_decon_airlock",
        name: "【洗消减压气闸】外勤洗消间",
        zone: "living",
        coord: { x: 7, y: 1 },
        shape: "airlock",
        equipment: "airlock_dock",
        desc: "大功率紫外线与等离子洗消环门，用于阻绝外界拟态孢子渗入生活区。"
    },

    // =========================================================================
    // 3. 舰体中腹：手绘原版核心与生活生态区 (Mid Deck: Core Hub & Ecology, Y=2)
    // =========================================================================
    // Level 1 原版节点 10: NPC 3 莫德房间
    "room_npc3": {
        id: "room_npc3",
        name: "【西北隔离舱】安全避难室",
        zone: "hub",
        coord: { x: 0, y: 2 },
        shape: "quarters",
        equipment: "medical_bed",
        desc: "厚重的隔音门虚掩着，里面倒着一名身材高大、身着防爆背心的男人。"
    },
    // Level 1 原版节点 9: 西北岔路
    "room_junction_nw": {
        id: "room_junction_nw",
        name: "【西北岔路】通风十字口",
        zone: "hub",
        coord: { x: 1, y: 2 },
        shape: "corridor_v",
        equipment: "workshop_tools",
        desc: "通道在此向左通往隔离室，向右折向上层出口通道，冷风从北面灌入。"
    },
    // Level 1 原版节点 11: 北向联络回廊
    "room_path_e": {
        id: "room_path_e",
        name: "【北向连接道】中继过渡间",
        zone: "hub",
        coord: { x: 2, y: 2 },
        shape: "corridor_h",
        equipment: "workshop_tools",
        desc: "脚下的合金格栅发出空洞的回响，前方通向东北侧拐弯口。"
    },
    // Level 1 原版节点 4: 中区枢纽
    "room_hub_n1": {
        id: "room_hub_n1",
        name: "【中区枢纽】分流控制室",
        zone: "hub",
        coord: { x: 3, y: 2 },
        shape: "rect",
        equipment: "bridge_console",
        desc: "正前方是紧闭的物资库防爆闸门，右侧通道与东侧急救点相通。"
    },
    // Level 1 原版节点 3: NPC 2 邵可欣房间
    "room_npc2": {
        id: "room_npc2",
        name: "【东侧备勤室】医护角落",
        zone: "hub",
        coord: { x: 4, y: 2 },
        shape: "medical",
        equipment: "medical_bed",
        desc: "这里似乎曾是一处临时急救点，一名系着救援缎带的少女正昏迷在桌旁。"
    },
    "room_living_quarter": {
        id: "room_living_quarter",
        name: "【乘组起居舱】温馨生活角",
        zone: "living",
        coord: { x: 5, y: 2 },
        shape: "quarters",
        equipment: "cryo_pods",
        desc: "床头贴着地球家园的旧照片，暖黄色的床头灯为冰冷金属平添几分温存。"
    },
    "room_hydro_garden": {
        id: "room_hydro_garden",
        name: "【立体水培温室】绿光生态舱",
        zone: "ecology",
        coord: { x: 6, y: 2 },
        shape: "lab",
        equipment: "hydroponics",
        desc: "无土水培种植架上生机盎然，青绿的叶片在粉紫补光灯下静默舒展。"
    },
    "room_mess_hall": {
        id: "room_mess_hall",
        name: "【舰员配给餐厅】自动餐吧",
        zone: "living",
        coord: { x: 7, y: 2 },
        shape: "rect",
        equipment: "cargo_grid",
        desc: "合成食品贩卖机指示灯闪烁，餐桌整齐排列，空气中弥漫着烤面包香气。"
    },
    "room_east_observation": {
        id: "room_east_observation",
        name: "【右舷景观走廊】沉思回廊",
        zone: "living",
        coord: { x: 8, y: 2 },
        shape: "corridor_v",
        equipment: "star_lens",
        desc: "右舷宽幅落地视窗，可俯瞰飞船巨大的散热翼板与壮丽的深空脉冲。"
    },

    // =========================================================================
    // 4. 舰体中层：手绘起点线与中央动力井 (Mid Deck: Start Deck & Gravity Well, Y=3)
    // =========================================================================
    // Level 1 原版节点 8: 西侧尽头 (食物)
    "room_west_end": {
        id: "room_west_end",
        name: "【西端休歇舱】配电副室",
        zone: "hub",
        coord: { x: 0, y: 3 },
        shape: "storage",
        equipment: "cargo_grid",
        desc: "角落里的储物柜中藏着未受损的能量棒与电解质水饮料！"
    },
    // Level 1 原版节点 7: NPC 1 卡泽房间
    "room_npc1": {
        id: "room_npc1",
        name: "【西区整备间】动力操作台",
        zone: "hub",
        coord: { x: 1, y: 3 },
        shape: "workshop",
        equipment: "workshop_tools",
        desc: "一名穿着战术外衣的青年男子瘫靠在控制柜边，冷峻的脸庞上沾染着灰尘。"
    },
    // Level 1 原版节点 6: 西侧走廊
    "room_corridor_w1": {
        id: "room_corridor_w1",
        name: "【西侧走廊】狭长甬道",
        zone: "hub",
        coord: { x: 2, y: 3 },
        shape: "corridor_h",
        equipment: "workshop_tools",
        desc: "灯光昏暗闪烁，墙壁上有明显的划痕与爆炸熏黑痕迹，继续向西可通向西区整备室。"
    },
    // Level 1 原版节点 1: 起点
    "room_start": {
        id: "room_start",
        name: "【起点】苏醒密封厅",
        zone: "hub",
        coord: { x: 3, y: 3 },
        shape: "octagon",
        equipment: "airlock_dock",
        desc: "你从剧烈的震荡中醒来，周围是变形的金属支架。空气中充满烧焦的味道。"
    },
    // Level 1 原版节点 2: 右下拐角
    "room_corner_se": {
        id: "room_corner_se",
        name: "【东下拐角】管线通道",
        zone: "hub",
        coord: { x: 4, y: 3 },
        shape: "corridor_v",
        equipment: "workshop_tools",
        desc: "粗大的冷却管线在头顶发出嗡鸣，地面有些积水，通往东侧舱室。"
    },
    "room_gravity_well": {
        id: "room_gravity_well",
        name: "【人工重力总井】重力发生核",
        zone: "engineering",
        coord: { x: 5, y: 3 },
        shape: "octagon",
        equipment: "shield_coil",
        desc: "深邃的垂直竖井中央悬浮着高频旋转的奇异质点，维持着全舰 1.0G 的重力场。"
    },
    "room_armory": {
        id: "room_armory",
        name: "【舰载武装军械库】防爆军火库",
        zone: "security",
        coord: { x: 6, y: 3 },
        shape: "storage",
        equipment: "workshop_tools",
        desc: "重型防爆装甲架上锁闭着电磁脉冲步枪，红外激光防盗光网保持戒备。"
    },
    "room_recreation_gym": {
        id: "room_recreation_gym",
        name: "【失重体能训练馆】体能维持舱",
        zone: "living",
        coord: { x: 7, y: 3 },
        shape: "rect",
        equipment: "tactical_sandtable",
        desc: "阻力离心机与抗肌肉萎缩跑台已断电停转，地毯上散落着运动毛巾。"
    },
    "room_east_airlock": {
        id: "room_east_airlock",
        name: "【东侧外勤气闸】右舷应急闸",
        zone: "living",
        coord: { x: 8, y: 3 },
        shape: "airlock",
        equipment: "airlock_dock",
        desc: "橙黄色的减压警示线环绕着防爆闸门，随时可与外界空间救援船接驳。"
    },

    // =========================================================================
    // 5. 舰体下层：重载机库与工程维修区 (Lower Deck: Hangar & Workshop, Y=4)
    // =========================================================================
    "room_salvage_bay": {
        id: "room_salvage_bay",
        name: "【废料回收解构井】材料熔炼间",
        zone: "engineering",
        coord: { x: 0, y: 4 },
        shape: "storage",
        equipment: "workshop_tools",
        desc: "金属粉碎齿轮巨大的阴影投在铁屑池中，自动化熔炉尚有残存余热。"
    },
    "room_cargo_lift": {
        id: "room_cargo_lift",
        name: "【重载物资升降井】垂直干线",
        zone: "engineering",
        coord: { x: 1, y: 4 },
        shape: "corridor_v",
        equipment: "cargo_grid",
        desc: "可承载数吨货物的液压提升平台，上下连接着工程甲板与主生活区。"
    },
    "room_sub_generator": {
        id: "room_sub_generator",
        name: "【辅助等离子发电站】二号辅电站",
        zone: "engineering",
        coord: { x: 2, y: 4 },
        shape: "lab",
        equipment: "reactor_core",
        desc: "四组中型等离子发生球体发出深蓝电火花，为下层走廊提供备用电力。"
    },
    "room_hangar_deck": {
        id: "room_hangar_deck",
        name: "【主穿梭机库甲板】停机坪甲板",
        zone: "engineering",
        coord: { x: 3, y: 4 },
        shape: "rect",
        equipment: "airlock_dock",
        desc: "开阔的机库地面标有醒目的黄色引道线，一架轻微受损的侦察穿梭机静卧其上。"
    },
    "room_machine_shop": {
        id: "room_machine_shop",
        name: "【重型机件锻造间】机械工坊",
        zone: "engineering",
        coord: { x: 4, y: 4 },
        shape: "workshop",
        equipment: "workshop_tools",
        desc: "数控激光机床与自动化装配台环列四周，工件架上码放着备用阀门与轴承。"
    },
    "room_water_purify": {
        id: "room_water_purify",
        name: "【生态净水再生中心】水处理总站",
        zone: "ecology",
        coord: { x: 5, y: 4 },
        shape: "lab",
        equipment: "hydroponics",
        desc: "银光闪闪的多级逆渗透滤罐与紫外线水杀菌池发出清脆的水流声。"
    },
    "room_life_support": {
        id: "room_life_support",
        name: "【生命支持总控中继】环境机房",
        zone: "ecology",
        coord: { x: 6, y: 4 },
        shape: "lab",
        equipment: "server_rack",
        desc: "二氧化碳吸收器与氧氮混合气瓶整齐排布，空气净化风扇高速运转。"
    },
    "room_air_recycler": {
        id: "room_air_recycler",
        name: "【通风总管加压站】气体交换室",
        zone: "ecology",
        coord: { x: 7, y: 4 },
        shape: "corridor_v",
        equipment: "workshop_tools",
        desc: "粗壮的换气风道汇聚于此，滤网上结着微霜，气流带着淡淡的臭氧味。"
    },
    "room_eva_staging": {
        id: "room_eva_staging",
        name: "【舱外作业整备间】出舱准备室",
        zone: "engineering",
        coord: { x: 8, y: 4 },
        shape: "airlock",
        equipment: "airlock_dock",
        desc: "墙上的金属扣锁挂着厚重的舱外宇航服，氧气充气管已就绪待命。"
    },

    // =========================================================================
    // 6. 舰体底层：主动力反应堆与装甲防护廊 (Lower Deck: Reactor & Shields, Y=5)
    // =========================================================================
    "room_shields_emitter": {
        id: "room_shields_emitter",
        name: "【偏折护盾发生核心】防护中枢",
        zone: "engineering",
        coord: { x: 0, y: 5 },
        shape: "octagon",
        equipment: "shield_coil",
        desc: "巨大的电磁线圈环绕着主发生器，空气中弥漫着静电毛刺感。"
    },
    "room_sub_coolant": {
        id: "room_sub_coolant",
        name: "【次级冷却旁路】低温储液舱",
        zone: "engineering",
        coord: { x: 1, y: 5 },
        shape: "storage",
        equipment: "cargo_grid",
        desc: "绝热储罐外凝结着一层厚厚的白霜，超低温液氦在封闭管道中无声流淌。"
    },
    "room_reactor_control": {
        id: "room_reactor_control",
        name: "【反应堆安全监控室】聚变值班舱",
        zone: "engineering",
        coord: { x: 2, y: 5 },
        shape: "lab",
        equipment: "server_rack",
        desc: "防辐射铅玻璃后，数十个仪表严密监视着主聚变炉的磁约束稳定度。"
    },
    "room_plasma_manifold": {
        id: "room_plasma_manifold",
        name: "【等离子能量汇流总管】主输能干线",
        zone: "engineering",
        coord: { x: 3, y: 5 },
        shape: "corridor_h",
        equipment: "workshop_tools",
        desc: "粗大的发光输能管道贯穿舱壁，炽烈的紫金色等离子体向推进器汹涌输送。"
    },
    "room_main_reactor": {
        id: "room_main_reactor",
        name: "【重核聚变主反应堆】全舰心脏",
        zone: "propulsion",
        coord: { x: 4, y: 5 },
        shape: "reactor",
        equipment: "reactor_core",
        desc: "巍峨的托卡马克环形聚变炉在中央静默悬浮，金色引力等离子环如太阳般耀眼！"
    },
    "room_coolant_tank": {
        id: "room_coolant_tank",
        name: "【主冷却剂循环泵站】散热中继站",
        zone: "propulsion",
        coord: { x: 5, y: 5 },
        shape: "storage",
        equipment: "cargo_grid",
        desc: "巨大的四联装增压泵将冷却剂注入反应堆外壳，发出沉雄有力的心跳轰鸣。"
    },
    "room_warp_field_gen": {
        id: "room_warp_field_gen",
        name: "【超弦跃迁场稳定器】时空定锚舱",
        zone: "propulsion",
        coord: { x: 6, y: 5 },
        shape: "octagon",
        equipment: "shield_coil",
        desc: "环状引力发生线圈在低速旋转，周围空间的光线产生明显的微弱弯折。"
    },
    "room_armored_corridor": {
        id: "room_armored_corridor",
        name: "【舰尾重装甲巡检长廊】防爆甬道",
        zone: "propulsion",
        coord: { x: 7, y: 5 },
        shape: "corridor_h",
        equipment: "workshop_tools",
        desc: "数层复合装甲加固的加厚舱壁，可承受数千吨级的直接动能冲击。"
    },
    "room_starboard_dock": {
        id: "room_starboard_dock",
        name: "【右舷受力锚定基座】拖曳联络舱",
        zone: "engineering",
        coord: { x: 8, y: 5 },
        shape: "airlock",
        equipment: "airlock_dock",
        desc: "用于与空间站干船坞物理硬连接的巨型液压夹具，锁止销已稳稳落槽。"
    },

    // =========================================================================
    // 7. 舰尾推进与终极脱离区 (Stern: Thrusters & Singularity Gate, Y=6)
    // =========================================================================
    "room_escape_pod_w": {
        id: "room_escape_pod_w",
        name: "【左舷 1 号紧急救生舱】脱出弹射管",
        zone: "stern",
        coord: { x: 1, y: 6 },
        shape: "airlock",
        equipment: "airlock_dock",
        desc: "小型流线型深空救生艇固定在弹射滑轨上，生命保障系统指示灯全绿。"
    },
    "room_ion_thruster_l": {
        id: "room_ion_thruster_l",
        name: "【左舷离子推进机房】脉冲喷口舱",
        zone: "stern",
        coord: { x: 2, y: 6 },
        shape: "workshop",
        equipment: "thruster_nozzle",
        desc: "巨大的蓝色离子喷流喷口在舱外深空吞吐光焰，脚底传来绵密的微震。"
    },
    "room_antimatter_tap": {
        id: "room_antimatter_tap",
        name: "【反物质引流阀室】超弦注料间",
        zone: "stern",
        coord: { x: 3, y: 6 },
        shape: "lab",
        equipment: "shield_coil",
        desc: "反物质磁束缚引流管以微秒级精度开闭，注入跃迁星门的主激发腔。"
    },
    "room_singularity_gate": {
        id: "room_singularity_gate",
        name: "【终焉奇点跃迁星门】终极脱离视界",
        zone: "stern",
        coord: { x: 4, y: 6 },
        shape: "reactor",
        equipment: "reactor_core",
        desc: "环形莫比乌斯跃迁环发出震颤灵魂的幽蓝共振，踏入其中即可终结轮回！",
        isExit: true
    },
    "room_matter_stream": {
        id: "room_matter_stream",
        name: "【重力脉冲排气道】尾迹引导间",
        zone: "stern",
        coord: { x: 5, y: 6 },
        shape: "corridor_v",
        equipment: "thruster_nozzle",
        desc: "厚重的格栅后是炽热的高温尾流，将引擎废能安全导向深空虚无。"
    },
    "room_ion_thruster_r": {
        id: "room_ion_thruster_r",
        name: "【右舷离子推进机房】脉冲喷口舱",
        zone: "stern",
        coord: { x: 6, y: 6 },
        shape: "workshop",
        equipment: "thruster_nozzle",
        desc: "右舷主喷管动力输出稳定，高频电离器在真空环境中激发出绚烂光弧。"
    },
    "room_escape_pod_e": {
        id: "room_escape_pod_e",
        name: "【右舷 2 号紧急救生舱】脱出弹射管",
        zone: "stern",
        coord: { x: 7, y: 6 },
        shape: "airlock",
        equipment: "airlock_dock",
        desc: "备用救援穿梭艇处于预热态，控制面板正在实时计算安全脱离弹道。"
    }
};

export const MASTER_CONNECTIONS = [
    // 舰艏 Y=0 横向干线
    ["room_sensor_array", "room_tactical_plan"],
    ["room_tactical_plan", "room_bridge_sub"],
    ["room_bridge_sub", "room_bridge_main"],
    ["room_bridge_main", "room_ai_core"],
    ["room_ai_core", "room_comm_center"],
    ["room_comm_center", "room_observation"],

    // 舰艏向下一层垂直通道 (Y=0 <-> Y=1)
    ["room_sensor_array", "room_specimen_vault"],
    ["room_tactical_plan", "room_exit"],
    ["room_bridge_main", "room_storage_ne"],
    ["room_ai_core", "room_bio_corridor"],
    ["room_comm_center", "room_med_surgery"],
    ["room_observation", "room_cryo_stasis"],

    // Y=1 甲板连线
    ["room_specimen_vault", "room_exit"],
    ["room_exit", "room_corner_ne"],
    ["room_corner_ne", "room_storage_ne"],
    ["room_storage_ne", "room_bio_corridor"],
    ["room_bio_corridor", "room_med_surgery"],
    ["room_med_surgery", "room_cryo_stasis"],
    ["room_cryo_stasis", "room_decon_airlock"],

    // Level 1 原版核心手绘连线 (Y=1, 2, 3) - 100% 精确对应原版
    ["room_start", "room_corridor_w1"],
    ["room_start", "room_corner_se"],
    ["room_start", "room_hub_n1"],
    ["room_corner_se", "room_npc2"],
    ["room_npc2", "room_hub_n1"],
    ["room_hub_n1", "room_storage_ne"],
    ["room_corridor_w1", "room_npc1"],
    ["room_npc1", "room_west_end"],
    ["room_npc1", "room_junction_nw"],
    ["room_junction_nw", "room_npc3"],
    ["room_junction_nw", "room_path_e"],
    ["room_junction_nw", "room_specimen_vault"],
    ["room_path_e", "room_corner_ne"],
    ["room_corner_ne", "room_exit"],

    // 东翼 Y=2 横向连线
    ["room_npc2", "room_living_quarter"],
    ["room_living_quarter", "room_hydro_garden"],
    ["room_hydro_garden", "room_mess_hall"],
    ["room_mess_hall", "room_east_observation"],

    // Y=1 <-> Y=2 垂直走廊
    ["room_med_surgery", "room_living_quarter"],
    ["room_cryo_stasis", "room_hydro_garden"],
    ["room_decon_airlock", "room_mess_hall"],

    // 东翼 Y=3 横向连线
    ["room_corner_se", "room_gravity_well"],
    ["room_gravity_well", "room_armory"],
    ["room_armory", "room_recreation_gym"],
    ["room_recreation_gym", "room_east_airlock"],

    // Y=2 <-> Y=3 垂直走廊
    ["room_living_quarter", "room_gravity_well"],
    ["room_hydro_garden", "room_armory"],
    ["room_mess_hall", "room_recreation_gym"],
    ["room_east_observation", "room_east_airlock"],

    // Y=3 <-> Y=4 垂直走廊
    ["room_west_end", "room_salvage_bay"],
    ["room_npc1", "room_cargo_lift"],
    ["room_corridor_w1", "room_sub_generator"],
    ["room_start", "room_hangar_deck"],
    ["room_corner_se", "room_machine_shop"],
    ["room_gravity_well", "room_water_purify"],
    ["room_armory", "room_life_support"],
    ["room_recreation_gym", "room_air_recycler"],
    ["room_east_airlock", "room_eva_staging"],

    // 下层 Y=4 横向连线
    ["room_salvage_bay", "room_cargo_lift"],
    ["room_cargo_lift", "room_sub_generator"],
    ["room_sub_generator", "room_hangar_deck"],
    ["room_hangar_deck", "room_machine_shop"],
    ["room_machine_shop", "room_water_purify"],
    ["room_water_purify", "room_life_support"],
    ["room_life_support", "room_air_recycler"],
    ["room_air_recycler", "room_eva_staging"],

    // Y=4 <-> Y=5 垂直连线 (通往主反应堆)
    ["room_salvage_bay", "room_shields_emitter"],
    ["room_cargo_lift", "room_sub_coolant"],
    ["room_sub_generator", "room_reactor_control"],
    ["room_hangar_deck", "room_plasma_manifold"],
    ["room_machine_shop", "room_main_reactor"],
    ["room_water_purify", "room_coolant_tank"],
    ["room_life_support", "room_warp_field_gen"],
    ["room_air_recycler", "room_armored_corridor"],
    ["room_eva_staging", "room_starboard_dock"],

    // 底层 Y=5 横向连线
    ["room_shields_emitter", "room_sub_coolant"],
    ["room_sub_coolant", "room_reactor_control"],
    ["room_reactor_control", "room_plasma_manifold"],
    ["room_plasma_manifold", "room_main_reactor"],
    ["room_main_reactor", "room_coolant_tank"],
    ["room_coolant_tank", "room_warp_field_gen"],
    ["room_warp_field_gen", "room_armored_corridor"],
    ["room_armored_corridor", "room_starboard_dock"],

    // Y=5 <-> Y=6 推进与逃生垂直连线
    ["room_sub_coolant", "room_escape_pod_w"],
    ["room_reactor_control", "room_ion_thruster_l"],
    ["room_plasma_manifold", "room_antimatter_tap"],
    ["room_main_reactor", "room_singularity_gate"],
    ["room_coolant_tank", "room_matter_stream"],
    ["room_warp_field_gen", "room_ion_thruster_r"],
    ["room_armored_corridor", "room_escape_pod_e"],

    // 舰尾 Y=6 横向连线
    ["room_escape_pod_w", "room_ion_thruster_l"],
    ["room_ion_thruster_l", "room_antimatter_tap"],
    ["room_antimatter_tap", "room_singularity_gate"],
    ["room_singularity_gate", "room_matter_stream"],
    ["room_matter_stream", "room_ion_thruster_r"],
    ["room_ion_thruster_r", "room_escape_pod_e"]
];

const MASTER_ADJACENCY = {};
Object.keys(MASTER_ROOM_DEFS).forEach(id => {
    MASTER_ADJACENCY[id] = new Set();
});
MASTER_CONNECTIONS.forEach(([a, b]) => {
    if (MASTER_ADJACENCY[a]) MASTER_ADJACENCY[a].add(b);
    if (MASTER_ADJACENCY[b]) MASTER_ADJACENCY[b].add(a);
});

export function getRelativeDirection(fromCoord, toCoord) {
    const dx = toCoord.x - fromCoord.x;
    const dy = toCoord.y - fromCoord.y;
    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? "right" : "left";
    } else {
        return dy > 0 ? "backward" : "forward";
    }
}

export const LEVEL_SECTOR_SPECS = {
    1: {
        title: "第一关：残破遗迹 · 迷宫重聚",
        subtitle: "根据手绘草图结构构建 · 寻找失散同伴",
        startNodeId: "room_start",
        exitNodeId: "room_exit",
        openRoomIds: [
            "room_start", "room_corridor_w1", "room_corner_se", "room_hub_n1",
            "room_storage_ne", "room_npc1", "room_west_end", "room_junction_nw",
            "room_npc3", "room_path_e", "room_corner_ne", "room_npc2", "room_exit"
        ],
        npcPlacements: {
            "room_npc1": "kaze",
            "room_npc2": "shaokexin",
            "room_npc3": "mode"
        },
        foodPlacements: ["room_storage_ne", "room_west_end"]
    },
    2: {
        title: "第二关：深层重叠 · 镜面回廊",
        subtitle: "生活与生态区 · 搜寻深层失散同伴",
        startNodeId: "room_living_quarter",
        exitNodeId: "room_east_airlock",
        openRoomIds: [
            "room_living_quarter", "room_hydro_garden", "room_mess_hall", "room_east_observation",
            "room_gravity_well", "room_armory", "room_recreation_gym", "room_east_airlock",
            "room_water_purify", "room_life_support", "room_air_recycler", "room_eva_staging",
            "room_med_surgery", "room_cryo_stasis", "room_decon_airlock", "room_npc2"
        ],
        npcPlacements: {
            "room_med_surgery": "shaokexin",
            "room_armory": "kaze",
            "room_cryo_stasis": "mode"
        },
        foodPlacements: ["room_mess_hall", "room_hydro_garden"]
    },
    3: {
        title: "第三关：湮灭奇点 · 引力撕裂重构",
        subtitle: "科研与样本冷藏区 · 引力潮汐裂解",
        startNodeId: "room_specimen_vault",
        exitNodeId: "room_bridge_main",
        openRoomIds: [
            "room_specimen_vault", "room_sensor_array", "room_tactical_plan", "room_bridge_sub",
            "room_bridge_main", "room_exit", "room_corner_ne", "room_storage_ne",
            "room_bio_corridor", "room_junction_nw", "room_path_e", "room_hub_n1", "room_npc3"
        ],
        npcPlacements: {
            "room_tactical_plan": "kaze",
            "room_storage_ne": "shaokexin",
            "room_npc3": "mode"
        },
        foodPlacements: ["room_storage_ne", "room_specimen_vault"]
    },
    4: {
        title: "第四关：高熵裂隙 · 热力学破缺",
        subtitle: "重载机库与动力辅机 · 破缺辐射带",
        startNodeId: "room_salvage_bay",
        exitNodeId: "room_plasma_manifold",
        openRoomIds: [
            "room_salvage_bay", "room_cargo_lift", "room_sub_generator", "room_hangar_deck",
            "room_machine_shop", "room_shields_emitter", "room_sub_coolant", "room_reactor_control",
            "room_plasma_manifold", "room_west_end", "room_npc1", "room_corridor_w1", "room_start", "room_corner_se"
        ],
        npcPlacements: {
            "room_npc1": "kaze",
            "room_hangar_deck": "shaokexin",
            "room_sub_generator": "mode"
        },
        foodPlacements: ["room_west_end", "room_sub_coolant"]
    },
    5: {
        title: "第五关：拟态深渊 · 凝视视界",
        subtitle: "动力心脏与推进总管 · 深渊拟态苏醒",
        startNodeId: "room_sub_coolant",
        exitNodeId: "room_singularity_gate",
        openRoomIds: [
            "room_sub_coolant", "room_reactor_control", "room_plasma_manifold", "room_main_reactor",
            "room_coolant_tank", "room_warp_field_gen", "room_ion_thruster_l", "room_antimatter_tap",
            "room_singularity_gate", "room_matter_stream", "room_ion_thruster_r", "room_escape_pod_w"
        ],
        npcPlacements: {
            "room_reactor_control": "kaze",
            "room_coolant_tank": "shaokexin",
            "room_escape_pod_w": "mode"
        },
        foodPlacements: ["room_coolant_tank", "room_matter_stream"]
    },
    6: {
        title: "第六关：量子回声 · 波函数坍缩",
        subtitle: "中腹生活区与机库工程区贯通",
        startNodeId: "room_start",
        exitNodeId: "room_singularity_gate",
        openRoomIds: [
            "room_start", "room_corridor_w1", "room_corner_se", "room_hub_n1", "room_storage_ne",
            "room_npc1", "room_west_end", "room_junction_nw", "room_path_e", "room_npc2",
            "room_living_quarter", "room_gravity_well", "room_armory", "room_machine_shop",
            "room_hangar_deck", "room_sub_generator", "room_water_purify", "room_life_support",
            "room_plasma_manifold", "room_main_reactor", "room_coolant_tank", "room_antimatter_tap",
            "room_singularity_gate", "room_matter_stream"
        ],
        npcPlacements: {
            "room_npc1": "kaze",
            "room_npc2": "shaokexin",
            "room_armory": "mode"
        },
        foodPlacements: ["room_storage_ne", "room_water_purify"]
    },
    7: {
        title: "第七关：虚数空间 · 复数坐标轴",
        subtitle: "西翼科研区与舰艏指挥区大连通",
        startNodeId: "room_start",
        exitNodeId: "room_bridge_main",
        openRoomIds: [
            "room_start", "room_hub_n1", "room_storage_ne", "room_npc2", "room_corner_se",
            "room_corridor_w1", "room_npc1", "room_junction_nw", "room_path_e", "room_corner_ne", "room_exit",
            "room_specimen_vault", "room_sensor_array", "room_tactical_plan", "room_bridge_sub", "room_bridge_main",
            "room_ai_core", "room_comm_center", "room_observation", "room_bio_corridor", "room_med_surgery",
            "room_cryo_stasis", "room_decon_airlock", "room_npc3", "room_west_end"
        ],
        npcPlacements: {
            "room_npc1": "kaze",
            "room_med_surgery": "shaokexin",
            "room_npc3": "mode"
        },
        foodPlacements: ["room_storage_ne", "room_cryo_stasis"]
    },
    8: {
        title: "第八关：超弦引力 · 多维共振膜",
        subtitle: "东翼生活生态区与工程主反应堆并网",
        startNodeId: "room_living_quarter",
        exitNodeId: "room_singularity_gate",
        openRoomIds: [
            "room_living_quarter", "room_hydro_garden", "room_mess_hall", "room_east_observation",
            "room_gravity_well", "room_armory", "room_recreation_gym", "room_east_airlock",
            "room_water_purify", "room_life_support", "room_air_recycler", "room_eva_staging",
            "room_machine_shop", "room_hangar_deck", "room_coolant_tank", "room_warp_field_gen",
            "room_armored_corridor", "room_main_reactor", "room_plasma_manifold", "room_antimatter_tap",
            "room_singularity_gate", "room_matter_stream", "room_ion_thruster_r", "room_escape_pod_e"
        ],
        npcPlacements: {
            "room_armory": "kaze",
            "room_hydro_garden": "shaokexin",
            "room_warp_field_gen": "mode"
        },
        foodPlacements: ["room_mess_hall", "room_coolant_tank"]
    },
    9: {
        title: "第九关：矩阵崩塌 · 拓扑断层",
        subtitle: "机库重载区与全舰尾部推进阵列打通",
        startNodeId: "room_salvage_bay",
        exitNodeId: "room_singularity_gate",
        openRoomIds: [
            "room_salvage_bay", "room_cargo_lift", "room_sub_generator", "room_hangar_deck",
            "room_machine_shop", "room_shields_emitter", "room_sub_coolant", "room_reactor_control",
            "room_plasma_manifold", "room_main_reactor", "room_coolant_tank", "room_warp_field_gen",
            "room_armored_corridor", "room_escape_pod_w", "room_ion_thruster_l", "room_antimatter_tap",
            "room_singularity_gate", "room_matter_stream", "room_ion_thruster_r", "room_escape_pod_e",
            "room_start", "room_corner_se", "room_gravity_well", "room_water_purify", "room_starboard_dock"
        ],
        npcPlacements: {
            "room_reactor_control": "kaze",
            "room_hangar_deck": "shaokexin",
            "room_shields_emitter": "mode"
        },
        foodPlacements: ["room_water_purify", "room_coolant_tank"]
    },
    10: {
        title: "第十关：绝对零度 · 冷冻沉寂",
        subtitle: "生命维持全线与深层冷冻基阵连通",
        startNodeId: "room_specimen_vault",
        exitNodeId: "room_east_airlock",
        openRoomIds: [
            "room_specimen_vault", "room_exit", "room_corner_ne", "room_storage_ne", "room_bio_corridor",
            "room_med_surgery", "room_cryo_stasis", "room_decon_airlock", "room_living_quarter", "room_hydro_garden",
            "room_mess_hall", "room_east_observation", "room_gravity_well", "room_armory", "room_recreation_gym",
            "room_east_airlock", "room_hub_n1", "room_npc2", "room_corner_se", "room_water_purify",
            "room_life_support", "room_air_recycler", "room_eva_staging"
        ],
        npcPlacements: {
            "room_armory": "kaze",
            "room_npc2": "shaokexin",
            "room_cryo_stasis": "mode"
        },
        foodPlacements: ["room_storage_ne", "room_mess_hall"]
    },
    11: {
        title: "第十一关：暗物质界 · 引力源扰动",
        subtitle: "舰艏指挥、中腹与西翼科研三区连通",
        startNodeId: "room_start",
        exitNodeId: "room_bridge_main",
        openRoomIds: [
            "room_sensor_array", "room_tactical_plan", "room_bridge_sub", "room_bridge_main", "room_ai_core", "room_comm_center", "room_observation",
            "room_specimen_vault", "room_exit", "room_corner_ne", "room_storage_ne", "room_bio_corridor", "room_med_surgery", "room_cryo_stasis", "room_decon_airlock",
            "room_npc3", "room_junction_nw", "room_path_e", "room_hub_n1", "room_npc2", "room_living_quarter", "room_hydro_garden",
            "room_west_end", "room_npc1", "room_corridor_w1", "room_start", "room_corner_se", "room_gravity_well", "room_armory",
            "room_salvage_bay", "room_cargo_lift", "room_sub_generator", "room_hangar_deck", "room_machine_shop", "room_water_purify", "room_life_support", "room_shields_emitter"
        ],
        npcPlacements: {
            "room_tactical_plan": "kaze",
            "room_med_surgery": "shaokexin",
            "room_npc3": "mode"
        },
        foodPlacements: ["room_storage_ne", "room_west_end", "room_water_purify"]
    },
    12: {
        title: "第十二关：时间牢笼 · 因果钟摆",
        subtitle: "中腹、东翼与反应堆工程连通",
        startNodeId: "room_start",
        exitNodeId: "room_singularity_gate",
        openRoomIds: [
            "room_hub_n1", "room_storage_ne", "room_npc2", "room_living_quarter", "room_hydro_garden", "room_mess_hall", "room_east_observation",
            "room_corridor_w1", "room_start", "room_corner_se", "room_gravity_well", "room_armory", "room_recreation_gym", "room_east_airlock",
            "room_cargo_lift", "room_sub_generator", "room_hangar_deck", "room_machine_shop", "room_water_purify", "room_life_support", "room_air_recycler", "room_eva_staging",
            "room_sub_coolant", "room_reactor_control", "room_plasma_manifold", "room_main_reactor", "room_coolant_tank", "room_warp_field_gen", "room_armored_corridor", "room_starboard_dock",
            "room_escape_pod_w", "room_ion_thruster_l", "room_antimatter_tap", "room_singularity_gate", "room_matter_stream", "room_ion_thruster_r", "room_escape_pod_e", "room_npc1", "room_path_e", "room_junction_nw"
        ],
        npcPlacements: {
            "room_npc1": "kaze",
            "room_npc2": "shaokexin",
            "room_warp_field_gen": "mode"
        },
        foodPlacements: ["room_storage_ne", "room_mess_hall", "room_coolant_tank"]
    },
    13: {
        title: "第十三关：拟人茧房 · 拟态繁殖工坊",
        subtitle: "机库重载与反应堆走廊大范围侵蚀",
        startNodeId: "room_salvage_bay",
        exitNodeId: "room_singularity_gate",
        openRoomIds: [
            "room_salvage_bay", "room_cargo_lift", "room_sub_generator", "room_hangar_deck", "room_machine_shop", "room_water_purify", "room_life_support", "room_air_recycler",
            "room_shields_emitter", "room_sub_coolant", "room_reactor_control", "room_plasma_manifold", "room_main_reactor", "room_coolant_tank", "room_warp_field_gen", "room_armored_corridor",
            "room_escape_pod_w", "room_ion_thruster_l", "room_antimatter_tap", "room_singularity_gate", "room_matter_stream", "room_ion_thruster_r", "room_escape_pod_e",
            "room_west_end", "room_npc1", "room_corridor_w1", "room_start", "room_corner_se", "room_gravity_well", "room_armory", "room_recreation_gym", "room_hub_n1", "room_npc2", "room_living_quarter", "room_hydro_garden", "room_starboard_dock"
        ],
        npcPlacements: {
            "room_reactor_control": "kaze",
            "room_npc2": "shaokexin",
            "room_shields_emitter": "mode"
        },
        foodPlacements: ["room_west_end", "room_water_purify", "room_coolant_tank"]
    },
    14: {
        title: "第十四关：异构核心 · 同构破缺",
        subtitle: "生物拟态变异舱室 · 隔离墙消融贯通",
        startNodeId: "room_start",
        exitNodeId: "room_singularity_gate",
        mutations: {
            "room_hydro_garden": {
                name: "【异化拟态温室】真菌异构母巢",
                desc: "原有水培架被暗紫色的有机质纤维全面缠绕覆盖，脉动的生物荧光散发着致命诱惑！",
                equipment: "mimic_nest"
            },
            "room_hub_n1": {
                name: "【贯通主枢纽】双向扩建中厅",
                desc: "原本隔绝的防爆钢板在高温中熔断，形成宽敞的双向联通大厅！",
                shape: "octagon"
            }
        },
        openRoomIds: [
            "room_start", "room_corridor_w1", "room_corner_se", "room_hub_n1", "room_storage_ne",
            "room_npc1", "room_west_end", "room_junction_nw", "room_path_e", "room_corner_ne", "room_npc2",
            "room_living_quarter", "room_hydro_garden", "room_mess_hall", "room_gravity_well", "room_armory",
            "room_water_purify", "room_life_support", "room_machine_shop", "room_hangar_deck", "room_sub_generator",
            "room_shields_emitter", "room_sub_coolant", "room_reactor_control", "room_plasma_manifold", "room_main_reactor",
            "room_coolant_tank", "room_warp_field_gen", "room_armored_corridor", "room_antimatter_tap", "room_singularity_gate",
            "room_matter_stream", "room_ion_thruster_l", "room_ion_thruster_r", "room_escape_pod_w", "room_escape_pod_e",
            "room_specimen_vault", "room_bio_corridor", "room_med_surgery", "room_cryo_stasis", "room_starboard_dock"
        ],
        npcPlacements: {
            "room_npc1": "kaze",
            "room_med_surgery": "shaokexin",
            "room_reactor_control": "mode"
        },
        foodPlacements: ["room_storage_ne", "room_mess_hall", "room_coolant_tank"]
    },
    15: {
        title: "第十五关：折叠维度 · 卡拉比-丘流形",
        subtitle: "舰艏高维折跃中枢与东翼生态打通",
        startNodeId: "room_living_quarter",
        exitNodeId: "room_bridge_main",
        openRoomIds: [
            "room_sensor_array", "room_tactical_plan", "room_bridge_sub", "room_bridge_main", "room_ai_core", "room_comm_center", "room_observation",
            "room_storage_ne", "room_bio_corridor", "room_med_surgery", "room_cryo_stasis", "room_decon_airlock",
            "room_hub_n1", "room_npc2", "room_living_quarter", "room_hydro_garden", "room_mess_hall", "room_east_observation",
            "room_start", "room_corner_se", "room_gravity_well", "room_armory", "room_recreation_gym", "room_east_airlock",
            "room_hangar_deck", "room_machine_shop", "room_water_purify", "room_life_support", "room_air_recycler", "room_eva_staging",
            "room_plasma_manifold", "room_main_reactor", "room_coolant_tank", "room_warp_field_gen", "room_armored_corridor", "room_starboard_dock",
            "room_singularity_gate", "room_matter_stream", "room_corridor_w1", "room_npc1"
        ],
        npcPlacements: {
            "room_bridge_sub": "kaze",
            "room_npc2": "shaokexin",
            "room_armory": "mode"
        },
        foodPlacements: ["room_storage_ne", "room_mess_hall", "room_water_purify"]
    },
    16: {
        title: "第十六关：因果律断 · 非定域纠缠",
        subtitle: "舰艏、科研、中腹与生活区全通",
        startNodeId: "room_start",
        exitNodeId: "room_bridge_main",
        openRoomIds: [
            "room_sensor_array", "room_tactical_plan", "room_bridge_sub", "room_bridge_main", "room_ai_core", "room_comm_center", "room_observation",
            "room_specimen_vault", "room_exit", "room_corner_ne", "room_storage_ne", "room_bio_corridor", "room_med_surgery", "room_cryo_stasis", "room_decon_airlock",
            "room_npc3", "room_junction_nw", "room_path_e", "room_hub_n1", "room_npc2", "room_living_quarter", "room_hydro_garden", "room_mess_hall", "room_east_observation",
            "room_west_end", "room_npc1", "room_corridor_w1", "room_start", "room_corner_se", "room_gravity_well", "room_armory", "room_recreation_gym", "room_east_airlock",
            "room_salvage_bay", "room_cargo_lift", "room_sub_generator", "room_hangar_deck", "room_machine_shop", "room_water_purify", "room_life_support", "room_air_recycler", "room_eva_staging",
            "room_shields_emitter", "room_sub_coolant", "room_reactor_control", "room_plasma_manifold", "room_main_reactor"
        ],
        npcPlacements: {
            "room_tactical_plan": "kaze",
            "room_npc2": "shaokexin",
            "room_npc3": "mode"
        },
        foodPlacements: ["room_storage_ne", "room_west_end", "room_mess_hall"]
    },
    17: {
        title: "第十七关：空洞节点 · 真空极化",
        subtitle: "生活区、工程机库与动力推进全域打通",
        startNodeId: "room_living_quarter",
        exitNodeId: "room_singularity_gate",
        openRoomIds: [
            "room_exit", "room_corner_ne", "room_storage_ne", "room_bio_corridor", "room_med_surgery", "room_cryo_stasis", "room_decon_airlock",
            "room_path_e", "room_hub_n1", "room_npc2", "room_living_quarter", "room_hydro_garden", "room_mess_hall", "room_east_observation",
            "room_corridor_w1", "room_start", "room_corner_se", "room_gravity_well", "room_armory", "room_recreation_gym", "room_east_airlock",
            "room_cargo_lift", "room_sub_generator", "room_hangar_deck", "room_machine_shop", "room_water_purify", "room_life_support", "room_air_recycler", "room_eva_staging",
            "room_sub_coolant", "room_reactor_control", "room_plasma_manifold", "room_main_reactor", "room_coolant_tank", "room_warp_field_gen", "room_armored_corridor", "room_starboard_dock",
            "room_escape_pod_w", "room_ion_thruster_l", "room_antimatter_tap", "room_singularity_gate", "room_matter_stream", "room_ion_thruster_r", "room_escape_pod_e", "room_npc1", "room_junction_nw"
        ],
        npcPlacements: {
            "room_armory": "kaze",
            "room_npc2": "shaokexin",
            "room_warp_field_gen": "mode"
        },
        foodPlacements: ["room_storage_ne", "room_mess_hall", "room_coolant_tank"]
    },
    18: {
        title: "第十八关：反转信标 · 宇称不守恒",
        subtitle: "全舰下层机库与两侧应急气闸贯通",
        startNodeId: "room_salvage_bay",
        exitNodeId: "room_singularity_gate",
        openRoomIds: [
            "room_specimen_vault", "room_exit", "room_storage_ne", "room_med_surgery", "room_cryo_stasis",
            "room_npc3", "room_junction_nw", "room_hub_n1", "room_npc2", "room_living_quarter", "room_hydro_garden", "room_mess_hall",
            "room_west_end", "room_npc1", "room_corridor_w1", "room_start", "room_corner_se", "room_gravity_well", "room_armory", "room_east_airlock",
            "room_salvage_bay", "room_cargo_lift", "room_sub_generator", "room_hangar_deck", "room_machine_shop", "room_water_purify", "room_life_support", "room_air_recycler", "room_eva_staging",
            "room_shields_emitter", "room_sub_coolant", "room_reactor_control", "room_plasma_manifold", "room_main_reactor", "room_coolant_tank", "room_warp_field_gen", "room_armored_corridor", "room_starboard_dock",
            "room_escape_pod_w", "room_ion_thruster_l", "room_antimatter_tap", "room_singularity_gate", "room_matter_stream", "room_ion_thruster_r", "room_escape_pod_e"
        ],
        npcPlacements: {
            "room_reactor_control": "kaze",
            "room_hangar_deck": "shaokexin",
            "room_shields_emitter": "mode"
        },
        foodPlacements: ["room_west_end", "room_mess_hall", "room_coolant_tank"]
    },
    19: {
        title: "第十九关：终极拟态 · 意识同化沼泽",
        subtitle: "舰艏主控至舰尾推进主轴完全连通",
        startNodeId: "room_start",
        exitNodeId: "room_singularity_gate",
        openRoomIds: [
            "room_sensor_array", "room_tactical_plan", "room_bridge_sub", "room_bridge_main", "room_ai_core", "room_comm_center",
            "room_specimen_vault", "room_exit", "room_corner_ne", "room_storage_ne", "room_bio_corridor", "room_med_surgery", "room_cryo_stasis",
            "room_junction_nw", "room_path_e", "room_hub_n1", "room_npc2", "room_living_quarter", "room_hydro_garden", "room_mess_hall",
            "room_west_end", "room_npc1", "room_corridor_w1", "room_start", "room_corner_se", "room_gravity_well", "room_armory",
            "room_cargo_lift", "room_sub_generator", "room_hangar_deck", "room_machine_shop", "room_water_purify", "room_life_support",
            "room_shields_emitter", "room_sub_coolant", "room_reactor_control", "room_plasma_manifold", "room_main_reactor", "room_coolant_tank", "room_warp_field_gen", "room_armored_corridor",
            "room_escape_pod_w", "room_ion_thruster_l", "room_antimatter_tap", "room_singularity_gate", "room_matter_stream", "room_ion_thruster_r"
        ],
        npcPlacements: {
            "room_tactical_plan": "kaze",
            "room_npc2": "shaokexin",
            "room_shields_emitter": "mode"
        },
        foodPlacements: ["room_storage_ne", "room_mess_hall", "room_coolant_tank"]
    },
    20: {
        title: "第二十关：意识海床 · 神经突触云端",
        subtitle: "四区深度大联通 · 拟态波高频共振",
        startNodeId: "room_start",
        exitNodeId: "room_singularity_gate",
        openRoomIds: [
            "room_sensor_array", "room_tactical_plan", "room_bridge_sub", "room_bridge_main", "room_ai_core", "room_comm_center", "room_observation",
            "room_specimen_vault", "room_exit", "room_corner_ne", "room_storage_ne", "room_bio_corridor", "room_med_surgery", "room_cryo_stasis", "room_decon_airlock",
            "room_npc3", "room_junction_nw", "room_path_e", "room_hub_n1", "room_npc2", "room_living_quarter", "room_hydro_garden", "room_mess_hall", "room_east_observation",
            "room_west_end", "room_npc1", "room_corridor_w1", "room_start", "room_corner_se", "room_gravity_well", "room_armory", "room_recreation_gym", "room_east_airlock",
            "room_cargo_lift", "room_sub_generator", "room_hangar_deck", "room_machine_shop", "room_water_purify", "room_life_support", "room_air_recycler",
            "room_sub_coolant", "room_reactor_control", "room_plasma_manifold", "room_main_reactor", "room_coolant_tank", "room_warp_field_gen", "room_armored_corridor",
            "room_ion_thruster_l", "room_antimatter_tap", "room_singularity_gate", "room_matter_stream", "room_ion_thruster_r"
        ],
        npcPlacements: {
            "room_bridge_sub": "kaze",
            "room_med_surgery": "shaokexin",
            "room_armory": "mode"
        },
        foodPlacements: ["room_storage_ne", "room_mess_hall", "room_coolant_tank"]
    },
    21: {
        title: "第二十一关：镜像死局 · 对称破缺迷津",
        subtitle: "全舰 53 舱室大开放 · 仅少数严重损毁区锁闭",
        startNodeId: "room_start",
        exitNodeId: "room_singularity_gate",
        openRoomIds: Object.keys(MASTER_ROOM_DEFS).filter(id => id !== "room_salvage_bay" && id !== "room_east_observation" && id !== "room_escape_pod_w" && id !== "room_escape_pod_e" && id !== "room_starboard_dock"),
        npcPlacements: {
            "room_npc1": "kaze",
            "room_npc2": "shaokexin",
            "room_npc3": "mode"
        },
        foodPlacements: ["room_storage_ne", "room_mess_hall", "room_water_purify", "room_coolant_tank"]
    },
    22: {
        title: "第二十二关：光锥视界 · 类光测地线",
        subtitle: "全舰 55 舱室开放 · 舰首至舰尾全线贯通",
        startNodeId: "room_start",
        exitNodeId: "room_singularity_gate",
        openRoomIds: Object.keys(MASTER_ROOM_DEFS).filter(id => id !== "room_salvage_bay" && id !== "room_escape_pod_w" && id !== "room_starboard_dock"),
        npcPlacements: {
            "room_bridge_main": "kaze",
            "room_med_surgery": "shaokexin",
            "room_shields_emitter": "mode"
        },
        foodPlacements: ["room_storage_ne", "room_mess_hall", "room_coolant_tank", "room_west_end"]
    },
    23: {
        title: "第二十三关：高维裂解 · 膜宇宙碰撞",
        subtitle: "全舰 54 舱室开放 · 穿梭双侧逃生机库",
        startNodeId: "room_bridge_main",
        exitNodeId: "room_singularity_gate",
        openRoomIds: Object.keys(MASTER_ROOM_DEFS).filter(id => id !== "room_salvage_bay" && id !== "room_east_airlock" && id !== "room_starboard_dock" && id !== "room_specimen_vault"),
        npcPlacements: {
            "room_tactical_plan": "kaze",
            "room_npc2": "shaokexin",
            "room_armory": "mode"
        },
        foodPlacements: ["room_storage_ne", "room_mess_hall", "room_coolant_tank"]
    },
    24: {
        title: "第二十四关：原初黑洞 · 微型奇点蒸发",
        subtitle: "全舰 56 舱室大决战 · 拟态狂潮全面爆发",
        startNodeId: "room_start",
        exitNodeId: "room_singularity_gate",
        openRoomIds: Object.keys(MASTER_ROOM_DEFS).filter(id => id !== "room_salvage_bay" && id !== "room_starboard_dock"),
        npcPlacements: {
            "room_bridge_main": "kaze",
            "room_hydro_garden": "shaokexin",
            "room_reactor_control": "mode"
        },
        foodPlacements: ["room_storage_ne", "room_mess_hall", "room_water_purify", "room_coolant_tank"]
    },
    25: {
        title: "第二十五关：终焉回响 · 莫比乌斯终环",
        subtitle: "全舰全境大开放 · 终极星舰脱出决战",
        startNodeId: "room_bridge_main",
        exitNodeId: "room_singularity_gate",
        openRoomIds: Object.keys(MASTER_ROOM_DEFS),
        npcPlacements: {
            "room_tactical_plan": "kaze",
            "room_med_surgery": "shaokexin",
            "room_shields_emitter": "mode"
        },
        foodPlacements: ["room_storage_ne", "room_mess_hall", "room_water_purify", "room_coolant_tank"]
    }
};

export function buildSpaceshipLevelMap(levelId) {
    const spec = LEVEL_SECTOR_SPECS[levelId] || LEVEL_SECTOR_SPECS[1];
    const openSet = new Set(spec.openRoomIds);
    const nodes = {};

    spec.openRoomIds.forEach(id => {
        const baseDef = MASTER_ROOM_DEFS[id];
        if (!baseDef) return;

        const mutated = (spec.mutations && spec.mutations[id]) ? spec.mutations[id] : {};
        const node = {
            id: baseDef.id,
            name: mutated.name || baseDef.name,
            desc: mutated.desc || baseDef.desc,
            zone: baseDef.zone,
            coord: { x: baseDef.coord.x, y: baseDef.coord.y },
            shape: mutated.shape || baseDef.shape || "rect",
            equipment: mutated.equipment || baseDef.equipment || null,
            connections: {}
        };

        if (baseDef.isExit || id === spec.exitNodeId) {
            node.isExit = true;
            node.event = { type: "exit", name: "终点气密大门" };
        }

        if (id === spec.startNodeId) {
            node.isStart = true;
        }

        if (spec.npcPlacements && spec.npcPlacements[id]) {
            node.event = {
                type: "npc",
                npcId: spec.npcPlacements[id]
            };
        }

        if (spec.foodPlacements && spec.foodPlacements.includes(id)) {
            node.event = {
                type: "food",
                name: "高能浓缩战备配给"
            };
        }

        nodes[id] = node;
    });

    MASTER_CONNECTIONS.forEach(([a, b]) => {
        if (openSet.has(a) && openSet.has(b)) {
            const nodeA = nodes[a];
            const nodeB = nodes[b];
            if (nodeA && nodeB) {
                const dirAtoB = getRelativeDirection(nodeA.coord, nodeB.coord);
                const dirBtoA = getRelativeDirection(nodeB.coord, nodeA.coord);
                nodeA.connections[dirAtoB] = b;
                nodeB.connections[dirBtoA] = a;
            }
        }
    });

    const lockedRooms = {};
    const fogRooms = {};

    Object.keys(MASTER_ROOM_DEFS).forEach(id => {
        if (openSet.has(id)) return;
        const def = MASTER_ROOM_DEFS[id];
        let isAdjacentToOpen = false;
        if (MASTER_ADJACENCY[id]) {
            for (const neighborId of MASTER_ADJACENCY[id]) {
                if (openSet.has(neighborId)) {
                    isAdjacentToOpen = true;
                    break;
                }
            }
        }

        if (isAdjacentToOpen) {
            lockedRooms[id] = {
                id: def.id,
                name: def.name,
                coord: { x: def.coord.x, y: def.coord.y },
                shape: def.shape,
                equipment: def.equipment,
                state: "locked",
                lockReason: "防爆安全气闸锁死 · 供电切断"
            };
        } else {
            fogRooms[id] = {
                id: def.id,
                coord: { x: def.coord.x, y: def.coord.y },
                state: "fog"
            };
        }
    });

    return {
        startNodeId: spec.startNodeId,
        exitNodeId: spec.exitNodeId,
        nodes,
        masterShip: {
            allRooms: MASTER_ROOM_DEFS,
            allConnections: MASTER_CONNECTIONS,
            openRoomIds: spec.openRoomIds,
            lockedRooms,
            fogRooms
        }
    };
}
