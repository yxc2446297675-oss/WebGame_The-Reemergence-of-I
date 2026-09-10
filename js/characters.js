/**
 * 角色模型与预设配置 (Characters Definition)
 * 包含多表情差分立绘系统 (Expression Sprite System)
 * 支持表情：default(平静), angry(生气), doubt(疑惑), sad(悲伤), smile(微笑), shock(震惊)
 */

export const CharacterRegistry = {
    // 主角
    protagonist: {
        id: "lph",
        name: "L.P.H",
        isProtagonist: true,
        themeColor: "#38bdf8", // 科技冰蓝
        boxBorderColor: "rgba(56, 189, 248, 0.85)",
        boxBgGlow: "rgba(56, 189, 248, 0.2)",
        avatarUrl: "",
        defaultRole: "seer",
        description: "探索小队的指挥队长，冷峻、克制而敏锐。"
    },

    // 候选NPC角色库 (采用 kaze/, shaokexin/, mode/ 独立文件夹管理)
    npcs: {
        // NPC 1：卡罗 (男，文字框蓝色，磁盘文件夹 kaluo)
        kaze: {
            id: "kaze",
            folder: "kaluo",
            name: "卡罗",
            gender: "男",
            themeColor: "#38bdf8", // 科技明蓝
            boxBorderColor: "rgba(56, 189, 248, 0.9)",
            boxBgGlow: "rgba(56, 189, 248, 0.25)",
            avatarUrl: "assets/characters/kaluo/clam.webp",
            expressions: {
                clam: "assets/characters/kaluo/clam.webp",
                happy: "assets/characters/kaluo/happy.webp",
                sad: "assets/characters/kaluo/sad.webp",
                normal: "assets/characters/kaluo/normal.webp",
                angry: "assets/characters/kaluo/angry.webp",
                doubt: "assets/characters/kaluo/doubt.webp",
                shock: "assets/characters/kaluo/shock.webp",
                dead: "assets/characters/kaluo/dead.webp"
            },
            introDialogue: [
                { text: "（一名穿着破损战术服的年轻男子捂着手臂，眼神凌厉而冷漠地抬起头）", expression: "clam" },
                { text: "……是你？呵，原来你还活着，队长。", expression: "doubt" },
                { text: "既然遇上了，那就一起行动吧。但我把话放在前头，如果发现你被感染了，我不会犹豫的。", expression: "angry" }
            ],
            inquiryDialogues: [
                // 对话 1 (第 1 次交谈)
                [
                    { text: "当时，你为什么不在基地里？", expression: "angry" },
                    { text: "难道你都忘了？", expression: "doubt" },
                    { text: "也对，你一直都这样，一直冷冰冰的对待我们。", expression: "sad" },
                    { text: "我没什么想跟你说的，就这样。", expression: "clam" }
                ],
                // 对话 2 (第 2 次交谈)
                [
                    { text: "又来找我？你不像是这样的人。", expression: "happy" },
                    { text: "随你便，反正现在也没有什么更好的办法了。", expression: "clam" },
                    { text: "希望我们还能一起看见太阳。", expression: "clam" }
                ],
                // 对话 3 (第 3 次及后续备选)
                [
                    { text: "终点就在前方，保持警戒。", expression: "clam" },
                    { text: "今晚如果进行裁决，别感情用事，看清楚谁是真正的威胁。", expression: "angry" }
                ]
            ],
            // 白天得知有角色遇害时触发的特殊反应语句库
            deathReactions: [
                { text: "……可恶！[${victim}]居然……！伪人到底藏在谁的皮囊底下？！", expression: "angry" },
                { text: "别发呆了，队长！[${victim}]已经遇害了，下一个可能就是我们之中的任何一人！", expression: "shock" },
                { text: "……昨晚如果我能更警惕一点的话，[${victim}]就不会……切，我绝不会放过那个潜伏的怪物！", expression: "angry" },
                { text: "悲伤解决不了任何问题。[${victim}]的仇，只有把伪人彻底揪出来才能报！", expression: "clam" }
            ],
            // 角色深度机密图鉴与专属分支
            persona: {
                title: "前锋哨兵 · 冷峻执行者",
                secrets: [
                    {
                        id: "kaze_taste",
                        title: "味觉抗拒",
                        desc: "极度抗拒任何甜味食品与高糖军用补给，偏好苦涩的浓缩咖啡因咀嚼片以保持警戒神经高度紧绷。",
                        hint: "在傍晚时刻与其单独交谈 2 次",
                        unlockType: "inquiry_count",
                        threshold: 2
                    },
                    {
                        id: "kaze_scar",
                        title: "战术警惕",
                        desc: "小臂上的撕裂伤痕源于第7巡逻区为了掩护新兵断后，看似冷血寡言，实则对同行队员有着近乎偏执的护短意愿。",
                        hint: "成功带领卡罗撤离至终点脱出",
                        unlockType: "evacuate_with",
                        threshold: 1
                    },
                    {
                        id: "kaze_instinct",
                        title: "因果逆流直觉",
                        desc: "在过往某次闭环中曾目睹时间逆转的幻象，对拟态伪装体脸部神经的抽搐有着超乎常人的辨识嗅觉。",
                        hint: "卡罗存活且在队时成功指认或放逐伪人",
                        unlockType: "exile_wolf_with",
                        threshold: 1
                    },
                    {
                        id: "kaze_resolve",
                        title: "终末决绝",
                        desc: "若自己不幸遭到高熵伪装体同化，会在意识彻底崩解前将自己锁死在减压气阀内，绝不向队友挥动利刃。",
                        hint: "见证卡罗在黑夜中遇害牺牲或被禁锢",
                        unlockType: "suffer_fate",
                        threshold: 1
                    }
                ],
                passiveSkill: {
                    name: "战术反制 (Tactical Counter)",
                    icon: "🛡️",
                    desc: "当夜间潜伏伪装体选定卡罗为刺杀目标时，有 35% 概率由卡罗反制脱身，强制转化为平安夜！"
                },
                exclusiveBranch: {
                    levelId: 101,
                    badge: "EX-K",
                    title: "扇区 EX-K：孤狼战术突破",
                    subtitle: "卡罗主导视角 · 单兵诱敌潜入回廊",
                    desc: "以卡罗单兵前锋视角展开的特殊突破行动。在重度感染的机房深处开辟通道，直面拟态巢穴。"
                }
            }
        },

        // NPC 2：邵可欣 (女，文字框粉色，文件夹 shaokexin)
        shaokexin: {
            id: "shaokexin",
            folder: "shaokexin",
            name: "邵可欣",
            gender: "女",
            themeColor: "#f43f5e", // 玫瑰粉红
            boxBorderColor: "rgba(244, 63, 94, 0.9)",
            boxBgGlow: "rgba(244, 63, 94, 0.25)",
            avatarUrl: "assets/characters/shaokexin/clam.webp",
            expressions: {
                clam: "assets/characters/shaokexin/clam.webp",     // 平静 (无指示时的默认照片，极速 WebP)
                happy: "assets/characters/shaokexin/happy.webp",   // 开心 / 微笑
                sad: "assets/characters/shaokexin/sad.webp",       // 悲伤 / 委屈
                normal: "assets/characters/shaokexin/normal.webp", // 正常
                angry: "assets/characters/shaokexin/angry.webp",   // 生气
                doubt: "assets/characters/shaokexin/doubt.webp",   // 疑惑 / 茫然
                shock: "assets/characters/shaokexin/shock.webp",   // 震惊 / 害怕
                dead: "assets/characters/shaokexin/dead.webp"      // 遇害 / 死亡
            },
            introDialogue: [
                { text: "（昏暗的管道阴影中，一名少女抱膝缩在角落，听到脚步声猛地颤抖起来）", expression: "shock" },
                { text: "请……请别过来！……等等，队长？！真的是你吗？！", expression: "shock" },
                { text: "太好了……我以为我真的要死在这里了……呜，请带我一起走！", expression: "sad" }
            ],
            inquiryDialogues: [
                // 对话 1 (第 1 次交谈)
                [
                    { text: "真的是你，我以为我死定了...", expression: "sad" },
                    { text: "基地不知为何发生爆炸，我们遗落于此....", expression: "doubt" },
                    { text: "不过还好，我们都活着...对吗？", expression: "happy" }
                ],
                // 对话 2 (第 2 次交谈)
                [
                    { text: "不知道该不该说...我挺庆幸你在这里，又为你感到惋惜....", expression: "sad" },
                    { text: "当时我以为你已经不在基地了，还在为你感到高兴，你不用像我们一样在这里....", expression: "clam" },
                    { text: "没想到你遗落于此，我们也算是有个照应，对吧？", expression: "happy" }
                ],
                // 对话 3 (第 3 次及后续备选)
                [
                    { text: "天黑之后这里好安静……安静得让人害怕。", expression: "sad" },
                    { text: "队长，今晚我能离你的舱房近一点吗？我总觉得黑暗里有视线在盯视着大家。", expression: "doubt" }
                ]
            ],
            // 白天得知有角色遇害时触发的特殊反应语句库
            deathReactions: [
                { text: "怎、怎么会这样……[${victim}]明明昨晚还好好的……呜呜……", expression: "sad" },
                { text: "骗人的吧……[${victim}]……为什么大家会被一个个杀掉……队长，我好害怕……", expression: "shock" },
                { text: "连[${victim}]都遇害了……下一个会不会轮到我……队长，不要丢下我……", expression: "sad" },
                { text: "太可怕了……昨晚还和[${victim}]在同一片舱室，现在却……伪人昨夜就在暗中看着我们……", expression: "shock" }
            ],
            // 角色深度机密图鉴与专属分支
            persona: {
                title: "后勤观测员 · 纯真共鸣者",
                secrets: [
                    {
                        id: "shaokexin_allergy",
                        title: "生理排异",
                        desc: "天生体质对超弦折跃射线严重排异，每次穿越气密闸口都会产生强烈眩晕，却从不在队友面前抱怨。",
                        hint: "在傍晚时刻与其单独交谈 2 次",
                        unlockType: "inquiry_count",
                        threshold: 2
                    },
                    {
                        id: "shaokexin_ribbon",
                        title: "救援缎带",
                        desc: "腕间系着的浅粉色缎带是因空难丧生的妹妹唯一的遗物，也是她在永无止境的循环死局中守住人性的锚点。",
                        hint: "成功带领邵可欣撤离至终点脱出",
                        unlockType: "evacuate_with",
                        threshold: 1
                    },
                    {
                        id: "shaokexin_sixth_sense",
                        title: "共鸣第六感",
                        desc: "对潜伏拟态伪装体散发的冰冷负熵臭氧气味异常敏感，身侧存在未探明的危机时心跳会莫名加速。",
                        hint: "邵可欣在队且存活时平安度过黑夜",
                        unlockType: "peaceful_night_with",
                        threshold: 1
                    },
                    {
                        id: "shaokexin_faith",
                        title: "最后的祷告",
                        desc: "在被困废墟的绝望黑暗中，她始终紧握着通讯器信标，坚信无论循环多少次队长一定会赶来救她。",
                        hint: "见证邵可欣遇害牺牲或搜救其入队",
                        unlockType: "suffer_fate",
                        threshold: 1
                    }
                ],
                passiveSkill: {
                    name: "第六感预警 (Intuitive Pulse)",
                    icon: "📡",
                    desc: "白天探索时，若邻近未探索房间内存在潜伏伪装体，微型雷达将发出闪烁黄色高熵危机预警！"
                },
                exclusiveBranch: {
                    levelId: 102,
                    badge: "EX-S",
                    title: "扇区 EX-S：邵可欣的记忆回溯",
                    subtitle: "邵可欣回忆视角 · 爆炸前夕的实验室真相",
                    desc: "探寻基地爆炸前最后 15 分钟的失落记忆，搜寻散落的生物样本黑匣子，解开最初的感染之谜。"
                }
            }
        },

        // NPC 3：莫德 (男，文字框紫色，文件夹 mode)
        mode: {
            id: "mode",
            folder: "mode",
            name: "莫德",
            gender: "男",
            themeColor: "#a855f7", // 幽邃紫晶
            boxBorderColor: "rgba(168, 85, 247, 0.9)",
            boxBgGlow: "rgba(168, 85, 247, 0.25)",
            avatarUrl: "assets/characters/mode/clam.webp",
            expressions: {
                clam: "assets/characters/mode/clam.webp",     // 平静 (无指示时的默认照片，极速 WebP)
                happy: "assets/characters/mode/happy.webp",   // 开心 / 冷笑
                sad: "assets/characters/mode/sad.webp",       // 沮丧
                normal: "assets/characters/mode/normal.webp", // 正常
                angry: "assets/characters/mode/angry.webp",   // 生气 / 凶狠
                doubt: "assets/characters/mode/doubt.webp",   // 疑惑 / 警惕
                shock: "assets/characters/mode/shock.webp",   // 震惊
                dead: "assets/characters/mode/dead.webp"      // 遇害 / 死亡
            },
            introDialogue: [
                { text: "（靠在金属隔板旁的魁梧男子捂着胸口艰难喘息，看到你的徽章后冷笑了一声）", expression: "angry" },
                { text: "咳咳……真是阴魂不散啊，L.P.H。", expression: "happy" },
                { text: "不过算了，算我欠你一次。在这鬼地方多个人掩护总比单打独斗强，拉我一把。", expression: "clam" }
            ],
            inquiryDialogues: [
                // 对话 1 (第 1 次交谈)
                [
                    { text: "真没想到我们会在这里相遇。", expression: "doubt" },
                    { text: "老实说，我还是挺讨厌你的。", expression: "angry" },
                    { text: "虽然不得不承认你很有能力....", expression: "clam" },
                    { text: "队长，希望今晚...我们能安度噩梦。", expression: "clam" }
                ],
                // 对话 2 (第 2 次交谈)
                [
                    { text: "我能问你一件事吗？关于基地爆炸的事情。", expression: "doubt" },
                    { text: "当时...你在哪里？", expression: "angry" },
                    { text: "不记得了？没事...我也只是好奇而已...", expression: "happy" }
                ],
                // 对话 3 (第 3 次及后续备选)
                [
                    { text: "你查验过大家了吗？", expression: "doubt" },
                    { text: "别用那种怀疑的眼神看着老子，老子要是伪人，在爆炸当天就把你捏死了。", expression: "angry" }
                ]
            ],
            // 白天得知有角色遇害时触发的特殊反应语句库
            deathReactions: [
                { text: "啧，[${victim}]那家伙到底还是没撑过去。伪人的胃口比我想象的还要贪婪。", expression: "angry" },
                { text: "收起眼泪吧。死了一个[${victim}]，意味着剩下的活人里伪人的比例更高了，看清楚身边的每一个人！", expression: "clam" },
                { text: "[${victim}]的死法很干净……伪人很熟悉这里的死角。队长，你的怀疑名单可以缩小了。", expression: "doubt" },
                { text: "[${victim}]倒下了，队伍的防御缺口更大了。今晚裁决要是再抓不出凶手，大家就一起等死吧。", expression: "angry" }
            ],
            // 角色深度机密图鉴与专属分支
            persona: {
                title: "重装安保主管 · 铁血守望者",
                secrets: [
                    {
                        id: "mode_photo",
                        title: "坚硬护甲",
                        desc: "看似坚不可摧的重型战术防爆背心内层，贴身珍藏着一张泛黄卷边的女儿童年照片。",
                        hint: "在傍晚时刻与其单独交谈 2 次",
                        unlockType: "inquiry_count",
                        threshold: 2
                    },
                    {
                        id: "mode_loyalty",
                        title: "铁血义气",
                        desc: "嘴上永远骂骂咧咧、口口声声讨厌队长，但每一次遭遇冲击波与坍塌时，身躯总是不自觉地挡在最前面。",
                        hint: "成功带领莫德撤离至终点脱出",
                        unlockType: "evacuate_with",
                        threshold: 1
                    },
                    {
                        id: "mode_fortify",
                        title: "重装戒备",
                        desc: "曾担任特勤工程兵，对基地应急断路闸和承重立柱结构烂熟于心，懂得如何快速加固避难所气密门。",
                        hint: "莫德在队时探索行进超过 8 步",
                        unlockType: "steps_with",
                        threshold: 8
                    },
                    {
                        id: "mode_iron_will",
                        title: "无悔执念",
                        desc: "无论在循环中经历了多么惨烈可怖的死亡，再次睁开眼时，依然会第一时间拉响枪栓沉稳起身。",
                        hint: "见证莫德在黑夜中遇害牺牲或被禁锢",
                        unlockType: "suffer_fate",
                        threshold: 1
                    }
                ],
                passiveSkill: {
                    name: "防爆坚守 (Iron Bastion)",
                    icon: "🛡️",
                    desc: "若黑夜中伪装体企图突袭队长主角，莫德只要在队存活，将誓死挺身格挡抵御，化解当夜致命伤！"
                },
                exclusiveBranch: {
                    levelId: 103,
                    badge: "EX-M",
                    title: "扇区 EX-M：莫德的铁壁守望",
                    subtitle: "莫德防守视角 · 中枢配电总厅死守战",
                    desc: "在动力炉临界暴走的断电大厅内，指挥应急重型火力网，坚守最后一道物理折跃屏障。"
                }
            }
        },
        // NPC 4：薇薇安 (女，安全巡逻副官，文件夹 Vivian)
        vivian: {
            id: "vivian",
            folder: "Vivian",
            name: "薇薇安",
            gender: "女",
            themeColor: "#f43f5e",
            boxBorderColor: "rgba(244, 63, 94, 0.9)",
            boxBgGlow: "rgba(244, 63, 94, 0.25)",
            avatarUrl: "assets/characters/Vivian/calm.png",
            expressions: {
                clam: "assets/characters/Vivian/calm.png",
                calm: "assets/characters/Vivian/calm.png",
                normal: "assets/characters/Vivian/calm.png",
                angry: "assets/characters/Vivian/angry.png",
                dead: "assets/characters/Vivian/dead.jpg"
            },
            introDialogue: [
                { text: "（手持光子微冲，战术目镜闪烁着橙红辉光警惕扫视）站在那里别动！出示识别码……", expression: "angry" },
                { text: "……是队长？呼……太好了，你不知道这片走廊刚才有多可怕。", expression: "clam" },
                { text: "外勤气闸附近有异常撬动痕迹。跟紧我，无论看到什么都别掉以轻心。", expression: "clam" }
            ],
            inquiryDialogues: [
                [
                    { text: "巡逻路线上全是断裂的液压管，看来爆炸波及了整个右舷。", expression: "clam" },
                    { text: "如果遇到袭击，交给我来断后。这是巡逻副官的职责。", expression: "angry" }
                ],
                [
                    { text: "我刚才在气闸边上捡到了这枚被踩碎的警员徽章……", expression: "clam" },
                    { text: "有人在停电前几分钟故意关闭了近防监控。那是内鬼干的。", expression: "angry" }
                ]
            ],
            deathReactions: [
                { text: "可恶……[${victim}]明明刚刚还在巡逻名单上！凶手就在我们身边！", expression: "angry" },
                { text: "[${victim}]倒下了……绝不能让牺牲者的血白流，今晚必须把伪人揪出来！", expression: "angry" }
            ],
            persona: {
                title: "巡逻警戒副官 · 敏锐鹰眼",
                secrets: [
                    {
                        id: "vivian_scope",
                        title: "战术夜视目镜",
                        desc: "右眼佩戴的定制增强现实目镜，能捕捉微米级的热成像足迹与隐形伪装体微弱的静电离子逸散。",
                        hint: "在傍晚时刻与其单独交谈 2 次",
                        unlockType: "inquiry_count",
                        threshold: 2
                    }
                ],
                passiveSkill: {
                    name: "鹰眼警戒 (Eagle Eye)",
                    icon: "🎯",
                    desc: "薇薇安在队时，遭遇突袭的防卫反击判定成功率提升 25%。"
                }
            }
        },

        // NPC 5：伊莲 (女，首席轮机长，文件夹 Elena)
        elena: {
            id: "elena",
            folder: "Elena",
            name: "伊莲",
            gender: "女",
            themeColor: "#fb923c",
            boxBorderColor: "rgba(251, 146, 60, 0.9)",
            boxBgGlow: "rgba(251, 146, 60, 0.25)",
            avatarUrl: "assets/characters/Elena/calm.jpg",
            expressions: {
                clam: "assets/characters/Elena/calm.jpg",
                calm: "assets/characters/Elena/calm.jpg",
                normal: "assets/characters/Elena/calm.jpg",
                angry: "assets/characters/Elena/angry.jpg",
                dead: "assets/characters/Elena/3f928911-2a4d-4b34-9aa7-932b3791ba3d.jpg"
            },
            introDialogue: [
                { text: "（满手重油污渍，正用力敲击着嗡鸣作响的等离子泄压阀）咳咳……别催了！", expression: "angry" },
                { text: "队长？！谢天谢地，主反应堆刚才差点连锁熔毁！", expression: "clam" },
                { text: "环境机房的温控芯片被人硬生生拔走了，到底是哪个疯子在拿整艘船的命开玩笑？！", expression: "angry" }
            ],
            inquiryDialogues: [
                [
                    { text: "等离子汇流管熔穿了三处，我只能用备用磁封勉强加固。", expression: "clam" },
                    { text: "要是再来一次过热回涌，神仙也保不住这颗托卡马克！", expression: "angry" }
                ],
                [
                    { text: "我查了偷拔芯片的受力痕迹，是用重型液压钳夹断的……普通人根本拿不动那玩意。", expression: "clam" }
                ]
            ],
            deathReactions: [
                { text: "天呐……连[${victim}]都……！这艘船的噩梦到底什么时候才是个头！", expression: "angry" },
                { text: "[${victim}]……该死！为什么伪人专挑懂机械的人下手？！", expression: "angry" }
            ],
            persona: {
                title: "首席轮机长 · 动力核心守护者",
                secrets: [
                    {
                        id: "elena_wrench",
                        title: "重型钛合金扳手",
                        desc: "贴身挂载的传家宝工具，不仅能拆卸全舰最顽固的高压法兰，危机时也是砸碎异构体颅骨的重兵器。",
                        hint: "带领伊莲穿越轮机区",
                        unlockType: "steps_with",
                        threshold: 6
                    }
                ],
                passiveSkill: {
                    name: "过载泄压 (Overload Vent)",
                    icon: "⚡",
                    desc: "伊莲在队时，工程区域内的过热与电气陷阱体力消耗降低 50%。"
                }
            }
        },

        // NPC 6：柯尔特 (男，星际领航员/走私线人，文件夹 Colt)
        colt: {
            id: "colt",
            folder: "Colt",
            name: "柯尔特",
            gender: "男",
            themeColor: "#f59e0b",
            boxBorderColor: "rgba(245, 158, 11, 0.9)",
            boxBgGlow: "rgba(245, 158, 11, 0.25)",
            avatarUrl: "assets/characters/Colt/calm.jpg",
            expressions: {
                clam: "assets/characters/Colt/calm.jpg",
                calm: "assets/characters/Colt/calm.jpg",
                normal: "assets/characters/Colt/calm.jpg",
                angry: "assets/characters/Colt/angry.png",
                dead: "assets/characters/Colt/dead.jpg"
            },
            introDialogue: [
                { text: "（指尖娴熟地把玩着一枚黄铜筹码，嘴角挂着玩世不恭的笑意）哟，大指挥官。", expression: "clam" },
                { text: "别用那种看死囚的眼神盯着我，定锚坐标被篡改可不是我一个人的'杰作'……", expression: "clam" },
                { text: "怎么，想拿枪指我？先搞清楚现在的航线正带着我们滑向哪个黑洞吧！", expression: "angry" }
            ],
            inquiryDialogues: [
                [
                    { text: "做生意嘛，讲究富贵险中求。谁能想到那批货引来的是这种东西。", expression: "clam" },
                    { text: "巴恩斯那家伙藏哪了？他的账本要是落到伪人手里，咱俩都得完蛋。", expression: "clam" }
                ],
                [
                    { text: "虚数航道可不是小姑娘的花园，一脚踩空就是连骨灰都蒸发的世界。", expression: "angry" }
                ]
            ],
            deathReactions: [
                { text: "啧啧，[${victim}]居然栽了……看来这轮赌局的庄家出老千了啊。", expression: "clam" },
                { text: "连[${victim}]这种老油条都翻船了？喂队长，你这队伍到底靠不靠谱！", expression: "angry" }
            ],
            persona: {
                title: "星际领航员 · 虚数航道游侠",
                secrets: [
                    {
                        id: "colt_compass",
                        title: "失真虚数罗盘",
                        desc: "一枚指针永远指向最近未知引力源的走私专用古董罗盘，在母舰迷失于时空褶皱时亦能找寻生路。",
                        hint: "在傍晚时刻与其交谈",
                        unlockType: "inquiry_count",
                        threshold: 2
                    }
                ],
                passiveSkill: {
                    name: "虚数规避 (Phantom Drift)",
                    icon: "🎲",
                    desc: "柯尔特在队时，夜间遭遇袭击有 20% 概率触发空间假动作闪避！"
                }
            }
        },

        // NPC 7：陆知行 (男，首席科学官，文件夹 Prof_Lu)
        prof_lu: {
            id: "prof_lu",
            folder: "Prof_Lu",
            name: "陆知行",
            gender: "男",
            themeColor: "#10b981",
            boxBorderColor: "rgba(16, 185, 129, 0.9)",
            boxBgGlow: "rgba(16, 185, 129, 0.25)",
            avatarUrl: "assets/characters/Prof_Lu/calm.png",
            expressions: {
                clam: "assets/characters/Prof_Lu/calm.png",
                calm: "assets/characters/Prof_Lu/calm.png",
                normal: "assets/characters/Prof_Lu/calm.png",
                angry: "assets/characters/Prof_Lu/angry.png",
                dead: "assets/characters/Prof_Lu/dead.jpg"
            },
            introDialogue: [
                { text: "（推了推反光的单片测镜，全神贯注凝视着真空试管内的异质晶体）别打扰我……", expression: "clam" },
                { text: "天……不可思议！这种晶格在微观层面上居然在自发逆转热力学熵流！", expression: "clam" },
                { text: "队长！别管什么盗货贼了，如果能解开这块样本的秘密，人类将彻底支配时间！", expression: "angry" }
            ],
            inquiryDialogues: [
                [
                    { text: "偷走二号芯片的人根本不知道自己在玩弄什么力量。那不是工具，是潘多拉魔盒。", expression: "clam" },
                    { text: "定格技术一旦逆流，所有人的意识切片都会被锁死在临死那一秒！", expression: "angry" }
                ],
                [
                    { text: "我采集了伪装体的细胞切片……它的碳氮同位素比值不属于已知银河系的任何星团。", expression: "clam" }
                ]
            ],
            deathReactions: [
                { text: "不可接受！[${victim}]的数据流瞬间归零了……伪人的吞噬速率正在呈指数级攀升！", expression: "angry" },
                { text: "[${victim}]的脑电波消失了……这不仅是杀戮，是对高等智慧结构的抹杀！", expression: "clam" }
            ],
            persona: {
                title: "首席科学官 · 异构晶体研析者",
                secrets: [
                    {
                        id: "lu_notebook",
                        title: "泛黄理论手稿",
                        desc: "密密麻麻记录着关于‘观察者效应坍缩’与‘多维投影投射’的绝密猜想手稿，也是跨时空信标的理论雏形。",
                        hint: "带领陆知行探查标本库",
                        unlockType: "steps_with",
                        threshold: 5
                    }
                ],
                passiveSkill: {
                    name: "样本解析 (Sample Analysis)",
                    icon: "🔬",
                    desc: "陆知行在队时，科研与医疗类舱室的情报收集效率提高 50%。"
                }
            }
        },

        // NPC 8：艾尔莎 (女，主治军医，文件夹 Dr_Elsa)
        elsa: {
            id: "elsa",
            folder: "Dr_Elsa",
            name: "艾尔莎",
            gender: "女",
            themeColor: "#06b6d4",
            boxBorderColor: "rgba(6, 182, 212, 0.9)",
            boxBgGlow: "rgba(6, 182, 212, 0.25)",
            avatarUrl: "assets/characters/Dr_Elsa/calm.jpg",
            expressions: {
                clam: "assets/characters/Dr_Elsa/calm.jpg",
                calm: "assets/characters/Dr_Elsa/calm.jpg",
                normal: "assets/characters/Dr_Elsa/calm.jpg",
                angry: "assets/characters/Dr_Elsa/angry.jpg",
                dead: "assets/characters/Dr_Elsa/dead.jpg"
            },
            introDialogue: [
                { text: "（戴着沾有荧光消毒凝胶的手套，神情清冷甚至有些严酷）心率138，血压偏低。", expression: "clam" },
                { text: "看来你刚从死人堆里爬出来，L.P.H。坐下，打一针镇定剂。", expression: "clam" },
                { text: "死人可没法带大家逃生。不管外面发生了什么，我的手术台上只看生理指标！", expression: "angry" }
            ],
            inquiryDialogues: [
                [
                    { text: "生化检测室的纳米探针还能用，但我必须警告你，假扮成人类的伪人连心跳都会模拟。", expression: "clam" },
                    { text: "唯独体液渗透压有极其细微的偏差，那是唯一的生化破绽。", expression: "clam" }
                ],
                [
                    { text: "休眠舱里那些人睡得很死……如果温度继续上升，他们全会脑死亡。", expression: "angry" }
                ]
            ],
            deathReactions: [
                { text: "……死亡时间不超过十分钟。[${victim}]的颈动脉被极其精密的利刃切断……手法近乎专业外科。", expression: "angry" },
                { text: "又一个病患从我手里失去了心跳……[${victim}]，伪装者的残忍已经超出生物本能了。", expression: "clam" }
            ],
            persona: {
                title: "主治军医 · 创伤干预专家",
                secrets: [
                    {
                        id: "elsa_scalpel",
                        title: "超声波振动手术刀",
                        desc: "锋利到能无阻力切开纳米防弹纤维的微型手术刀，不仅用于战地切缝，也是近身致命自卫武器。",
                        hint: "在傍晚时刻与其单独交谈 2 次",
                        unlockType: "inquiry_count",
                        threshold: 2
                    }
                ],
                passiveSkill: {
                    name: "战地缝合 (Field Surgery)",
                    icon: "💉",
                    desc: "艾尔莎在队时，探索中若受到重伤体力扣减，将立即恢复 1 点生命维持！"
                }
            }
        },

        // NPC 9：巴恩斯 (男，军需调度官，文件夹 Barnes)
        barnes: {
            id: "barnes",
            folder: "Barnes",
            name: "巴恩斯",
            gender: "男",
            themeColor: "#84cc16",
            boxBorderColor: "rgba(132, 204, 22, 0.9)",
            boxBgGlow: "rgba(132, 204, 22, 0.25)",
            avatarUrl: "assets/characters/Barnes/calm.jpg",
            expressions: {
                clam: "assets/characters/Barnes/calm.jpg",
                calm: "assets/characters/Barnes/calm.jpg",
                normal: "assets/characters/Barnes/calm.jpg",
                happy: "assets/characters/Barnes/happy.jpg",
                angry: "assets/characters/Barnes/angry.jpg",
                dead: "assets/characters/Barnes/dead.jpg"
            },
            introDialogue: [
                { text: "（拍了拍身边挂着三重密码锁的防爆箱，皮笑肉不笑地咧嘴）嘿嘿……大驾光临啊指挥官。", expression: "happy" },
                { text: "别提什么配额制度了，现在全舰断电，规章制度就是擦屁股纸。", expression: "clam" },
                { text: "想要高能压缩饼干还是军规医疗喷雾？拿实打实的东西来换，巴恩斯童叟无欺。", expression: "clam" }
            ],
            inquiryDialogues: [
                [
                    { text: "我和柯尔特搭伙这么多年，什么大风大浪没见过？", expression: "happy" },
                    { text: "但这次那批‘特种晶体’……水太深了，连定锚舱的航路都被暗中买家买断了。", expression: "clam" }
                ],
                [
                    { text: "看好你的后背，队长。有些看着像圣人一样的家伙，背地里比我还贪心！", expression: "angry" }
                ]
            ],
            deathReactions: [
                { text: "老天爷……[${victim}]的物资箱都空了……伪人连死人的干粮都要搜刮吗？！", expression: "angry" },
                { text: "死了……[${victim}]欠我的三箱浓缩燃料还没结清呢！该死的怪物！", expression: "clam" }
            ],
            persona: {
                title: "军需调度官 · 黑市暗线枢纽",
                secrets: [
                    {
                        id: "barnes_ledger",
                        title: "双重密码账本",
                        desc: "记录着整艘母舰所有暗度陈仓的走私交易、改道分成以及违禁违规人员指纹的绝密软盘。",
                        hint: "带领巴恩斯搜获物资补给",
                        unlockType: "steps_with",
                        threshold: 6
                    }
                ],
                passiveSkill: {
                    name: "黑市配给 (Black Market Rations)",
                    icon: "📦",
                    desc: "巴恩斯在队时，拾取食物补给获得的行动步数额外增加 1 步！"
                }
            }
        },

        // NPC 10：诺亚 (男，仿生逻辑技师，文件夹 Noah)
        noah: {
            id: "noah",
            folder: "Noah",
            name: "诺亚",
            gender: "男",
            themeColor: "#6366f1",
            boxBorderColor: "rgba(99, 102, 241, 0.9)",
            boxBgGlow: "rgba(99, 102, 241, 0.25)",
            avatarUrl: "assets/characters/Noah/calm.png",
            expressions: {
                clam: "assets/characters/Noah/calm.png",
                calm: "assets/characters/Noah/calm.png",
                normal: "assets/characters/Noah/calm.png",
                angry: "assets/characters/Noah/calm.png", // 保底使用平静
                dead: "assets/characters/Noah/dead.jpg"
            },
            introDialogue: [
                { text: "（颈部液态金属接口闪烁着深蓝脉冲，无机质的双眸缓缓对焦）系统自检中……", expression: "clam" },
                { text: "指挥官 L.P.H，识别通过。我的超导阵列受到了未知电磁脉冲的严重干扰。", expression: "clam" },
                { text: "逻辑核心提示：当前空间内生物电信号出现混淆伪装，我的协议将优先确保您生存。", expression: "clam" }
            ],
            inquiryDialogues: [
                [
                    { text: "超脑机柜并没有被物理损坏，但数据总线被注入了一段高熵递归病毒。", expression: "clam" },
                    { text: "那段代码带有明显的智能特征，它在尝试重构这艘飞船的物理常数。", expression: "clam" }
                ],
                [
                    { text: "根据图灵协议，仿生人无法成为伪人——但我无法保证我的逻辑不被篡改。", expression: "clam" }
                ]
            ],
            deathReactions: [
                { text: "警报。乘员[${victim}]的生命体征于0.3秒前彻底归零。推测遭受致命机械性挤压。", expression: "clam" },
                { text: "生物样本[${victim}]损毁。威胁评级提升为最高危级。", expression: "clam" }
            ],
            persona: {
                title: "仿生逻辑技师 · 超脑矩阵哨卫",
                secrets: [
                    {
                        id: "noah_core",
                        title: "未加密备用核心",
                        desc: "藏于胸腔防磁装甲板下的第二微型处理器，即使外层躯体损毁，其数据切片也能在超脑中重生。",
                        hint: "在黑夜中平安度过",
                        unlockType: "peaceful_night_with",
                        threshold: 1
                    }
                ],
                passiveSkill: {
                    name: "逻辑解构 (Logic Deconstruct)",
                    icon: "🤖",
                    desc: "诺亚在队时，白天审决会议中对于虚假发言的辨识成功率提高 30%！"
                }
            }
        },

        // NPC 11：索菲亚 (女，生态维生总监，文件夹 Sophia)
        sophia: {
            id: "sophia",
            folder: "Sophia",
            name: "索菲亚",
            gender: "女",
            themeColor: "#ec4899",
            boxBorderColor: "rgba(236, 72, 153, 0.9)",
            boxBgGlow: "rgba(236, 72, 153, 0.25)",
            avatarUrl: "assets/characters/Sophia/calm.jpg",
            expressions: {
                clam: "assets/characters/Sophia/calm.jpg",
                calm: "assets/characters/Sophia/calm.jpg",
                normal: "assets/characters/Sophia/calm.jpg",
                angry: "assets/characters/Sophia/angry.jpg",
                sad: "assets/characters/Sophia/sad.png",
                dead: "assets/characters/Sophia/dead.jpg"
            },
            introDialogue: [
                { text: "（用微滴喷雾器给濒危的水培幼苗细致补水，转过身来目光清澈而忧伤）请轻一点……", expression: "sad" },
                { text: "它们受惊了。维生管道失压后，这是温室里仅存的最后一批绿苗了。", expression: "clam" },
                { text: "队长，只要这些根系还在呼吸，我们就还没有输，对吧？带我一起走吧！", expression: "clam" }
            ],
            inquiryDialogues: [
                [
                    { text: "空气里的臭氧浓度在上升，这是环境总控机房芯片被盗的连锁反应。", expression: "sad" },
                    { text: "如果没有纯净氧气，大家撑不过四十八小时的。", expression: "clam" }
                ],
                [
                    { text: "我经常在水培室看着窗外的星海。不管多么遥远，我坚信地球的太阳依然在照耀着我们。", expression: "clam" }
                ]
            ],
            deathReactions: [
                { text: "怎么会……[${victim}]……明明昨天还向我讨要过晒干的花瓣……呜呜……", expression: "sad" },
                { text: "连[${victim}]也离开了……像枯萎的叶子一样……大家真的能活着回去吗……", expression: "sad" }
            ],
            persona: {
                title: "生态维生总监 · 生命摇篮培育者",
                secrets: [
                    {
                        id: "sophia_seed",
                        title: "抗辐射永生种荚",
                        desc: "精心封存在玻璃挂坠中的地球母星原生小麦胚芽，寄托着在深空中重建生态圈的永恒希望。",
                        hint: "在傍晚时刻与其交谈",
                        unlockType: "inquiry_count",
                        threshold: 2
                    }
                ],
                passiveSkill: {
                    name: "生机共鸣 (Biosphere Nurture)",
                    icon: "🌱",
                    desc: "索菲亚在队时，全队在黑夜的恐慌精神损耗减半，探索初始体力上限临时 +1！"
                }
            }
        }
    },

    /**
     * 规范化表情代号 (兼容中英文标签与各种输入)
     */
    normalizeExpression(exp) {
        if (!exp) return "clam";
        const clean = String(exp).trim().toLowerCase();
        const tagMap = {
            "clam": "clam",
            "calm": "clam",
            "平静": "clam",
            "normal": "normal",
            "正常": "normal",
            "默认": "clam",
            "default": "clam",
            "happy": "happy",
            "开心": "happy",
            "微笑": "happy",
            "smile": "happy",
            "sad": "sad",
            "悲伤": "sad",
            "沮丧": "sad",
            "angry": "angry",
            "生气": "angry",
            "doubt": "doubt",
            "疑惑": "doubt",
            "shock": "shock",
            "震惊": "shock",
            "dead": "dead",
            "死亡": "dead",
            "牺牲": "dead",
            "遇害": "dead"
        };
        return tagMap[clean] || clean;
    },

    /**
     * 解析单条文本或对象中的表情
     * 核心规则：当文本没有指示用什么表情时，默认用平静“clam”照片
     */
    parseDialogueLine(lineItem) {
        if (typeof lineItem === "object" && lineItem !== null) {
            return {
                text: lineItem.text || "",
                expression: this.normalizeExpression(lineItem.expression || "clam")
            };
        }

        const rawText = String(lineItem || "");
        // 匹配前置中英文标签 [xxx]
        const match = rawText.match(/^\[(clam|calm|normal|happy|smile|sad|angry|doubt|shock|dead|default|平静|正常|开心|微笑|悲伤|沮丧|生气|疑惑|震惊|死亡|牺牲|遇害|默认)\]\s*(.*)$/i);
        if (match) {
            return {
                text: match[2],
                expression: this.normalizeExpression(match[1])
            };
        }

        // 当文本没有指示用什么表情时，严格默认用平静“clam”
        return {
            text: rawText,
            expression: "clam"
        };
    },

    /**
     * 随机获取针对特定受害者的特殊反应语句
     */
    getRandomDeathReaction(character, victim) {
        if (!character) return null;
        const reactions = character.deathReactions || [];
        const victimName = (victim && victim.name) ? victim.name : "同伴";
        if (reactions.length === 0) {
            return {
                text: `……[${victimName}]居然遇害了……大家一定要加倍小心！`,
                expression: "shock"
            };
        }
        const picked = reactions[Math.floor(Math.random() * reactions.length)];
        const text = picked.text
            .replace(/\[\$\{victim\}\]/g, `[${victimName}]`)
            .replace(/\$\{victim\}/g, victimName);
        return {
            text: text,
            expression: this.normalizeExpression(picked.expression || "shock")
        };
    },

    /**
     * 获取指定角色在特定表情下的候选立绘URL队列 (自动按优先级排序尝试)
     * 支持 kaze/, shaokexin/, mode/ 独立文件夹架构与 png/jpg/webp 自动探测
     */
    getCharacterImageCandidates(character, expression = "clam") {
        if (!character) return [];
        // 广播、终端、系统通知、主角等绝对不加载角色立绘
        if (character.isProtagonist || character.isBroadcast || character.isSystem ||
            character.id === "lph" || character.id === "system" || character.id === "broadcast" ||
            /广播|系统|终端|通信|审决|全员/i.test(character.name || "")) {
            return [];
        }
        const exp = this.normalizeExpression(expression);
        const folder = character.folder || character.id;
        if (!folder) return [];
        
        // 支持 mode 与 morde, kaze 与 kaluo/caro 别名映射
        const folders = [folder];
        if (folder === "mode") folders.push("morde");
        if (folder === "morde") folders.push("mode");
        if (folder === "kaze") folders.push("kaluo", "caro", "kalo");
        if (["kaluo", "caro", "kalo"].includes(folder)) folders.push("kaze");
        if (folder === "Prof_Lu") folders.push("Prof. Lu");
        if (folder === "Prof. Lu") folders.push("Prof_Lu");
        if (folder === "Dr_Elsa") folders.push("Dr. Elsa");
        if (folder === "Dr. Elsa") folders.push("Dr_Elsa");
        if (character.name && !folders.includes(character.name)) {
            folders.push(character.name);
        }

        const expAliases = {
            clam: ["clam", "calm", "normal", "平静"],
            calm: ["clam", "calm", "normal", "平静"],
            normal: ["normal", "clam", "calm", "正常", "default"],
            happy: ["happy", "smile", "开心", "微笑"],
            sad: ["sad", "悲伤", "沮丧"],
            angry: ["angry", "生气"],
            doubt: ["doubt", "疑惑"],
            shock: ["shock", "震惊"],
            dead: ["dead", "死亡", "die", "corpse", "sad", "clam"]
        };

        const namesToTry = expAliases[exp] || [exp];
        // 优先探测极速轻量的 webp，同时兼顾兼容旧版 png / jpg
        const extensions = ["webp", "png", "jpg", "jpeg"];

        const candidates = [];

        // 0. 优先尝试角色 expressions 字典中明确配置的立绘路径
        if (character.expressions && character.expressions[exp]) {
            candidates.push(character.expressions[exp]);
        }

        // 1. 在各目标文件夹下探测对应的表情切图
        for (const f of folders) {
            for (const name of namesToTry) {
                for (const ext of extensions) {
                    candidates.push(`assets/characters/${f}/${name}.${ext}`);
                }
            }
        }

        // 2. 如果请求的是非平静表情但特定切图缺失，降级尝试该角色的平静/默认图 (clam / calm / normal)
        if (exp !== "clam" && exp !== "normal") {
            for (const f of folders) {
                for (const calmName of ["clam", "calm", "normal", "平静"]) {
                    for (const ext of extensions) {
                        candidates.push(`assets/characters/${f}/${calmName}.${ext}`);
                    }
                }
            }
        }

        // 3. 根目录保底 (如 assets/characters/kaze.png)
        for (const f of folders) {
            for (const ext of extensions) {
                candidates.push(`assets/characters/${f}.${ext}`);
            }
        }

        return [...new Set(candidates)];
    },

    /**
     * 获取指定角色在特定表情下的标准立绘URL
     */
    getCharacterImageUrl(character, expression = "clam") {
        if (!character) return "";
        if (character.isProtagonist || character.isBroadcast || character.isSystem ||
            character.id === "lph" || character.id === "system" || character.id === "broadcast" ||
            /广播|系统|终端|通信|审决|全员/i.test(character.name || "")) {
            return "";
        }
        const exp = this.normalizeExpression(expression);
        const candidates = this.getCharacterImageCandidates(character, exp);
        return candidates[0] || (character.folder || character.id ? `assets/characters/${character.folder || character.id}/${exp}.png` : "");
    },

    /**
     * 生成带表情状态特质的SVG头像 (作为图片完全未放入时的保底呈现)
     */
    getAvatarSvg(character, expression = "clam") {
        if (!character) return "";
        // 广播播报人、系统通知、终端等严禁展示任何立绘
        if (character.isBroadcast || character.isSystem ||
            character.id === "system" || character.id === "broadcast" ||
            /广播|系统|终端|通信|审决|全员/i.test(character.name || "")) {
            return "";
        }
        const color = character.themeColor || "#38bdf8";
        const nameInitial = character.name ? character.name.charAt(0) : "L";
        const isFemale = character.gender === "女";
        const isCap = character.isProtagonist || character.id === "lph";
        const exp = this.normalizeExpression(expression);
        
        const headRadius = isFemale ? 44 : (isCap ? 46 : 48);
        const shoulderWidth = isFemale ? 34 : 42;

        // 表情特征小标 (主角展示指挥官星徽，NPC展示状态标识)
        const emojiMap = {
            clam: "•_•",
            calm: "•_•",
            normal: "•_•",
            default: "•_•",
            happy: "✨",
            smile: "✨",
            sad: "💧",
            angry: "💢",
            doubt: "❓",
            shock: "❗",
            dead: "💀"
        };
        const badge = isCap ? "⭐" : (emojiMap[exp] || "•_•");

        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
            <defs>
                <radialGradient id="grad-${character.id}-${exp}" cx="50%" cy="40%" r="60%">
                    <stop offset="0%" stop-color="${color}" stop-opacity="0.85"/>
                    <stop offset="100%" stop-color="#080c18" stop-opacity="0.98"/>
                </radialGradient>
                <linearGradient id="glow-${character.id}-${exp}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="${color}" stop-opacity="1"/>
                    <stop offset="100%" stop-color="#ffffff" stop-opacity="0.3"/>
                </linearGradient>
            </defs>
            <rect width="200" height="200" rx="16" fill="#090e1c" stroke="${color}" stroke-width="2.5"/>
            <!-- 头部剪影 -->
            <circle cx="100" cy="80" r="${headRadius}" fill="url(#grad-${character.id}-${exp})" stroke="url(#glow-${character.id}-${exp})" stroke-width="2"/>
            <!-- 躯干剪影 -->
            <path d="M${100 - shoulderWidth * 1.5} 185 C${100 - shoulderWidth} 130, ${100 - shoulderWidth * 0.7} 122, 100 122 C${100 + shoulderWidth * 0.7} 122, ${100 + shoulderWidth} 130, ${100 + shoulderWidth * 1.5} 185 Z" fill="url(#grad-${character.id}-${exp})" opacity="0.9" stroke="${color}" stroke-width="1.5"/>
            <!-- HUD刻度圆环 -->
            <circle cx="100" cy="80" r="56" fill="none" stroke="${color}" stroke-width="1.2" stroke-dasharray="6 6" opacity="0.5"/>
            <!-- 角色姓名首字 -->
            <text x="100" y="93" font-family="'Orbitron', 'PingFang SC', 'Microsoft YaHei', sans-serif" font-size="34" font-weight="bold" fill="#ffffff" text-anchor="middle" filter="drop-shadow(0px 2px 5px rgba(0,0,0,0.9))">
                ${nameInitial}
            </text>
            <!-- 徽章气泡 -->
            <circle cx="152" cy="48" r="18" fill="#0b1120" stroke="${color}" stroke-width="1.5"/>
            <text x="152" y="54" font-size="14" text-anchor="middle">${badge}</text>
            <!-- 底部姓名牌 (严禁标注任何“平静/生气”等情绪文字，仅保留角色名) -->
            <rect x="25" y="165" width="150" height="22" rx="4" fill="#000000" opacity="0.75" stroke="${color}" stroke-width="1"/>
            <text x="100" y="180" font-family="'PingFang SC', 'Microsoft YaHei', sans-serif" font-size="12" font-weight="bold" fill="${color}" text-anchor="middle" letter-spacing="1.5">
                ${character.name}
            </text>
        </svg>
        `;
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    },

    get(id) {
        if (!id || !this.npcs) return null;
        return this.npcs[id] || null;
    },

    getAll() {
        if (!this.npcs) return [];
        return Object.values(this.npcs);
    },

    // 资源预加载：仅缓存真正加载成功的图片；失败 URL 进黑名单，避免局内反复 404
    preloadedImages: new Set(),
    failedImages: new Set(),
    imageCache: (typeof Map !== "undefined") ? new Map() : null,

    isImageReady(img) {
        return !!(img && img.complete && img.naturalWidth > 0);
    },

    preloadImage(url) {
        if (!url || typeof Image === "undefined") return Promise.resolve(null);
        if (this.failedImages.has(url)) return Promise.resolve(null);
        this.preloadedImages.add(url);
        if (this.imageCache && this.imageCache.has(url)) {
            const cached = this.imageCache.get(url);
            if (this.isImageReady(cached)) return Promise.resolve(cached);
            this.imageCache.delete(url);
        }

        return new Promise((resolve) => {
            let settled = false;
            const finish = (imgOrNull) => {
                if (settled) return;
                settled = true;
                resolve(imgOrNull);
            };
            try {
                const img = new Image();
                const markOk = () => {
                    if (this.isImageReady(img)) {
                        if (this.imageCache) this.imageCache.set(url, img);
                        this.preloadedImages.add(url);
                        finish(img);
                    } else {
                        this.preloadedImages.delete(url);
                        this.failedImages.add(url);
                        finish(null);
                    }
                };
                const markFail = () => {
                    this.preloadedImages.delete(url);
                    this.failedImages.add(url);
                    if (this.imageCache) this.imageCache.delete(url);
                    finish(null);
                };
                img.onload = markOk;
                img.onerror = markFail;
                img.src = encodeURI(url);
                if (typeof img.decode === "function") {
                    img.decode().then(markOk).catch(() => {
                        if (img.complete) markOk();
                    });
                }
            } catch (e) {
                this.failedImages.add(url);
                finish(null);
            }
        });
    },

    /**
     * 返回当前表情最可能立刻显示的立绘 URL：
     * 优先已成功预热缓存 → 跳过已知失败 → 再回落候选队列
     */
    getBestPortraitUrl(character, expression = "clam") {
        const candidates = this.getCharacterImageCandidates(character, expression) || [];
        for (const url of candidates) {
            if (!url || this.failedImages.has(url)) continue;
            const cached = this.imageCache && this.imageCache.get(url);
            if (this.isImageReady(cached)) return url;
        }
        for (const url of candidates) {
            if (!url || this.failedImages.has(url)) continue;
            if (this.preloadedImages.has(url)) return url;
        }
        for (const url of candidates) {
            if (url && !this.failedImages.has(url)) return url;
        }
        return candidates[0] || "";
    },

    preloadCharacter(character) {
        if (!character) return Promise.resolve();
        const promises = [];
        if (character.avatarUrl) promises.push(this.preloadImage(character.avatarUrl));
        if (character.expressions) {
            Object.values(character.expressions).forEach(url => {
                if (url && typeof url === "string") {
                    promises.push(this.preloadImage(url));
                }
            });
        }
        // 额外预热候选探测前几项（兼容别名路径），减少局内 onerror 轮询
        ["clam", "happy", "angry", "dead"].forEach(exp => {
            const candidates = this.getCharacterImageCandidates(character, exp) || [];
            candidates.slice(0, 6).forEach(url => {
                if (url) promises.push(this.preloadImage(url));
            });
        });
        return Promise.all(promises);
    },

    preloadForLevel(levelConfig) {
        this.preloadImage("assets/level1_sketch.jpg");
        const candidates = (levelConfig && levelConfig.candidateNPCs) || [];
        if (candidates.length > 0) {
            candidates.forEach(c => {
                const char = this.get(c.id);
                if (char) this.preloadCharacter(char);
            });
        } else {
            this.getAll().forEach(char => this.preloadCharacter(char));
        }
    },

    preloadAll() {
        this.preloadImage("assets/level1_sketch.jpg");
        this.getAll().forEach(char => this.preloadCharacter(char));
    }
};

// 保持 morde 与 mode 双重映射兼容性
CharacterRegistry.npcs.morde = CharacterRegistry.npcs.mode;
CharacterRegistry.npcs.kaluo = CharacterRegistry.npcs.kaze;
CharacterRegistry.npcs.luzhixing = CharacterRegistry.npcs.prof_lu;
CharacterRegistry.npcs.dr_elsa = CharacterRegistry.npcs.elsa;

// 浏览器空闲期静默预热全部角色立绘资源
if (typeof window !== "undefined") {
    const idlePreload = window.requestIdleCallback || ((cb) => setTimeout(cb, 600));
    idlePreload(() => {
        if (typeof CharacterRegistry.preloadAll === "function") {
            CharacterRegistry.preloadAll();
        }
    });
}
