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
        // NPC 1：卡泽 (男，文字框蓝色，文件夹 kaze)
        kaze: {
            id: "kaze",
            folder: "kaze",
            name: "卡泽",
            gender: "男",
            themeColor: "#38bdf8", // 科技明蓝
            boxBorderColor: "rgba(56, 189, 248, 0.9)",
            boxBgGlow: "rgba(56, 189, 248, 0.25)",
            avatarUrl: "assets/characters/kaze/clam.webp",
            expressions: {
                clam: "assets/characters/kaze/clam.webp",     // 平静 (无指示时的默认照片，极速 WebP)
                happy: "assets/characters/kaze/happy.webp",   // 开心 / 微笑
                sad: "assets/characters/kaze/sad.webp",       // 悲伤 / 沮丧
                normal: "assets/characters/kaze/normal.webp", // 正常
                angry: "assets/characters/kaze/angry.webp",   // 生气 / 质问
                doubt: "assets/characters/kaze/doubt.webp",   // 疑惑 / 审视
                shock: "assets/characters/kaze/shock.webp",   // 震惊 / 错愕
                dead: "assets/characters/kaze/dead.webp"      // 遇害 / 死亡
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
                        hint: "成功带领卡泽撤离至终点脱出",
                        unlockType: "evacuate_with",
                        threshold: 1
                    },
                    {
                        id: "kaze_instinct",
                        title: "因果逆流直觉",
                        desc: "在过往某次闭环中曾目睹时间逆转的幻象，对拟态伪装体脸部神经的抽搐有着超乎常人的辨识嗅觉。",
                        hint: "卡泽存活且在队时成功指认或放逐伪人",
                        unlockType: "exile_wolf_with",
                        threshold: 1
                    },
                    {
                        id: "kaze_resolve",
                        title: "终末决绝",
                        desc: "若自己不幸遭到高熵伪装体同化，会在意识彻底崩解前将自己锁死在减压气阀内，绝不向队友挥动利刃。",
                        hint: "见证卡泽在黑夜中遇害牺牲或被禁锢",
                        unlockType: "suffer_fate",
                        threshold: 1
                    }
                ],
                passiveSkill: {
                    name: "战术反制 (Tactical Counter)",
                    icon: "🛡️",
                    desc: "当夜间潜伏伪装体选定卡泽为刺杀目标时，有 35% 概率由卡泽反制脱身，强制转化为平安夜！"
                },
                exclusiveBranch: {
                    levelId: 101,
                    badge: "EX-K",
                    title: "扇区 EX-K：孤狼战术突破",
                    subtitle: "卡泽主导视角 · 单兵诱敌潜入回廊",
                    desc: "以卡泽单兵前锋视角展开的特殊突破行动。在重度感染的机房深处开辟通道，直面拟态巢穴。"
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
        
        // 支持 mode 与 morde 别名映射
        const folders = [folder];
        if (folder === "mode") folders.push("morde");
        if (folder === "morde") folders.push("mode");
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

    // 资源极低成本静默预加载系统 (零主线程消耗、即点即现)
    preloadedImages: new Set(),
    imageCache: (typeof Map !== "undefined") ? new Map() : null,

    preloadImage(url) {
        if (!url || typeof Image === "undefined") return Promise.resolve(null);
        if (this.imageCache && this.imageCache.has(url)) {
            return Promise.resolve(this.imageCache.get(url));
        }
        if (this.preloadedImages.has(url)) return Promise.resolve(null);
        this.preloadedImages.add(url);

        return new Promise((resolve) => {
            try {
                const img = new Image();
                img.src = encodeURI(url);
                if (this.imageCache) {
                    this.imageCache.set(url, img);
                }
                // 现代浏览器支持异步离线解码，彻底避免首次渲染的主线程掉帧卡顿
                if (typeof img.decode === "function") {
                    img.decode().then(() => resolve(img)).catch(() => resolve(img));
                } else {
                    img.onload = () => resolve(img);
                    img.onerror = () => resolve(img);
                }
            } catch (e) {
                resolve(null);
            }
        });
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
        return Promise.all(promises);
    },

    preloadForLevel(levelConfig) {
        // 1. 预加载关卡手绘地图
        this.preloadImage("assets/level1_sketch.jpg");

        // 2. 预加载本关卡候选NPC全套表情
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

// 浏览器空闲期静默预热全部角色立绘资源
if (typeof window !== "undefined") {
    const idlePreload = window.requestIdleCallback || ((cb) => setTimeout(cb, 600));
    idlePreload(() => {
        if (typeof CharacterRegistry.preloadAll === "function") {
            CharacterRegistry.preloadAll();
        }
    });
}
