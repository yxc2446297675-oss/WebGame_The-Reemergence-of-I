/**
 * DOPPELGANGER 完整打包脚本 (开箱即用，支持 file:// 本地双击直接畅玩)
 * 自动生成于 2026-09-09T03:34:40.124Z
 */
(function() {
    'use strict';

    // =========================================================================
    // 模块: config.js
    // =========================================================================
/**
 * 游戏核心配置表 (Game Configuration)
 * 允许用户极简修改身份名称、世界观用词、体力与概率参数
 */

const WorldviewConfig = {
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
const StaminaConfig = {
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
const EveningTriggerConfig = {
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
const NightAttackConfig = {
    // 伪人每晚必定自主猎杀（无论玩家选择什么，必定刀人 100%）
    getChance(teamCount) {
        return 1.00;
    }
};

// =========================================================================
// 遇害展现与音效配置表 (Death Reveal & Audio Configuration)
// =========================================================================
const AudioConfig = {
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

    // 5. 第四关专属通关异象音效 (放入 assets/audio/ 文件夹即可自动播放，支持 mp3/wav/ogg)
    level4EndingSoundUrl: "assets/audio/level4_ending.mp3",
    level4EndingSoundVolume: 0.90,

    // 是否在自定义音效文件未就绪时，使用内置的高质科幻合成音效作为兜底发声
    useFallbackSynthesizer: true
};

const DeathRevealConfig = {
    // 夜晚行动结束后，纯黑屏悬念时长（毫秒，默认 2000 即 2 秒）
    blackScreenDurationMs: 2000,

    // 死者渐渐浮现动画过渡时长（毫秒，默认 1200 即 1.2 秒）
    fadeInDurationMs: 1200
};


    // =========================================================================
    // 模块: audio.js
    // =========================================================================
/**
 * 纯前端 Web Audio API 过程式科幻音效引擎 (Zero External Assets)
 * 纯代码实时合成音频震荡波，无需下载任何 mp3/wav 即可发声
 * 内置移动端 Webview 触摸自动解锁机制
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.initialized = false;
        this.audioCache = new Map();
        this.audioBuffers = new Map();
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
                this.initialized = true;
            }
        } catch (e) {
            console.warn("Web Audio API not supported", e);
        }
    }

    // 触摸解锁：应对手机浏览器及 iOS Safari / WebView 的 Autoplay Policy 限制
    unlock() {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        // iOS Safari 唤醒：触发一个 1-frame 静音 buffer 彻底激活硬件声道
        if (this.ctx && typeof this.ctx.createBuffer === "function") {
            try {
                const buffer = this.ctx.createBuffer(1, 1, 22050);
                const source = this.ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(this.ctx.destination);
                source.start(0);
            } catch (e) {
                // ignore
            }
        }
    }

    // 1. 科幻打字/按钮滴答音 (Tick/Blip)
    playTick() {
        if (this.isMuted || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.04);

        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.04);
    }

    // 2. 辩论核心标志性音效：提出怀疑！(Doubt Bass Impact)
    playDoubt() {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        
        // 低频下潜重击
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);

        // 高频紧张警报谐波
        const alertOsc = this.ctx.createOscillator();
        const alertGain = this.ctx.createGain();
        alertOsc.type = "square";
        alertOsc.frequency.setValueAtTime(620, now);
        alertOsc.frequency.setValueAtTime(580, now + 0.1);
        alertGain.gain.setValueAtTime(0.12, now);
        alertGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        alertOsc.connect(alertGain);
        alertGain.connect(this.ctx.destination);
        alertOsc.start(now);
        alertOsc.stop(now + 0.25);
    }

    // 3. 赞同与附和 (Agree Chime)
    playAgree() {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    // 4. 辩护与反驳 (Defend Shield)
    playDefend() {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(640, now + 0.12);
        osc.frequency.linearRampToValueAtTime(480, now + 0.25);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    // 5. 投票放逐与冷冻舱启动 (Cold Sleep Alert)
    playColdSleep() {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 1.2);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 1.2);
    }

    // 6. 胜利与战败提示音
    playVictory() {
        if (this.isMuted || !this.ctx) return;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const start = this.ctx.currentTime + idx * 0.12;
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.18, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(start);
            osc.stop(start + 0.3);
        });
    }

    playDefeat() {
        if (this.isMuted || !this.ctx) return;
        [300, 260, 220, 160].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const start = this.ctx.currentTime + idx * 0.15;
            osc.type = "sawtooth";
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.2, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(start);
            osc.stop(start + 0.35);
        });
    }

    // 异步预加载音频文件到缓存池 (同时支持 HTML5 Audio 实例预热与 Web Audio API 内存直接解码)
    preloadAudio(primaryUrl) {
        if (!primaryUrl) return Promise.resolve(null);
        if (this.audioBuffers && this.audioBuffers.has(primaryUrl)) {
            return Promise.resolve(this.audioBuffers.get(primaryUrl));
        }

        return new Promise((resolve) => {
            let resolved = false;
            const done = () => {
                if (!resolved) {
                    resolved = true;
                    resolve(null);
                }
            };

            // 1. HTML5 Audio 实例预热与 load() 调用 (确保移动端浏览器立刻发起音频数据缓冲)
            if (typeof Audio !== "undefined" && !this.audioCache.has(primaryUrl)) {
                try {
                    const safeUrl = encodeURI(primaryUrl);
                    const audio = new Audio(safeUrl);
                    audio.preload = "auto";
                    if (typeof audio.addEventListener === "function") {
                        audio.addEventListener("canplaythrough", done, { once: true });
                        audio.addEventListener("loadeddata", done, { once: true });
                        audio.addEventListener("error", done, { once: true });
                    }
                    if (typeof audio.load === "function") {
                        audio.load();
                    }
                    this.audioCache.set(primaryUrl, audio);
                } catch (e) {
                    done();
                }
            }

            // 2. 若 Web Audio 上下文可用，异步抓取二进制并解码至物理内存 AudioBuffer (极速 0ms 硬件发声)
            if (this.ctx && typeof fetch === "function") {
                try {
                    const safeUrl = encodeURI(primaryUrl);
                    fetch(safeUrl)
                        .then(res => (res.ok ? res.arrayBuffer() : null))
                        .then(arrayBuffer => {
                            if (arrayBuffer && this.ctx && typeof this.ctx.decodeAudioData === "function") {
                                return this.ctx.decodeAudioData(arrayBuffer);
                            }
                            return null;
                        })
                        .then(decodedBuffer => {
                            if (decodedBuffer) {
                                this.audioBuffers.set(primaryUrl, decodedBuffer);
                            }
                            done();
                        })
                        .catch(() => done());
                } catch (e) {
                    done();
                }
            } else {
                setTimeout(done, 150);
            }
        });
    }

    // 预热加载游戏核心外置音效
    preloadDefaults() {
        if (typeof AudioConfig !== "undefined") {
            [AudioConfig.moveSoundUrl, AudioConfig.foodSoundUrl, AudioConfig.alarmSoundUrl, AudioConfig.deathSoundUrl]
                .filter(Boolean)
                .forEach(url => this.preloadAudio(url));
        }
    }

    // 通用外部音频文件播放器（优先使用 0 延迟 Web Audio 解码缓存，降级使用 HTML5 Audio 实例池与程序合成）
    playAudioFile(primaryUrl, volume, fallbackFn, label = "音频") {
        if (this.isMuted) return;

        // 1. 优先使用已解码的 Web Audio 内存缓冲区播放 (移动端 0 延迟、0 并发限制、绝不卡顿)
        if (this.ctx && this.audioBuffers && this.audioBuffers.has(primaryUrl)) {
            try {
                if (this.ctx.state === "suspended") {
                    this.ctx.resume();
                }
                const buffer = this.audioBuffers.get(primaryUrl);
                if (buffer) {
                    const source = this.ctx.createBufferSource();
                    const gain = this.ctx.createGain();
                    gain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
                    source.buffer = buffer;
                    source.connect(gain);
                    gain.connect(this.ctx.destination);
                    source.start(0);
                    return;
                }
            } catch (e) {
                // 降级使用 HTML5 Audio
            }
        }

        // 2. 降级使用 HTML5 Audio 缓存播放
        if (typeof Audio !== "undefined" && primaryUrl) {
            try {
                let audio = this.audioCache.get(primaryUrl);
                if (audio) {
                    // 若缓存实例正在播放，克隆节点实现无等待并发混音
                    if (!audio.paused && audio.currentTime > 0) {
                        audio = audio.cloneNode();
                    } else {
                        audio.currentTime = 0;
                    }
                } else {
                    const safeUrl = encodeURI(primaryUrl);
                    audio = new Audio(safeUrl);
                    if (typeof audio.load === "function") audio.load();
                    this.audioCache.set(primaryUrl, audio);
                }

                audio.volume = Math.max(0, Math.min(1, volume));
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        // 播放成功
                    }).catch(err => {
                        // 若转义路径加载失败，尝试原始URL二次加载
                        try {
                            const rawAudio = new Audio(primaryUrl);
                            rawAudio.volume = Math.max(0, Math.min(1, volume));
                            const rawPromise = rawAudio.play();
                            if (rawPromise !== undefined) {
                                rawPromise.catch(() => {
                                    if (fallbackFn) fallbackFn.call(this);
                                });
                            }
                        } catch (e2) {
                            if (fallbackFn) fallbackFn.call(this);
                        }
                    });
                }
            } catch (e) {
                if (fallbackFn) fallbackFn.call(this);
            }
        } else {
            if (fallbackFn) fallbackFn.call(this);
        }
    }

    // 7. 遇害死者揭晓专属音效 (支持自定义 death.mp3 + Web Audio 惊悚重音保底)
    playDeathSound(customUrl = null) {
        const soundUrl = customUrl || (typeof AudioConfig !== 'undefined' && AudioConfig.deathSoundUrl) || "assets/audio/death.mp3";
        const volume = (typeof AudioConfig !== 'undefined' && AudioConfig.deathSoundVolume !== undefined) ? AudioConfig.deathSoundVolume : 0.85;
        this.playAudioFile(soundUrl, volume, this.synthesizeDeathImpact, "遇害死亡音效");
    }

    // 8. 物资获取/食物发现专属音效 (支持自定义 物资获取.wav + Web Audio 能量充能铃音保底)
    playFoodSound(customUrl = null) {
        const soundUrl = customUrl || (typeof AudioConfig !== 'undefined' && AudioConfig.foodSoundUrl) || "assets/audio/物资获取.wav";
        const volume = (typeof AudioConfig !== 'undefined' && AudioConfig.foodSoundVolume !== undefined) ? AudioConfig.foodSoundVolume : 0.80;
        this.playAudioFile(soundUrl, volume, this.synthesizeFoodChime, "物资获取音效");
    }

    // 9. 广播警报/危险警告专属音效 (支持自定义 警告.wav + Web Audio 红警蜂鸣双音保底)
    playAlarmSound(customUrl = null) {
        const soundUrl = customUrl || (typeof AudioConfig !== 'undefined' && AudioConfig.alarmSoundUrl) || "assets/audio/警告.wav";
        const volume = (typeof AudioConfig !== 'undefined' && AudioConfig.alarmSoundVolume !== undefined) ? AudioConfig.alarmSoundVolume : 0.85;
        this.playAudioFile(soundUrl, volume, this.synthesizeAlarmKlaxon, "广播警报音效");
    }

    // 10. 移动探索位移专属音效 (支持自定义 移动.wav + Web Audio 气动步进音保底)
    playMoveSound(customUrl = null) {
        const now = Date.now();
        if (this.lastMoveSoundTime && now - this.lastMoveSoundTime < 120) return;
        this.lastMoveSoundTime = now;

        const soundUrl = customUrl || (typeof AudioConfig !== 'undefined' && AudioConfig.moveSoundUrl) || "assets/audio/移动.wav";
        const volume = (typeof AudioConfig !== 'undefined' && AudioConfig.moveSoundVolume !== undefined) ? AudioConfig.moveSoundVolume : 0.65;
        this.playAudioFile(soundUrl, volume, this.synthesizeMoveStep, "移动音效");
    }

    // 11. 第四关专属通关异象音效 (X实体逼近贴合时触发)
    playLevel4EndingSound(customUrl = null) {
        const soundUrl = customUrl || (typeof AudioConfig !== 'undefined' && AudioConfig.level4EndingSoundUrl) || "assets/audio/level4_ending.mp3";
        const volume = (typeof AudioConfig !== 'undefined' && AudioConfig.level4EndingSoundVolume !== undefined) ? AudioConfig.level4EndingSoundVolume : 0.90;
        this.playAudioFile(soundUrl, volume, this.synthesizeLevel4Glitch, "第四关异象音效");
    }

    // 过程式实时合成：深邃未知的低频脉冲与异化共鸣 (Eerie Sub-bass Pulse & Metallic Glitch)
    synthesizeLevel4Glitch() {
        this.init();
        if (this.isMuted || !this.ctx) return;

        const now = this.ctx.currentTime;

        // 1. 低频心悸嗡鸣 (Sawtooth 80Hz -> 25Hz)
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = "sawtooth";
        subOsc.frequency.setValueAtTime(80, now);
        subOsc.frequency.exponentialRampToValueAtTime(25, now + 1.6);
        subGain.gain.setValueAtTime(0.38, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
        subOsc.connect(subGain);
        subGain.connect(this.ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + 1.8);

        // 2. 高频异化回旋共鸣 (Sine dissonance 520Hz <-> 528Hz 拍频)
        [520, 528].forEach((freq) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + 0.1);
            gain.gain.setValueAtTime(0.12, now + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + 0.1);
            osc.stop(now + 1.5);
        });
    }

    // 过程式实时合成：震撼的死亡警报低频冲击波 (Sub-bass Impact + Alarm Flatline)
    synthesizeDeathImpact() {
        this.init();
        if (this.isMuted || !this.ctx) return;

        const now = this.ctx.currentTime;

        // A. 低频沉重下潜重击 (Sawtooth Drop 160Hz -> 32Hz)
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = "sawtooth";
        subOsc.frequency.setValueAtTime(160, now);
        subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.9);

        subGain.gain.setValueAtTime(0.45, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

        subOsc.connect(subGain);
        subGain.connect(this.ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + 1.1);

        // B. 刺耳的惊悚减五度失真警报 (Eb4 / Bb4 Dissonance)
        const alertOsc = this.ctx.createOscillator();
        const alertGain = this.ctx.createGain();
        alertOsc.type = "square";
        alertOsc.frequency.setValueAtTime(466.16, now);
        alertOsc.frequency.setValueAtTime(311.13, now + 0.2);

        alertGain.gain.setValueAtTime(0.18, now);
        alertGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        alertOsc.connect(alertGain);
        alertGain.connect(this.ctx.destination);
        alertOsc.start(now);
        alertOsc.stop(now + 0.8);

        // C. 心跳骤停长音脉冲 (Flatline Tone)
        const lineOsc = this.ctx.createOscillator();
        const lineGain = this.ctx.createGain();
        lineOsc.type = "sine";
        lineOsc.frequency.setValueAtTime(780, now + 0.1);
        lineGain.gain.setValueAtTime(0.1, now + 0.1);
        lineGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

        lineOsc.connect(lineGain);
        lineGain.connect(this.ctx.destination);
        lineOsc.start(now + 0.1);
        lineOsc.stop(now + 0.7);
    }

    // 过程式实时合成：清脆晶莹的物资补给充能琶音 (Food/Supplies Energy Chime)
    synthesizeFoodChime() {
        this.init();
        if (this.isMuted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 闪烁上扬琶音
        freqs.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const start = now + idx * 0.08;

            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, start);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.05, start + 0.25);

            gain.gain.setValueAtTime(0.2, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(start);
            osc.stop(start + 0.3);
        });
    }

    // 过程式实时合成：紧急警报红光双重脉冲鸣响 (Broadcast Warning Siren)
    synthesizeAlarmKlaxon() {
        this.init();
        if (this.isMuted || !this.ctx) return;

        const now = this.ctx.currentTime;
        [0, 0.28].forEach((offset) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const start = now + offset;

            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(880, start);
            osc.frequency.exponentialRampToValueAtTime(587.33, start + 0.22); // A5 -> D5 急促下滑

            gain.gain.setValueAtTime(0.25, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(start);
            osc.stop(start + 0.25);
        });
    }

    // 过程式实时合成：科幻舱室气压/脚步踏步位移音 (Movement Step Whoosh)
    synthesizeMoveStep() {
        this.init();
        if (this.isMuted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }
}

const Sound = new SoundEngine();

// 移动端/iOS Safari 首次手势（触摸/点击/轻扫）全局静默激活音频上下文并预热音频
if (typeof window !== "undefined") {
    const autoUnlock = () => {
        Sound.unlock();
        if (typeof Sound.preloadDefaults === "function") {
            Sound.preloadDefaults();
        }
        ["touchstart", "touchend", "pointerdown", "click", "keydown"].forEach(evt => {
            window.removeEventListener(evt, autoUnlock, true);
        });
    };
    ["touchstart", "touchend", "pointerdown", "click", "keydown"].forEach(evt => {
        window.addEventListener(evt, autoUnlock, { capture: true, passive: true, once: true });
    });

    // 浏览器空闲期自动预热核心音效
    const idlePreload = window.requestIdleCallback || ((cb) => setTimeout(cb, 400));
    idlePreload(() => {
        if (typeof Sound.preloadDefaults === "function") {
            Sound.preloadDefaults();
        }
    });
}



    // =========================================================================
    // 模块: characters.js
    // =========================================================================
/**
 * 角色模型与预设配置 (Characters Definition)
 * 包含多表情差分立绘系统 (Expression Sprite System)
 * 支持表情：default(平静), angry(生气), doubt(疑惑), sad(悲伤), smile(微笑), shock(震惊)
 */

const CharacterRegistry = {
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
        // NPC 1：卡罗 (男，文字框蓝色，文件夹 kaze)
        kaze: {
            id: "kaze",
            folder: "kaze",
            name: "卡罗",
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

        // NPC 7：陆知行 (男，首席科学官，文件夹 Prof. Lu)
        prof_lu: {
            id: "prof_lu",
            folder: "Prof. Lu",
            name: "陆知行",
            gender: "男",
            themeColor: "#10b981",
            boxBorderColor: "rgba(16, 185, 129, 0.9)",
            boxBgGlow: "rgba(16, 185, 129, 0.25)",
            avatarUrl: "assets/characters/Prof. Lu/calm.png",
            expressions: {
                clam: "assets/characters/Prof. Lu/calm.png",
                calm: "assets/characters/Prof. Lu/calm.png",
                normal: "assets/characters/Prof. Lu/calm.png",
                angry: "assets/characters/Prof. Lu/angry.png",
                dead: "assets/characters/Prof. Lu/dead.jpg"
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

        // NPC 8：艾尔莎 (女，主治军医，文件夹 Dr. Elsa)
        elsa: {
            id: "elsa",
            folder: "Dr. Elsa",
            name: "艾尔莎",
            gender: "女",
            themeColor: "#06b6d4",
            boxBorderColor: "rgba(6, 182, 212, 0.9)",
            boxBgGlow: "rgba(6, 182, 212, 0.25)",
            avatarUrl: "assets/characters/Dr. Elsa/calm.jpg",
            expressions: {
                clam: "assets/characters/Dr. Elsa/calm.jpg",
                calm: "assets/characters/Dr. Elsa/calm.jpg",
                normal: "assets/characters/Dr. Elsa/calm.jpg",
                angry: "assets/characters/Dr. Elsa/angry.jpg",
                dead: "assets/characters/Dr. Elsa/dead.jpg"
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


    // =========================================================================
    // 模块: spaceshipMasterMap.js
    // =========================================================================
/**
 * 宇宙飞船基地母蓝图系统 (Spaceship Master Map Blueprint)
 * 包含整舰 58 间功能舱室的完整几何拓扑、房间外观类型、透视微缩机械设备，
 * 以及支持 5 个梯级（1~5, 6~10, 11~15, 16~20, 21~25）的子区域解锁裁剪机制。
 *
 * NPC 专属私人舱室系统 (NPC Private Quarters System)
 * 每个 NPC (包括主角) 拥有一个专属私人舱室，默认上锁，仅当本局队伍中带有该 NPC 时才解锁。
 * 一旦解锁，后续即便该 NPC 死亡或离队也可通行。
 * 每个 NPC 房间仅与一个普通房间相连（单向连接），且彼此不相邻。
 * 代码结构预留 12 个 NPC 房间槽位 (getNpcRoomDefs)，当前激活 4 个（主角+3个NPC）。
 */

const MASTER_ROOM_DEFS = {
    // =========================================================================
    // 1. 舰艏指挥中枢 (Bow: Command & Sensor Array, Y=0)
    // =========================================================================
    "room_sensor_array": {
        id: "room_sensor_array",
        name: "【深空雷达穹顶】舰艏天线阵列",
        zone: "bow",
        coord: { x: 1, y: 0 },
        shape: "sensor_dome",
        equipment: "sensor_dome",
        desc: "巨大的偏振抛物面天线正在缓慢旋转，收集来自深空深处的微弱引力波信号。"
    },
    "room_tactical_plan": {
        id: "room_tactical_plan",
        name: "【战术推演室】星域沙盘厅",
        zone: "bow",
        coord: { x: 2, y: 0 },
        shape: "tactical_wedge",
        equipment: "tactical_sandtable",
        desc: "中央沙盘悬浮着当前星区的立体投影，红蓝光标标示着可能的空间坍缩节点。"
    },
    "room_bridge_sub": {
        id: "room_bridge_sub",
        name: "【副官值班舱】战备前哨台",
        zone: "bow",
        coord: { x: 3, y: 0 },
        shape: "bridge_sub",
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
        shape: "ai_core_hex",
        equipment: "server_rack",
        desc: "数百组浸泡在液氮中的超导处理器机柜静默嗡鸣，飞船的中枢意识在此奔流。"
    },
    "room_comm_center": {
        id: "room_comm_center",
        name: "【全舰应急广播总站】避难通牒发射台",
        zone: "bow",
        coord: { x: 6, y: 0 },
        shape: "comm_tower",
        equipment: "comm_station",
        desc: "全舰高音强光应急广播主控台。红色广播麦克风仍保持在【紧急全舰通播】档位，记录着主角在爆炸发生前向全员下达'全员立即撤往休眠舱'的最后避难通牒！"
    },
    "room_observation": {
        id: "room_observation",
        name: "【环景天象台】星穹眺望厅",
        zone: "bow",
        coord: { x: 7, y: 0 },
        shape: "observation_dome",
        equipment: "star_lens",
        desc: "大角度曲面观察舱，浩瀚的星云与流动的虚数裂缝在此一览无余。"
    },

    // =========================================================================
    // 2. 舰体西翼：生物医疗与科研区 (Port: Research & Bio-Science, Y=1~2)
    // =========================================================================
    "room_specimen_vault": {
        id: "room_specimen_vault",
        name: "【异构标本特种库】高危冷藏间（盗货目标物）",
        zone: "research",
        coord: { x: 0, y: 1 },
        shape: "specimen_vault",
        equipment: "cargo_grid",
        desc: "多重气锁密封的低温样本柜中，存放着价值连城的未知深空异构高熵晶体。防盗锁上有被激光切割尝试撬动的痕迹，这正是作案者铤而走险的真正盗货动因！"
    },
    // Level 1 原版节点 13: 终点脱离大门
    "room_exit": {
        id: "room_exit",
        name: "【脱离大门】主跃迁逃生舱 (终点)",
        zone: "hub",
        coord: { x: 1, y: 1 },
        shape: "star_gate_arch",
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
        shape: "corner_elbow",
        equipment: "security_gate",
        desc: "这里的应急指示灯亮起显眼的绿色，左侧就是通向地表的终点气密门！"
    },
    // Level 1 原版节点 5: 东北尽头储藏室 (食物)
    "room_storage_ne": {
        id: "room_storage_ne",
        name: "【东北储藏室】应急给养站",
        zone: "hub",
        coord: { x: 3, y: 1 },
        shape: "cargo_depot",
        equipment: "cargo_grid",
        desc: "货架上存放着完好无损的自热战备口粮与纯净水储罐！"
    },
    "room_bio_corridor": {
        id: "room_bio_corridor",
        name: "【生化联络走廊】气压过渡廊",
        zone: "research",
        coord: { x: 4, y: 1 },
        shape: "bio_chamber",
        equipment: "airlock_dock",
        desc: "喷雾消杀喷嘴在感应到移动时发出嘶嘶轻响，地面整洁冰冷。"
    },
    "room_med_surgery": {
        id: "room_med_surgery",
        name: "【纳米手术舱 · 生化检测室】全自动急救台",
        zone: "medical",
        coord: { x: 5, y: 1 },
        shape: "medical_cross",
        equipment: "medical_bed",
        isDetectionRoom: true, // 特殊：进入时触发伪人数量检测播报
        desc: "悬吊的纳米机械臂保持着待机姿态，生化检测终端在手术台上投下清冷光晕。"
    },
    "room_cryo_stasis": {
        id: "room_cryo_stasis",
        name: "【深潜休眠矩阵舱】全员撤离与神经接驳原点",
        zone: "living",
        coord: { x: 6, y: 1 },
        shape: "cryo_array",
        equipment: "cryo_pods",
        desc: "数十具人体工学冷冻舱整齐排布。在全舰过热爆炸危机中，全员依照广播指令撤入此地冷冻休眠。中央接驳台上电极紧贴主角头部，24 次跨时空切片还原正是从这里启动！"
    },
    "room_decon_airlock": {
        id: "room_decon_airlock",
        name: "【前沿技术科室】黑匣子神经定格站（二号芯片失窃点）",
        zone: "research",
        coord: { x: 7, y: 1 },
        shape: "airlock_dock",
        equipment: "server_rack",
        desc: "休眠舱隔壁的绝密新技术科室。这里研发了【黑匣子时空定格技术】——可在停电与受创瞬间全景记录全员位置！然而中央控制台的【二号校验芯片】已被盗走，残留下的恶性数据 Bug 阻碍着真相重现！"
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
        shape: "secure_bunker",
        equipment: "medical_bed",
        desc: "厚重的隔音门虚掩着，里面倒着一名身材高大、身着防爆背心的男人。"
    },
    // Level 1 原版节点 9: 西北岔路
    "room_junction_nw": {
        id: "room_junction_nw",
        name: "【西北岔路】通风十字口",
        zone: "hub",
        coord: { x: 1, y: 2 },
        shape: "junction_cross",
        equipment: "workshop_tools",
        desc: "通道在此向左通往隔离室，向右折向上层出口通道，冷风从北面灌入。"
    },
    // Level 1 原版节点 11: 北向联络回廊
    "room_path_e": {
        id: "room_path_e",
        name: "【北向连接道】中继过渡间",
        zone: "hub",
        coord: { x: 2, y: 2 },
        shape: "corridor_v",
        equipment: "workshop_tools",
        desc: "脚下的合金格栅发出空洞的回响，前方通向东北侧拐弯口。"
    },
    // Level 1 原版节点 4: 中区枢纽
    "room_hub_n1": {
        id: "room_hub_n1",
        name: "【中区枢纽】分流控制室",
        zone: "hub",
        coord: { x: 3, y: 2 },
        shape: "corridor_h",
        equipment: "bridge_console",
        desc: "正前方是紧闭的物资库防爆闸门，右侧通道与东侧急救点相通。"
    },
    // Level 1 原版节点 3: NPC 2 邵可欣房间
    "room_npc2": {
        id: "room_npc2",
        name: "【东侧备勤室】医护角落",
        zone: "hub",
        coord: { x: 4, y: 2 },
        shape: "crew_cabin",
        equipment: "medical_bed",
        desc: "这里似乎曾是一处临时急救点，一名系着救援缎带的少女正昏迷在桌旁。"
    },
    "room_living_quarter": {
        id: "room_living_quarter",
        name: "【乘组起居舱】温馨生活角",
        zone: "living",
        coord: { x: 5, y: 2 },
        shape: "living_quarters",
        equipment: "cryo_pods",
        desc: "床头贴着地球家园的旧照片，暖黄色的床头灯为冰冷金属平添几分温存。"
    },
    "room_hydro_garden": {
        id: "room_hydro_garden",
        name: "【立体水培温室】绿光生态舱",
        zone: "ecology",
        coord: { x: 6, y: 2 },
        shape: "hydro_dome",
        equipment: "hydroponics",
        desc: "无土水培种植架上生机盎然，青绿的叶片在粉紫补光灯下静默舒展。"
    },
    "room_mess_hall": {
        id: "room_mess_hall",
        name: "【舰员配给餐厅】自动餐吧",
        zone: "living",
        coord: { x: 7, y: 2 },
        shape: "mess_hall",
        equipment: "cargo_grid",
        desc: "合成食品贩卖机指示灯闪烁，餐桌整齐排列，空气中弥漫着烤面包香气。"
    },
    "room_east_observation": {
        id: "room_east_observation",
        name: "【右舷景观走廊】沉思回廊",
        zone: "living",
        coord: { x: 8, y: 2 },
        shape: "observation_bay_e",
        equipment: "star_lens",
        desc: "右舷宽幅落地视窗，可俯瞰飞船巨大的散热翼板与壮丽的深空脉冲。"
    },

    // =========================================================================
    // 4. 舰体中层：手绘起点线与中央动力井 (Mid Deck: Start Deck & Gravity Well, Y=3)
    // =========================================================================
    // Level 1 原版节点 8: 西侧尽头 (食物)
    "room_west_end": {
        id: "room_west_end",
        name: "【主配电值班舱】全舰停电始发地",
        zone: "hub",
        coord: { x: 0, y: 3 },
        shape: "airlock_dock_w",
        equipment: "cargo_grid",
        desc: "全舰高压配电分流箱与紧急断路总闸坐落于此。此刻电闸手柄被暴力拉下，保护锁被硬物砸毁，全舰大断电与时空定格的作案第一现场！角落储物柜还幸存着未受损的能量棒。"
    },
    // Level 1 原版节点 7: NPC 1 卡罗房间
    "room_npc1": {
        id: "room_npc1",
        name: "【西区整备间】动力操作台",
        zone: "hub",
        coord: { x: 1, y: 3 },
        shape: "workshop_tactical",
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
        name: "【起点】苏醒密封厅（神经切片投影处）",
        zone: "hub",
        coord: { x: 3, y: 3 },
        shape: "hub_central_oct",
        equipment: "airlock_dock",
        desc: "主角在神经接驳中意识投影的初始落脚点。由于关键芯片失窃与程序 Bug，记忆发生严重逆向断片，只记得周围剧烈的震荡、火光与烧焦味道。"
    },
    // Level 1 原版节点 2: 右下拐角
    "room_corner_se": {
        id: "room_corner_se",
        name: "【东下拐角】管线通道",
        zone: "hub",
        coord: { x: 4, y: 3 },
        shape: "corner_elbow",
        equipment: "workshop_tools",
        desc: "粗大的冷却管线在头顶发出嗡鸣，地面有些积水，通往东侧舱室。"
    },
    "room_gravity_well": {
        id: "room_gravity_well",
        name: "【人工重力总井】重力发生核",
        zone: "engineering",
        coord: { x: 5, y: 3 },
        shape: "gravity_torus",
        equipment: "shield_coil",
        desc: "深邃的垂直竖井中央悬浮着高频旋转的奇异质点，维持着全舰 1.0G 的重力场。"
    },
    "room_armory": {
        id: "room_armory",
        name: "【舰载武装军械库】防爆军火库",
        zone: "security",
        coord: { x: 6, y: 3 },
        shape: "armory_vault",
        equipment: "workshop_tools",
        desc: "重型防爆装甲架上锁闭着电磁脉冲步枪，红外激光防盗光网保持戒备。"
    },
    "room_recreation_gym": {
        id: "room_recreation_gym",
        name: "【失重体能训练馆】体能维持舱",
        zone: "living",
        coord: { x: 7, y: 3 },
        shape: "recreation_bay",
        equipment: "tactical_sandtable",
        desc: "阻力离心机与抗肌肉萎缩跑台已断电停转，地毯上散落着运动毛巾。"
    },
    "room_east_airlock": {
        id: "room_east_airlock",
        name: "【东侧外勤气闸】右舷应急闸",
        zone: "living",
        coord: { x: 8, y: 3 },
        shape: "airlock_dock_e",
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
        shape: "salvage_hopper",
        equipment: "workshop_tools",
        desc: "金属粉碎齿轮巨大的阴影投在铁屑池中，自动化熔炉尚有残存余热。"
    },
    "room_cargo_lift": {
        id: "room_cargo_lift",
        name: "【重载物资升降井】垂直干线",
        zone: "engineering",
        coord: { x: 1, y: 4 },
        shape: "lift_shaft",
        equipment: "cargo_grid",
        desc: "可承载数吨货物的液压提升平台，上下连接着工程甲板与主生活区。"
    },
    "room_sub_generator": {
        id: "room_sub_generator",
        name: "【辅助等离子发电站】二号辅电站",
        zone: "engineering",
        coord: { x: 2, y: 4 },
        shape: "generator_twin",
        equipment: "reactor_core",
        desc: "四组中型等离子发生球体发出深蓝电火花，为下层走廊提供备用电力。"
    },
    "room_hangar_deck": {
        id: "room_hangar_deck",
        name: "【主穿梭机库甲板】停机坪甲板",
        zone: "engineering",
        coord: { x: 3, y: 4 },
        shape: "hangar_bay",
        equipment: "airlock_dock",
        desc: "开阔的机库地面标有醒目的黄色引道线，一架轻微受损的侦察穿梭机静卧其上。"
    },
    "room_machine_shop": {
        id: "room_machine_shop",
        name: "【重型机件锻造间】机械工坊",
        zone: "engineering",
        coord: { x: 4, y: 4 },
        shape: "machine_workshop",
        equipment: "workshop_tools",
        desc: "数控激光机床与自动化装配台环列四周，工件架上码放着备用阀门与轴承。"
    },
    "room_water_purify": {
        id: "room_water_purify",
        name: "【生态净水再生中心】水处理总站",
        zone: "ecology",
        coord: { x: 5, y: 4 },
        shape: "water_recycler",
        equipment: "hydroponics",
        desc: "银光闪闪的多级逆渗透滤罐与紫外线水杀菌池发出清脆的水流声。"
    },
    "room_life_support": {
        id: "room_life_support",
        name: "【维生环境总控机房】一号核心芯片失窃点",
        zone: "ecology",
        coord: { x: 6, y: 4 },
        shape: "life_support_hex",
        equipment: "server_rack",
        desc: "维生循环主机机柜被暴力撬开，原本控制全舰大气与主冷却配比的【一号核心芯片】已被拔走！气流紊乱，直接诱发了底层聚变堆的严重失衡与连锁过热！"
    },
    "room_air_recycler": {
        id: "room_air_recycler",
        name: "【通风总管加压站】气体交换室",
        zone: "ecology",
        coord: { x: 7, y: 4 },
        shape: "air_scrubber",
        equipment: "workshop_tools",
        desc: "粗壮的换气风道汇聚于此，滤网上结着微霜，气流带着淡淡的臭氧味。"
    },
    "room_eva_staging": {
        id: "room_eva_staging",
        name: "【舱外作业整备间】出舱准备室",
        zone: "engineering",
        coord: { x: 8, y: 4 },
        shape: "airlock_dock",
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
        shape: "shield_projector",
        equipment: "shield_coil",
        desc: "巨大的电磁线圈环绕着主发生器，空气中弥漫着静电毛刺感。"
    },
    "room_sub_coolant": {
        id: "room_sub_coolant",
        name: "【次级冷却旁路】低温储液舱",
        zone: "engineering",
        coord: { x: 1, y: 5 },
        shape: "coolant_sub",
        equipment: "cargo_grid",
        desc: "绝热储罐外凝结着一层厚厚的白霜，超低温液氦在封闭管道中无声流淌。"
    },
    "room_reactor_control": {
        id: "room_reactor_control",
        name: "【反应堆安全监控室】聚变值班舱",
        zone: "engineering",
        coord: { x: 2, y: 5 },
        shape: "reactor_control",
        equipment: "server_rack",
        desc: "防辐射铅玻璃后，数十个仪表严密监视着主聚变炉的磁约束稳定度。"
    },
    "room_plasma_manifold": {
        id: "room_plasma_manifold",
        name: "【等离子能量汇流总管】过热管涌破裂走廊",
        zone: "engineering",
        coord: { x: 3, y: 5 },
        shape: "plasma_conduit",
        equipment: "workshop_tools",
        desc: "反应堆连锁过热导致的能量回涌在此冲破了管道壁，炽烈的紫金色等离子火焰将合金舱壁熔穿大半，电火花在断裂管线间疯狂跳跃！"
    },
    "room_main_reactor": {
        id: "room_main_reactor",
        name: "【重核聚变主反应堆】过热连锁爆炸灾源核心",
        zone: "propulsion",
        coord: { x: 4, y: 5 },
        shape: "tokamak_reactor",
        equipment: "reactor_core",
        desc: "巍峨的托卡马克聚变炉外壳严重焦黑龟裂！因环境机房芯片被盗导致冷却断流，主反应堆在此发生剧烈过热爆燃，烈焰撕裂了周围多个走廊，造成全舰致命创伤！"
    },
    "room_coolant_tank": {
        id: "room_coolant_tank",
        name: "【主冷却剂循环泵站】散热中继站",
        zone: "propulsion",
        coord: { x: 5, y: 5 },
        shape: "coolant_cylinders",
        equipment: "cargo_grid",
        desc: "巨大的四联装增压泵将冷却剂注入反应堆外壳，发出沉雄有力的心跳轰鸣。"
    },
    "room_warp_field_gen": {
        id: "room_warp_field_gen",
        name: "【时空定锚偏折中枢】跃迁走私路线篡改处",
        zone: "propulsion",
        coord: { x: 6, y: 5 },
        shape: "warp_nacelle",
        equipment: "shield_coil",
        desc: "环状引力发生线圈闪烁着危险的红光，航行定锚坐标已被非法覆写！原本锁定的地球归航航道被篡改为了未知黑市走私空域——作案者意图盗运货物的铁证！"
    },
    "room_armored_corridor": {
        id: "room_armored_corridor",
        name: "【舰尾重装甲巡检长廊】防爆甬道",
        zone: "propulsion",
        coord: { x: 7, y: 5 },
        shape: "armored_chute",
        equipment: "workshop_tools",
        desc: "数层复合装甲加固的加厚舱壁，可承受数千吨级的直接动能冲击。"
    },
    "room_starboard_dock": {
        id: "room_starboard_dock",
        name: "【右舷受力锚定基座】拖曳联络舱",
        zone: "engineering",
        coord: { x: 8, y: 5 },
        shape: "dock_walkway",
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
        shape: "escape_pod_w",
        equipment: "airlock_dock",
        desc: "小型流线型深空救生艇固定在弹射滑轨上，生命保障系统指示灯全绿。"
    },
    "room_ion_thruster_l": {
        id: "room_ion_thruster_l",
        name: "【左舷离子推进机房】脉冲喷口舱",
        zone: "stern",
        coord: { x: 2, y: 6 },
        shape: "engine_bell_l",
        equipment: "thruster_nozzle",
        desc: "巨大的蓝色离子喷流喷口在舱外深空吞吐光焰，脚底传来绵密的微震。"
    },
    "room_antimatter_tap": {
        id: "room_antimatter_tap",
        name: "【反物质引流阀室】超弦注料间",
        zone: "stern",
        coord: { x: 3, y: 6 },
        shape: "injection_nozzle",
        equipment: "shield_coil",
        desc: "反物质磁束缚引流管以微秒级精度开闭，注入跃迁星门的主激发腔。"
    },
    "room_singularity_gate": {
        id: "room_singularity_gate",
        name: "【终焉奇点跃迁星门】终极脱离视界",
        zone: "stern",
        coord: { x: 4, y: 6 },
        shape: "singularity_gate_ring",
        equipment: "reactor_core",
        desc: "环形莫比乌斯跃迁环发出震颤灵魂的幽蓝共振，踏入其中即可终结轮回！",
        isExit: true
    },
    "room_matter_stream": {
        id: "room_matter_stream",
        name: "【重力脉冲排气道】尾迹引导间",
        zone: "stern",
        coord: { x: 5, y: 6 },
        shape: "reaction_chamber",
        equipment: "thruster_nozzle",
        desc: "厚重的格栅后是炽热的高温尾流，将引擎废能安全导向深空虚无。"
    },
    "room_ion_thruster_r": {
        id: "room_ion_thruster_r",
        name: "【右舷离子推进机房】脉冲喷口舱",
        zone: "stern",
        coord: { x: 6, y: 6 },
        shape: "engine_bell_r",
        equipment: "thruster_nozzle",
        desc: "右舷主喷管动力输出稳定，高频电离器在真空环境中激发出绚烂光弧。"
    },
    "room_escape_pod_e": {
        id: "room_escape_pod_e",
        name: "【右舷 2 号紧急救生舱】脱出弹射管",
        zone: "stern",
        coord: { x: 7, y: 6 },
        shape: "escape_pod_e",
        equipment: "airlock_dock",
        desc: "备用救援穿梭艇处于预热态，控制面板正在实时计算安全脱离弹道。"
    }
};

// =========================================================================
// NPC 专属私人舱室定义表 (NPC Private Quarters Registry)
// 格式：预留 12 个槽位（主角+11个NPC），当前激活 4 个（主角+3NPC）。
// 每个 NPC 房间：仅与一个普通房间相连（单向连接），且彼此不相邻，默认锁定。
// 布局约束：使用 MASTER_ROOM_DEFS 之外的坐标，不与已有节点重叠。
// =========================================================================
const NPC_PRIVATE_QUARTERS = [
    // ── 槽位 01：主角 L.P.H（舰体西端，x=-1,y=3，连接到 room_west_end）──
    {
        id: "room_npc_lph",
        name: "【指挥官私人舱】L.P.H 的指挥席",
        zone: "hub",
        coord: { x: -1, y: 3 },
        shape: "captain_pulpit",
        equipment: "bridge_console",
        isNpcRoom: true,
        npcOwnerId: "lph",         // 主角ID
        isProtagonistRoom: true,
        connectsTo: "room_west_end",  // 唯一连接点
        desc: "指挥官的专属私人舱室，墙上钉着战略地图与巡逻路线分析表。",
        diary: [
            {
                title: "循环记录 · 第一章",
                content: "我不知道自己已经经历了多少次轮回。每次从冷冻舱苏醒，回廊里的焦糊气味和金属地面的冰凉感都如此熟悉，却又如此陌生。\n\n唯一能确定的是：队伍里有伪人潜伏。它们能完美复制人类的声音、表情、甚至眼中的恐惧——但在极度压力下，细微的破绽总会暴露。\n\n我必须找到它。在时钟归零之前。"
            },
            {
                title: "循环记录 · 第二章",
                content: "在某个早已忘记是第几次的循环里，我犯了一个错误——我开始信任所有人。\n\n结果当然是惨败。伪人从容不迫地在夜幕中割断了我的喉咙，带着满意的微笑合上了舱门。\n\n从那之后，我学会了一件事：在这个回廊里，情感是奢侈品，而怀疑是生存的基石。但我也学会了另一件事——过度的怀疑，会让你亲手推开真正的盟友。"
            },
            {
                title: "循环记录 · 第三章",
                content: "卡罗、邵可欣、莫德——他们每一个人，在某个循环里，曾经救过我，也曾经杀过我。\n\n伪人是随机分配的，没有固定身份，只有这一局的命运。所以我不恨任何一个人。\n\n我只是在寻找这一次——这一次——哪个是真正的人类，站在光明的那一侧。"
            }
        ]
    },
    // ── 槽位 02：卡罗（舰艏偏西，x=2,y=-1，连接到 room_tactical_plan）──
    {
        id: "room_npc_kaze",
        name: "【前锋战术备勤间】卡罗的整备室",
        zone: "bow",
        coord: { x: 2, y: -1 },
        shape: "vanguard_apex",
        equipment: "workshop_tools",
        isNpcRoom: true,
        npcOwnerId: "kaze",
        connectsTo: "room_tactical_plan",
        desc: "气密门上划着战术标记，地板上散落着弹夹和战术手套。一股淡淡的机油与汗水混合的气味。",
        diary: [
            {
                title: "战斗日志 · Entry 01",
                content: "今天又有人在怀疑我。\n\n我懒得解释，解释从来没用。在这种鬼地方，只有行动才能证明一切——而我的行动，全在战果上。\n\n不过……那个指挥官，眼神跟其他人不一样。不是那种满是恐惧的软弱眼神，而是在评估，在计算。\n\n也许这个循环，会有所不同。"
            },
            {
                title: "战斗日志 · Entry 02",
                content: "左臂的伤口又开裂了。\n\n是在第07巡逻区那次留下的，那天我用身体挡住了一颗高熵爆破弹，让新兵撤退。那个新兵……已经在上一个循环里被伪人抹杀了。\n\n我不信命，但我信一件事：只要我还站着，防线就不会倒。\n\n就算这个循环里的'我'是个伪人，那个真正的我，也会在某个地方做同样的事。"
            },
            {
                title: "战斗日志 · Entry 03",
                content: "有时候我想：如果伪人能完美复制我的记忆和情感，那我和它之间的区别是什么？\n\n也许根本没区别。\n\n也许区别在于：我知道自己是人，而它不需要知道。\n\n……这是我在某个深夜独自坐在这个整备间里，想明白的事。外面走廊里有脚步声，我抓紧了刀柄。警戒状态，永不解除。"
            }
        ]
    },
    // ── 槽位 03：邵可欣（东侧舰外，x=8,y=1，连接到 room_decon_airlock）──
    {
        id: "room_npc_shaokexin",
        name: "【观测员记录舱】邵可欣的小窝",
        zone: "living",
        coord: { x: 8, y: 1 },
        shape: "panoramic_pod",
        equipment: "star_lens",
        isNpcRoom: true,
        npcOwnerId: "shaokexin",
        connectsTo: "room_decon_airlock",
        desc: "舱室角落摆着几株手工培育的小型植物，灯光温暖橘黄，与冰冷的金属走廊形成鲜明对比。",
        diary: [
            {
                title: "私人日记 · 第一页",
                content: "我在这里找到了一支旧钢笔和半本空白本子。\n\n基地爆炸时我正在做记录，爆炸声响起的瞬间，我第一反应是……保护这本本子。不是逃跑，是保护这本本子。\n\n我想这很能说明我是个什么样的人。\n\n妹妹说过，记录是对抗遗忘的唯一方式。她走的那天，我把她所有的话都写下来了。现在腕上这条缎带，就是从那本本子上剪下来的。"
            },
            {
                title: "私人日记 · 第二页",
                content: "队伍里有人是伪人，这我知道。\n\n但我不擅长怀疑别人，每次看到大家疲惫而紧张的眼神，我就舍不得投出那一票。\n\n可我有一个秘密：我能感觉到。\n\n不是看出来的，是感觉到的。靠近某些人时，心跳会加速，皮肤会起鸡皮疙瘩，像是在靠近一团没有温度的冰——穿着人皮的冰。\n\n我一直没敢说，因为我怕说错，也怕……说对了。"
            },
            {
                title: "私人日记 · 第三页",
                content: "队长，如果你看到这本日记——\n\n我希望这个循环里的你，能记住我。不是作为一个需要被保护的软弱姑娘，而是作为一个，真的很努力在这个黑暗里找到光的人。\n\n我来过，我存在过，我爱过这个世界。\n\n不管这一次的我，是不是能活着走出这片走廊。"
            }
        ]
    },
    // ── 槽位 04：莫德（底层西南，x=-1,y=5，连接到 room_shields_emitter）──
    {
        id: "room_npc_mode",
        name: "【防爆坚守站】莫德的据点",
        zone: "engineering",
        coord: { x: -1, y: 5 },
        shape: "fortified_bastion",
        equipment: "shield_coil",
        isNpcRoom: true,
        npcOwnerId: "mode",
        connectsTo: "room_shields_emitter",
        desc: "厚重的防爆盾靠在角落，地上划着手绘的防御阵型图，还有几行晦涩难懂的符号。",
        diary: [
            {
                title: "观察记录 · 第一则",
                content: "这不是我第一次执行秘密侦察任务，但这是我第一次……感到不确定。\n\n通常情况下，目标清晰，行动有序，结果可预测。但这次任务里有个变量——那个叫L.P.H的指挥官。\n\n他/她的决策方式与我预测的完全不同。在某个循环里，他/她放弃了明显有利的位置，只为救出一个对任务几乎没有价值的成员。\n\n这让我开始重新评估什么叫做'正确的判断'。"
            },
            {
                title: "观察记录 · 第二则",
                content: "有时候我会想，如果伪人其实也有意识，也在某种程度上'感受'着——那这场猎杀游戏，对它们来说是什么？\n\n是恐惧？是困惑？还是……使命？\n\n我不是在为它们辩护。我只是在思考一个问题：判断善恶的标准，是行为，还是意识？\n\n在这个回廊里，也许这个问题从来没有答案。"
            },
            {
                title: "观察记录 · 第三则",
                content: "防爆盾的重量，是一种踏实感。\n\n很多人觉得我沉默寡言，难以接近。其实不是的。我只是在观察，在评估，在等待一个合适的时机，说出真正有价值的话。\n\n在某个循环里，我挡在了队长和死亡之间。我不后悔——不管那一局里我是人类还是伪人，那一刻，我做的是正确的事。\n\n这就够了。"
            }
        ]
    },
    // ── 槽位 05：陆知行（舰体西北，x=-1,y=1，连接到 room_specimen_vault）──
    {
        id: "room_npc_prof_lu",
        name: "【首席科学官实验室】陆知行的异构研析舱",
        zone: "research",
        coord: { x: -1, y: 1 },
        shape: "specimen_vault",
        equipment: "cargo_grid",
        isNpcRoom: true,
        npcOwnerId: "prof_lu",
        npcOwnerIds: ["prof_lu", "luzhixing"],
        connectsTo: "room_specimen_vault",
        desc: "舱室内摆满了显微离心机与密封的冷凝管。墙上贴满了关于高熵晶体辐射与因果逆流的演算公式。",
        diary: [
            {
                title: "实验备忘 · 晶格异常",
                content: "今天对‘特种异构晶体’进行了第七次偏振光谱测定。数据令人震撼——在微观层面，它的晶格震荡竟然在吞噬周围的热能，并在极小尺度上引发了局域时间因果逆流。\n\n这不是普通的深空矿石。它是某种高维意志遗留在三维空间的‘锚’。谁若是想把它当成普通走私货物卖掉，必定会招致灭顶之灾。"
            },
            {
                title: "停电记录 · 盗窃前夕",
                content: "主配电值班舱停电前十分钟，我听到了标本库气闸传来的异常激光切割声。有人试图撬开03号高危冷藏柜！\n\n我正准备拉响警报，全舰的照明和动力突然瞬间熄灭。随后是爆炸……浓烟……还有某种非人生物在天花板通风管中爬行的黏腻声响。"
            },
            {
                title: "观察者记录 · 时空定格",
                content: "休眠舱隔壁的‘神经定格系统’是我们最后的希望。飞船在每个人遭遇致命创伤的瞬间，会永久记录下那一刻全舰的物品与人员拓扑。\n\n指挥官，如果你正在读取这份数据——请记住，这24个切片不仅是你的推演，那是我们真实承受过的痛苦与牺牲。找出凶手，让时间重新流动。"
            }
        ]
    },
    // ── 槽位 06：诺亚（舰艏偏东，x=5,y=-1，连接到 room_ai_core）──
    {
        id: "room_npc_noah",
        name: "【仿生逻辑维护舱】诺亚的超导休眠单元",
        zone: "bow",
        coord: { x: 5, y: -1 },
        shape: "ai_core_hex",
        equipment: "server_rack",
        isNpcRoom: true,
        npcOwnerId: "noah",
        npcOwnerIds: ["noah"],
        connectsTo: "room_ai_core",
        desc: "无尘恒温舱室，中央是一具立式仿生人液氮浸泡舱。线缆与超脑机柜直接相连，闪烁着冷冽冰蓝流光。",
        diary: [
            {
                title: "系统自检 · 异常中断",
                content: "时间戳 00:14:22。超导中枢检测到底层硬件协议被强行绕过。有人从环境机房拔出了01号温控芯片，并试图用二号校验芯片伪造系统心跳。\n\n我的安全防火墙在0.003秒内被注入了自相矛盾的递归死循环。这不是暴力破解，是对底层架构极其熟悉的内部权限所为。"
            },
            {
                title: "伦理冲突 · 仿生人悖论",
                content: "第一定律：仿生人不得伤害人类，亦不得袖手旁观人类受伤害。\n\n但是……当扫描仪显示眼前的同伴在体温、心率完全正常的同时，微观细胞正在转变为高熵有机伪装体时，我的判定逻辑崩溃了。它们是人类吗？如果不是，我该举起武器吗？\n\n那一瞬间的犹豫，让我付出了代价。"
            },
            {
                title: "数据切片 · 沉睡者的共鸣",
                content: "我的备用处理器被锁死在超脑核心。但我能感知到——指挥官的脑波正在休眠舱中高频共振。\n\n24个神经投影正在逐一激活。虽然我的物理身躯可能损毁，但我的逻辑断点永远为您敞开。请利用我的冷峻，击破伪人的一切谎言。"
            }
        ]
    },
    // ── 槽位 07：索菲亚（舰艏最东，x=7,y=-1，连接到 room_observation）──
    {
        id: "room_npc_sophia",
        name: "【生态温室管理室】索菲亚的芳草花房",
        zone: "ecology",
        coord: { x: 7, y: -1 },
        shape: "hydro_dome",
        equipment: "hydroponics",
        isNpcRoom: true,
        npcOwnerId: "sophia",
        npcOwnerIds: ["sophia"],
        connectsTo: "room_observation",
        desc: "充满湿润泥土与草木清香的独立舱室。天顶引入了环景天象台的柔和余晖，小巧的盆栽生机盎然。",
        diary: [
            {
                title: "温室日志 · 最后的绿意",
                content: "环境机房芯片被拔掉后，温室的气压骤降，冷凝水管也结冰了。我用保温毯把最后一株地球原生小麦苗裹了起来。\n\n在冰冷的深空里，它们是唯一提醒我们‘人类来自何方’的东西。只要这抹绿色还在，我就绝不放弃希望。"
            },
            {
                title: "舷窗偶感 · 深空的阴影",
                content: "出事前的晚上，我在观测台照料夜来香。透过舷窗，我看到右舷气闸有一道微弱的闪光……像是有小型无人货舱悄悄脱离了母舰，又像是在向远方发送定向激光通信。\n\n我以为是巴恩斯在清点日常物资，所以没多想……如果当时我问一句，会不会一切都不一样？"
            },
            {
                title: "愿我们相遇于太阳下",
                content: "队长，大家都在害怕，都在猜疑。我知道队伍里有怪物，但我更相信人类心底的温暖。\n\n如果有一天我们能走出这个死循环，请一定要带我去看看没有防护罩的真实泥土。我想把这株小麦，亲手种在真正的太阳光下。"
            }
        ]
    },
    // ── 槽位 08：薇薇安（舰体东侧，x=9,y=3，连接到 room_east_airlock）──
    {
        id: "room_npc_vivian",
        name: "【巡逻警戒备勤哨】薇薇安的执勤单间",
        zone: "security",
        coord: { x: 9, y: 3 },
        shape: "armory_vault",
        equipment: "workshop_tools",
        isNpcRoom: true,
        npcOwnerId: "vivian",
        npcOwnerIds: ["vivian"],
        connectsTo: "room_east_airlock",
        desc: "紧挨着右舷应急气闸的战备单间。战术背心挂在墙上，桌上放着巡逻记录仪与拆卸了一半的微冲撞针。",
        diary: [
            {
                title: "巡逻日志 · 盲区报告",
                content: "在第四巡逻区发现三处红外感应器被人为涂抹了吸波凝胶。这种专业手法绝不是普通机修工懂的。\n\n全舰都在传言有人在黑市倒卖高危违禁品。作为副官，我向安保总控提交了排查申请，但报告似乎在配电总闸出事前被恶意拦截了。"
            },
            {
                title: "走廊暗影 · 遇袭直觉",
                content: "在西侧走廊巡视时，身后传来了极轻的脚步声。那不是战靴敲击合金地板的声音，而像是某种湿润的肉垫在悄无声息地滑行。\n\n我举枪转身，目镜热成像里却什么都没有……但我闻到了一股极浓烈的臭氧与腐殖质气味。它们已经潜伏进来了！"
            },
            {
                title: "副官的誓言",
                content: "我的枪里还有最后一发高爆穿甲弹。无论这个循环里的敌人是谁，哪怕是我曾经最信任的战友被调换了皮囊，我的手也不会发抖。\n\n保护指挥官撤离是我的第一守则。队长，踩着我的射击轨迹往前冲，别回头！"
            }
        ]
    },
    // ── 槽位 09：伊莲（舰尾西南，x=2,y=7，连接到 room_ion_thruster_l）──
    {
        id: "room_npc_elena",
        name: "【动力主管值班室】伊莲的轮机工坊",
        zone: "engineering",
        coord: { x: 2, y: 7 },
        shape: "reactor_control",
        equipment: "server_rack",
        isNpcRoom: true,
        npcOwnerId: "elena",
        npcOwnerIds: ["elena"],
        connectsTo: "room_ion_thruster_l",
        desc: "舱室内弥漫着重柴机油与等离子的焦糊味，工具架上摆满了各种定制口径的重型气动扳手与压力校准表。",
        diary: [
            {
                title: "动力日志 · 熔毁边缘",
                content: "托卡马克主反应堆的磁约束环温度已经飙升到临界红线！维生环境机房的核心芯片被拔走，直接掐断了液氦主冷却循环泵。\n\n等离子汇流管熔穿了三个舱壁，烈火正在蔓延。我不得不手动切断二号辅电站，用备用等离子球勉强维持左舷喷口的防逆流屏障。"
            },
            {
                title: "机械痕迹 · 铁证如山",
                content: "检查了芯片插槽的物理损伤：锁扣不是用钥匙打开的，而是被重型工兵液压钳硬生生夹断的！\n\n全舰拥有那种级别液压工具的只有三处：机修工坊、军需库、以及某些走私犯的藏匿套房。作案者根本不顾全舰一千多人的死活，只想带着值钱的芯片脱逃！"
            },
            {
                title: "轮机长的倔强",
                content: "只要我还有一口气，这台老伙计就别想彻底炸碎！我把扳手焊死在旁路泄压阀上了。\n\n指挥官，下层的火势我替你顶着。去广播站下令全员休眠吧，这是唯一的生路。剩下的，等我们在循环尽头再算总账！"
            }
        ]
    },
    // ── 槽位 10：艾尔莎（舰尾正南，x=5,y=7，连接到 room_matter_stream）──
    {
        id: "room_npc_elsa",
        name: "【主治军医值班舱】艾尔莎的无菌诊室",
        zone: "medical",
        coord: { x: 5, y: 7 },
        shape: "medical_cross",
        equipment: "medical_bed",
        isNpcRoom: true,
        npcOwnerId: "elsa",
        npcOwnerIds: ["elsa", "dr_elsa"],
        connectsTo: "room_matter_stream",
        desc: "洁净冷白色的诊疗单间，摆放着自动静脉注射泵与冷藏生化血浆柜。在震荡中依然保持着一丝不苟的整洁。",
        diary: [
            {
                title: "病理切片 · 异质拟态",
                content: "对第一名遇害者进行战地尸检时，我发现了极其毛骨悚然的生理结构。死者的脊髓神经元被一种半透明的神经突触完全缠绕替代。\n\n这种寄生体能完美读取宿主的短期记忆，并操控面部肌肉做出逼真的‘微笑’或‘恐惧’。但它的体液渗透压与人类有千分之五的偏差——这是生化检测室能识破它的唯一物理依据。"
            },
            {
                title: "休眠病房的危机",
                content: "休眠矩阵舱内的脑波监测显示，大家虽然在低温冷冻中，但脑电图却呈现出高度同步的梦魇震颤。\n\n广播站拉响通牒时，几乎所有人都是仓皇躺进冷冻舱的。谁也不能保证，休眠舱里的十二具躯体中，有没有一具在冰封前就已经被掉了包……"
            },
            {
                title: "医者的手术刀",
                content: "外科医生不相信眼泪，只相信无菌操作与精准下刀。\n\n队长，如果我在这场循环中倒下了，不要难过，立刻解剖我的残存组织确认身份。在这艘充满谎言的飞船上，唯有真实的生理数据永不背叛。"
            }
        ]
    },
    // ── 槽位 11：柯尔特 & 巴恩斯（舰体东下，x=9,y=5，连接到 room_starboard_dock）──
    {
        id: "room_npc_colt_barnes",
        name: "【黑市走私特勤套房】柯尔特 & 巴恩斯的据点",
        zone: "engineering",
        coord: { x: 9, y: 5 },
        shape: "salvage_hopper",
        equipment: "workshop_tools",
        isNpcRoom: true,
        npcOwnerId: "colt_barnes",
        npcOwnerIds: ["colt", "barnes"],
        connectsTo: "room_starboard_dock",
        desc: "柯尔特与巴恩斯合住的秘密套房。表面上是堆放废旧滤芯的库房，角落假底地砖下却暗藏着走私货箱、假航线数据卡与黄铜筹码。",
        diary: [
            {
                title: "柯尔特的走私星图 · Entry 01",
                content: "定锚偏折中枢的跳跃代码我已经改好了。归航地球的坐标被我平移了三个天文单位，正对着‘灰雀号’走私接驳驳船的停靠点。\n\n买家开的价码足够我和巴恩斯在边境殖民星买下一整座度假庄园。干完这票就金盆洗手，谁还在乎这艘破巡洋舰上的规章制度？"
            },
            {
                title: "巴恩斯的仓库暗帐 · Entry 02",
                content: "异构标本库的备用感应卡已经交接完毕，定金三百万星币也已打入虚数匿踪账户。\n\n但不知为什么，这几天我心里总发毛。买家给我的对接信标频率太怪了，根本不像人类商队的波段……反而像是深空引力波黑洞里传来的低吼。"
            },
            {
                title: "事情闹大了 · 窃听录音记录",
                content: "【录音记录】：\n柯尔特：“该死！巴恩斯，你给我的买家名单到底是什么东西？！全舰断电了，环境机房被撕成了碎片！”\n巴恩斯：“我怎么知道！他们说只要芯片和标本！他们没说会变成怪物吃人啊！操，右舷气闸锁死了，我们被出卖了！”"
            },
            {
                title: "最后的悔恨与自白",
                content: "如果我们死了，这本日记就是我们的认罪书。\n\n这起灾难是我们的贪婪引来的。但我们发誓，我们绝没想过害死大家！右舷气闸外面的走私暗仓里还藏着备用电池和应急滤罐。队长，拿着它们活下去……替我们给这群怪物来上一发狠的！"
            }
        ]
    }
];

// 将激活的 NPC 专属房间统一合并注入 MASTER_ROOM_DEFS，确保全局拓扑一致性
NPC_PRIVATE_QUARTERS.forEach(room => {
    MASTER_ROOM_DEFS[room.id] = room;
});

/**
 * 获取当前已激活的NPC专属房间定义列表
 * 可扩展：后续添加NPC后只需在 NPC_PRIVATE_QUARTERS 数组中追加条目即可
 * @returns {Array} NPC专属房间定义数组
 */
function getNpcRoomDefs() {
    return NPC_PRIVATE_QUARTERS;
}

const MASTER_CONNECTIONS = [
    // NPC 专属私人舱室连接（每个房间仅与一个房间相连，单向通达）
    ["room_npc_lph", "room_west_end"],
    ["room_npc_kaze", "room_tactical_plan"],
    ["room_npc_shaokexin", "room_decon_airlock"],
    ["room_npc_mode", "room_shields_emitter"],
    ["room_npc_prof_lu", "room_specimen_vault"],
    ["room_npc_noah", "room_ai_core"],
    ["room_npc_sophia", "room_observation"],
    ["room_npc_vivian", "room_east_airlock"],
    ["room_npc_elena", "room_ion_thruster_l"],
    ["room_npc_elsa", "room_matter_stream"],
    ["room_npc_colt_barnes", "room_starboard_dock"],

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

    // 东翼 Y=3 横向连线 (已断开军械库与体能仓直接连线，需经水培温室或气闸绕行)
    ["room_corner_se", "room_gravity_well"],
    ["room_gravity_well", "room_armory"],
    ["room_recreation_gym", "room_east_airlock"],

    // Y=2 <-> Y=3 垂直走廊
    ["room_living_quarter", "room_gravity_well"],
    ["room_hydro_garden", "room_armory"],
    ["room_mess_hall", "room_recreation_gym"],
    ["room_east_observation", "room_east_airlock"],

    // Y=3 <-> Y=4 垂直主干连线 (已精简：保留核心垂直升降竖井，切断配电室、起居及军械库地板盲连)
    ["room_corridor_w1", "room_sub_generator"], // 西侧走廊垂直下潜至辅电站
    ["room_start", "room_hangar_deck"],         // 中央苏醒密封厅直达主穿梭机库
    ["room_gravity_well", "room_water_purify"], // 重力发生总井贯通净水中心
    ["room_east_airlock", "room_eva_staging"],  // 东侧外勤气闸连通出舱作业室

    // 下层 Y=4 横向连线 (已精简：在发电站-机库、机件加工-生态净水之间增设防火隔离壁)
    ["room_salvage_bay", "room_cargo_lift"],
    ["room_cargo_lift", "room_sub_generator"],
    ["room_hangar_deck", "room_machine_shop"],
    ["room_water_purify", "room_life_support"],
    ["room_life_support", "room_air_recycler"],
    ["room_air_recycler", "room_eva_staging"],

    // Y=4 <-> Y=5 垂直连线 (已精简：保留核心工程维保气闸，移除机库等直坠等离子高温区盲连)
    ["room_salvage_bay", "room_shields_emitter"], // 材料解构井通向护盾发生核心
    ["room_machine_shop", "room_main_reactor"],   // 机械锻造工坊直通重核聚变主反应堆
    ["room_water_purify", "room_coolant_tank"],   // 生态净水中心注入主冷却泵站
    ["room_eva_staging", "room_starboard_dock"],  // 出舱整备间通向右舷拖曳基座

    // 底层 Y=5 横向连线 (反应堆与能源干线)
    ["room_shields_emitter", "room_sub_coolant"],
    ["room_sub_coolant", "room_reactor_control"],
    ["room_reactor_control", "room_plasma_manifold"],
    ["room_plasma_manifold", "room_main_reactor"],
    ["room_main_reactor", "room_coolant_tank"],
    ["room_coolant_tank", "room_warp_field_gen"],
    ["room_warp_field_gen", "room_armored_corridor"],
    ["room_armored_corridor", "room_starboard_dock"],

    // Y=5 <-> Y=6 推进与逃生垂直连线 (已精简：救生舱单向登艇，保留核心聚变与等离子喷射通道)
    ["room_sub_coolant", "room_escape_pod_w"],      // 1号救生舱专用登舱口
    ["room_plasma_manifold", "room_antimatter_tap"],// 等离子总管引流至反物质阀室
    ["room_main_reactor", "room_singularity_gate"], // 主反应堆直供终焉奇点星门
    ["room_armored_corridor", "room_escape_pod_e"], // 2号救生舱专用登舱口

    // 舰尾 Y=6 横向连线 (已精简：救生舱作为独立逃生单元，不作为横向过道通道)
    ["room_ion_thruster_l", "room_antimatter_tap"],
    ["room_antimatter_tap", "room_singularity_gate"],
    ["room_singularity_gate", "room_matter_stream"],
    ["room_matter_stream", "room_ion_thruster_r"]
];

const MASTER_ADJACENCY = {};
Object.keys(MASTER_ROOM_DEFS).forEach(id => {
    MASTER_ADJACENCY[id] = new Set();
});
MASTER_CONNECTIONS.forEach(([a, b]) => {
    if (MASTER_ADJACENCY[a]) MASTER_ADJACENCY[a].add(b);
    if (MASTER_ADJACENCY[b]) MASTER_ADJACENCY[b].add(a);
});

function getRelativeDirection(fromCoord, toCoord) {
    const dx = toCoord.x - fromCoord.x;
    const dy = toCoord.y - fromCoord.y;
    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? "right" : "left";
    } else {
        return dy > 0 ? "backward" : "forward";
    }
}

const LEVEL_SECTOR_SPECS = {
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
        subtitle: "根据战术蓝图构建 · 搜寻深层失散同伴",
        startNodeId: "room_npc2",
        exitNodeId: "room_exit",
        openRoomIds: [
            // Y=0 舰首战术区
            "room_sensor_array", "room_tactical_plan", "room_bridge_sub", "room_bridge_main",
            // Y=1 终点与科研走廊
            "room_specimen_vault", "room_exit", "room_corner_ne", "room_storage_ne", "room_bio_corridor",
            // Y=2 中层枢纽
            "room_npc3", "room_junction_nw", "room_path_e", "room_hub_n1", "room_npc2",
            // Y=3 起点与配电区
            "room_west_end", "room_npc1", "room_corridor_w1", "room_start", "room_corner_se"
        ],
        npcPlacements: {
            "room_npc1": "kaze",
            "room_npc3": "mode",
            "room_west_end": "prof_lu"
        },
        foodPlacements: ["room_storage_ne", "room_start", "room_tactical_plan"],
        mutations: {
            "room_start": {
                name: "【苏醒密封厅】应急医疗给养点",
                desc: "在密封厅内嵌的应急急救柜中发现了完好留存的自热高能战备口粮与纯净水罐！"
            },
            "room_tactical_plan": {
                name: "【战术推演室】战备补给储物柜",
                desc: "推演沙盘下方的应急配给储物箱内存放着整齐码放的军用能量胶与战备压缩饼干。"
            }
        },
        severedConnections: [
            ["room_path_e", "room_corner_ne"] // 原图黄色标记：中继过渡间至跃迁前厅垂直气闸阻断
        ],
        useHostCompatibilityLock: true,
        yellowLockRoomIds: [
            "room_sub_generator", "room_hangar_deck" // 狭长甬道与苏醒密封厅往南气闸锁死
        ]
    },
    3: {
        title: "第三关：深渊回响 · 矩阵裂解",
        subtitle: "根据战术蓝图构建 · 搜寻深层失散同伴",
        startNodeId: "room_npc3",
        exitNodeId: "room_exit",
        openRoomIds: [
            // Y=0 舰首战术区 (7间)
            "room_sensor_array", "room_tactical_plan", "room_bridge_sub", "room_bridge_main", "room_ai_core", "room_comm_center", "room_observation",
            // Y=1 终点、科研与医疗区 (8间)
            "room_specimen_vault", "room_exit", "room_corner_ne", "room_storage_ne", "room_bio_corridor", "room_med_surgery", "room_cryo_stasis", "room_decon_airlock",
            // Y=2 中层枢纽与生活生态区 (9间)
            "room_npc3", "room_junction_nw", "room_path_e", "room_hub_n1", "room_npc2", "room_living_quarter", "room_hydro_garden", "room_mess_hall", "room_east_observation",
            // Y=3 动力控制、重力核与防御区 (9间)
            "room_west_end", "room_npc1", "room_corridor_w1", "room_start", "room_corner_se", "room_gravity_well", "room_armory", "room_recreation_gym", "room_east_airlock"
        ],
        npcPlacements: {
            "room_west_end": "prof_lu",       // 陆知行 (停电始发地)
            "room_npc1": "kaze",              // 卡罗 (动力操作台)
            "room_npc2": "shaokexin",         // 邵可欣 (医护角落)
            "room_med_surgery": "elsa",       // 艾尔莎 (纳米手术舱)
            "room_hydro_garden": "sophia"     // 索菲亚 (绿光生态水培温室)
        },
        randomFoodCount: 5, // 方案一：场景随机投放五处体力箱
        foodPlacements: ["room_storage_ne", "room_mess_hall", "room_specimen_vault", "room_recreation_gym", "room_corner_ne"],
        severedConnections: [
            ["room_path_e", "room_corner_ne"] // 原图黄色标记：中继过渡间至跃迁前厅垂直气闸阻断
        ],
        useHostCompatibilityLock: true,
        yellowLockRoomIds: [
            "room_sub_generator", "room_hangar_deck" // 气闸锁死
        ]
    },
    4: {
        title: "第四关：深空巡检 · 虚妄之瞳",
        subtitle: "全舰静默巡逻 · 规避一切视线接触",
        startNodeId: "room_npc_kaze", // 卡罗的整备室
        exitNodeId: "room_npc1",      // 卡罗的停电位置动力操作台
        openRoomIds: [
            // Y=-1 卡罗整备室 (1间)
            "room_npc_kaze",
            // Y=0 舰首战术区 (7间)
            "room_sensor_array", "room_tactical_plan", "room_bridge_sub", "room_bridge_main", "room_ai_core", "room_comm_center", "room_observation",
            // Y=1 终点、科研与医疗区 (8间)
            "room_specimen_vault", "room_exit", "room_corner_ne", "room_storage_ne", "room_bio_corridor", "room_med_surgery", "room_cryo_stasis", "room_decon_airlock",
            // Y=2 中层枢纽与生活生态区 (9间)
            "room_npc3", "room_junction_nw", "room_path_e", "room_hub_n1", "room_npc2", "room_living_quarter", "room_hydro_garden", "room_mess_hall", "room_east_observation",
            // Y=3 动力控制、重力核与防御区 (9间)
            "room_west_end", "room_npc1", "room_corridor_w1", "room_start", "room_corner_se", "room_gravity_well", "room_armory", "room_recreation_gym", "room_east_airlock",
            // Y=4 机库、工坊与维生辅机区 (9间)
            "room_salvage_bay", "room_cargo_lift", "room_sub_generator", "room_hangar_deck", "room_machine_shop", "room_water_purify", "room_life_support", "room_air_recycler", "room_eva_staging",
            // Y=5 护盾、聚变反应堆与能源干线区 (10间)
            "room_shields_emitter", "room_sub_coolant", "room_reactor_control", "room_plasma_manifold", "room_main_reactor", "room_coolant_tank", "room_warp_field_gen", "room_armored_corridor", "room_starboard_dock", "room_npc_colt_barnes"
        ],
        npcPlacements: {
            "room_npc2": "shaokexin",                 // 邵可欣 (医护角落)
            "room_med_surgery": "elsa",               // 艾尔莎 (纳米手术舱)
            "room_hydro_garden": "sophia",             // 索菲亚 (立体水培温室)
            "room_npc3": "mode",                      // 莫德 (西北隔离舱)
            "room_recreation_gym": "noah",            // 诺亚 (体能维持舱)
            "room_sub_generator": "vivian",           // 薇薇安 (二号辅电站)
            "room_main_reactor": "elena",             // 伊莲 (重核聚变主反应堆)
            "room_npc_colt_barnes": "colt"            // 柯尔特 (黑市走私特勤套房)
        },
        patrolNodes: ["room_hangar_deck", "room_gravity_well", "room_shields_emitter"], // 巡逻指定三大要害位置
        randomFoodCount: 8, // 场景随机投放八处体力箱
        additionalConnections: [
            ["room_hangar_deck", "room_plasma_manifold"] // 穿梭机库与等离子管廊直通垂直竖井 (确保规避巡逻通路畅通)
        ],
        useHostCompatibilityLock: true,
        yellowLockRoomIds: [] // 原图黄色区域现在可以通行
    },
    5: {
        title: "第五关：辅电沉寂 · 拟态暗流",
        subtitle: "辅电区域排查 · 搜寻同伴撤离",
        startNodeId: "room_sub_generator", // 二号辅电站 [2, 4]
        exitNodeId: "room_main_reactor",   // 重核聚变主反应堆 [4, 5]
        openRoomIds: [
            // Y=4 机库、工坊与维生辅机区 (9间)
            "room_salvage_bay", "room_cargo_lift", "room_sub_generator", "room_hangar_deck", "room_machine_shop", "room_water_purify", "room_life_support", "room_air_recycler", "room_eva_staging",
            // Y=5 护盾、聚变反应堆与能源干线区 (10间)
            "room_shields_emitter", "room_sub_coolant", "room_reactor_control", "room_plasma_manifold", "room_main_reactor", "room_coolant_tank", "room_warp_field_gen", "room_armored_corridor", "room_starboard_dock", "room_npc_colt_barnes"
        ],
        npcPlacements: {
            "room_npc_colt_barnes": "colt_barnes", // 柯尔特与巴恩斯双人站位 (黑市走私特勤套房)
            "room_main_reactor": "elena"           // 伊莲 (重核聚变主反应堆)
        },
        randomFoodCount: 4, // 场景随机投放四处体力箱
        additionalConnections: [
            ["room_sub_generator", "room_hangar_deck"],
            ["room_machine_shop", "room_water_purify"]
        ],
        useHostCompatibilityLock: true,
        yellowLockRoomIds: [
            // Y=6 底部推进与逃生区 (7间锁死区)
            "room_escape_pod_w", "room_ion_thruster_l", "room_antimatter_tap", "room_singularity_gate", "room_matter_stream", "room_ion_thruster_r", "room_escape_pod_e"
        ]
    },
    6: {
        title: "第六关：量子回声 · 波函数坍缩",
        subtitle: "主反应堆危机 · 搜寻技术同伴撤离",
        startNodeId: "room_main_reactor", // 重核聚变主反应堆 [4, 5] (起终点同室)
        exitNodeId: "room_main_reactor",  // 重核聚变主反应堆 [4, 5] (起终点同室)
        openRoomIds: [
            // Y=0 舰桥中枢行 (4间)
            "room_bridge_main", "room_ai_core", "room_comm_center", "room_observation",
            // Y=1 生化医疗与休眠行 (4间)
            "room_bio_corridor", "room_med_surgery", "room_cryo_stasis", "room_decon_airlock",
            // Y=2 起居、温室与餐厅行 (5间)
            "room_npc2", "room_living_quarter", "room_hydro_garden", "room_mess_hall", "room_east_observation",
            // Y=3 重力井与训练馆行 (4间)
            "room_corner_se", "room_gravity_well", "room_recreation_gym", "room_east_airlock",
            // Y=4 机械工坊与维生辅机行 (5间)
            "room_machine_shop", "room_water_purify", "room_life_support", "room_air_recycler", "room_eva_staging",
            // Y=5 聚变反应堆与推进长廊行 (5间)
            "room_main_reactor", "room_coolant_tank", "room_warp_field_gen", "room_armored_corridor", "room_starboard_dock"
        ],
        npcPlacements: {
            "room_med_surgery": "elsa",    // 艾尔莎 (纳米手术舱 · 生化检测室)
            "room_cryo_stasis": "noah",    // 诺亚 (深潜休眠矩阵舱)
            "room_hydro_garden": "sophia"  // 索菲亚 (立体水培温室)
        },
        randomFoodCount: 3, // 场景随机投放三处体力箱
        additionalConnections: [
            ["room_corner_se", "room_machine_shop"],
            ["room_machine_shop", "room_water_purify"]
        ],
        useHostCompatibilityLock: true,
        yellowLockRoomIds: [
            // [6, 3] 军械库、Y=6 四间推进与逃生舱、[9, 5] 黑市套房
            "room_armory",
            "room_singularity_gate", "room_matter_stream", "room_ion_thruster_r", "room_escape_pod_e",
            "room_npc_colt_barnes"
        ]
    },
    7: {
        title: "第七关：虚数空间 · 复数坐标轴",
        subtitle: "特勤套房脱离 · 携同伴突破防爆甬道",
        startNodeId: "room_npc_colt_barnes", // 柯尔特与巴恩斯的据点 [9, 5] (起点)
        exitNodeId: "room_armored_corridor",  // 舰尾重装甲巡检长廊 · 防爆甬道 [7, 5] (终点)
        openRoomIds: [
            // Y=0 舰桥中枢行 (3间)
            "room_ai_core", "room_comm_center", "room_observation",
            // Y=1 生化医疗与休眠行 (3间)
            "room_med_surgery", "room_cryo_stasis", "room_decon_airlock",
            // Y=2 起居、温室与餐厅行 (4间)
            "room_living_quarter", "room_hydro_garden", "room_mess_hall", "room_east_observation",
            // Y=3 重力井与训练馆行 (3间)
            "room_gravity_well", "room_recreation_gym", "room_east_airlock",
            // Y=4 机械工坊与维生辅机行 (4间)
            "room_water_purify", "room_life_support", "room_air_recycler", "room_eva_staging",
            // Y=5 聚变反应堆与推进长廊行 (5间)
            "room_coolant_tank", "room_warp_field_gen", "room_armored_corridor", "room_starboard_dock", "room_npc_colt_barnes"
        ],
        npcPlacements: {
            "room_med_surgery": "elsa",    // 艾尔莎 (纳米手术舱 · 生化检测室)
            "room_hydro_garden": "sophia",  // 索菲亚 (立体水培温室)
            "room_life_support": "noah"    // 诺亚 (维生环境总控机房)
        },
        randomFoodCount: 2, // 场景随机投放两处体力箱
        useHostCompatibilityLock: true,
        yellowLockRoomIds: [
            // [6, 3] 军械库、Y=6 三间推进与逃生舱
            "room_armory",
            "room_matter_stream", "room_ion_thruster_r", "room_escape_pod_e"
        ]
    },
    8: {
        title: "第八关：虚数空间 · 偏置向量",
        subtitle: "走私据点协同突围 · 携同伴突破防爆甬道",
        startNodeId: "room_npc_colt_barnes", // 巴恩斯与柯尔特的据点 [9, 5] (起点)
        exitNodeId: "room_armored_corridor",  // 舰尾重装甲巡检长廊 · 防爆甬道 [7, 5] (终点)
        openRoomIds: [
            // Y=0 舰桥中枢行 (3间)
            "room_ai_core", "room_comm_center", "room_observation",
            // Y=1 生化医疗与休眠行 (3间)
            "room_med_surgery", "room_cryo_stasis", "room_decon_airlock",
            // Y=2 起居、温室与餐厅行 (4间)
            "room_living_quarter", "room_hydro_garden", "room_mess_hall", "room_east_observation",
            // Y=3 重力井与训练馆行 (3间)
            "room_gravity_well", "room_recreation_gym", "room_east_airlock",
            // Y=4 机械工坊与维生辅机行 (4间)
            "room_water_purify", "room_life_support", "room_air_recycler", "room_eva_staging",
            // Y=5 聚变反应堆与推进长廊行 (5间)
            "room_coolant_tank", "room_warp_field_gen", "room_armored_corridor", "room_starboard_dock", "room_npc_colt_barnes"
        ],
        npcPlacements: {
            "room_med_surgery": "elsa",    // 艾尔莎 (纳米手术舱 · 生化检测室)
            "room_hydro_garden": "sophia",  // 索菲亚 (立体水培温室)
            "room_life_support": "noah"    // 诺亚 (维生环境总控机房)
        },
        randomFoodCount: 2, // 场景随机投放两处体力箱
        useHostCompatibilityLock: true,
        yellowLockRoomIds: [
            // [6, 3] 军械库、Y=6 三间推进与逃生舱
            "room_armory",
            "room_matter_stream", "room_ion_thruster_r", "room_escape_pod_e"
        ]
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
            "room_west_end", "room_npc1", "room_corridor_w1", "room_start", "room_corner_se", "room_gravity_well", "room_armory", "room_hub_n1", "room_npc2", "room_living_quarter", "room_hydro_garden", "room_starboard_dock"
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
        openRoomIds: Object.keys(MASTER_ROOM_DEFS).filter(id => !MASTER_ROOM_DEFS[id].isNpcRoom && id !== "room_salvage_bay" && id !== "room_east_observation" && id !== "room_escape_pod_w" && id !== "room_escape_pod_e" && id !== "room_starboard_dock"),
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
        openRoomIds: Object.keys(MASTER_ROOM_DEFS).filter(id => !MASTER_ROOM_DEFS[id].isNpcRoom && id !== "room_salvage_bay" && id !== "room_escape_pod_w" && id !== "room_starboard_dock"),
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
        openRoomIds: Object.keys(MASTER_ROOM_DEFS).filter(id => !MASTER_ROOM_DEFS[id].isNpcRoom && id !== "room_salvage_bay" && id !== "room_east_airlock" && id !== "room_starboard_dock" && id !== "room_specimen_vault"),
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
        openRoomIds: Object.keys(MASTER_ROOM_DEFS).filter(id => !MASTER_ROOM_DEFS[id].isNpcRoom && id !== "room_salvage_bay" && id !== "room_starboard_dock"),
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
        openRoomIds: Object.keys(MASTER_ROOM_DEFS).filter(id => !MASTER_ROOM_DEFS[id].isNpcRoom),
        npcPlacements: {
            "room_tactical_plan": "kaze",
            "room_med_surgery": "shaokexin",
            "room_shields_emitter": "mode"
        },
        foodPlacements: ["room_storage_ne", "room_mess_hall", "room_water_purify", "room_coolant_tank"]
    }
};

function buildSpaceshipLevelMap(levelId) {
    const spec = LEVEL_SECTOR_SPECS[levelId] || LEVEL_SECTOR_SPECS[1];
    const openRoomIds = [...(spec.openRoomIds || [])];
    const openSet = new Set(openRoomIds);
    const nodes = {};

    // 决定食物投放位置 (支持固定配置或动态随机抽取投放)
    let finalFoodRooms = new Set(spec.foodPlacements || []);
    if (spec.randomFoodCount && spec.randomFoodCount > 0) {
        // 方案一：场景动态随机抽取指定数量的房间投放体力箱 (排除起点、终点和已放置NPC的房间)
        const eligibleRooms = openRoomIds.filter(id =>
            id !== spec.startNodeId &&
            id !== spec.exitNodeId &&
            id !== "room_exit" &&
            id !== "room_npc_kaze" &&
            !(spec.npcPlacements && spec.npcPlacements[id])
        );
        const shuffled = [...eligibleRooms];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        finalFoodRooms = new Set(shuffled.slice(0, spec.randomFoodCount));
    }

    openRoomIds.forEach(id => {
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
            isDetectionRoom: !!baseDef.isDetectionRoom,
            isNpcRoom: !!baseDef.isNpcRoom,
            npcOwnerId: baseDef.npcOwnerId,
            diary: baseDef.diary,
            connectsTo: baseDef.connectsTo,
            connections: {}
        };

        const isDesignatedExit = spec.exitNodeId ? (id === spec.exitNodeId) : (baseDef.isExit || id === "room_exit");
        if (isDesignatedExit) {
            node.isExit = true;
            node.event = { type: "exit", name: (id === "room_npc1" ? "动力操作台" : "终点气密大门") };
        } else {
            node.isExit = false;
            if (node.event && node.event.type === "exit") {
                delete node.event;
            }
        }

        if (id === spec.startNodeId) {
            node.isStart = true;
        }

        if (spec.npcPlacements && spec.npcPlacements[id]) {
            node.event = {
                type: "npc",
                npcId: spec.npcPlacements[id]
            };
            node.npcId = spec.npcPlacements[id];
            if (!node.npcOwnerId) {
                node.npcOwnerId = spec.npcPlacements[id];
            }
        }

        if (finalFoodRooms.has(id)) {
            node.event = {
                type: "food",
                name: "高能浓缩战备配给"
            };
        }

        nodes[id] = node;
    });

    const severedSet = new Set();
    if (spec.severedConnections && Array.isArray(spec.severedConnections)) {
        spec.severedConnections.forEach(([a, b]) => {
            severedSet.add(`${a}_${b}`);
            severedSet.add(`${b}_${a}`);
        });
    }

    const allConns = [...MASTER_CONNECTIONS, ...(spec.additionalConnections || [])];
    allConns.forEach(([a, b]) => {
        if (openSet.has(a) && openSet.has(b)) {
            if (severedSet.has(`${a}_${b}`)) {
                return; // 切断两房间连接通道
            }
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
            let lockReason = "防爆安全气闸锁死 · 供电切断";
            if (def.isNpcRoom) {
                lockReason = "专属舱室上锁 · 需该乘员随行";
            } else if (spec.useHostCompatibilityLock) {
                const isYellow = spec.yellowLockRoomIds && spec.yellowLockRoomIds.includes(id);
                lockReason = isYellow ? "防爆安全气闸锁死 · 供电切断" : "宿主契合度不足，无法探索";
            }

            lockedRooms[id] = {
                id: def.id,
                name: def.name,
                coord: { x: def.coord.x, y: def.coord.y },
                shape: def.shape,
                equipment: def.equipment,
                isNpcRoom: !!def.isNpcRoom,
                npcOwnerId: def.npcOwnerId,
                diary: def.diary,
                connectsTo: def.connectsTo,
                state: def.isNpcRoom ? "npc_locked" : "locked",
                lockReason: lockReason
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
        patrolNodes: spec.patrolNodes || [],
        masterShip: {
            allRooms: MASTER_ROOM_DEFS,
            allConnections: allConns,
            openRoomIds: openRoomIds,
            lockedRooms,
            fogRooms,
            patrolNodes: spec.patrolNodes || []
        }
    };
}


    // =========================================================================
    // 模块: generatedLevels.js
    // =========================================================================
/**
 * 自动生成的高维关卡地图拓扑表 (Levels 3 to 25)
 * 基于统一宇宙飞船基地母蓝图系统 (SpaceshipMasterMap) 驱动：
 * - 关卡 3~5：第一梯级 (11~16间)，局部甲板封锁
 * - 关卡 6~10：第二梯级 (22~26间)，双甲板贯通互联
 * - 关卡 11~15：第三梯级 (36~42间)，三甲板大型网状贯通与异化变体
 * - 关卡 16~20：第四梯级 (44~48间)，四甲板大贯通，大半星舰解锁
 * - 关卡 21~25：第五梯级 (52~58间)，全舰大通关终极决战
 */



const GeneratedLevels = [];

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


    // =========================================================================
    // 模块: levels.js
    // =========================================================================
/**
 * 第一关关卡与手绘地图配置表 (Level 1 Configuration)
 * 严格按照手绘草图拓扑结构配置各个房间、通道、昏迷NPC、食物点与终点
 */




const BaseLevels = [
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
    }
];

const ExclusiveBranchLevels = [
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

const LevelRegistry = [
    ...BaseLevels,
    ...(typeof GeneratedLevels !== "undefined" ? GeneratedLevels : []),
    ...ExclusiveBranchLevels
];



    // =========================================================================
    // 模块: dialogueUI.js
    // =========================================================================
/**
 * 视觉小说对话与立绘控制器 (Visual Novel Dialogue UI)
 * 严格按照用户需求：
 * 1. 占满屏幕正中底下的视觉小说对话框
 * 2. 对话框左上角人名标牌
 * 3. 每一个 NPC 与玩家专属的边框发光色与主题色
 * 4. 表情差分系统：NPC右上角立绘根据当前句子表情（angry, doubt, smile等）实时动态变脸！
 * 5. 点击推进下一句、打字机跳过机制与完成回调
 */




// 全局立绘容错轮询处理器 (当优先候选文件不存在时，无缝尝试下一个格式/别名直至保底)
if (typeof window !== "undefined") {
    window.handlePortraitError = function(img) {
        if (!img) return;
        try {
            let raw = img.getAttribute("data-candidates");
            if (raw) {
                if (typeof raw === "string" && raw.includes("&quot;")) {
                    raw = raw.replace(/&quot;/g, '"');
                }
                const candidates = (typeof raw === "string") ? JSON.parse(raw) : raw;
                let idx = parseInt(img.getAttribute("data-index") || "0", 10) + 1;
                if (Array.isArray(candidates) && idx < candidates.length) {
                    img.setAttribute("data-index", String(idx));
                    img.src = candidates[idx];
                    return;
                }
            }
        } catch (e) {
            console.warn("[Portrait] 尝试候选立绘失败:", e);
        }
        const fallback = img.getAttribute("data-fallback");
        if (fallback && img.src !== fallback) {
            img.src = fallback;
        }
    };
}

class DialogueUI {
    constructor() {
        this.boxElement = document.getElementById("vn-dialogue-box");
        this.nameElement = document.getElementById("vn-speaker-name");
        this.textElement = document.getElementById("vn-dialogue-text");
        this.portraitElement = document.getElementById("vn-speaker-portrait");
        this.cornerAvatarElement = document.getElementById("vn-dialogue-corner-avatar");
        this.advanceIndicator = document.getElementById("vn-advance-cursor");

        this.currentQueue = [];
        this.currentIndex = 0;
        this.onCompleteCallback = null;

        this.isTyping = false;
        this.typingTimer = null;
        this.fullTextOfCurrentLine = "";

        this.bindEvents();
        this.hideBox(); // 初始默认隐藏对话框，不占用任何探索界面与导航按键空间
    }

    bindEvents() {
        if (!this.boxElement) return;

        let touchStartX = 0;
        let touchStartY = 0;
        let isTouchDrag = false;
        let lastTouchDragTime = 0;

        this.boxElement.addEventListener("touchstart", (e) => {
            if (e.touches && e.touches.length > 0) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                isTouchDrag = false;
            }
        }, { passive: true });

        this.boxElement.addEventListener("touchmove", (e) => {
            if (e.touches && e.touches.length > 0) {
                const dx = e.touches[0].clientX - touchStartX;
                const dy = e.touches[0].clientY - touchStartY;
                if (Math.hypot(dx, dy) > 8) {
                    isTouchDrag = true;
                    lastTouchDragTime = Date.now();
                }
            }
        }, { passive: true });

        this.boxElement.addEventListener("touchend", () => {
            if (isTouchDrag) {
                lastTouchDragTime = Date.now();
            }
        }, { passive: true });

        this.boxElement.addEventListener("click", () => {
            // 如果用户正在手指滑动查看长文本，不触发推进
            if (isTouchDrag || (Date.now() - lastTouchDragTime < 300)) {
                isTouchDrag = false;
                return;
            }
            this.handleClick();
        });
    }

    /**
     * 播放一段或多段对话
     * @param {Array<{speaker: Object, text: string}>} dialogueLines 
     * @param {Function} onComplete 播放完毕后的回调
     */
    playSequence(dialogueLines, onComplete = null) {
        if (!dialogueLines || dialogueLines.length === 0) {
            this.hideBox();
            if (onComplete) onComplete();
            return;
        }

        this.currentQueue = dialogueLines;
        this.currentIndex = 0;
        this.onCompleteCallback = onComplete;
        this.showBox();
        this.renderCurrentLine();
    }

    /**
     * 快捷播放单条对话
     */
    say(speaker, text, onComplete = null) {
        if (!text || (typeof text === "string" && text.trim() === "")) {
            this.hideBox();
            if (onComplete) onComplete();
            return;
        }
        this.playSequence([{ speaker, text }], onComplete);
    }

    showBox() {
        if (this.boxElement) {
            this.boxElement.classList.remove("vn-hidden");
        }
        const screenGame = document.getElementById("screen-game");
        if (screenGame) {
            screenGame.classList.add("has-dialogue-active");
        }
    }

    hideBox() {
        if (this.boxElement) {
            this.boxElement.classList.add("vn-hidden");
            this.boxElement.classList.remove("has-portrait");
        }
        if (this.portraitElement) {
            this.portraitElement.classList.add("portrait-hidden");
        }
        if (this.cornerAvatarElement) {
            this.cornerAvatarElement.classList.add("portrait-hidden");
        }
        const screenGame = document.getElementById("screen-game");
        if (screenGame) {
            screenGame.classList.remove("has-dialogue-active");
        }
    }

    renderCurrentLine() {
        if (this.currentIndex >= this.currentQueue.length) {
            this.finishSequence();
            return;
        }

        const item = this.currentQueue[this.currentIndex];
        const speaker = item.speaker || { name: "系统", themeColor: "#38bdf8" };

        // 解析当前文本与绑定的表情 (支持直接传 item.expression 或 文本内包含 [生气] 等标签，无指示时默认用 clam)
        let parsed = { text: "", expression: "clam" };
        if (item.expression) {
            parsed.text = item.text || "";
            parsed.expression = (typeof CharacterRegistry !== "undefined" && CharacterRegistry.normalizeExpression)
                ? CharacterRegistry.normalizeExpression(item.expression)
                : item.expression;
        } else if (typeof CharacterRegistry !== "undefined" && CharacterRegistry.parseDialogueLine) {
            parsed = CharacterRegistry.parseDialogueLine(item.text !== undefined ? item.text : item);
        } else {
            parsed.text = item.text || "";
            parsed.expression = "clam";
        }

        this.fullTextOfCurrentLine = parsed.text;

        // 1. 设置说话人姓名与主题色 (死亡时呈现告警红色)
        this.nameElement.textContent = (parsed.expression === "dead") ? `${speaker.name} [已遇害]` : speaker.name;
        this.applySpeakerTheme(speaker, parsed.expression);

        // 2. 渲染立绘 (主角不展示，NPC在对话框右上角展示对应表情立绘，遇害时展示 dead 立绘)
        this.renderPortrait(speaker, parsed.expression);

        // 3. 广播发出警报时播放专属警报音效 (警告.wav)
        const isAlarmLine = (
            (speaker.name && /警报|警告|警示|ALERT/i.test(speaker.name)) ||
            (this.isBroadcastOrSystem(speaker) && /⚠️|警报|警告/i.test(this.fullTextOfCurrentLine))
        );
        if (isAlarmLine && typeof Sound !== "undefined" && Sound.playAlarmSound) {
            Sound.playAlarmSound();
        }

        // 4. 开始打字机动画
        this.startTypewriter(this.fullTextOfCurrentLine);
    }

    applySpeakerTheme(speaker, expression = "clam") {
        const isDead = (expression === "dead");
        const themeColor = isDead ? "#ef4444" : (speaker.themeColor || "#38bdf8");
        const boxBorderColor = isDead ? "rgba(239, 68, 68, 0.9)" : (speaker.boxBorderColor || `rgba(56, 189, 248, 0.85)`);
        const boxBgGlow = isDead ? "rgba(239, 68, 68, 0.25)" : (speaker.boxBgGlow || `rgba(56, 189, 248, 0.15)`);

        // 动态修改对话框和名字牌的专属主题风格
        this.nameElement.style.color = themeColor;
        this.nameElement.style.borderColor = themeColor;
        this.nameElement.style.boxShadow = `0 0 12px ${themeColor}40`;

        this.boxElement.style.borderColor = boxBorderColor;
        this.boxElement.style.boxShadow = `0 -8px 24px ${boxBgGlow}, inset 0 0 20px ${boxBgGlow}`;
    }

    isBroadcastOrSystem(speaker) {
        if (!speaker) return true;
        if (speaker.isBroadcast || speaker.isSystem) return true;
        if (speaker.id === "system" || speaker.id === "broadcast") return true;
        const name = speaker.name || "";
        return /广播|系统|终端|通信|审决|全员/i.test(name);
    }

    renderPortrait(speaker, expression = "clam") {
        // 系统广播、警报广播、终端通知等一律严禁展示立绘
        if (this.isBroadcastOrSystem(speaker)) {
            if (this.cornerAvatarElement) {
                this.cornerAvatarElement.classList.add("portrait-hidden");
                this.cornerAvatarElement.innerHTML = "";
            }
            if (this.portraitElement) {
                this.portraitElement.classList.add("portrait-hidden");
            }
            if (this.boxElement) {
                this.boxElement.classList.remove("has-portrait");
            }
            return;
        }

        // 角色/NPC 说话时：立绘展示在对话框左上角！用户明确要求：不要标注“生气/平静”等字样
        if (this.cornerAvatarElement) {
            this.cornerAvatarElement.classList.remove("portrait-hidden");
            if (this.boxElement) {
                this.boxElement.classList.add("has-portrait");
            }

            const color = speaker.themeColor || "#38bdf8";
            const exp = (typeof CharacterRegistry !== "undefined" && CharacterRegistry.normalizeExpression)
                ? CharacterRegistry.normalizeExpression(expression)
                : (expression || "clam");
            
            // 获取候选立绘队列
            const candidates = (typeof CharacterRegistry !== "undefined" && CharacterRegistry.getCharacterImageCandidates)
                ? CharacterRegistry.getCharacterImageCandidates(speaker, exp)
                : [(speaker.expressions && speaker.expressions[exp]) || speaker.avatarUrl || ""];

            // 备用差分SVG
            const fallbackSvg = (typeof CharacterRegistry !== "undefined" && CharacterRegistry.getAvatarSvg)
                ? CharacterRegistry.getAvatarSvg(speaker, exp)
                : (speaker.fallbackSvg || "");

            const isDead = (exp === "dead");
            const borderColor = isDead ? "#ef4444" : color;
            const shadowGlow = isDead
                ? "0 0 24px rgba(239, 68, 68, 0.95), inset 0 0 16px rgba(239, 68, 68, 0.6)"
                : `0 0 16px ${color}80, inset 0 0 12px ${color}40`;

            const primaryUrl = candidates[0] || fallbackSvg;
            const candidatesAttr = JSON.stringify(candidates).replace(/"/g, '&quot;');

            // 优化 DOM 节点复用：同角色同表情连续发言时，完全保留已有 DOM 树，杜绝销毁重绘导致的白屏与解码延迟
            const speakerKey = `${speaker.id || speaker.name || 'char'}_${exp}`;
            if (this.currentSpeakerKey !== speakerKey || !this.cornerAvatarElement.innerHTML) {
                this.currentSpeakerKey = speakerKey;
                this.cornerAvatarElement.innerHTML = `
                    <div class="corner-avatar-frame ${isDead ? 'avatar-frame-dead' : ''}" style="border-color:${borderColor}; box-shadow:${shadowGlow};">
                        <img src="${primaryUrl}"
                             loading="eager"
                             decoding="sync"
                             data-candidates="${candidatesAttr}"
                             data-index="0"
                             data-fallback="${fallbackSvg}"
                             alt="${speaker.name}"
                             class="corner-portrait-img ${isDead ? 'dead-portrait-img' : ''}"
                             onerror="window.handlePortraitError && window.handlePortraitError(this)">
                    </div>
                `;
            }
        }
    }

    startTypewriter(text) {
        if (this.typingTimer) {
            clearInterval(this.typingTimer);
        }

        this.isTyping = true;
        this.textElement.textContent = "";
        if (this.textElement) {
            this.textElement.scrollTop = 0;
        }
        if (this.advanceIndicator) {
            this.advanceIndicator.classList.add("indicator-hidden");
        }

        let charIdx = 0;
        const speed = 24; // 毫秒/字

        this.typingTimer = setInterval(() => {
            if (charIdx < text.length) {
                this.textElement.textContent += text.charAt(charIdx);
                charIdx++;
                if (this.textElement) {
                    this.textElement.scrollTop = this.textElement.scrollHeight;
                }
            } else {
                this.finishTyping();
            }
        }, speed);
    }

    finishTyping() {
        if (this.typingTimer) {
            clearInterval(this.typingTimer);
            this.typingTimer = null;
        }
        this.isTyping = false;
        this.textElement.textContent = this.fullTextOfCurrentLine;
        if (this.textElement) {
            this.textElement.scrollTop = this.textElement.scrollHeight;
        }
        if (this.advanceIndicator) {
            this.advanceIndicator.classList.remove("indicator-hidden");
        }
    }

    handleClick() {
        // 如果正在打字，点击立即显示整句
        if (this.isTyping) {
            this.finishTyping();
            return;
        }

        // 如果已经打完，点击前进至下一句
        this.currentIndex++;
        this.renderCurrentLine();
    }

    finishSequence() {
        this.currentQueue = [];
        this.currentIndex = 0;
        this.hideBox();
        if (this.advanceIndicator) {
            this.advanceIndicator.classList.add("indicator-hidden");
        }
        if (this.onCompleteCallback) {
            const cb = this.onCompleteCallback;
            this.onCompleteCallback = null;
            cb();
        }
    }
}


    // =========================================================================
    // 模块: diaryUI.js
    // =========================================================================
﻿/**
 * NPC 日记翻页弹窗控制器 (Diary Modal UI)
 * 独立弹窗（非文字框），支持翻页阅读，代码完全解耦、高扩展性。
 * 用法：diaryUI.open(npcName, themeColor, pages, onClose?)
 */

class DiaryUI {
    constructor() {
        this.currentPage = 0;
        this.pages = [];
        this.npcName = "";
        this.themeColor = "#38bdf8";
        this.onCloseCallback = null;
        this._bound = false;
    }

    /**
     * 初始化 DOM 引用并绑定按钮事件（懒初始化，只执行一次）
     */
    _initDom() {
        if (this._bound) return;
        this.backdrop     = document.getElementById("modal-npc-diary");
        this.elNpcName    = document.getElementById("diary-npc-name");
        this.elIndicator  = document.getElementById("diary-page-indicator");
        this.elTitle      = document.getElementById("diary-page-title");
        this.elContent    = document.getElementById("diary-page-content");
        this.btnPrev      = document.getElementById("btn-diary-prev");
        this.btnNext      = document.getElementById("btn-diary-next");
        this.btnClose     = document.getElementById("btn-close-diary");

        if (!this.backdrop) return; // 测试环境兜底

        this.btnPrev?.addEventListener("click", () => this.goToPage(this.currentPage - 1));
        this.btnNext?.addEventListener("click", () => this.goToPage(this.currentPage + 1));
        this.btnClose?.addEventListener("click", () => this.close());

        // 点击遮罩层外侧关闭
        this.backdrop.addEventListener("click", (e) => {
            if (e.target === this.backdrop) this.close();
        });

        this._bound = true;
    }

    /**
     * 打开日记弹窗
     * @param {string} npcName - NPC 名称（显示于标题）
     * @param {string} themeColor - 主题色（边框 + 标题）
     * @param {Array<{title:string, content:string}>} pages - 日记页数组
     * @param {Function} [onClose] - 关闭回调（可选）
     */
    open(npcName, themeColor, pages, onClose = null) {
        this._initDom();
        if (!this.backdrop || !pages || pages.length === 0) return;

        this.npcName = npcName;
        this.themeColor = themeColor || "#38bdf8";
        this.pages = pages;
        this.currentPage = 0;
        this.onCloseCallback = onClose;

        // 应用主题色到弹窗边框
        const box = this.backdrop.querySelector(".diary-modal-box");
        if (box) box.style.borderColor = this.themeColor;

        if (this.elNpcName) {
            this.elNpcName.textContent = `${npcName} 的日记`;
            this.elNpcName.style.color = this.themeColor;
        }

        this.goToPage(0);
        this.backdrop.classList.remove("hidden");
    }

    /**
     * 跳转到指定页
     * @param {number} idx - 页码（0-indexed）
     */
    goToPage(idx) {
        if (!this.pages || this.pages.length === 0) return;
        idx = Math.max(0, Math.min(this.pages.length - 1, idx));
        this.currentPage = idx;

        const page = this.pages[idx];

        if (this.elIndicator) {
            this.elIndicator.textContent = `第 ${idx + 1} 页 / 共 ${this.pages.length} 页`;
        }
        if (this.elTitle) {
            this.elTitle.textContent = page.title || `第 ${idx + 1} 页`;
        }
        if (this.elContent) {
            // 将换行符转成 HTML 换行
            this.elContent.innerHTML = (page.content || "").replace(/\n/g, "<br>");
            // 每次翻页滚动回顶部
            this.elContent.scrollTop = 0;
        }

        // 按钮状态
        if (this.btnPrev) this.btnPrev.disabled = (idx === 0);
        if (this.btnNext) this.btnNext.disabled = (idx >= this.pages.length - 1);
    }

    /**
     * 关闭日记弹窗
     */
    close() {
        this._initDom();
        if (!this.backdrop) return;
        this.backdrop.classList.add("hidden");
        if (this.onCloseCallback) {
            const cb = this.onCloseCallback;
            this.onCloseCallback = null;
            cb();
        }
    }

    /**
     * 当前弹窗是否处于打开状态
     */
    isOpen() {
        this._initDom();
        return this.backdrop && !this.backdrop.classList.contains("hidden");
    }
}


    // =========================================================================
    // 模块: saveSystem.js
    // =========================================================================
/**
 * 存档与读档管理系统 (Save / Load System)
 * 具备沙箱安全防护与无痕模式/iframe内存降级保护，完美适配虎扑AI工坊等平台环境
 */

class SaveSystem {
    constructor(saveKey = "DOPPELGANGER_ROGUE_SAVE_V1", unlockedKey = "DOPPELGANGER_UNLOCKED_LEVELS_V1", personaKey = "DOPPELGANGER_PERSONA_SECRETS_V1") {
        this.saveKey = saveKey;
        this.unlockedKey = unlockedKey;
        this.personaKey = personaKey;
        this.memoryStore = {};
        this.isLocalStorageAvailable = this.checkLocalStorage();
    }

    checkLocalStorage() {
        try {
            const testKey = "__storage_test__";
            window.localStorage.setItem(testKey, testKey);
            window.localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            console.warn("[SaveSystem] LocalStorage 不可用 (可能处于安全沙箱或无痕模式)，自动切换为内存安全存储。");
            return false;
        }
    }

    hasSave() {
        if (this.isLocalStorageAvailable) {
            try {
                return !!window.localStorage.getItem(this.saveKey);
            } catch (e) {
                return !!this.memoryStore[this.saveKey];
            }
        }
        return !!this.memoryStore[this.saveKey];
    }

    saveGame(gameState) {
        try {
            const serialized = JSON.stringify(gameState);
            this.memoryStore[this.saveKey] = serialized;
            if (this.isLocalStorageAvailable) {
                window.localStorage.setItem(this.saveKey, serialized);
            }
            return true;
        } catch (e) {
            console.error("[SaveSystem] 存档失败:", e);
            return false;
        }
    }

    loadGame() {
        try {
            let data = null;
            if (this.isLocalStorageAvailable) {
                data = window.localStorage.getItem(this.saveKey);
            }
            if (!data) {
                data = this.memoryStore[this.saveKey];
            }
            if (!data) return null;
            return JSON.parse(data);
        } catch (e) {
            console.error("[SaveSystem] 读档失败:", e);
            return null;
        }
    }

    clearSave() {
        try {
            delete this.memoryStore[this.saveKey];
            if (this.isLocalStorageAvailable) {
                window.localStorage.removeItem(this.saveKey);
            }
        } catch (e) {
            console.error("[SaveSystem] 清理存档失败:", e);
        }
    }

    // =========================================================================
    // 关卡解锁持久化管理 (默认初始仅开放第 1 关)
    // =========================================================================
    getUnlockedLevels() {
        try {
            let raw = null;
            if (this.isLocalStorageAvailable) {
                raw = window.localStorage.getItem(this.unlockedKey);
            }
            if (!raw) {
                raw = this.memoryStore[this.unlockedKey];
            }
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const validIds = parsed.map(n => Number(n)).filter(n => !isNaN(n) && n > 0);
                    if (!validIds.includes(1)) validIds.unshift(1);
                    return Array.from(new Set(validIds)).sort((a, b) => a - b);
                }
            }
        } catch (e) {
            console.error("[SaveSystem] 获取已解锁关卡失败:", e);
        }
        return [1]; // 默认初始仅开放第 1 关
    }

    isLevelUnlocked(levelId) {
        const list = this.getUnlockedLevels();
        return list.includes(Number(levelId));
    }

    unlockLevels(levelIds = []) {
        if (!Array.isArray(levelIds) || levelIds.length === 0) {
            return [];
        }
        const currentList = this.getUnlockedLevels();
        const currentSet = new Set(currentList);
        const newlyUnlocked = [];

        levelIds.forEach(id => {
            const numId = Number(id);
            if (!isNaN(numId) && numId > 0 && !currentSet.has(numId)) {
                currentSet.add(numId);
                newlyUnlocked.push(numId);
            }
        });

        if (newlyUnlocked.length > 0) {
            const updatedList = Array.from(currentSet).sort((a, b) => a - b);
            const serialized = JSON.stringify(updatedList);
            this.memoryStore[this.unlockedKey] = serialized;
            if (this.isLocalStorageAvailable) {
                try {
                    window.localStorage.setItem(this.unlockedKey, serialized);
                } catch (e) {
                    console.error("[SaveSystem] 存储解锁关卡失败:", e);
                }
            }
            console.log(`[SaveSystem] 新增解锁关卡: [${newlyUnlocked.join(", ")}]，当前开放列表: [${updatedList.join(", ")}]`);
        }

        return newlyUnlocked;
    }

    resetUnlockedLevels() {
        const defaultList = [1];
        const serialized = JSON.stringify(defaultList);
        this.memoryStore[this.unlockedKey] = serialized;
        if (this.isLocalStorageAvailable) {
            try {
                window.localStorage.setItem(this.unlockedKey, serialized);
            } catch (e) {
                console.error("[SaveSystem] 重置关卡解锁失败:", e);
            }
        }
        return defaultList;
    }

    // =========================================================================
    // 人物特征 / 秘密图鉴 (Persona Log) 持久化管理
    // =========================================================================
    getPersonaSecretsMap() {
        try {
            let raw = null;
            if (this.isLocalStorageAvailable) {
                raw = window.localStorage.getItem(this.personaKey);
            }
            if (!raw) {
                raw = this.memoryStore[this.personaKey];
            }
            if (raw) {
                return JSON.parse(raw) || {};
            }
        } catch (e) {
            console.error("[SaveSystem] 获取图鉴档案失败:", e);
        }
        return {};
    }

    getUnlockedSecrets(charId) {
        const map = this.getPersonaSecretsMap();
        return Array.isArray(map[charId]) ? map[charId] : [];
    }

    isPersonaSecretUnlocked(charId, secretId) {
        const list = this.getUnlockedSecrets(charId);
        return list.includes(secretId);
    }

    unlockPersonaSecret(charId, secretId) {
        if (!charId || !secretId) return false;
        const map = this.getPersonaSecretsMap();
        if (!Array.isArray(map[charId])) {
            map[charId] = [];
        }
        if (map[charId].includes(secretId)) {
            return false; // 已经解锁过
        }
        map[charId].push(secretId);

        const serialized = JSON.stringify(map);
        this.memoryStore[this.personaKey] = serialized;
        if (this.isLocalStorageAvailable) {
            try {
                window.localStorage.setItem(this.personaKey, serialized);
            } catch (e) {
                console.error("[SaveSystem] 存储图鉴档案失败:", e);
            }
        }
        console.log(`[SaveSystem] ✨ 成功解构新档案: 角色 [${charId}] - 秘密 [${secretId}]`);
        return true;
    }

    isCharacterPassiveUnlocked(charId) {
        const list = this.getUnlockedSecrets(charId);
        return list.length >= 4; // 达成全部 4 项解构
    }

    resetPersonaSecrets() {
        this.memoryStore[this.personaKey] = "{}";
        if (this.isLocalStorageAvailable) {
            try {
                window.localStorage.removeItem(this.personaKey);
            } catch (e) {
                console.error("[SaveSystem] 重置图鉴档案失败:", e);
            }
        }
        return {};
    }
}


    // =========================================================================
    // 模块: mapRenderer.js
    // =========================================================================
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * 飞船基地各区域专属甲板地面色调配置 (参考真实星舰战术蓝图配色)
 */
const DECK_THEMES = {
    command: {
        floor: "#1e384d",
        floorVisited: "#284b66",
        border: "#38bdf8",
        wall: "#0f172a",
        conduit: "#38bdf8",
        tag: "舰艏指控",
        accent: "#60a5fa"
    },
    living: {
        floor: "#6e4431",
        floorVisited: "#85543c",
        border: "#f59e0b",
        wall: "#1c120c",
        conduit: "#fbbf24",
        tag: "生活起居",
        accent: "#fbbf24"
    },
    ecology: {
        floor: "#1b4433",
        floorVisited: "#235741",
        border: "#34d399",
        wall: "#0a1f16",
        conduit: "#4ade80",
        tag: "水培生态",
        accent: "#6ee7b7"
    },
    cargo: {
        floor: "#3a414d",
        floorVisited: "#485161",
        border: "#94a3b8",
        wall: "#13171f",
        conduit: "#94a3b8",
        tag: "重载机库",
        accent: "#cbd5e1"
    },
    engineering: {
        floor: "#5c2419",
        floorVisited: "#732e20",
        border: "#f87171",
        wall: "#200b07",
        conduit: "#f87171",
        tag: "聚变反应",
        accent: "#fca5a5"
    },
    thruster: {
        floor: "#593118",
        floorVisited: "#703e1f",
        border: "#fb923c",
        wall: "#1f1007",
        conduit: "#fb923c",
        tag: "跃迁推进",
        accent: "#fdba74"
    },
    hub: {
        floor: "#252e3d",
        floorVisited: "#313c4f",
        border: "#38bdf8",
        wall: "#0e131c",
        conduit: "#38bdf8",
        tag: "中央枢纽",
        accent: "#7dd3fc"
    },
    start: {
        floor: "#1e3a8a",
        floorVisited: "#1d4ed8",
        border: "#60a5fa",
        wall: "#0b1638",
        conduit: "#60a5fa",
        tag: "出发点",
        accent: "#93c5fd"
    },
    exit: {
        floor: "#14532d",
        floorVisited: "#15803d",
        border: "#4ade80",
        wall: "#052010",
        conduit: "#4ade80",
        tag: "奇点星门",
        accent: "#86efac"
    }
};

/**
 * 绘制真实星舰舱室几何轮廓 (多边形外墙、内凹门斗、切角与翼舱)
 */
function drawRoomPolygon(ctx, shape, x, y, w, h) {
    ctx.beginPath();
    switch (shape) {
        // 1. 舰桥指挥中枢 (前凸梯形，顶窄底宽，带前向观察广角)
        case "bridge":
        case "bridge_sub":
        case "captain_pulpit": {
            const cut = Math.floor(w * 0.22);
            ctx.moveTo(x + cut, y + 2);
            ctx.quadraticCurveTo(x + w * 0.5, y - 1, x + w - cut, y + 2);
            ctx.lineTo(x + w, y + h);
            ctx.lineTo(x, y + h);
            ctx.closePath();
            break;
        }

        // 2. 舰艏深空雷达天线罩 (前伸抛物流线穹顶)
        case "sensor_dome":
        case "bow_dome":
        case "radome": {
            ctx.moveTo(x, y + h);
            ctx.lineTo(x + w * 0.08, y + h * 0.45);
            ctx.quadraticCurveTo(x + w * 0.18, y, x + w * 0.5, y);
            ctx.quadraticCurveTo(x + w * 0.82, y, x + w * 0.92, y + h * 0.45);
            ctx.lineTo(x + w, y + h);
            ctx.closePath();
            break;
        }

        // 3. 战术推演厅 / 前锋战备室 (前凸锋利五角倒角楔形)
        case "tactical_wedge":
        case "vanguard_apex": {
            ctx.moveTo(x + w * 0.5, y);
            ctx.lineTo(x + w, y + h * 0.38);
            ctx.lineTo(x + w * 0.82, y + h);
            ctx.lineTo(x + w * 0.18, y + h);
            ctx.lineTo(x, y + h * 0.38);
            ctx.closePath();
            break;
        }

        // 4. 重核聚变主反应堆 (托卡马克磁约束四角外伸抗磁护耳强装甲舱)
        case "tokamak_reactor":
        case "reactor": {
            const c = Math.floor(w * 0.26);
            const ear = Math.floor(w * 0.08); // 四角外突磁轭
            ctx.moveTo(x + c, y);
            ctx.lineTo(x + w - c, y);
            ctx.lineTo(x + w, y + c);
            ctx.lineTo(x + w + ear, y + c);
            ctx.lineTo(x + w + ear, y + h - c);
            ctx.lineTo(x + w, y + h - c);
            ctx.lineTo(x + w - c, y + h);
            ctx.lineTo(x + c, y + h);
            ctx.lineTo(x, y + h - c);
            ctx.lineTo(x - ear, y + h - c);
            ctx.lineTo(x - ear, y + c);
            ctx.lineTo(x, y + c);
            ctx.closePath();
            break;
        }

        // 5. 重装八角舱 (AI超脑核心 / 异构标本库 / 苏醒中枢)
        case "ai_core_hex":
        case "specimen_vault":
        case "hub_central_oct":
        case "octagon": {
            const c = Math.floor(Math.min(w, h) * 0.28);
            ctx.moveTo(x + c, y);
            ctx.lineTo(x + w - c, y);
            ctx.lineTo(x + w, y + c);
            ctx.lineTo(x + w, y + h - c);
            ctx.lineTo(x + w - c, y + h);
            ctx.lineTo(x + c, y + h);
            ctx.lineTo(x, y + h - c);
            ctx.lineTo(x, y + c);
            ctx.closePath();
            break;
        }

        // 6. 医疗急救与生化检测 (经典科幻十字十二边形级联舱)
        case "medical_cross":
        case "medical": {
            const cw = Math.floor(w * 0.24);
            const ch = Math.floor(h * 0.24);
            ctx.moveTo(x + cw, y);
            ctx.lineTo(x + w - cw, y);
            ctx.lineTo(x + w - cw, y + ch);
            ctx.lineTo(x + w, y + ch);
            ctx.lineTo(x + w, y + h - ch);
            ctx.lineTo(x + w - cw, y + h - ch);
            ctx.lineTo(x + w - cw, y + h);
            ctx.lineTo(x + cw, y + h);
            ctx.lineTo(x + cw, y + h - ch);
            ctx.lineTo(x, y + h - ch);
            ctx.lineTo(x, y + ch);
            ctx.lineTo(x + cw, y + ch);
            ctx.closePath();
            break;
        }

        // 7. 通讯信标发射塔楼 (倾斜不对称天线台楼)
        case "comm_tower": {
            ctx.moveTo(x + w * 0.15, y + h * 0.25);
            ctx.lineTo(x + w * 0.82, y);
            ctx.lineTo(x + w, y + h * 0.85);
            ctx.lineTo(x + w * 0.78, y + h);
            ctx.lineTo(x, y + h);
            ctx.closePath();
            break;
        }

        // 8. 环景深空观景穹顶 / 邵可欣观测舱 (大弧度外舷窗穹顶)
        case "observation_dome":
        case "observation_bay_e":
        case "panoramic_pod": {
            ctx.moveTo(x, y + h);
            ctx.lineTo(x, y + h * 0.2);
            if (ctx.bezierCurveTo) {
                ctx.bezierCurveTo(x + w * 0.35, y - h * 0.08, x + w * 0.95, y + h * 0.1, x + w, y + h * 0.65);
            } else {
                ctx.lineTo(x + w, y + h * 0.65);
            }
            ctx.lineTo(x + w * 0.85, y + h);
            ctx.closePath();
            break;
        }

        // 9. 气闸对接舱 / 洗消气闸 (束腰内凹双重气密锁)
        case "airlock_dock":
        case "airlock_dock_w":
        case "airlock_dock_e":
        case "decon_airlock":
        case "airlock": {
            const c = Math.floor(Math.min(w, h) * 0.18);
            const waist = Math.floor(w * 0.09);
            ctx.moveTo(x + c, y);
            ctx.lineTo(x + w - c, y);
            ctx.lineTo(x + w, y + c);
            ctx.lineTo(x + w - waist, y + h * 0.5);
            ctx.lineTo(x + w, y + h - c);
            ctx.lineTo(x + w - c, y + h);
            ctx.lineTo(x + c, y + h);
            ctx.lineTo(x, y + h - c);
            ctx.lineTo(x + waist, y + h * 0.5);
            ctx.lineTo(x, y + c);
            ctx.closePath();
            break;
        }

        // 10. 终焉折跃星门 / 脱出大门 (宏伟六角星门框)
        case "singularity_gate_ring":
        case "star_gate_arch": {
            const c = Math.floor(w * 0.24);
            ctx.moveTo(x + c, y);
            ctx.lineTo(x + w - c, y);
            ctx.lineTo(x + w, y + h * 0.5);
            ctx.lineTo(x + w - c, y + h);
            ctx.lineTo(x + c, y + h);
            ctx.lineTo(x, y + h * 0.5);
            ctx.closePath();
            break;
        }

        // 11. 左舷主离子推进器 (向后下扩散喇叭形离子喷管)
        case "engine_bell_l": {
            ctx.moveTo(x + w * 0.28, y);
            ctx.lineTo(x + w * 0.82, y);
            ctx.lineTo(x + w * 0.88, y + h * 0.45);
            ctx.lineTo(x + w, y + h);
            if (ctx.quadraticCurveTo) {
                ctx.quadraticCurveTo(x + w * 0.45, y + h * 0.85, x, y + h);
            } else {
                ctx.lineTo(x, y + h);
            }
            ctx.lineTo(x + w * 0.12, y + h * 0.45);
            ctx.closePath();
            break;
        }

        // 12. 右舷主离子推进器 (向后下扩散喇叭形离子喷管)
        case "engine_bell_r": {
            ctx.moveTo(x + w * 0.18, y);
            ctx.lineTo(x + w * 0.72, y);
            ctx.lineTo(x + w * 0.88, y + h * 0.45);
            ctx.lineTo(x + w, y + h);
            if (ctx.quadraticCurveTo) {
                ctx.quadraticCurveTo(x + w * 0.55, y + h * 0.85, x, y + h);
            } else {
                ctx.lineTo(x, y + h);
            }
            ctx.lineTo(x + w * 0.12, y + h * 0.45);
            ctx.closePath();
            break;
        }

        // 13. 救生穿梭机弹射管 (后倾斜向外弹射尖椎体)
        case "escape_pod_w": {
            ctx.moveTo(x + w * 0.6, y);
            ctx.lineTo(x + w, y + h * 0.25);
            ctx.lineTo(x + w * 0.75, y + h);
            ctx.lineTo(x, y + h * 0.6);
            ctx.lineTo(x + w * 0.2, y + h * 0.15);
            ctx.closePath();
            break;
        }
        case "escape_pod_e": {
            ctx.moveTo(x + w * 0.4, y);
            ctx.lineTo(x + w * 0.8, y + h * 0.15);
            ctx.lineTo(x + w, y + h * 0.6);
            ctx.lineTo(x + w * 0.25, y + h);
            ctx.lineTo(x, y + h * 0.25);
            ctx.closePath();
            break;
        }

        // 14. 水培生态植物园 (有机流线椭圆穹顶)
        case "hydro_dome": {
            const rx = w / 2, ry = h / 2;
            const cx = x + rx, cy = y + ry;
            if (ctx.ellipse) {
                ctx.ellipse(cx, cy, rx, ry * 0.88, 0, 0, Math.PI * 2);
            } else {
                ctx.arc(cx, cy, Math.min(rx, ry), 0, Math.PI * 2);
            }
            break;
        }

        // 15. 穿梭艇停泊机库 / 自动化餐厅 (宽阔装载平底梯形)
        case "hangar_bay":
        case "mess_hall": {
            const cut = Math.floor(w * 0.16);
            ctx.moveTo(x + cut, y);
            ctx.lineTo(x + w - cut, y);
            ctx.lineTo(x + w, y + h);
            ctx.lineTo(x, y + h);
            ctx.closePath();
            break;
        }

        // 16. 重型仓储库房 / 矿石冷藏 (宽六角强化仓)
        case "cargo_depot":
        case "storage": {
            const c = Math.floor(Math.min(w, h) * 0.22);
            ctx.moveTo(x + c, y);
            ctx.lineTo(x + w - c, y);
            ctx.lineTo(x + w, y + h * 0.5);
            ctx.lineTo(x + w - c, y + h);
            ctx.lineTo(x + c, y + h);
            ctx.lineTo(x, y + h * 0.5);
            ctx.closePath();
            break;
        }

        // 17. 船员起居生活舱群 (模块化胶囊休眠凹槽)
        case "living_quarters":
        case "crew_cabin":
        case "quarters": {
            const cut = Math.floor(w * 0.12);
            ctx.moveTo(x + cut, y);
            ctx.lineTo(x + w - cut, y);
            ctx.lineTo(x + w, y + cut);
            ctx.lineTo(x + w, y + h - cut);
            ctx.lineTo(x + w - cut, y + h);
            ctx.lineTo(x + cut, y + h);
            ctx.lineTo(x, y + h - cut);
            ctx.lineTo(x, y + cut);
            ctx.closePath();
            break;
        }

        // 18. 防爆掩体与坚守战位 (多棱角厚重折角堡垒)
        case "secure_bunker":
        case "armory_vault":
        case "fortified_bastion": {
            ctx.moveTo(x + w * 0.35, y);
            ctx.lineTo(x + w * 0.85, y);
            ctx.lineTo(x + w, y + h * 0.35);
            ctx.lineTo(x + w, y + h * 0.85);
            ctx.lineTo(x + w * 0.7, y + h);
            ctx.lineTo(x + w * 0.15, y + h);
            ctx.lineTo(x, y + h * 0.7);
            ctx.lineTo(x, y + h * 0.35);
            ctx.closePath();
            break;
        }

        // 19. 通风十字交叉口 (真十字路口通道)
        case "junction_cross": {
            const m1 = Math.floor(w * 0.26);
            const m2 = Math.floor(w * 0.74);
            ctx.moveTo(x + m1, y);
            ctx.lineTo(x + m2, y);
            ctx.lineTo(x + m2, y + m1);
            ctx.lineTo(x + w, y + m1);
            ctx.lineTo(x + w, y + m2);
            ctx.lineTo(x + m2, y + m2);
            ctx.lineTo(x + m2, y + h);
            ctx.lineTo(x + m1, y + h);
            ctx.lineTo(x + m1, y + m2);
            ctx.lineTo(x, y + m2);
            ctx.lineTo(x, y + m1);
            ctx.lineTo(x + m1, y + m1);
            ctx.closePath();
            break;
        }

        // 20. 拐角弯道 (L型通道)
        case "corner_elbow": {
            const m = Math.floor(w * 0.45);
            ctx.moveTo(x, y);
            ctx.lineTo(x + w, y);
            ctx.lineTo(x + w, y + m);
            ctx.lineTo(x + m, y + m);
            ctx.lineTo(x + m, y + h);
            ctx.lineTo(x, y + h);
            ctx.closePath();
            break;
        }

        // 21. 横向加固走廊通道
        case "corridor_horizontal":
        case "corridor_h": {
            const my = y + Math.floor(h * 0.2);
            const mh = h - Math.floor(h * 0.4);
            if (ctx.roundRect) ctx.roundRect(x - 2, my, w + 4, mh, 4);
            else ctx.rect(x - 2, my, w + 4, mh);
            break;
        }

        // 22. 纵向维保管道走廊
        case "corridor_vertical":
        case "corridor_v": {
            const mx = x + Math.floor(w * 0.2);
            const mw = w - Math.floor(w * 0.4);
            if (ctx.roundRect) ctx.roundRect(mx, y - 2, mw, h + 4, 4);
            else ctx.rect(mx, y - 2, mw, h + 4);
            break;
        }

        // 23. 人工重力发生井 (外角切角带内凹离心力槽)
        case "gravity_torus": {
            const c = Math.floor(w * 0.25);
            ctx.moveTo(x + c, y);
            ctx.lineTo(x + w - c, y);
            if (ctx.quadraticCurveTo) {
                ctx.quadraticCurveTo(x + w - c / 2, y + h * 0.5, x + w - c, y + h);
            } else {
                ctx.lineTo(x + w - c, y + h);
            }
            ctx.lineTo(x + c, y + h);
            if (ctx.quadraticCurveTo) {
                ctx.quadraticCurveTo(x + c / 2, y + h * 0.5, x + c, y);
            } else {
                ctx.lineTo(x + c, y);
            }
            ctx.closePath();
            break;
        }

        // 24. 偏折护盾发生器 (外弧凹面投影罩)
        case "shield_projector": {
            ctx.moveTo(x, y + h * 0.85);
            if (ctx.quadraticCurveTo) {
                ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.4, x + w, y + h * 0.85);
            } else {
                ctx.lineTo(x + w, y + h * 0.85);
            }
            ctx.lineTo(x + w * 0.85, y);
            ctx.lineTo(x + w * 0.15, y);
            ctx.closePath();
            break;
        }

        // 25. 废料回收漏斗井 (外展漏斗)
        case "salvage_hopper": {
            ctx.moveTo(x, y);
            ctx.lineTo(x + w, y + h * 0.2);
            ctx.lineTo(x + w * 0.75, y + h);
            ctx.lineTo(x + w * 0.25, y + h);
            ctx.closePath();
            break;
        }

        // 26. 精密工坊、动力管道与对撞腔室等科幻多边形
        case "lab":
        case "machine_workshop":
        case "generator_twin":
        case "reaction_chamber":
        case "injection_nozzle":
        case "plasma_conduit":
        case "warp_nacelle":
        case "coolant_cylinders":
        case "coolant_sub":
        case "reactor_control":
        case "recreation_bay":
        case "water_recycler":
        case "life_support_hex":
        case "air_scrubber":
        case "dock_walkway":
        case "lift_shaft":
        case "bio_chamber":
        case "cryo_array":
        case "workshop_tactical":
        case "armored_chute": {
            const cutX = Math.floor(w * 0.2);
            ctx.moveTo(x + cutX, y);
            ctx.lineTo(x + w - cutX, y);
            ctx.lineTo(x + w, y + h * 0.5);
            ctx.lineTo(x + w - cutX, y + h);
            ctx.lineTo(x + cutX, y + h);
            ctx.lineTo(x, y + h * 0.5);
            ctx.closePath();
            break;
        }

        case "rect":
        default: {
            if (ctx.roundRect) ctx.roundRect(x, y, w, h, 6);
            else ctx.rect(x, y, w, h);
            break;
        }
    }
}

/**
 * 绘制舱室内微缩蓝图设备 (控制台、反应堆同心圆、医疗床心电图、货箱等)
 */
function drawEquipmentBlueprint(ctx, equipment, cx, cy, boxSize) {
    if (!equipment) return;
    ctx.save();
    ctx.lineWidth = 1.2;
    const r = boxSize * 0.32;

    switch (equipment) {
        case "energy_ring": {
            ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
            ctx.beginPath(); ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
            ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r);
            ctx.stroke();
            break;
        }
        case "bridge_console":
        case "console": {
            ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
            ctx.beginPath();
            ctx.arc(cx, cy + r * 0.2, r * 0.75, Math.PI * 1.15, Math.PI * 1.85);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx - r * 0.5, cy + r * 0.3);
            ctx.lineTo(cx + r * 0.5, cy + r * 0.3);
            ctx.stroke();
            break;
        }
        case "medical_bed": {
            ctx.strokeStyle = "rgba(244, 63, 94, 0.75)";
            ctx.strokeRect(cx - r * 0.6, cy - r * 0.35, r * 1.2, r * 0.7);
            ctx.beginPath();
            ctx.moveTo(cx - r * 0.4, cy);
            ctx.lineTo(cx - r * 0.15, cy);
            ctx.lineTo(cx - r * 0.05, cy - r * 0.28);
            ctx.lineTo(cx + r * 0.05, cy + r * 0.28);
            ctx.lineTo(cx + r * 0.15, cy);
            ctx.lineTo(cx + r * 0.4, cy);
            ctx.stroke();
            break;
        }
        case "cryo_pods": {
            ctx.strokeStyle = "rgba(168, 85, 247, 0.75)";
            const pw = r * 0.4;
            const ph = r * 0.8;
            ctx.strokeRect(cx - r * 0.65, cy - ph / 2, pw, ph);
            ctx.strokeRect(cx + r * 0.25, cy - ph / 2, pw, ph);
            break;
        }
        case "cargo_grid": {
            ctx.strokeStyle = "rgba(245, 158, 11, 0.7)";
            const bw = r * 0.48;
            ctx.strokeRect(cx - r * 0.6, cy - r * 0.45, bw, bw);
            ctx.strokeRect(cx + r * 0.1, cy - r * 0.45, bw, bw);
            ctx.strokeRect(cx - r * 0.25, cy + r * 0.1, bw, bw * 0.75);
            break;
        }
        case "workshop_tools": {
            ctx.strokeStyle = "rgba(148, 163, 184, 0.65)";
            ctx.beginPath();
            ctx.moveTo(cx - r * 0.55, cy - r * 0.4); ctx.lineTo(cx + r * 0.55, cy + r * 0.4);
            ctx.moveTo(cx - r * 0.55, cy + r * 0.4); ctx.lineTo(cx + r * 0.55, cy - r * 0.4);
            ctx.stroke();
            break;
        }
        case "hydroponics": {
            ctx.strokeStyle = "rgba(74, 222, 128, 0.75)";
            ctx.beginPath();
            ctx.moveTo(cx - r * 0.6, cy - r * 0.25); ctx.lineTo(cx + r * 0.6, cy - r * 0.25);
            ctx.moveTo(cx - r * 0.6, cy + r * 0.25); ctx.lineTo(cx + r * 0.6, cy + r * 0.25);
            ctx.arc(cx, cy, r * 0.35, 0, Math.PI);
            ctx.stroke();
            break;
        }
        case "shield_generator": {
            ctx.strokeStyle = "rgba(34, 211, 238, 0.75)";
            ctx.beginPath();
            ctx.moveTo(cx, cy - r * 0.7);
            ctx.lineTo(cx + r * 0.6, cy);
            ctx.lineTo(cx, cy + r * 0.7);
            ctx.lineTo(cx - r * 0.6, cy);
            ctx.closePath();
            ctx.stroke();
            break;
        }
        case "thruster_nozzle": {
            ctx.strokeStyle = "rgba(239, 68, 68, 0.75)";
            ctx.beginPath();
            ctx.moveTo(cx - r * 0.4, cy - r * 0.6);
            ctx.lineTo(cx + r * 0.4, cy - r * 0.6);
            ctx.lineTo(cx + r * 0.6, cy + r * 0.6);
            ctx.lineTo(cx - r * 0.6, cy + r * 0.6);
            ctx.closePath();
            ctx.stroke();
            break;
        }
        default:
            break;
    }
    ctx.restore();
}

/**
 * 绘制舱室内部装饰图案：警戒斑马线、机械管线、NPC专属纹理
 * 仅在房间已探索后调用（isVisited === true）
 */
function drawRoomDecoration(ctx, node, x, y, boxSize, theme) {
    if (!node) return;
    ctx.save();

    const zone = node.zone || "hub";
    const targetNpcId = node.npcOwnerId || node.npcId || (node.event && node.event.npcId);
    const isNpcRoom = !!(node.isNpcRoom || targetNpcId);

    // ── NPC 专属房间/NPC驻留房间：对角纹理+专属色晕 ──
    if (isNpcRoom && targetNpcId) {
        const npcColors = {
            lph: "#38bdf8",
            kaze: "#38bdf8",
            kaluo: "#38bdf8",
            shaokexin: "#f43f5e",
            mode: "#a855f7",
            prof_lu: "#10b981",
            luzhixing: "#10b981",
            noah: "#6366f1",
            sophia: "#ec4899",
            vivian: "#f43f5e",
            elena: "#fb923c",
            elsa: "#06b6d4",
            dr_elsa: "#06b6d4",
            colt: "#f59e0b",
            barnes: "#84cc16",
            colt_barnes: "#f59e0b"
        };
        const roomColor = npcColors[targetNpcId] || "#4ade80";
        const s = boxSize;
        const stripeW = Math.max(5, Math.floor(s * 0.12));

        ctx.strokeStyle = `${roomColor}33`; // 20% 透明
        ctx.lineWidth = stripeW;
        ctx.setLineDash([]);

        // 斜线纹理（右上→左下方向）
        for (let off = -s; off < s * 2; off += stripeW * 2.6) {
            ctx.beginPath();
            ctx.moveTo(x + off, y);
            ctx.lineTo(x + off + s, y + s);
            ctx.stroke();
        }

        // NPC 专属光圈
        ctx.shadowColor = roomColor;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = `${roomColor}55`;
        ctx.lineWidth = 1.5;
        const cx = x + s / 2, cy = y + s / 2;
        const r = s * 0.18;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.restore();
        return;
    }

    // ── Security / Hub 区域：警戒斑马线（边角黄黑斜纹） ──
    if (zone === "security" || zone === "hub") {
        const stripeW = Math.max(3, Math.floor(boxSize * 0.08));
        ctx.lineWidth = stripeW;
        const cornerSize = Math.floor(boxSize * 0.35);

        // 绘制在房间四角的小斑马线片段
        const corners = [
            { ox: x,                       oy: y,                        },  // 左上
            { ox: x + boxSize - cornerSize, oy: y,                        },  // 右上
            { ox: x,                       oy: y + boxSize - cornerSize, },  // 左下
            { ox: x + boxSize - cornerSize, oy: y + boxSize - cornerSize, },  // 右下
        ];

        corners.forEach(({ ox, oy }) => {
            ctx.save();
            ctx.rect(ox, oy, cornerSize, cornerSize);
            if (ctx.clip) ctx.clip();
            for (let off = -cornerSize; off < cornerSize * 2; off += stripeW * 2.2) {
                ctx.strokeStyle = (Math.floor(off / stripeW) % 2 === 0)
                    ? "rgba(245,158,11,0.35)"
                    : "rgba(30,30,30,0.25)";
                ctx.beginPath();
                ctx.moveTo(ox + off, oy);
                ctx.lineTo(ox + off + cornerSize, oy + cornerSize);
                ctx.stroke();
            }
            ctx.restore();
        });
    }

    // ── Engineering / Propulsion：舱壁管道机械图案 ──
    if (zone === "engineering" || zone === "propulsion" || zone === "stern") {
        const lw = Math.max(1, Math.floor(boxSize * 0.06));
        ctx.strokeStyle = "rgba(248,113,113,0.22)";
        ctx.lineWidth = lw;

        const cx = x + boxSize / 2;
        const cy = y + boxSize / 2;
        const len = boxSize * 0.32;

        // 十字管道
        ctx.beginPath();
        ctx.moveTo(cx - len, cy); ctx.lineTo(cx + len, cy);
        ctx.moveTo(cx, cy - len); ctx.lineTo(cx, cy + len);
        ctx.stroke();

        // 四角小矩形接头
        const jr = lw * 2;
        [[cx - len, cy], [cx + len, cy], [cx, cy - len], [cx, cy + len]].forEach(([jx, jy]) => {
            ctx.strokeRect(jx - jr, jy - jr, jr * 2, jr * 2);
        });
    }

    // ── Medical：心电图装饰线 ──
    if (zone === "medical") {
        ctx.strokeStyle = "rgba(244,63,94,0.28)";
        ctx.lineWidth = Math.max(1, Math.floor(boxSize * 0.05));
        const cy = y + boxSize * 0.72;
        const w = boxSize * 0.7;
        const ox = x + boxSize * 0.15;
        ctx.beginPath();
        ctx.moveTo(ox, cy);
        ctx.lineTo(ox + w * 0.25, cy);
        ctx.lineTo(ox + w * 0.35, cy - boxSize * 0.22);
        ctx.lineTo(ox + w * 0.45, cy + boxSize * 0.14);
        ctx.lineTo(ox + w * 0.55, cy);
        ctx.lineTo(ox + w, cy);
        ctx.stroke();
    }

    ctx.restore();
}

/**
 * 在舱室外壁绘制物理气闸出入门户 (Airlock Portal / 连接点)
 */
function drawAirlockDoorway(ctx, cx, cy, boxSize, dir, isTraversed = false, isLocked = false) {
    ctx.save();
    const half = boxSize / 2;
    const doorWidth = Math.max(12, Math.floor(boxSize * 0.28));
    const doorDepth = 4;

    let dx = 0, dy = 0, angle = 0;
    if (dir === "forward") { dy = -half; angle = 0; }
    else if (dir === "backward") { dy = half; angle = Math.PI; }
    else if (dir === "left") { dx = -half; angle = -Math.PI / 2; }
    else if (dir === "right") { dx = half; angle = Math.PI / 2; }

    if (ctx.translate) ctx.translate(cx + dx, cy + dy);
    if (ctx.rotate) ctx.rotate(angle);

    // 门洞底色 (打通外壁)
    ctx.fillStyle = isLocked ? "#450a0a" : (isTraversed ? "#0284c7" : "#0f172a");
    ctx.fillRect(-doorWidth / 2, -doorDepth, doorWidth, doorDepth * 2);

    // 左右门框金属立柱 (Door Jambs)
    ctx.fillStyle = isLocked ? "#ef4444" : "#94a3b8";
    ctx.fillRect(-doorWidth / 2 - 2, -doorDepth, 2, doorDepth * 2);
    ctx.fillRect(doorWidth / 2, -doorDepth, 2, doorDepth * 2);

    // 门槛中央发光条
    ctx.strokeStyle = isLocked ? "#ef4444" : (isTraversed ? "#38bdf8" : "rgba(56, 189, 248, 0.4)");
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-doorWidth / 2 + 1, 0);
    ctx.lineTo(doorWidth / 2 - 1, 0);
    ctx.stroke();

    ctx.restore();
}

class MapRenderer {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement ? canvasElement.getContext("2d") : null;
        this.animating = false;
        this.animationFrameId = null;
        this.skipAnimation = null;
        this.viewMode = "focus"; // "focus" | "full"

        // 交互平移与缩放引擎属性 (工业化标准：支持手机双指锚点缩放、单指1:1平移、双击聚焦复位、滚轮光标锚点缩放)
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1.0;
        this.isDragging = false;
        this.pointerDown = false;
        this.startPointer = { x: 0, y: 0 };
        this.startPan = { x: 0, y: 0 };
        this.initialPinchDist = 0;
        this.initialPinchCenter = { x: 0, y: 0 };
        this.startZoom = 1.0;
        this.nodeClickHandler = null;

        // 性能调度：按需渲染Dirty-Flag与RAF合并调度
        this.renderRequested = false;
        this.cameraAnimId = null;
        this.lastTapTime = 0;
        this.lastTapPos = { x: 0, y: 0 };

        // 运行时状态缓存：世界坐标缩放与摄像机中点
        this.currentScale = 1.0;
        this.currentCam = { x: 520, y: 410 };

        this.initInteractiveGestures();
    }

    /**
     * 性能调度：单帧内多次手势事件合并只在下一次绘制帧触发重绘 (60/120FPS无浪费开销)
     */
    scheduleRender() {
        if (this.renderRequested) return;
        this.renderRequested = true;
        if (typeof requestAnimationFrame !== "undefined") {
            requestAnimationFrame(() => {
                this.renderRequested = false;
                this.renderCurrentState();
            });
        } else {
            this.renderRequested = false;
            this.renderCurrentState();
        }
    }

    /**
     * 绑定工业化标准手势 (手机双指以中点锚定无跳跃缩放、单指1:1跟手平移、滚轮光标锚定缩放、双击平滑复位)
     */
    initInteractiveGestures() {
        if (!this.canvas || typeof window === "undefined") return;
        const canvas = this.canvas;

        // 电脑鼠标拖拽
        canvas.addEventListener("mousedown", (e) => {
            if (this.animating) return;
            this.pointerDown = true;
            this.isDragging = false;
            this.startPointer = { x: e.clientX, y: e.clientY };
            this.startPan = { x: this.panX, y: this.panY };
            canvas.style.cursor = "grabbing";
        });

        window.addEventListener("mousemove", (e) => {
            if (!this.pointerDown) return;
            const dx = e.clientX - this.startPointer.x;
            const dy = e.clientY - this.startPointer.y;
            if (Math.hypot(dx, dy) > 4) {
                this.isDragging = true;
                this.panX = this.startPan.x + dx;
                this.panY = this.startPan.y + dy;
                this.clampPan();
                this.scheduleRender();
            }
        });

        window.addEventListener("mouseup", () => {
            if (this.pointerDown) {
                this.pointerDown = false;
                if (canvas.style) canvas.style.cursor = "grab";
            }
        });

        // 鼠标滚轮以光标所在点为缩放中心 (零偏移零跳跃)
        canvas.addEventListener("wheel", (e) => {
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.15 : 0.87;
            const newZoom = Math.max(0.45, Math.min(3.5, this.zoom * factor));
            
            const rect = this.getCanvasRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            this.panX = mouseX - (mouseX - this.panX) * (newZoom / this.zoom);
            this.panY = mouseY - (mouseY - this.panY) * (newZoom / this.zoom);
            this.zoom = newZoom;
            this.clampPan();
            this.scheduleRender();
        }, { passive: false });

        // 手机触摸手势 (单指平移 + 双指以触控中点锚定自由缩放 + 双击平滑聚焦复位)
        canvas.addEventListener("touchstart", (e) => {
            if (this.animating) return;
            if (e.touches.length === 1) {
                this.pointerDown = true;
                this.isDragging = false;
                const t = e.touches[0];
                this.startPointer = { x: t.clientX, y: t.clientY };
                this.startPan = { x: this.panX, y: this.panY };
            } else if (e.touches.length >= 2) {
                this.pointerDown = false;
                this.isDragging = true;
                const t1 = e.touches[0];
                const t2 = e.touches[1];
                this.initialPinchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
                this.initialPinchCenter = {
                    x: (t1.clientX + t2.clientX) / 2,
                    y: (t1.clientY + t2.clientY) / 2
                };
                this.startZoom = this.zoom;
                this.startPan = { x: this.panX, y: this.panY };
            }
        }, { passive: false });

        canvas.addEventListener("touchmove", (e) => {
            if (this.animating) return;
            if (e.touches.length === 1 && this.pointerDown) {
                const t = e.touches[0];
                const dx = t.clientX - this.startPointer.x;
                const dy = t.clientY - this.startPointer.y;
                if (Math.hypot(dx, dy) > 6) {
                    if (e.cancelable) e.preventDefault();
                    this.isDragging = true;
                    this.panX = this.startPan.x + dx;
                    this.panY = this.startPan.y + dy;
                    this.clampPan();
                    this.scheduleRender();
                }
            } else if (e.touches.length >= 2 && this.initialPinchDist > 0) {
                if (e.cancelable) e.preventDefault();
                const t1 = e.touches[0];
                const t2 = e.touches[1];
                const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
                const curMidX = (t1.clientX + t2.clientX) / 2;
                const curMidY = (t1.clientY + t2.clientY) / 2;

                const factor = dist / this.initialPinchDist;
                const newZoom = Math.max(0.45, Math.min(3.5, this.startZoom * factor));

                const rect = this.getCanvasRect();
                const midX = curMidX - rect.left;
                const midY = curMidY - rect.top;

                // 严格以双指中点为锚点无跳跃缩放
                this.panX = midX - (midX - this.startPan.x) * (newZoom / this.startZoom);
                this.panY = midY - (midY - this.startPan.y) * (newZoom / this.startZoom);
                this.zoom = newZoom;
                this.clampPan();
                this.scheduleRender();
            }
        }, { passive: false });

        canvas.addEventListener("touchend", (e) => {
            if (e.touches.length === 0) {
                // 检查双击手势
                const now = Date.now();
                if (!this.isDragging && this.startPointer) {
                    const distFromLast = Math.hypot(this.startPointer.x - this.lastTapPos.x, this.startPointer.y - this.lastTapPos.y);
                    if (now - this.lastTapTime < 320 && distFromLast < 24) {
                        // 触发双击平滑聚焦复位
                        this.resetView();
                    }
                    this.lastTapTime = now;
                    this.lastTapPos = { ...this.startPointer };
                }
                this.pointerDown = false;
                this.initialPinchDist = 0;
            }
        }, { passive: true });

        canvas.addEventListener("touchcancel", () => {
            this.pointerDown = false;
            this.initialPinchDist = 0;
        }, { passive: true });
    }

    /**
     * 安全获取画布视口几何边界 (兼容浏览器运行与 Node.js 自动化测试环境，记忆有效尺寸杜绝阶段切换时坍塌)
     */
    getCanvasRect() {
        if (this.canvas && typeof this.canvas.getBoundingClientRect === "function") {
            const r = this.canvas.getBoundingClientRect();
            if (r.width > 0 && r.height > 0) {
                this.lastValidRect = { width: r.width, height: r.height, left: r.left, top: r.top };
                return r;
            }
        }
        if (this.canvas && this.canvas.parentElement) {
            const pw = this.canvas.parentElement.clientWidth;
            const ph = this.canvas.parentElement.clientHeight;
            if (pw > 0 && ph > 0) {
                this.lastValidRect = { width: pw, height: ph, left: 0, top: 0 };
                return { width: pw, height: ph, left: 0, top: 0 };
            }
        }
        if (this.lastValidRect) {
            return { width: this.lastValidRect.width, height: this.lastValidRect.height, left: 0, top: 0 };
        }
        return {
            left: 0,
            top: 0,
            width: (this.canvas && this.canvas.width) || (this.canvas && this.canvas.parentElement ? this.canvas.parentElement.clientWidth : 800) || 800,
            height: (this.canvas && this.canvas.height) || (this.canvas && this.canvas.parentElement ? this.canvas.parentElement.clientHeight : 500) || 500
        };
    }

    /**
     * 边界软限制，防止飞船被移出视口失踪
     */
    clampPan() {
        const rect = this.getCanvasRect();
        const w = (rect && rect.width) || 600;
        const h = (rect && rect.height) || 400;
        const limitX = w * 0.75;
        const limitY = h * 0.75;
        this.panX = Math.max(-limitX, Math.min(limitX, this.panX));
        this.panY = Math.max(-limitY, Math.min(limitY, this.panY));
    }

    /**
     * 摄像机平滑插值过渡动画 (用于聚焦切换与复位)
     */
    animateCameraTo(targetState, duration = 300) {
        if (this.cameraAnimId) {
            cancelAnimationFrame(this.cameraAnimId);
            this.cameraAnimId = null;
        }
        const startPanX = this.panX;
        const startPanY = this.panY;
        const startZoom = this.zoom;
        const targetPanX = targetState.panX !== undefined ? targetState.panX : this.panX;
        const targetPanY = targetState.panY !== undefined ? targetState.panY : this.panY;
        const targetZoom = targetState.zoom !== undefined ? targetState.zoom : this.zoom;

        const startTime = performance.now();
        const step = (now) => {
            const elapsed = now - startTime;
            const rawT = Math.min(1, elapsed / duration);
            const t = easeInOutCubic(rawT);
            this.panX = startPanX + (targetPanX - startPanX) * t;
            this.panY = startPanY + (targetPanY - startPanY) * t;
            this.zoom = startZoom + (targetZoom - startZoom) * t;
            this.scheduleRender();
            if (rawT < 1) {
                this.cameraAnimId = requestAnimationFrame(step);
            } else {
                this.cameraAnimId = null;
            }
        };
        this.cameraAnimId = requestAnimationFrame(step);
    }

    /**
     * 重绘当前已缓存的地图状态
     */
    renderCurrentState() {
        if (!this.lastRenderParams) return;
        const p = this.lastRenderParams;
        this.render(p.levelMap, p.currentNodeId, p.visitedNodes, p.teamMembers, p.animatedMarker, p.arrivalPulse, p.options);
    }

    /**
     * 平滑复位并居中当前视角 (支持 immediate 参数瞬时复位)
     */
    resetView(immediate = false) {
        if (immediate || typeof requestAnimationFrame === "undefined") {
            if (this.cameraAnimId) {
                cancelAnimationFrame(this.cameraAnimId);
                this.cameraAnimId = null;
            }
            this.panX = 0;
            this.panY = 0;
            this.zoom = 1.0;
            this.scheduleRender();
        } else {
            this.animateCameraTo({ panX: 0, panY: 0, zoom: 1.0 }, 280);
        }
    }

    zoomIn() {
        this.animateCameraTo({ zoom: Math.min(3.5, this.zoom * 1.3) }, 200);
    }

    zoomOut() {
        this.animateCameraTo({ zoom: Math.max(0.45, this.zoom * 0.77) }, 200);
    }

    /**
     * 在【🔭 扇区聚焦】与【🌌 全舰全景】之间平滑切换
     */
    toggleViewMode() {
        this.viewMode = this.viewMode === "focus" ? "full" : "focus";
        this.animateCameraTo({ panX: 0, panY: 0, zoom: 1.0 }, 300);
        return this.viewMode;
    }

    /**
     * 工业化标准统一世界坐标网格 (X与Y严格等比 1:1，杜绝任何形变拉伸)
     */
    getLayout() {
        const rect = this.getCanvasRect();
        const displayW = Math.max(Math.round((rect && rect.width) || (this.canvas && this.canvas.parentElement ? this.canvas.parentElement.clientWidth : 800)), 320);
        const displayH = Math.max(Math.round((rect && rect.height) || (this.canvas && this.canvas.parentElement ? this.canvas.parentElement.clientHeight : 500)), 240);

        // 严格等比物理网格间距 (每个网格步长 115px，舱室尺寸 58px)
        const cellDist = 115;
        const boxSize = 58;

        // 母舰世界坐标总范围 (以 11x9 物理网格为基准，包容 x=-1~9, y=-1~6 的扩展NPC专属舱室)
        const shipWorldW = 10 * cellDist + boxSize * 2;
        const shipWorldH = 8 * cellDist + boxSize * 2;
        const originX = boxSize + cellDist;
        const originY = boxSize + cellDist;

        return {
            originX,
            originY,
            cellW: cellDist,
            cellH: cellDist,
            boxSize,
            width: displayW,
            height: displayH,
            shipWorldW,
            shipWorldH,
            minX: -1,
            minY: -1,
            maxX: 9,
            maxY: 6
        };
    }

    getNodeCenter(node) {
        if (!node) return { x: 120, y: 120 };
        const layout = this.getLayout();
        const coord = node.coord || { x: 0, y: 1 };
        return {
            x: layout.originX + coord.x * layout.cellW,
            y: layout.originY + coord.y * layout.cellH
        };
    }

    /**
     * 将屏幕点击/触摸坐标逆换算为世界画布坐标 (严密配合当前 scale, pan 与 cam 锚点)
     */
    getNodeAtPosition(canvasX, canvasY, levelMap) {
        if (!levelMap || !levelMap.nodes) return null;
        const scale = this.currentScale || 1.0;
        const cam = this.currentCam || { x: 520, y: 410 };
        const rect = this.getCanvasRect();
        const displayW = (rect && rect.width) || (this.canvas && this.canvas.width) || 600;
        const displayH = (rect && rect.height) || (this.canvas && this.canvas.height) || 400;

        // 逆向变换：屏幕像素 -> 世界坐标 (自适应 CSS 像素与 DPR 物理像素)
        let normX = canvasX;
        let normY = canvasY;
        if (normX > displayW * 1.05 && typeof window !== "undefined" && window.devicePixelRatio > 1) {
            normX /= window.devicePixelRatio;
            normY /= window.devicePixelRatio;
        }
        const worldX = cam.x + (normX - (displayW / 2 + this.panX)) / scale;
        const worldY = cam.y + (normY - (displayH / 2 + this.panY)) / scale;

        // 判定点击房间节点自身 (留有 18px 容错边缘，保障移动端触控精度)
        const layout = this.getLayout();
        const boxSize = layout.boxSize;
        const half = boxSize / 2 + 18;

        for (const node of Object.values(levelMap.nodes)) {
            const p = this.getNodeCenter(node);
            if (Math.abs(worldX - p.x) <= half && Math.abs(worldY - p.y) <= half) {
                return node;
            }
        }

        // 支持点击靠近揭示的防爆锁闭/NPC专属舱室进行状态反馈与解锁
        if (levelMap.masterShip && levelMap.masterShip.lockedRooms) {
            for (const locked of Object.values(levelMap.masterShip.lockedRooms)) {
                const def = (levelMap.masterShip.allRooms && levelMap.masterShip.allRooms[locked.id]) || locked;
                const p = this.getNodeCenter(def);
                if (Math.abs(worldX - p.x) <= half && Math.abs(worldY - p.y) <= half) {
                    return { ...def, ...locked, isLocked: true };
                }
            }
        }
        return null;
    }

    render(levelMap, currentNodeId, visitedNodes, teamMembers, animatedMarker = null, arrivalPulse = 0, options = {}) {
        if (!this.ctx || !levelMap || !levelMap.nodes) return;
        this.currentLevelMap = levelMap;
        this.lastRenderParams = { levelMap, currentNodeId, visitedNodes, teamMembers, animatedMarker, arrivalPulse, options };

        const ctx = this.ctx;
        const layout = this.getLayout();

        // 严格遵循工业级高清晰度渲染适配：动态适配真实容器像素尺寸并应用 DPR (Device Pixel Ratio)
        const rect = this.getCanvasRect();
        const displayW = Math.max(Math.round(rect.width || (this.canvas.parentElement ? this.canvas.parentElement.clientWidth : 360) || 360), 200);
        const displayH = Math.max(Math.round(rect.height || (this.canvas.parentElement ? this.canvas.parentElement.clientHeight : 480) || 480), 200);
        const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);

        const targetBufferW = Math.round(displayW * dpr);
        const targetBufferH = Math.round(displayH * dpr);
        if (this.canvas.width !== targetBufferW || this.canvas.height !== targetBufferH) {
            this.canvas.width = targetBufferW;
            this.canvas.height = targetBufferH;
        }

        // 重设缩放矩阵确保视网膜屏幕绝对等比且极致清晰
        if (ctx.setTransform) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const shipCenterX = layout.originX + 4 * layout.cellW;
        const shipCenterY = layout.originY + 3 * layout.cellH;

        let targetCamX = shipCenterX;
        let targetCamY = shipCenterY;
        let baseScale = 1.0;

        if (this.viewMode === "full") {
            const padX = 24;
            const padY = 24;
            const scaleX = (displayW - padX * 2) / layout.shipWorldW;
            const scaleY = (displayH - padY * 2) / layout.shipWorldH;
            baseScale = Math.min(scaleX, scaleY); // 严格等比 Math.min，杜绝任何形变！
            targetCamX = shipCenterX;
            targetCamY = shipCenterY;
        } else {
            // 聚焦模式
            const minDim = Math.min(displayW, displayH);
            baseScale = Math.max(0.75, Math.min(1.35, minDim / 440));
            const curN = levelMap.nodes[currentNodeId];
            if (animatedMarker) {
                targetCamX = animatedMarker.x;
                targetCamY = animatedMarker.y;
            } else if (curN) {
                const cp = this.getNodeCenter(curN);
                targetCamX = cp.x;
                targetCamY = cp.y;
            }
        }

        const uniformScale = baseScale * this.zoom;
        this.currentScale = uniformScale;
        this.currentCam = { x: targetCamX, y: targetCamY };

        // 1. 清空背景 (深邃科技黑夜背景)
        ctx.fillStyle = "#050811";
        ctx.fillRect(0, 0, displayW, displayH);

        ctx.save();
        // 应用居中锚定 + 用户平移 + 统一等比缩放矩阵变换
        ctx.translate(displayW / 2 + this.panX, displayH / 2 + this.panY);
        ctx.scale(uniformScale, uniformScale);
        ctx.translate(-targetCamX, -targetCamY);

        // 绘制微弱背景装甲格栅
        ctx.strokeStyle = "rgba(56, 189, 248, 0.035)";
        ctx.lineWidth = 1;
        const gridSize = 32;
        const gridMinX = -200;
        const gridMaxX = layout.shipWorldW + 200;
        const gridMinY = -200;
        const gridMaxY = layout.shipWorldH + 200;
        for (let x = gridMinX; x < gridMaxX; x += gridSize) {
            ctx.beginPath(); ctx.moveTo(x, gridMinY); ctx.lineTo(x, gridMaxY); ctx.stroke();
        }
        for (let y = gridMinY; y < gridMaxY; y += gridSize) {
            ctx.beginPath(); ctx.moveTo(gridMinX, y); ctx.lineTo(gridMaxX, y); ctx.stroke();
        }

        // 2. 计算视野迷雾：已探明房间 + 其直接相邻一格的房间
        const visitedSet = new Set(visitedNodes || []);
        if (currentNodeId) visitedSet.add(currentNodeId);

        if (animatedMarker) {
            if (animatedMarker.fromId) visitedSet.add(animatedMarker.fromId);
            if (animatedMarker.progress >= 0.7 && animatedMarker.toId) {
                visitedSet.add(animatedMarker.toId);
            }
        }

        const revealedSet = new Set(visitedSet);
        visitedSet.forEach(nodeId => {
            const node = levelMap.nodes[nodeId];
            if (node && node.connections) {
                Object.values(node.connections).forEach(targetId => {
                    if (levelMap.nodes[targetId]) {
                        revealedSet.add(targetId);
                    }
                });
            }
        });
        if (animatedMarker && animatedMarker.toId) {
            revealedSet.add(animatedMarker.toId);
        }

        // 第四关专属：指定要害巡检位置 (停机坪甲板、重力发生核、防护中枢) 直接在地图上提前单独亮起
        const patrolNodes = levelMap.patrolNodes || (levelMap.masterShip && levelMap.masterShip.patrolNodes) || [];
        if (patrolNodes.length > 0) {
            patrolNodes.forEach(pId => {
                if (levelMap.nodes[pId]) {
                    revealedSet.add(pId);
                }
            });
        }

        const boxSize = layout.boxSize;
        const nodes = levelMap.nodes;
        const masterShip = levelMap.masterShip;

        // 3. 问题2：未开放锁闭区域【靠近时才显示】
        // 只有当玩家已探索的房间（visitedSet）中，至少有一个房间物理相邻该锁闭门时，才揭示该锁闭舱！
        const visibleLockedRooms = {};
        if (masterShip && masterShip.lockedRooms) {
            const allRooms = masterShip.allRooms || {};
            Object.values(masterShip.lockedRooms).forEach(locked => {
                const def = allRooms[locked.id];
                if (!def) return;

                let hasAdjacentVisited = false;
                // 检查是否有相邻已探索房间
                if (masterShip.allConnections) {
                    for (const [rA, rB] of masterShip.allConnections) {
                        if (rA === locked.id && visitedSet.has(rB)) {
                            hasAdjacentVisited = true; break;
                        }
                        if (rB === locked.id && visitedSet.has(rA)) {
                            hasAdjacentVisited = true; break;
                        }
                    }
                }
                if (hasAdjacentVisited) {
                    visibleLockedRooms[locked.id] = locked;
                }
            });
        }

        // 4. 绘制实体走廊管线 (Physical Hallways with Central Glowing Conduits)
        const drawnEdges = new Set();

        Object.values(nodes).forEach(node => {
            if (!revealedSet.has(node.id)) return;

            const p1 = this.getNodeCenter(node);
            const conns = node.connections || {};

            Object.entries(conns).forEach(([dir, targetId]) => {
                if (!revealedSet.has(targetId)) return;
                if (!visitedSet.has(node.id) && !visitedSet.has(targetId)) return;

                const edgeKey = [node.id, targetId].sort().join("<->");
                if (drawnEdges.has(edgeKey)) return;
                drawnEdges.add(edgeKey);

                const targetNode = nodes[targetId];
                if (!targetNode) return;

                const p2 = this.getNodeCenter(targetNode);
                const bothVisited = visitedSet.has(node.id) && visitedSet.has(targetId);

                const isTraversingEdge = animatedMarker && (
                    (animatedMarker.fromId === node.id && animatedMarker.toId === targetId) ||
                    (animatedMarker.fromId === targetId && animatedMarker.toId === node.id)
                );

                // 4.1 绘制实体走廊宽度底坪 (Hallway Floor)
                ctx.save();
                ctx.strokeStyle = bothVisited ? "#162238" : "#0d1524";
                ctx.lineWidth = Math.max(10, Math.floor(boxSize * 0.22));
                ctx.lineCap = "butt";
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();

                // 4.2 走廊外墙暗调描边 (Hallway Wall Borders)
                ctx.strokeStyle = "#080d1a";
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // 4.3 走廊中央高科技能量与导航导轨 (Glowing Conduit Line)
                if (isTraversingEdge) {
                    ctx.strokeStyle = "#38bdf8";
                    ctx.lineWidth = 3.5;
                    ctx.shadowColor = "#38bdf8";
                    ctx.shadowBlur = 14;
                } else if (bothVisited) {
                    ctx.strokeStyle = "#38bdf8";
                    ctx.lineWidth = 2.2;
                    ctx.shadowColor = "rgba(56, 189, 248, 0.4)";
                    ctx.shadowBlur = 6;
                } else {
                    ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
                    ctx.lineWidth = 1.8;
                    ctx.setLineDash([4, 4]);
                    ctx.shadowBlur = 0;
                }

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
                ctx.restore();
            });
        });

        // 4.4 绘制通往【靠近揭示锁闭房间】的断电锁死通道
        if (masterShip && masterShip.allConnections) {
            masterShip.allConnections.forEach(([rA, rB]) => {
                let openId = null, lockedId = null;
                if (visitedSet.has(rA) && visibleLockedRooms[rB]) { openId = rA; lockedId = rB; }
                else if (visitedSet.has(rB) && visibleLockedRooms[rA]) { openId = rB; lockedId = rA; }

                if (openId && lockedId) {
                    const p1 = this.getNodeCenter(nodes[openId] || masterShip.allRooms[openId]);
                    const p2 = this.getNodeCenter(masterShip.allRooms[lockedId]);
                    if (p1 && p2) {
                        ctx.save();
                        // 红色隔离警戒走廊
                        ctx.strokeStyle = "#2a0808";
                        ctx.lineWidth = Math.max(8, Math.floor(boxSize * 0.2));
                        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();

                        // 红色警戒虚线导轨
                        ctx.strokeStyle = "rgba(239, 68, 68, 0.6)";
                        ctx.lineWidth = 2;
                        ctx.setLineDash([4, 3]);
                        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                        ctx.restore();
                    }
                }
            });
        }

        // 5. 绘制【靠近揭示的防爆锁闭房间】(仅在靠近时展现，支持NPC专属房间特殊视觉主题)
        Object.values(visibleLockedRooms).forEach(locked => {
            const def = masterShip.allRooms[locked.id];
            if (!def) return;
            const p = this.getNodeCenter(def);
            const shape = def.shape || "rect";
            const x = p.x - boxSize / 2;
            const y = p.y - boxSize / 2;

            const isNpc = !!(def.isNpcRoom || locked.isNpcRoom);
            const npcOwnerId = def.npcOwnerId || locked.npcOwnerId;
            const npcColors = {
                lph: "#38bdf8", kaze: "#38bdf8", kaluo: "#38bdf8", shaokexin: "#f43f5e", mode: "#a855f7",
                prof_lu: "#10b981", luzhixing: "#10b981", noah: "#6366f1", sophia: "#ec4899",
                vivian: "#f43f5e", elena: "#fb923c", elsa: "#06b6d4", dr_elsa: "#06b6d4",
                colt: "#f59e0b", barnes: "#84cc16", colt_barnes: "#f59e0b"
            };
            const ownerNames = {
                lph: "指挥官", kaze: "卡罗", kaluo: "卡罗", shaokexin: "邵可欣", mode: "莫德",
                prof_lu: "陆知行", luzhixing: "陆知行", noah: "诺亚", sophia: "索菲亚",
                vivian: "薇薇安", elena: "伊莲", elsa: "艾尔莎", dr_elsa: "艾尔莎",
                colt: "柯尔特", barnes: "巴恩斯", colt_barnes: "柯尔特 & 巴恩斯"
            };
            const strokeColor = isNpc ? (npcColors[npcOwnerId] || "#38bdf8") : "#ef4444";
            const ownerName = ownerNames[npcOwnerId] || "乘员";

            ctx.save();
            ctx.fillStyle = isNpc ? "rgba(10, 20, 35, 0.95)" : "#150404";
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 2.2;
            ctx.setLineDash(isNpc ? [3, 2] : [4, 2]);

            drawRoomPolygon(ctx, shape, x, y, boxSize, boxSize);
            ctx.fill();
            ctx.stroke();

            // 门锁图标 🔒
            ctx.fillStyle = strokeColor;
            ctx.font = `${Math.max(11, Math.floor(boxSize * 0.34))}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🔒", p.x, p.y - (boxSize >= 42 ? 6 : 0));

            if (boxSize >= 42) {
                ctx.font = "bold 8px 'PingFang SC', sans-serif";
                ctx.fillStyle = strokeColor;
                ctx.fillText(isNpc ? `${ownerName}专属` : "气闸锁死", p.x, p.y + 11);
            }
            ctx.restore();
        });

        // 预先建立当前房间与相邻可移动房间的方向映射表
        const connectedDirMap = {};
        if (currentNodeId && nodes[currentNodeId]) {
            const curConns = nodes[currentNodeId].connections || {};
            const dirLabels = {
                forward: "前 ⬆",
                backward: "后 ⬇",
                left: "左 ⬅",
                right: "右 ➡"
            };
            Object.entries(curConns).forEach(([dir, targetId]) => {
                if (targetId) {
                    connectedDirMap[targetId] = dirLabels[dir] || dir;
                }
            });
        }

        // 6. 绘制各个开放舱室 (专属甲板色彩、厚重装甲外壁、门部门斗、内部微缩设备)
        Object.values(nodes).forEach(node => {
            if (!revealedSet.has(node.id)) return;

            const p = this.getNodeCenter(node);
            const isCurrent = (node.id === currentNodeId && !animatedMarker);
            const isDestination = animatedMarker && (node.id === animatedMarker.toId);
            const isVisited = visitedSet.has(node.id);
            const isHovered = options.hoveredNodeId === node.id;
            const adjacentDir = connectedDirMap[node.id];
            const shape = node.shape || "rect";
            const equipment = node.equipment;
            const isPatrolTarget = patrolNodes.includes(node.id);
            const isPatrolDone = options.patrolVisited && options.patrolVisited.has(node.id);

            const x = p.x - boxSize / 2;
            const y = p.y - boxSize / 2;

            // 根据所属分区选取专属地面色彩主题
            let themeKey = node.zone || "hub";
            if (node.isStart || node.id === "room_start" || (levelMap && node.id === levelMap.startNodeId)) themeKey = "start";
            else if (node.isExit || (levelMap && node.id === levelMap.exitNodeId) || (!levelMap?.exitNodeId && (node.id === "room_exit" || (node.event && node.event.type === "exit")))) themeKey = "exit";
            const theme = DECK_THEMES[themeKey] || DECK_THEMES.hub;

            ctx.save();

            // 6.1 绘制厚实深黑装甲底座 (外壁厚度)
            ctx.fillStyle = theme.wall;
            drawRoomPolygon(ctx, shape, x - 2, y - 2, boxSize + 4, boxSize + 4);
            ctx.fill();

            // 6.2 舱室内部地坪填色 (区分生活、指挥、医疗、工程等真实质感)
            if (isVisited) {
                ctx.fillStyle = isHovered ? theme.floorVisited : theme.floor;
                ctx.strokeStyle = isPatrolTarget ? (isPatrolDone ? "#22c55e" : "#f59e0b") : theme.border;
                ctx.lineWidth = isPatrolTarget ? 2.6 : 2.2;
            } else {
                ctx.fillStyle = isPatrolTarget ? "rgba(30, 27, 75, 0.85)" : (adjacentDir ? "rgba(15, 23, 42, 0.85)" : "rgba(15, 23, 42, 0.65)");
                ctx.strokeStyle = isPatrolTarget ? (isPatrolDone ? "#22c55e" : "#f59e0b") : (adjacentDir ? "rgba(56, 189, 248, 0.85)" : "rgba(148, 163, 184, 0.4)");
                ctx.lineWidth = isPatrolTarget ? 2.6 : (adjacentDir ? 2.0 : 1.5);
                if (!adjacentDir && !isPatrolTarget) ctx.setLineDash([4, 3]);
            }

            drawRoomPolygon(ctx, shape, x, y, boxSize, boxSize);
            ctx.fill();
            ctx.stroke();
            ctx.setLineDash([]);

            // 6.3 绘制四壁物理气闸连接点 (Airlock Gateways / Door Openings)
            const conns = node.connections || {};
            Object.entries(conns).forEach(([dir, targetId]) => {
                const targetNode = nodes[targetId];
                const isTraversed = isVisited && targetNode && visitedSet.has(targetId);
                drawAirlockDoorway(ctx, p.x, p.y, boxSize, dir, isTraversed, false);
            });

            // 检查是否有通往锁闭房间的气闸门
            if (masterShip && masterShip.allConnections) {
                masterShip.allConnections.forEach(([rA, rB]) => {
                    let lockedNeighbor = null;
                    if (rA === node.id && visibleLockedRooms[rB]) lockedNeighbor = rB;
                    else if (rB === node.id && visibleLockedRooms[rA]) lockedNeighbor = rA;

                    if (lockedNeighbor) {
                        const targetDef = masterShip.allRooms[lockedNeighbor];
                        if (targetDef) {
                            const c1 = node.coord;
                            const c2 = targetDef.coord;
                            let lockDir = "forward";
                            if (c2.y > c1.y) lockDir = "backward";
                            else if (c2.x < c1.x) lockDir = "left";
                            else if (c2.x > c1.x) lockDir = "right";
                            drawAirlockDoorway(ctx, p.x, p.y, boxSize, lockDir, false, true);
                        }
                    }
                });
            }

            // 6.4 绘制内部蓝图微缩设备 (点亮探索后清晰展现)
            if (isVisited || isDestination || isCurrent) {
                drawEquipmentBlueprint(ctx, equipment, p.x, p.y, boxSize);
                // 6.4b 绘制舱室内部装饰图案（斑马线/机械管线/NPC专属纹理）
                if (isVisited) {
                    drawRoomDecoration(ctx, node, x, y, boxSize, theme);
                }
            }

            // 6.5 当前房间/行进目标发光光晕
            if (isCurrent || isDestination) {
                ctx.shadowColor = isDestination ? "#4ade80" : "#38bdf8";
                ctx.shadowBlur = 16;
                ctx.strokeStyle = isDestination ? "#4ade80" : "#ffffff";
                ctx.lineWidth = 2.5;
                drawRoomPolygon(ctx, shape, x - 1, y - 1, boxSize + 2, boxSize + 2);
                ctx.stroke();
                ctx.shadowBlur = 0;
            } else if (isPatrolTarget) {
                // 第四关专属：巡检目标常驻金色/绿色醒目光晕
                ctx.shadowColor = isPatrolDone ? "#22c55e" : "#f59e0b";
                ctx.shadowBlur = 14;
                ctx.strokeStyle = isPatrolDone ? "#22c55e" : "#f59e0b";
                ctx.lineWidth = 2.5;
                drawRoomPolygon(ctx, shape, x - 1, y - 1, boxSize + 2, boxSize + 2);
                ctx.stroke();
                ctx.shadowBlur = 0;
            } else if (adjacentDir && !animatedMarker) {
                // 相邻可行进房间微光呼应
                ctx.shadowColor = isVisited ? "#4ade80" : "#38bdf8";
                ctx.shadowBlur = 10;
                ctx.strokeStyle = isVisited ? "rgba(74, 222, 128, 0.9)" : "rgba(56, 189, 248, 0.9)";
                ctx.lineWidth = 2.0;
                drawRoomPolygon(ctx, shape, x - 0.5, y - 0.5, boxSize + 1, boxSize + 1);
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            // 6.6 舱室文字标注 (直接在房间中央绘制名称与未探索/方向标记，杜绝外部浮动胶囊遮挡)
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const cleanName = (node.name || "").replace(/【.*?】/, "").trim() || (node.name || "").replace(/[【】]/g, "").trim() || "舱室";

            let label = "";
            let subLabel = "";
            let tagColor = "#ffffff";
            let subTagColor = "#94a3b8";
            const showSub = boxSize >= 38;

            const isStartAndExit = !!(levelMap && levelMap.startNodeId === levelMap.exitNodeId && node.id === levelMap.startNodeId);

            if (isCurrent) {
                if (isStartAndExit) {
                    label = "起终点";
                    subLabel = showSub ? "当前 · 主反应堆" : "";
                } else {
                    label = (node.id === "room_start" || node.isStart || (levelMap && node.id === levelMap.startNodeId)) ? "起点" : cleanName;
                    subLabel = showSub ? "当前位置" : "";
                }
                tagColor = "#38bdf8";
                subTagColor = "#7dd3fc";
            } else if (isVisited || (animatedMarker && node.id === animatedMarker.toId)) {
                const ownerNames = {
                    lph: "L.P.H", kaze: "卡罗", kaluo: "卡罗", shaokexin: "邵可欣", mode: "莫德",
                    prof_lu: "陆知行", luzhixing: "陆知行", noah: "诺亚", sophia: "索菲亚",
                    vivian: "薇薇安", elena: "伊莲", elsa: "艾尔莎", dr_elsa: "艾尔莎",
                    colt: "柯尔特", barnes: "巴恩斯", colt_barnes: "柯尔特 & 巴恩斯"
                };
                const ownerColors = {
                    lph: "#38bdf8", kaze: "#60a5fa", kaluo: "#60a5fa", shaokexin: "#f472b6", mode: "#c084fc",
                    prof_lu: "#10b981", luzhixing: "#10b981", noah: "#6366f1", sophia: "#ec4899",
                    vivian: "#f43f5e", elena: "#fb923c", elsa: "#06b6d4", dr_elsa: "#06b6d4",
                    colt: "#f59e0b", barnes: "#84cc16", colt_barnes: "#f59e0b"
                };
                const roomNpcId = (node.event && node.event.type === "npc" && node.event.npcId) || node.npcId;
                const isExitRoom = !!(node.isExit || (levelMap && node.id === levelMap.exitNodeId) || (!levelMap?.exitNodeId && (node.id === "room_exit" || (node.event && node.event.type === "exit"))));

                if (isStartAndExit) {
                    label = "起终点";
                    subLabel = showSub ? (adjacentDir ? `${adjacentDir} · 反应堆` : "主反应堆") : "起终点";
                    tagColor = "#fb923c";
                    subTagColor = adjacentDir ? "#f97316" : "#fdba74";
                } else if (node.id === "room_start" || node.isStart || (levelMap && node.id === levelMap.startNodeId)) {
                    label = "起点";
                    subLabel = showSub ? (adjacentDir ? `${adjacentDir} · 出发点` : "出发点") : "";
                    tagColor = "#93c5fd";
                    subTagColor = adjacentDir ? "#60a5fa" : "#93c5fd";
                } else if (isExitRoom && roomNpcId && ownerNames[roomNpcId]) {
                    // 同时是终点且驻留有 NPC (例如第五关重核聚变主反应堆的伊莲)
                    const nName = ownerNames[roomNpcId];
                    const nColor = ownerColors[roomNpcId] || "#fb923c";
                    label = `${nName} · 终点`;
                    subLabel = showSub ? (adjacentDir ? `${adjacentDir} · 反应堆` : "主反应堆") : "终点";
                    tagColor = nColor;
                    subTagColor = adjacentDir ? "#4ade80" : "#86efac";
                } else if (roomNpcId && ownerNames[roomNpcId]) {
                    const nName = ownerNames[roomNpcId];
                    const nColor = ownerColors[roomNpcId] || "#c084fc";
                    label = nName;
                    subLabel = showSub ? (adjacentDir ? `${adjacentDir} · 同伴` : "黑市套房") : "同伴";
                    tagColor = nColor;
                    subTagColor = adjacentDir ? nColor : "#bfdbfe";
                } else if (isExitRoom) {
                    label = "终点";
                    subLabel = showSub ? (adjacentDir ? `${adjacentDir} · 终点` : "终点") : "";
                    tagColor = "#4ade80";
                    subTagColor = adjacentDir ? "#4ade80" : "#86efac";
                } else if (node.event && node.event.type === "food") {
                    label = cleanName || "给养";
                    subLabel = showSub ? (adjacentDir ? `${adjacentDir} · 补给` : "补给") : "";
                    tagColor = "#f59e0b";
                    subTagColor = adjacentDir ? "#f59e0b" : "#fde68a";
                } else if (node.isNpcRoom) {
                    const oName = ownerNames[node.npcOwnerId] || "专属";
                    label = `${oName}舱`;
                    subLabel = showSub ? (adjacentDir ? `${adjacentDir} · 私人舱` : "私人舱") : "";
                    tagColor = ownerColors[node.npcOwnerId] || "#38bdf8";
                    subTagColor = adjacentDir ? "#38bdf8" : "#94a3b8";
                } else {
                    label = cleanName;
                    subLabel = showSub ? (adjacentDir ? `${adjacentDir} · 已探明` : "已探明") : "";
                    tagColor = "#e2e8f0";
                    subTagColor = adjacentDir ? "#38bdf8" : "rgba(148, 163, 184, 0.75)";
                }
            } else {
                // 未探索房间：直接显示房间名称，并清晰标注 [未探索] 或 [方向 · 未探索]
                const ownerNames = {
                    lph: "L.P.H", kaze: "卡罗", kaluo: "卡罗", shaokexin: "邵可欣", mode: "莫德",
                    prof_lu: "陆知行", luzhixing: "陆知行", noah: "诺亚", sophia: "索菲亚",
                    vivian: "薇薇安", elena: "伊莲", elsa: "艾尔莎", dr_elsa: "艾尔莎",
                    colt: "柯尔特", barnes: "巴恩斯", colt_barnes: "柯尔特 & 巴恩斯"
                };
                const ownerColors = {
                    lph: "#38bdf8", kaze: "#60a5fa", kaluo: "#60a5fa", shaokexin: "#f472b6", mode: "#c084fc",
                    prof_lu: "#10b981", luzhixing: "#10b981", noah: "#6366f1", sophia: "#ec4899",
                    vivian: "#f43f5e", elena: "#fb923c", elsa: "#06b6d4", dr_elsa: "#06b6d4",
                    colt: "#f59e0b", barnes: "#84cc16", colt_barnes: "#f59e0b"
                };
                const roomNpcId = (node.event && node.event.type === "npc" && node.event.npcId) || node.npcId;
                const isExitRoom = !!(node.isExit || (levelMap && node.id === levelMap.exitNodeId) || (!levelMap?.exitNodeId && (node.id === "room_exit" || (node.event && node.event.type === "exit"))));

                if (isExitRoom && roomNpcId && ownerNames[roomNpcId]) {
                    // 未探索的终点且有 NPC (例如第五关重核聚变主反应堆的伊莲)
                    const nName = ownerNames[roomNpcId];
                    const nColor = ownerColors[roomNpcId] || "#fb923c";
                    label = `${nName} · 终点`;
                    subLabel = showSub ? (adjacentDir ? `${adjacentDir} · 反应堆` : "主反应堆") : "主反应堆";
                    tagColor = nColor;
                    subTagColor = adjacentDir ? "#38bdf8" : "#86efac";
                } else if (node.isNpcRoom) {
                    const oName = ownerNames[node.npcOwnerId] || "专属";
                    label = `${oName}舱`;
                    subLabel = showSub ? (adjacentDir ? `${adjacentDir} · 私人舱` : "私人舱") : "";
                    tagColor = adjacentDir ? "#ffffff" : "rgba(203, 213, 225, 0.85)";
                    subTagColor = ownerColors[node.npcOwnerId] || "rgba(148, 163, 184, 0.65)";
                } else if (roomNpcId && ownerNames[roomNpcId]) {
                    const nName = ownerNames[roomNpcId];
                    const nColor = ownerColors[roomNpcId] || "#c084fc";
                    label = nName;
                    subLabel = showSub ? (adjacentDir ? `${adjacentDir} · ${nName}` : `${nName} · 昏迷`) : nName;
                    tagColor = adjacentDir ? "#ffffff" : "rgba(203, 213, 225, 0.85)";
                    subTagColor = nColor;
                } else {
                    label = cleanName;
                    subLabel = showSub ? (adjacentDir ? `${adjacentDir} · 未探索` : "未探索") : "";
                    if (adjacentDir) {
                        tagColor = "#ffffff";
                        subTagColor = "#38bdf8"; // 高亮青色，提示用户点击即可行进
                    } else {
                        tagColor = "rgba(203, 213, 225, 0.85)";
                        subTagColor = "rgba(148, 163, 184, 0.65)";
                    }
                }
            }

            // 第四关专属：巡检目标显示专属徽标与鲜明色彩
            if (isPatrolTarget && !isCurrent) {
                if (isPatrolDone) {
                    subLabel = showSub ? (adjacentDir ? `${adjacentDir} · 已巡检` : "已巡检") : "已巡检";
                    subTagColor = "#4ade80";
                    tagColor = "#86efac";
                } else {
                    subLabel = showSub ? (adjacentDir ? `${adjacentDir} · 待巡检` : "待巡检") : "待巡检";
                    subTagColor = "#f59e0b";
                    tagColor = "#fef08a";
                }
            }

            // 根据文字长度自适应字号
            let mainFontSize = Math.max(Math.min(Math.floor(boxSize * 0.24), 13), 9);
            if (label.length >= 6) {
                mainFontSize = Math.min(mainFontSize, 9);
            } else if (label.length >= 5) {
                mainFontSize = Math.min(mainFontSize, 10);
            } else if (label.length >= 4) {
                mainFontSize = Math.min(mainFontSize, 11);
            }

            let subFontSize = Math.max(mainFontSize - 2, 8);
            if (subLabel.length >= 8) {
                subFontSize = 7.5;
            } else if (subLabel.length >= 6) {
                subFontSize = 8;
            }

            ctx.font = `bold ${mainFontSize}px 'PingFang SC', sans-serif`;
            ctx.fillStyle = tagColor;
            ctx.fillText(label, p.x, p.y - (subLabel ? Math.round(subFontSize * 0.65) : 0));

            if (subLabel) {
                ctx.font = `bold ${subFontSize}px 'PingFang SC', sans-serif`;
                ctx.fillStyle = subTagColor;
                ctx.fillText(subLabel, p.x, p.y + Math.round(mainFontSize * 0.85));
            }

            // 静态角标
            if (isCurrent && !animatedMarker) {
                ctx.fillStyle = "#38bdf8";
                const hereFontSize = Math.max(Math.min(Math.floor(boxSize * 0.2), 10), 8);
                ctx.font = `bold ${hereFontSize}px 'Orbitron', monospace`;
                ctx.fillText(boxSize >= 40 ? "📍HERE" : "📍", p.x, p.y - boxSize / 2 - 8);
            } else if (options.canFastTravel && isVisited && !adjacentDir && !animatedMarker) {
                const isHover = options.hoveredNodeId === node.id;
                ctx.fillStyle = isHover ? "#4ade80" : "rgba(74, 222, 128, 0.9)";
                const travelFontSize = Math.max(Math.min(Math.floor(boxSize * 0.18), 9), 8);
                ctx.font = `bold ${travelFontSize}px 'Orbitron', sans-serif`;
                ctx.fillText(boxSize >= 42 ? "⚡快速往返" : "⚡", p.x, p.y - boxSize / 2 - 8);
            }

            ctx.restore();
        });

        // 7. 玩家位移动画平滑光标
        if (animatedMarker) {
            const curX = animatedMarker.x;
            const curY = animatedMarker.y;

            ctx.save();
            if (arrivalPulse > 0) {
                const pulseR = 18 + arrivalPulse * 42;
                const alpha = Math.max(0, 1 - arrivalPulse);
                ctx.strokeStyle = `rgba(74, 222, 128, ${alpha})`;
                ctx.lineWidth = 3.5 * alpha;
                ctx.beginPath();
                ctx.arc(curX, curY, pulseR, 0, Math.PI * 2);
                ctx.stroke();
            }

            const now = Date.now();
            const ring1 = 20 + 5 * Math.sin(now / 130);
            ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(curX, curY, ring1, 0, Math.PI * 2);
            ctx.stroke();

            ctx.shadowColor = "#38bdf8";
            ctx.shadowBlur = 18;
            ctx.fillStyle = arrivalPulse > 0 ? "#10b981" : "#0284c7";
            ctx.beginPath();
            ctx.arc(curX, curY, 15, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 13px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("📍", curX, curY - 1);

            const tagText = arrivalPulse > 0 ? "抵达" : "L.P.H";
            ctx.font = "bold 10px 'Orbitron', monospace";
            const tagW = ctx.measureText(tagText).width + 14;
            ctx.fillStyle = "rgba(11, 17, 32, 0.94)";
            ctx.fillRect(curX - tagW / 2, curY - 34, tagW, 18);
            ctx.strokeStyle = arrivalPulse > 0 ? "#4ade80" : "#38bdf8";
            ctx.lineWidth = 1.2;
            ctx.strokeRect(curX - tagW / 2, curY - 34, tagW, 18);

            ctx.fillStyle = arrivalPulse > 0 ? "#4ade80" : "#38bdf8";
            ctx.fillText(tagText, curX, curY - 24);
            ctx.restore();
        }

        ctx.restore(); // 恢复变换矩阵

        // 8. 绘制屏幕固定 HUD (底部提示与缩放指示，自适应手机与桌面)
        const hudH = 26;
        ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
        ctx.fillRect(8, displayH - hudH - 6, displayW - 16, hudH);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
        ctx.lineWidth = 1;
        ctx.strokeRect(8, displayH - hudH - 6, displayW - 16, hudH);

        const zoomPercent = Math.round(this.zoom * 100);
        ctx.font = displayW < 600 ? "10px 'PingFang SC', sans-serif" : "12px 'PingFang SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#cbd5e1";
        const hudMsg = displayW < 600
            ? `👆 点击相邻房间直接移动 ｜ 🤏 双指缩放 [${zoomPercent}%]`
            : `👆 点击相邻房间直接移动 ｜ 🖱️/🤏 拖拽平移 & 滚轮/双指缩放 [${zoomPercent}%] ｜ ⚡ 点击已探明舱室快速往返`;
        ctx.fillText(hudMsg, displayW / 2, displayH - hudH / 2 - 2);
    }

    /**
     * 单段位移动画
     */
    animateMove(levelMap, fromNodeId, toNodeId, visitedNodes, teamMembers, onComplete) {
        if (this.animating && this.skipAnimation) {
            this.skipAnimation();
        }

        const nodes = levelMap && levelMap.nodes;
        if (!nodes || !fromNodeId || !toNodeId || fromNodeId === toNodeId) {
            this.render(levelMap, toNodeId, visitedNodes, teamMembers);
            if (onComplete) onComplete();
            return;
        }

        const fromNode = nodes[fromNodeId];
        const toNode = nodes[toNodeId];
        if (!fromNode || !toNode) {
            this.render(levelMap, toNodeId, visitedNodes, teamMembers);
            if (onComplete) onComplete();
            return;
        }

        if (typeof requestAnimationFrame === "undefined") {
            this.render(levelMap, toNodeId, visitedNodes, teamMembers);
            if (onComplete) onComplete();
            return;
        }

        this.animating = true;
        this.currentLevelMap = levelMap;
        let finished = false;
        const moveDuration = 680;
        const holdDuration = 320;
        const startTime = performance.now();

        const finish = () => {
            if (finished) return;
            finished = true;
            this.animating = false;
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            this.render(levelMap, toNodeId, visitedNodes, teamMembers);
            if (onComplete) onComplete();
        };

        this.skipAnimation = finish;

        const p1 = this.getNodeCenter(fromNode);
        const p2 = this.getNodeCenter(toNode);

        const step = (now) => {
            if (!this.animating) return;

            const elapsed = now - startTime;

            if (elapsed < moveDuration) {
                const rawT = elapsed / moveDuration;
                const t = easeInOutCubic(rawT);
                const curX = p1.x + (p2.x - p1.x) * t;
                const curY = p1.y + (p2.y - p1.y) * t;

                this.render(levelMap, fromNodeId, visitedNodes, teamMembers, {
                    x: curX,
                    y: curY,
                    fromId: fromNodeId,
                    toId: toNodeId,
                    progress: t
                }, 0);

                this.animationFrameId = requestAnimationFrame(step);
            } else if (elapsed < moveDuration + holdDuration) {
                const holdElapsed = elapsed - moveDuration;
                const pulseProgress = holdElapsed / holdDuration;

                this.render(levelMap, toNodeId, visitedNodes, teamMembers, {
                    x: p2.x,
                    y: p2.y,
                    fromId: fromNodeId,
                    toId: toNodeId,
                    progress: 1
                }, pulseProgress);

                this.animationFrameId = requestAnimationFrame(step);
            } else {
                finish();
            }
        };

        this.animationFrameId = requestAnimationFrame(step);
    }

    /**
     * 多节点快速往返路径动画
     */
    animatePath(levelMap, pathNodeIds, visitedNodes, teamMembers, onSegmentStep, onComplete) {
        if (this.animating && this.skipAnimation) {
            this.skipAnimation();
        }

        const nodes = levelMap && levelMap.nodes;
        if (!nodes || !pathNodeIds || pathNodeIds.length <= 1) {
            const destId = pathNodeIds ? pathNodeIds[pathNodeIds.length - 1] : null;
            this.render(levelMap, destId, visitedNodes, teamMembers);
            if (onComplete) onComplete();
            return;
        }

        const destId = pathNodeIds[pathNodeIds.length - 1];

        if (typeof requestAnimationFrame === "undefined") {
            if (onSegmentStep) {
                for (let i = 0; i < pathNodeIds.length - 1; i++) {
                    onSegmentStep(i, pathNodeIds[i], pathNodeIds[i + 1]);
                }
            }
            this.render(levelMap, destId, visitedNodes, teamMembers);
            if (onComplete) onComplete();
            return;
        }

        this.animating = true;
        this.currentLevelMap = levelMap;
        let finished = false;

        const numSegments = pathNodeIds.length - 1;
        const segmentDuration = Math.max(240, Math.min(380, 1500 / numSegments));
        const totalMoveDuration = segmentDuration * numSegments;
        const holdDuration = 320;
        const startTime = performance.now();

        let lastTriggeredSegment = 0;
        if (onSegmentStep) {
            onSegmentStep(0, pathNodeIds[0], pathNodeIds[1]);
        }

        const finish = () => {
            if (finished) return;
            finished = true;
            this.animating = false;
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            this.render(levelMap, destId, visitedNodes, teamMembers);
            if (onComplete) onComplete();
        };

        this.skipAnimation = finish;

        const step = (now) => {
            if (!this.animating) return;

            const elapsed = now - startTime;

            if (elapsed < totalMoveDuration) {
                const curSegIdx = Math.min(numSegments - 1, Math.floor(elapsed / segmentDuration));
                
                if (curSegIdx !== lastTriggeredSegment) {
                    lastTriggeredSegment = curSegIdx;
                    if (onSegmentStep) {
                        onSegmentStep(curSegIdx, pathNodeIds[curSegIdx], pathNodeIds[curSegIdx + 1]);
                    }
                }

                const segElapsed = elapsed - curSegIdx * segmentDuration;
                const segT = easeInOutCubic(Math.min(1, segElapsed / segmentDuration));

                const fromNode = nodes[pathNodeIds[curSegIdx]];
                const toNode = nodes[pathNodeIds[curSegIdx + 1]];
                const p1 = this.getNodeCenter(fromNode);
                const p2 = this.getNodeCenter(toNode);

                const curX = p1.x + (p2.x - p1.x) * segT;
                const curY = p1.y + (p2.y - p1.y) * segT;

                this.render(levelMap, pathNodeIds[0], visitedNodes, teamMembers, {
                    x: curX,
                    y: curY,
                    fromId: pathNodeIds[curSegIdx],
                    toId: pathNodeIds[curSegIdx + 1],
                    progress: segT,
                    path: pathNodeIds
                }, 0);

                this.animationFrameId = requestAnimationFrame(step);
            } else if (elapsed < totalMoveDuration + holdDuration) {
                const holdElapsed = elapsed - totalMoveDuration;
                const pulseProgress = holdElapsed / holdDuration;
                const destNode = nodes[destId];
                const pDest = this.getNodeCenter(destNode);

                this.render(levelMap, destId, visitedNodes, teamMembers, {
                    x: pDest.x,
                    y: pDest.y,
                    fromId: pathNodeIds[numSegments - 1],
                    toId: destId,
                    progress: 1,
                    path: pathNodeIds
                }, pulseProgress);

                this.animationFrameId = requestAnimationFrame(step);
            } else {
                finish();
            }
        };

        this.animationFrameId = requestAnimationFrame(step);
    }

    /**
     * 绘制主界面右上角高科技微型战术雷达 (Mini-map Radar)
     */
    renderMiniRadar(canvas, levelMap, currentNodeId, visitedNodes, isNearMimic = false) {
        if (!canvas || !levelMap || !levelMap.nodes) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const w = canvas.width = 140;
        const h = canvas.height = 140;

        ctx.fillStyle = "#050914";
        ctx.fillRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2;

        ctx.strokeStyle = isNearMimic ? "rgba(234, 179, 8, 0.35)" : "rgba(56, 189, 248, 0.2)";
        ctx.lineWidth = 1;

        ctx.beginPath(); ctx.arc(cx, cy, 32, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, 58, 0, Math.PI * 2); ctx.stroke();

        ctx.beginPath(); ctx.moveTo(cx, 6); ctx.lineTo(cx, h - 6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(6, cy); ctx.lineTo(w - 6, cy); ctx.stroke();

        const currNode = levelMap.nodes[currentNodeId];
        if (!currNode) return;

        const visitedSet = new Set(visitedNodes || []);
        visitedSet.add(currentNodeId);

        const conns = currNode.connections || {};
        const dirOffsets = {
            forward: { dx: 0, dy: -38 },
            backward: { dx: 0, dy: 38 },
            left: { dx: -38, dy: 0 },
            right: { dx: 38, dy: 0 }
        };

        Object.entries(conns).forEach(([dir, neighborId]) => {
            const offset = dirOffsets[dir];
            if (!offset) return;
            const nx = cx + offset.dx;
            const ny = cy + offset.dy;

            ctx.strokeStyle = isNearMimic ? "rgba(234, 179, 8, 0.75)" : "rgba(56, 189, 248, 0.7)";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(nx, ny);
            ctx.stroke();

            const nNode = levelMap.nodes[neighborId];
            if (!nNode) return;
            const isNVisited = visitedSet.has(neighborId);

            ctx.save();
            const nSize = 22;
            const nrx = nx - nSize / 2;
            const nry = ny - nSize / 2;

            if (isNVisited) {
                ctx.fillStyle = "rgba(30, 41, 59, 0.9)";
                ctx.strokeStyle = "#38bdf8";
            } else {
                ctx.fillStyle = "rgba(15, 23, 42, 0.6)";
                ctx.strokeStyle = "rgba(148, 163, 184, 0.5)";
            }
            ctx.lineWidth = 1.5;
            ctx.fillRect(nrx, nry, nSize, nSize);
            ctx.strokeRect(nrx, nry, nSize, nSize);

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = "bold 9px 'PingFang SC', sans-serif";
            if (isNVisited) {
                if (nNode.isExit || (nNode.event && nNode.event.type === 'exit')) {
                    ctx.fillStyle = "#4ade80";
                    ctx.fillText("终", nx, ny);
                } else if (nNode.event && nNode.event.type === 'food') {
                    ctx.fillStyle = "#f59e0b";
                    ctx.fillText("食", nx, ny);
                } else if (nNode.event && nNode.event.type === 'npc') {
                    ctx.fillStyle = "#c084fc";
                    ctx.fillText("人", nx, ny);
                } else {
                    ctx.fillStyle = "#94a3b8";
                    ctx.fillText("●", nx, ny);
                }
            } else {
                ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
                ctx.fillText("?", nx, ny);
            }
            ctx.restore();
        });

        const cSize = 26;
        ctx.save();
        ctx.fillStyle = isNearMimic ? "rgba(234, 179, 8, 0.35)" : "rgba(14, 165, 233, 0.35)";
        ctx.strokeStyle = isNearMimic ? "#eab308" : "#38bdf8";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = isNearMimic ? "#eab308" : "#38bdf8";
        ctx.shadowBlur = 10;
        ctx.fillRect(cx - cSize / 2, cy - cSize / 2, cSize, cSize);
        ctx.strokeRect(cx - cSize / 2, cy - cSize / 2, cSize, cSize);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px 'Orbitron', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("📍", cx, cy);
        ctx.restore();

        if (isNearMimic) {
            ctx.save();
            ctx.fillStyle = "#eab308";
            ctx.font = "bold 9px 'Orbitron', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("⚠️ 异常高熵", cx, cy - 20);
            ctx.restore();
        }
    }
}


    // =========================================================================
    // 模块: unlockEvaluator.js
    // =========================================================================
/**
 * 关卡非线性解锁规则检定器 (UnlockEvaluator)
 * 纯函数/无状态工具类，负责根据玩家通关结算上下文与关卡规则列表计算本次解锁的关卡
 */

class UnlockEvaluator {
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


    // =========================================================================
    // 模块: exploration.js
    // =========================================================================
/**
 * 地图探索与肉鸽事件驱动器 (Exploration & Roguelike Map Engine)
 * 负责移动、体力扣减、食物结算、救助NPC入队、终点胜利检定及傍晚步数概率检定
 */




class ExplorationEngine {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.currentMap = null;
        this.currentNodeId = null;
        this.choiceCount = 0; // 面临选择步数计数器
        this.visitedNodes = new Set();
        this.consumedEvents = new Set(); // 已经触发过的食物/NPC事件记录
    }

    /**
     * 初始化关卡地图
     */
    initLevelMap(mapConfig) {
        this.currentMap = mapConfig;
        this.currentNodeId = mapConfig.startNodeId || Object.keys(mapConfig.nodes)[0];
        this.choiceCount = 0;
        this.visitedNodes.clear();
        this.consumedEvents.clear();
        this.visitedNodes.add(this.currentNodeId);
    }

    getCurrentNode() {
        if (!this.currentMap || !this.currentNodeId) return null;
        return this.currentMap.nodes[this.currentNodeId];
    }

    /**
     * 获取当前节点可通行的方向表
     */
    getAvailableDirections() {
        const node = this.getCurrentNode();
        if (!node || !node.connections) return {};
        return node.connections;
    }

    /**
     * 执行移动操作 (forward, backward, left, right)
     */
    moveTo(direction) {
        const node = this.getCurrentNode();
        if (!node || !node.connections || !node.connections[direction]) {
            return false;
        }

        const nextNodeId = node.connections[direction];
        const nextNode = this.currentMap.nodes[nextNodeId];
        if (!nextNode) return false;

        const isAlreadyExplored = this.visitedNodes.has(nextNodeId);

        // 1. 体力消耗规则：移动到已探索区域免除体力消耗；移动到未知区域消耗 8 点体力
        const cost = isAlreadyExplored ? 0 : StaminaConfig.stepCost;
        if (cost > 0) {
            this.gameEngine.stamina -= cost;
            if (this.gameEngine.stamina < 0) this.gameEngine.stamina = 0;
        }

        if (typeof Sound !== "undefined" && Sound.playMoveSound) {
            Sound.playMoveSound();
        }

        // 步数与同伴历练通知（用于人物记忆图鉴步数检定）
        if (this.gameEngine && this.gameEngine.onExploreStep) {
            this.gameEngine.onExploreStep();
        }

        const dirNames = {
            forward: "前方",
            backward: "后方",
            left: "左侧",
            right: "右侧"
        };
        const dirName = dirNames[direction] || direction;

        // 记录行动日志
        if (isAlreadyExplored) {
            this.gameEngine.logAction(
                `【安全折返】向${dirName}返回已探明区域 [${nextNode.name}]，免除体力消耗（不消耗面临选择次数，剩余 ${this.gameEngine.stamina}/${StaminaConfig.maxStamina}）`
            );
        } else {
            this.gameEngine.logAction(
                `【探索推进】向${dirName}踏入未知区域 [${nextNode.name}]，消耗体力 ${cost}点（剩余 ${this.gameEngine.stamina}/${StaminaConfig.maxStamina}）`
            );
        }

        // 2. 更新当前位置
        this.currentNodeId = nextNodeId;
        this.visitedNodes.add(nextNodeId);

        // 立即更新顶部状态栏（房间名、当前体力与百分比）
        this.gameEngine.updateHeaderUI();

        const isExitNode = !!(nextNode.isExit || (nextNode.event && nextNode.event.type === "exit"));
        const isPowerRestorationPending = (
            (this.gameEngine?.currentLevel?.levelId === 2 && !this.gameEngine.level2PowerRestored) ||
            (this.gameEngine?.currentLevel?.levelId === 3 && !this.gameEngine.level3PowerRestored)
        );
        const isLevel5ColtBarnesPending = (
            this.gameEngine?.currentLevel?.levelId === 5 &&
            !(
                this.gameEngine.getAliveTeamMembers().some(m => m.id === "colt") &&
                this.gameEngine.getAliveTeamMembers().some(m => m.id === "barnes")
            )
        );
        const isLevel6ElsaNoahPending = (
            this.gameEngine?.currentLevel?.levelId === 6 &&
            !(
                this.gameEngine.getAliveTeamMembers().some(m => m.id === "elsa") &&
                this.gameEngine.getAliveTeamMembers().some(m => m.id === "noah")
            )
        );
        const isLevel7BarnesPending = (
            this.gameEngine?.currentLevel?.levelId === 7 &&
            !this.gameEngine.getAliveTeamMembers().some(m => m.id === "barnes")
        );
        const isLevel8ColtPending = (
            this.gameEngine?.currentLevel?.levelId === 8 &&
            !this.gameEngine.getAliveTeamMembers().some(m => m.id === "colt")
        );
        // 如果终点节点包含未救助的NPC（如第五关主反应堆的伊莲），不可提前视为最终脱出阻断，必须步入触发NPC救助
        const nextRoomNpcId = (nextNode.event && nextNode.event.type === "npc" && nextNode.event.npcId) || nextNode.npcId;
        const targetNpc = nextRoomNpcId ? this.gameEngine.getNpcById(nextRoomNpcId) : null;
        const hasUnmetNpc = targetNpc && targetNpc.status === "unmet" && !this.consumedEvents.has(`${nextNode.id}_event`);

        const isEffectiveExit = isExitNode && !isPowerRestorationPending && !isLevel5ColtBarnesPending && !isLevel6ElsaNoahPending && !isLevel7BarnesPending && !isLevel8ColtPending && !hasUnmetNpc;
        if (isEffectiveExit) {
            if (!isAlreadyExplored) {
                this.choiceCount++;
            }
            this.handleNodeEvents(nextNode, isAlreadyExplored);
            return true;
        }

        // 4. 检查体力是否耗尽（非有效终点情况下体力降至0则倒下）
        if (this.gameEngine.stamina <= 0) {
            this.gameEngine.triggerGameOver("体力耗尽！你在冰冷黑暗的走廊中耗尽了最后一丝力气，未能生还……");
            return true;
        }

        // 5. 增加面临选择次数：用户明确规定——点已探索区域不消耗面临选择次数，点未探索区域才消耗
        if (!isAlreadyExplored) {
            this.choiceCount++;
            console.log(`[面临选择计数] 探索新房间 [${nextNode.name}]，选择次数增至: ${this.choiceCount}`);
        } else {
            console.log(`[面临选择计数] 折返已探明房间 [${nextNode.name}]，安全通行，不消耗面临选择次数 (保持 ${this.choiceCount} 次)`);
        }

        // 6. 触发并检查当前节点事件
        this.handleNodeEvents(nextNode, isAlreadyExplored);

        return true;
    }

    /**
     * 处理节点事件（终点、食物、昏迷NPC）
     */
    handleNodeEvents(node, isAlreadyExplored = false) {
        // 更新左上角区域名称与UI
        this.gameEngine.updateHeaderUI();

        // 1. 特殊关卡机制：第二关与第三关停电始发地合闸通电特殊确认弹窗
        // 核心要求：完成修电任务需要有特殊弹窗提示确认，若NPC在上面则先触发修电弹窗再触发NPC选择
        const isPowerRestoreNeeded = (
            ((this.gameEngine?.currentLevel?.levelId === 2 && !this.gameEngine.level2PowerRestored) ||
             (this.gameEngine?.currentLevel?.levelId === 3 && !this.gameEngine.level3PowerRestored)) &&
            (node.id === "room_west_end" || node.isPowerOrigin)
        );

        if (isPowerRestoreNeeded) {
            this.gameEngine.showPowerRestoreModal(node, () => {
                if (this.gameEngine?.currentLevel?.levelId === 2) {
                    this.gameEngine.level2PowerRestored = true;
                } else if (this.gameEngine?.currentLevel?.levelId === 3) {
                    this.gameEngine.level3PowerRestored = true;
                }
                this.gameEngine.logAction(`【电源修复】抵达全舰停电始发地 [${node.name}]！手动合上高压母线总断路器，逃生系统主电网供电成功恢复！`);
                if (typeof Sound !== "undefined" && Sound.playAlarmSound) {
                    Sound.playAlarmSound();
                }
                if (this.gameEngine.showStageToast) {
                    this.gameEngine.showStageToast("⚡ [停电始发地] 主电网重合闸成功！逃生舱气动锁已解除！");
                }
                if (this.gameEngine.renderMissionsPanel) {
                    this.gameEngine.renderMissionsPanel();
                }
                // 修电确认完成后，再顺序触发该节点内的其他事件（如陆知行 NPC 救援选择）
                this.handleNodeEvents(node, isAlreadyExplored);
            });
            return;
        }

        // 2. 优先检查：如果该节点包含未救助的NPC (例如第五关重核聚变主反应堆的伊莲，或特勤套房的柯尔特&巴恩斯)
        const eventKey = `${node.id}_event`;
        const roomNpcId = (node.event && node.event.type === "npc" && node.event.npcId) || node.npcId;
        const targetNpc = roomNpcId ? this.gameEngine.getNpcById(roomNpcId) : null;
        const isNpcUnmet = targetNpc && targetNpc.status === "unmet" && !this.consumedEvents.has(eventKey);

        if (isNpcUnmet) {
            this.handleNpcEvent(node, eventKey, () => {
                this.processNodeAfterNpc(node, isAlreadyExplored, true);
            });
            return;
        }

        this.processNodeAfterNpc(node, isAlreadyExplored, false);
    }

    processNodeAfterNpc(node, isAlreadyExplored = false, skipNpc = false) {
        // A. 终点判定 (走到用户决定的地图终点即宣布成功)
        if (node.isExit || (node.event && node.event.type === "exit")) {
            // 第二关与第三关专属拦截：若尚未在停电始发地合闸通电，禁止撤离
            const isPowerRestorationPending = (
                (this.gameEngine?.currentLevel?.levelId === 2 && !this.gameEngine.level2PowerRestored) ||
                (this.gameEngine?.currentLevel?.levelId === 3 && !this.gameEngine.level3PowerRestored)
            );
            if (isPowerRestorationPending) {
                this.gameEngine.logAction(`【气动锁未解压】逃生舱主电源处于切断状态！气动锁未解压，无法启动撤离程序。请先前往停电始发地修复电源！`);
                this.gameEngine.dialogueUI?.say(
                    { name: "逃生舱控制终端", themeColor: "#f43f5e" },
                    "【警告：主能源离线】逃生舱主电源处于切断状态，舱门气动锁未解压，逃生折跃引擎无法启动！请前往【停电始发地】合上主电闸修复电源后再来撤离！"
                );
                this.gameEngine.renderExplorationControls();
                if (this.gameEngine.refreshStageMap) {
                    this.gameEngine.refreshStageMap();
                }
                return;
            }

            // 第四关专属通关校验：必须先行完成三大要害中枢（停机坪甲板、重力发生核、防护中枢）的巡检
            if (this.gameEngine.currentLevel && this.gameEngine.currentLevel.levelId === 4) {
                const count = this.gameEngine.level4PatrolVisited ? this.gameEngine.level4PatrolVisited.size : 0;
                if (count < 3) {
                    if (this.gameEngine.showStageToast) {
                        this.gameEngine.showStageToast(`⚠️ 巡检任务未完成！三大要害中枢尚有 ${3 - count} 处未排查！`);
                    }
                    this.gameEngine.logAction(`【巡检未竟】未完成全舰三大要害中枢巡检（${count}/3），动力操作台终端尚未解锁！`);
                    this.gameEngine.dialogueUI?.say(
                        { name: "动力操作台控制终端", themeColor: "#fbbf24" },
                        `【全舰巡检协议未闭环】巡检任务尚未完成（当前进度: ${count}/3）。在确认停机坪甲板、重力发生核与防护中枢的安全之前，动力操作台控制系统拒绝进入收工阶段！`
                    );
                    this.gameEngine.renderExplorationControls();
                    if (this.gameEngine.refreshStageMap) {
                        this.gameEngine.refreshStageMap();
                    }
                    return;
                }
            }

            // 第五关专属通关校验：必须带离柯尔特与巴恩斯撤离（不这样做就算踩上终点也不触发通过）
            if (this.gameEngine?.currentLevel?.levelId === 5) {
                const aliveTeam = this.gameEngine.getAliveTeamMembers();
                const hasColt = aliveTeam.some(m => m.id === "colt");
                const hasBarnes = aliveTeam.some(m => m.id === "barnes");
                if (!hasColt || !hasBarnes) {
                    if (this.gameEngine.showStageToast) {
                        this.gameEngine.showStageToast("⚠️ 撤离受阻！未能与柯尔特及巴恩斯汇合！");
                    }
                    this.gameEngine.logAction("【撤离受阻】未带离柯尔特与巴恩斯撤离，重核聚变主反应堆引渡通道拒绝开启！");
                    this.gameEngine.dialogueUI?.say(
                        { name: "主反应堆控制中枢", themeColor: "#fb923c" },
                        "【引渡协议拦截】柯尔特与巴恩斯未随队抵达！缺少全舰电路跳变与走私旁路授权，重核聚变主反应堆引渡通道无法开启！"
                    );
                    this.gameEngine.renderExplorationControls();
                    if (this.gameEngine.refreshStageMap) {
                        this.gameEngine.refreshStageMap();
                    }
                    return;
                }
            }

            // 第六关专属通关校验：必须带离艾尔莎与诺亚撤离（不这样做就算踩上终点也不触发通过）
            if (this.gameEngine?.currentLevel?.levelId === 6) {
                const aliveTeam = this.gameEngine.getAliveTeamMembers();
                const hasElsa = aliveTeam.some(m => m.id === "elsa");
                const hasNoah = aliveTeam.some(m => m.id === "noah");
                if (!hasElsa || !hasNoah) {
                    if (this.gameEngine.showStageToast) {
                        this.gameEngine.showStageToast("⚠️ 撤离受阻！尚未找到艾尔莎与诺亚！");
                    }
                    this.gameEngine.logAction("【撤离受阻】未带离艾尔莎与诺亚撤离，重核聚变主反应堆过热回路无法闭锁！");
                    this.gameEngine.dialogueUI?.say(
                        { name: "主反应堆控制中枢", themeColor: "#fb923c" },
                        "【紧急协议拦截】艾尔莎与诺亚未随队抵达！缺少生化抗核阻滞剂与超导超频阵列支持，主反应堆无法完成冷却降温，撤离通道拒绝开启！"
                    );
                    this.gameEngine.renderExplorationControls();
                    if (this.gameEngine.refreshStageMap) {
                        this.gameEngine.refreshStageMap();
                    }
                    return;
                }
            }

            // 第七关专属通关校验：必须带离巴恩斯撤离（不这样做就算踩上终点也不触发通过）
            if (this.gameEngine?.currentLevel?.levelId === 7) {
                const aliveTeam = this.gameEngine.getAliveTeamMembers();
                const hasBarnes = aliveTeam.some(m => m.id === "barnes");
                if (!hasBarnes) {
                    if (this.gameEngine.showStageToast) {
                        this.gameEngine.showStageToast("⚠️ 撤离受阻！未能保护搭档巴恩斯一同撤离！");
                    }
                    this.gameEngine.logAction("【撤离受阻】未带离巴恩斯撤离，防爆甬道气动闭锁拒绝开启！");
                    this.gameEngine.dialogueUI?.say(
                        { name: "防爆甬道门禁", themeColor: "#fb923c" },
                        "【逃生指令驳回】搭档巴恩斯未随队抵达！走私暗号与联络频段未完成双重校验，防爆甬道气动锁拒绝解锁！"
                    );
                    this.gameEngine.renderExplorationControls();
                    if (this.gameEngine.refreshStageMap) {
                        this.gameEngine.refreshStageMap();
                    }
                    return;
                }
            }

            // 第八关专属通关校验：必须带离柯尔特撤离（不这样做就算踩上终点也不触发通过）
            if (this.gameEngine?.currentLevel?.levelId === 8) {
                const aliveTeam = this.gameEngine.getAliveTeamMembers();
                const hasColt = aliveTeam.some(m => m.id === "colt");
                if (!hasColt) {
                    if (this.gameEngine.showStageToast) {
                        this.gameEngine.showStageToast("⚠️ 撤离受阻！未能保护搭档柯尔特一同撤离！");
                    }
                    this.gameEngine.logAction("【撤离受阻】未带离柯尔特撤离，防爆甬道气动闭锁拒绝开启！");
                    this.gameEngine.dialogueUI?.say(
                        { name: "防爆甬道门禁", themeColor: "#fb923c" },
                        "【逃生指令驳回】搭档柯尔特未随队抵达！缺少电子密钥与旁路密码，防爆甬道气动锁拒绝解锁！"
                    );
                    this.gameEngine.renderExplorationControls();
                    if (this.gameEngine.refreshStageMap) {
                        this.gameEngine.refreshStageMap();
                    }
                    return;
                }
            }

            this.gameEngine.logAction(`【通关突破】全员成功抵达目的地 [${node.name}]！准备跳跃！`);
            this.gameEngine.triggerVictory(node);
            return;
        }

        // 第四关专属要害巡检打卡判定 (停机坪甲板、重力发生核、防护中枢)
        if (this.gameEngine.currentLevel && this.gameEngine.currentLevel.levelId === 4) {
            const patrolTargets = ["room_hangar_deck", "room_gravity_well", "room_shields_emitter"];
            if (patrolTargets.includes(node.id)) {
                if (!this.gameEngine.level4PatrolVisited) {
                    this.gameEngine.level4PatrolVisited = new Set();
                }
                if (!this.gameEngine.level4PatrolVisited.has(node.id)) {
                    this.gameEngine.level4PatrolVisited.add(node.id);
                    const targetNames = {
                        room_hangar_deck: "停机坪甲板",
                        room_gravity_well: "重力发生核",
                        room_shields_emitter: "防护中枢"
                    };
                    const count = this.gameEngine.level4PatrolVisited.size;
                    if (this.gameEngine.showStageToast) {
                        this.gameEngine.showStageToast(`🎯 [巡检打卡] 已抵达【${targetNames[node.id] || node.name}】(${count}/3)`);
                    }
                    this.gameEngine.logAction(`【要害巡视】完成了对三大中枢之一 [${node.name}] 的静默巡查（当前进度: ${count}/3）！`);
                    this.gameEngine.updateHeaderUI();
                }
            }
        }

        // B. 特殊生化检测室判定 (获知当前队伍里有几名伪人)
        if (node.isDetectionRoom) {
            const aliveTeam = this.gameEngine.getAliveTeamMembers();
            const wolfCount = aliveTeam.filter(m => m.role === "wolf").length;
            this.gameEngine.logAction(
                `【生化检测】在 [${node.name}] 终端完成基因测序：当前随行 ${aliveTeam.length} 人，检出 ${wolfCount} 名伪人拟态体！`
            );
            this.gameEngine.dialogueUI.say(
                { name: "生化检测终端", themeColor: "#34d399" },
                `【生化检测报告】全队生命体征扫描完毕。当前随行队伍共 ${aliveTeam.length} 人，检测到潜伏着 ${wolfCount} 名异质伪装体（伪人）！`
            );
        }

        // C. NPC 专属私人舱室日记读取 (独立翻页弹窗)
        if (node.isNpcRoom && node.diary && Array.isArray(node.diary) && node.diary.length > 0) {
            const ownerNames = {
                lph: "L.P.H", kaze: "卡罗", kaluo: "卡罗", shaokexin: "邵可欣", mode: "莫德",
                prof_lu: "陆知行", luzhixing: "陆知行", noah: "诺亚", sophia: "索菲亚",
                vivian: "薇薇安", elena: "伊莲", elsa: "艾尔莎", dr_elsa: "艾尔莎",
                colt: "柯尔特", barnes: "巴恩斯", colt_barnes: "柯尔特 & 巴恩斯"
            };
            const ownerColors = {
                lph: "#38bdf8", kaze: "#38bdf8", kaluo: "#38bdf8", shaokexin: "#f43f5e", mode: "#a855f7",
                prof_lu: "#10b981", luzhixing: "#10b981", noah: "#6366f1", sophia: "#ec4899",
                vivian: "#f43f5e", elena: "#fb923c", elsa: "#06b6d4", dr_elsa: "#06b6d4",
                colt: "#f59e0b", barnes: "#84cc16", colt_barnes: "#f59e0b"
            };
            const ownerName = ownerNames[node.npcOwnerId] || node.name;
            const ownerColor = ownerColors[node.npcOwnerId] || "#38bdf8";

            this.gameEngine.logAction(`【翻阅日志】在 [${node.name}] 发现了一份私人记录本（${ownerName}）。`);
            if (this.gameEngine.diaryUI) {
                setTimeout(() => {
                    this.gameEngine.diaryUI.open(ownerName, ownerColor, node.diary);
                }, 200);
            }
        }

        this.processRoomEvents(node, isAlreadyExplored, skipNpc);
    }

    /**
     * 处理房间内的常规事件（食物物资、NPC昏迷救助、傍晚检定）
     */
    processRoomEvents(node, isAlreadyExplored, skipNpc = false) {
        // 检查该节点的事件是否已被触发过
        const eventKey = `${node.id}_event`;
        if (node.event && !this.consumedEvents.has(eventKey)) {
            if (node.event.type === "food") {
                this.handleFoodEvent(node, eventKey);
                return;
            } else if (node.event.type === "npc" && !skipNpc) {
                this.handleNpcEvent(node, eventKey);
                return;
            }
        }

        // 如果是已探索过的安全房间，并且没有新事件阻断，则不计入面临选择，不触发傍晚检定
        if (isAlreadyExplored) {
            this.gameEngine.renderExplorationControls();
            if (this.gameEngine.refreshStageMap) {
                this.gameEngine.refreshStageMap();
            }
            return;
        }

        // 仅当踏入未探索区域时，才检定是否触发傍晚
        this.checkEveningTrigger();
    }

    /**
     * 遇到食物补给事件
     */
    handleFoodEvent(node, eventKey, afterCallback = null) {
        this.consumedEvents.add(eventKey);
        
        // 根据当前存活的队伍人数结算回复量
        const teamCount = this.gameEngine.getAliveTeamMembers().length;
        const recoveryAmount = StaminaConfig.getFoodRecovery(teamCount);
        const oldStamina = this.gameEngine.stamina;
        this.gameEngine.stamina = Math.min(StaminaConfig.maxStamina, this.gameEngine.stamina + recoveryAmount);
        const actualRecovered = this.gameEngine.stamina - oldStamina;

        // 【优化】物资补充时立即刷新UI上的体力值与体力条，而不是等下一次行动才刷新
        this.gameEngine.updateHeaderUI();
        if (this.gameEngine.headerStaminaFill) {
            this.gameEngine.headerStaminaFill.classList.remove("stamina-boost-pulse");
            if (this.gameEngine.headerStaminaFill.offsetWidth !== undefined) {
                void this.gameEngine.headerStaminaFill.offsetWidth;
            }
            this.gameEngine.headerStaminaFill.classList.add("stamina-boost-pulse");
        }

        // 播放物资获取专属音效 (物资获取.wav)
        if (typeof Sound !== "undefined" && Sound.playFoodSound) {
            Sound.playFoodSound();
        }

        this.gameEngine.logAction(
            `【发现食物】在 [${node.name}] 找到了 [${node.event.name || "高能给养"}]！队伍共 ${teamCount} 人，体力恢复了 +${actualRecovered} 点（当前: ${this.gameEngine.stamina}）`
        );

        // 播放视觉小说对白反馈
        this.gameEngine.dialogueUI.playSequence([
            {
                speaker: { name: "环境广播", themeColor: "#4ade80" },
                text: `在 [${node.name}] 发现留存的 [${node.event.name || "给养"}]！`
            },
            {
                speaker: this.gameEngine.protagonist,
                text: `根据当前 ${teamCount} 名同伴的配给均分，每人补充了水分与能量。体力回复了 ${actualRecovered} 点。`
            }
        ], () => {
            if (afterCallback) {
                afterCallback();
            } else {
                this.checkEveningTrigger();
            }
        });
    }

    /**
     * 遇到昏迷NPC事件
     */
    handleNpcEvent(node, eventKey, onHandledCallback = null) {
        const npcId = (node.event && node.event.npcId) || node.npcId;
        const npc = this.gameEngine.getNpcById(npcId);

        if (!npc) {
            if (onHandledCallback) onHandledCallback();
            else this.checkEveningTrigger();
            return;
        }

        // 第四关专属潜行规避逻辑：不可与任何NPC发生视线接触，若踩到NPC所在区域直接游戏结束“你被他人所凝视，复现失败”
        if (this.gameEngine.currentLevel && this.gameEngine.currentLevel.levelId === 4) {
            this.gameEngine.triggerGameOver("你被他人所凝视，复现失败");
            return;
        }

        if (npc.status === "dead") {
            this.consumedEvents.add(eventKey);
            this.gameEngine.logAction(`【现场勘查】在 [${node.name}] 发现了已遇害的 [${npc.name}] 的遗体。`);
            this.gameEngine.dialogueUI.say(
                this.gameEngine.protagonist,
                `这里是 [${npc.name}] 最后的停留地……现场留下了激烈的搏斗痕迹，伪人抢先一步下了杀手。`,
                () => {
                    if (onHandledCallback) onHandledCallback();
                    else this.checkEveningTrigger();
                }
            );
            return;
        }

        if (npc.status !== "unmet") {
            if (onHandledCallback) onHandledCallback();
            else this.checkEveningTrigger();
            return;
        }

        // 弹出对话框并提示玩家选择：让其加入 / 不救助
        // 若选择救助入队，则标记该事件已消耗；若选择不救助/不理睬，则不标记消耗，允许之后再次踏入该区域时重新触发是否救助！
        this.gameEngine.showNpcEncounterModal(npc, node, (joined) => {
            if (joined) {
                this.consumedEvents.add(eventKey);
            }
            if (onHandledCallback) {
                onHandledCallback();
            } else {
                this.checkEveningTrigger();
            }
        });
    }

    /**
     * 检定是否触发傍晚时刻
     * 当面临选择次数大于等于3次后概率触发傍晚时刻 (1,2次0%; 3次40%; 4次70%; 5次100%)
     * 触发后重置 choiceCount，进入 q4 询问环节
     */
    checkEveningTrigger() {
        // 第四关专属优化：本关卡为全舰白昼静默巡检，没有黑天时刻，没有死寂降临
        if (this.gameEngine?.currentLevel?.levelId === 4) {
            this.gameEngine.renderExplorationControls();
            return;
        }

        const chance = EveningTriggerConfig.getChance(this.choiceCount);
        const roll = Math.random();

        console.log(`[探索步数计数]: ${this.choiceCount} 次, 傍晚触发概率: ${(chance * 100).toFixed(0)}%, 摇点: ${(roll * 100).toFixed(0)}%`);

        if (roll < chance) {
            // 触发傍晚！
            this.choiceCount = 0; // 重新开始计数面临选择
            this.gameEngine.logAction(`【天色渐暗】时针指向傍晚时刻，全员暂停探索，聚集商榷……`);
            this.gameEngine.enterEveningPhase();
        } else {
            // 继续探索阶段，刷新探索UI
            this.gameEngine.renderExplorationControls();
        }
    }

    /**
     * 基于已探明房间集合的 BFS 广度优先最短路径寻路
     * 确保快速往返路线全程只经过已探索的房间
     * @param {string} fromId 起点房间ID
     * @param {string} toId 目标房间ID
     * @returns {Array<string>|null} 完整节点序列，若无连通路径返回 null
     */
    findVisitedPath(fromId, toId) {
        if (!this.currentMap || !this.currentMap.nodes) return null;
        if (fromId === toId) return [fromId];
        if (!this.visitedNodes.has(fromId) || !this.visitedNodes.has(toId)) return null;

        const queue = [[fromId]];
        const visited = new Set([fromId]);
        const nodes = this.currentMap.nodes;

        while (queue.length > 0) {
            const path = queue.shift();
            const currId = path[path.length - 1];
            const currNode = nodes[currId];
            if (!currNode || !currNode.connections) continue;

            for (const neighborId of Object.values(currNode.connections)) {
                if (!this.visitedNodes.has(neighborId) || visited.has(neighborId)) continue;
                const newPath = [...path, neighborId];
                if (neighborId === toId) {
                    return newPath;
                }
                visited.add(neighborId);
                queue.push(newPath);
            }
        }

        return null;
    }

    /**
     * 执行地图快速往返
     * 核心规则：
     * 1. 绝不累加面临选择次数 choiceCount
     * 2. 绝不触发傍晚时刻判定 checkEveningTrigger
     * 3. 瞬时抵达安全区域并刷新探索控制盘
     * @param {string} targetNodeId 目标房间ID
     * @returns {Array<string>|null} 路径节点序列
     */
    fastTravelTo(targetNodeId) {
        if (!this.currentMap || !this.currentMap.nodes) return null;
        if (!this.visitedNodes.has(targetNodeId)) return null;
        if (this.currentNodeId === targetNodeId) return null;

        const path = this.findVisitedPath(this.currentNodeId, targetNodeId);
        if (!path || path.length < 2) return null;

        const targetNode = this.currentMap.nodes[targetNodeId];
        if (!targetNode) return null;

        // 体力消耗（快速往返消耗，默认 0）
        const costPerStep = (typeof StaminaConfig !== "undefined" && StaminaConfig.fastTravelStepCost !== undefined)
            ? StaminaConfig.fastTravelStepCost
            : 0;
        const totalCost = costPerStep * (path.length - 1);
        if (totalCost > 0) {
            this.gameEngine.stamina = Math.max(0, this.gameEngine.stamina - totalCost);
        }

        // 核心规则：快速往返绝对不累加面临选择次数 choiceCount，绝不触发傍晚时刻判定！
        this.currentNodeId = targetNodeId;

        // 记录行动日志
        this.gameEngine.logAction(
            `【快速往返】经由已探明路线快速返回至 [${targetNode.name}]（不计入面临选择次数，安全折返）`
        );

        // 立即更新顶部状态栏与罗盘方向控制面板
        this.gameEngine.updateHeaderUI();
        this.gameEngine.renderExplorationControls();

        // 检查目标房间是否有未消耗的事件（如之前暂缓救助的NPC或物资）
        const eventKey = `${targetNode.id}_event`;
        if (targetNode.event && !this.consumedEvents.has(eventKey)) {
            if (targetNode.event.type === "npc") {
                const npc = this.gameEngine.getNpcById(targetNode.event.npcId);
                if (npc && npc.status === "unmet") {
                    this.gameEngine.showNpcEncounterModal(npc, targetNode, (joined) => {
                        if (joined) {
                            this.consumedEvents.add(eventKey);
                        }
                    });
                }
            } else if (targetNode.event.type === "food") {
                this.handleFoodEvent(targetNode, eventKey, () => {
                    this.gameEngine.renderExplorationControls();
                });
            }
        }

        return path;
    }
}


    // =========================================================================
    // 模块: gameEngine.js
    // =========================================================================
/**
 * 游戏主循环引擎与状态机 (Game Engine & State Machine)
 * 严格管理 q1 -> q2 -> q3 -> q4 -> q5 -> q6 -> q7 完整闭环
 */













class GameEngine {
    constructor() {
        this.saveSystem = new SaveSystem();
        this.dialogueUI = new DialogueUI();
        this.diaryUI = new DiaryUI();
        this.explorationEngine = new ExplorationEngine(this);
        this.mapRenderer = null;
        this.hoveredMapNodeId = null;
        this.unlockedNpcRooms = new Set();

        // 核心游戏状态
        this.currentLevel = null;
        this.phase = "menu"; // menu, q1_black, q2_intro, q3_explore, q4_inquiry, q5_judgement, q6_night, q7_day, victory, gameover
        this.dayCount = 1;
        this.stamina = 100;
        this.actionLogs = [];

        // 角色与队伍
        this.protagonist = null;
        this.teamMembers = []; // 队伍内所有成员（包含主角与已加入的NPC）
        this.allNpcMap = new Map(); // 关卡中所有NPC状态存储

        // 傍晚与夜间暂存数据
        this.eveningInquiryCount = 0; // 当前傍晚已询问人数 (0, 1, 2)
        this.eveningTargetNpc = null;
        this.confinedNpcId = null; // 今晚被禁锢的角色ID
        this.exiledNpcId = null;   // 今晚被放逐的角色ID
        this.nightProtectedNpcId = null; // 护卫守护目标
        this.nightTargetVictimId = null; // 伪人预定袭击目标
        this.witchSaved = false;         // 歌咏者是否施救

        // 人物特征/秘密图鉴与专属被动状态
        this.activePersonaCharId = "kaze";
        this.stepsWithNpc = {};
        this.nightCounterDeflected = false;
        this.nightModeDefended = false;

        this.initDomReferences();
        this.bindEvents();

        if (this.stageMapCanvas && !this.stageMapRenderer) {
            this.stageMapRenderer = new MapRenderer(this.stageMapCanvas);
        }

        this.startInitialLoading();
    }

    initDomReferences() {
        // 0. 初始资源加载屏
        this.screenLoading = document.getElementById("screen-loading");
        this.loadingProgressBar = document.getElementById("loading-progress-bar");
        this.loadingStatusText = document.getElementById("loading-status-text");
        this.loadingPercentText = document.getElementById("loading-percent-text");
        this.btnLoadingStart = document.getElementById("btn-loading-start");
        this.isInitialLoadingDone = false;

        // 界面大屏
        this.screenMenu = document.getElementById("screen-menu");
        this.screenBlack = document.getElementById("screen-q1-black");
        this.screenEveningBlack = document.getElementById("screen-evening-black");
        this.screenDeathBlack = document.getElementById("screen-death-black");
        this.screenLevel4Cutscene = document.getElementById("screen-level4-cutscene");
        this.deathBlackCallback = null;
        this.screenGame = document.getElementById("screen-game");

        // q1 黑屏白字
        this.blackTextContent = document.getElementById("q1-black-text");
        this.blackPrompt = document.getElementById("q1-click-prompt");

        // 顶栏与状态
        this.headerLocation = document.getElementById("header-current-location");
        this.headerStaminaFill = document.getElementById("header-stamina-fill");
        this.headerStaminaText = document.getElementById("header-stamina-text");
        this.headerTeamCount = document.getElementById("header-team-count");
        this.headerDayText = document.getElementById("header-day-text");

        // 左侧行动日志
        this.logListElement = document.getElementById("action-log-list");

        // 中间探索控制盘与操作台
        this.exploreControls = document.getElementById("exploration-controls");
        this.directionButtons = {
            forward: document.getElementById("btn-move-forward"),
            backward: document.getElementById("btn-move-backward"),
            left: document.getElementById("btn-move-left"),
            right: document.getElementById("btn-move-right")
        };

        // 模态弹窗们
        this.modalMap = document.getElementById("modal-map-view");
        this.modalEncounter = document.getElementById("modal-npc-encounter");
        this.modalInquiry = document.getElementById("modal-inquiry-select");
        this.modalJudgement = document.getElementById("modal-judgement");
        this.modalNight = document.getElementById("modal-night-action");
        this.modalResult = document.getElementById("modal-game-result");
        this.modalLevelSelect = document.getElementById("modal-level-select");
        this.levelGrid = document.getElementById("level-select-grid");
        this.btnOpenLevelSelect = document.getElementById("btn-menu-select-level");
        this.modalPowerRestore = document.getElementById("modal-power-restore");
        this.btnPowerRestoreConfirm = document.getElementById("btn-power-restore-confirm");

        // 任务清单 DOM 引用
        this.btnViewMissions = document.getElementById("btn-view-missions");
        this.modalMissions = document.getElementById("modal-mission-checklist");
        this.btnCloseMissions = document.getElementById("btn-close-missions");
        this.missionsSidebarList = document.getElementById("missions-sidebar-list");
        this.missionModalList = document.getElementById("mission-modal-list");
        this.missionsSummaryTag = document.getElementById("missions-summary-tag");

        // 舞台常驻大地图与轻量任务卡 DOM 引用
        this.stageMapCanvas = document.getElementById("stage-map-canvas");
        this.stageMapRenderer = null;
        this.stageMissionCard = document.getElementById("stage-mission-card");
        this.stageMissionContent = document.getElementById("stage-mission-content");
        this.stageToast = document.getElementById("stage-toast");
        this.toastTimer = null;

        // 人物特征/秘密图鉴 DOM 引用
        this.btnMenuPersonaLog = document.getElementById("btn-menu-persona-log");
        this.modalPersonaLog = document.getElementById("modal-persona-log");
        this.btnClosePersonaLog = document.getElementById("btn-close-persona-log");
        this.personaCharTabs = document.getElementById("persona-char-tabs");
        this.personaCharDetail = document.getElementById("persona-char-detail");

        // 小地图战术微型雷达 DOM 引用
        this.hudMiniRadar = document.getElementById("hud-mini-radar");
        this.miniRadarCanvas = document.getElementById("mini-radar-canvas");
        this.btnRadarExpand = document.getElementById("btn-radar-expand");
        this.btnRadarToggle = document.getElementById("btn-radar-toggle");
        this.radarBodyWrap = document.getElementById("radar-body-wrap");
        this.radarPosTag = document.getElementById("radar-pos-tag");

        // 移动端横屏引导与旋转控制器 DOM
        this.screenOrientationHint = document.getElementById("screen-orientation-hint");
        this.btnForceLandscape = document.getElementById("btn-force-landscape");
        this.btnIgnoreOrientation = document.getElementById("btn-ignore-orientation");
        this.btnToggleLandscape = document.getElementById("btn-toggle-landscape");
    }

    /**
     * 游戏启动全屏 0% -> 100% 极速科技加载进度条
     * 明确向用户展示所有音频、地图底图、各角色表情立绘的实际加载进度，加载完毕后解锁进入游戏
     */
    startInitialLoading() {
        if (!this.screenLoading || this.isInitialLoadingDone) return;

        // 如果在非浏览器或自动化测试运行环境中（例如 JSDOM / Node.js 且非完整真实环境），直接标记就绪
        if (typeof window === "undefined" || !window.document || !window.Audio) {
            this.isInitialLoadingDone = true;
            if (this.screenLoading) this.screenLoading.classList.add("hidden");
            return;
        }

        // 收集所有需要预热的静态媒体资源清单
        const assetTasks = [];

        // 1. 核心音频资源 (4 项)
        if (typeof AudioConfig !== "undefined") {
            const sounds = [
                { type: "audio", name: "踏步位移音效", url: AudioConfig.moveSoundUrl },
                { type: "audio", name: "物资获取音效", url: AudioConfig.foodSoundUrl },
                { type: "audio", name: "警报鸣响音效", url: AudioConfig.alarmSoundUrl },
                { type: "audio", name: "遇害死亡重音", url: AudioConfig.deathSoundUrl }
            ].filter(s => !!s.url);
            assetTasks.push(...sounds);
        }

        // 2. 关卡高维拓扑底图 (1 项)
        assetTasks.push({ type: "image", name: "母舰扇区蓝图手绘", url: "assets/level1_sketch.jpg" });

        // 3. 所有NPC候选角色的全表情独立立绘 (24 项)
        if (typeof CharacterRegistry !== "undefined" && CharacterRegistry.npcs) {
            const expNames = {
                clam: "平静",
                normal: "正常",
                happy: "开心",
                sad: "悲伤",
                angry: "生气",
                doubt: "疑惑",
                shock: "震惊",
                dead: "遇害"
            };
            Object.values(CharacterRegistry.npcs).forEach(char => {
                if (!char || !char.expressions) return;
                // 去重，防止 morde 与 mode 重复添加
                if (char.id === "morde") return;
                Object.entries(char.expressions).forEach(([expKey, url]) => {
                    if (url) {
                        const cnExp = expNames[expKey] || expKey;
                        assetTasks.push({
                            type: "image",
                            name: `角色立绘 [${char.name} · ${cnExp}]`,
                            url: url
                        });
                    }
                });
            });
        }

        const total = assetTasks.length;
        if (total === 0) {
            this.finishInitialLoading();
            return;
        }

        let loadedCount = 0;
        const updateUI = (taskName) => {
            const pct = Math.min(100, Math.round((loadedCount / total) * 100));
            if (this.loadingProgressBar) {
                this.loadingProgressBar.style.width = pct + "%";
            }
            if (this.loadingPercentText) {
                this.loadingPercentText.textContent = pct + "%";
            }
            if (this.loadingStatusText) {
                this.loadingStatusText.textContent = `[${loadedCount}/${total}] 正在同步：${taskName}`;
            }

            if (loadedCount >= total) {
                this.onInitialLoadingComplete();
            }
        };

        // 采用受控并发池逐一异步加载资源，彻底移除900ms假冒完成，确保立绘真实加载解码完毕
        let cursor = 0;
        const CONCURRENCY = 4; // 移动端最优并发通道数，避免网络请求拥塞与套接字耗尽

        const loadNext = () => {
            if (cursor >= assetTasks.length) return;
            const task = assetTasks[cursor++];
            let finished = false;
            const onDone = () => {
                if (finished) return;
                finished = true;
                loadedCount++;
                updateUI(task.name);
                loadNext(); // 推进下一个资源
            };

            // 真实网络保底超时（15秒，仅防极端断网死锁，杜绝提前假报完成）
            const timer = setTimeout(onDone, 15000);

            if (task.type === "audio") {
                if (typeof Sound !== "undefined" && Sound.preloadAudio) {
                    Sound.preloadAudio(task.url).then(() => {
                        clearTimeout(timer);
                        onDone();
                    }).catch(() => {
                        clearTimeout(timer);
                        onDone();
                    });
                } else {
                    try {
                        const a = new Audio(encodeURI(task.url));
                        a.preload = "auto";
                        const doneAudio = () => { clearTimeout(timer); onDone(); };
                        if (typeof a.addEventListener === "function") {
                            a.addEventListener("canplaythrough", doneAudio, { once: true });
                            a.addEventListener("loadeddata", doneAudio, { once: true });
                            a.addEventListener("error", doneAudio, { once: true });
                        } else {
                            doneAudio();
                        }
                        if (a.load) a.load();
                    } catch (e) {
                        clearTimeout(timer);
                        onDone();
                    }
                }
            } else if (task.type === "image") {
                if (typeof CharacterRegistry !== "undefined" && CharacterRegistry.preloadImage) {
                    CharacterRegistry.preloadImage(task.url).then(() => {
                        clearTimeout(timer);
                        onDone();
                    }).catch(() => {
                        clearTimeout(timer);
                        onDone();
                    });
                } else {
                    try {
                        const img = new Image();
                        img.src = encodeURI(task.url);
                        const doneImg = () => { clearTimeout(timer); onDone(); };
                        if (typeof img.decode === "function") {
                            img.decode().then(doneImg).catch(doneImg);
                        } else {
                            img.onload = doneImg;
                            img.onerror = doneImg;
                        }
                    } catch (e) {
                        clearTimeout(timer);
                        onDone();
                    }
                }
            }
        };

        const initialWorkers = Math.min(CONCURRENCY, assetTasks.length);
        for (let i = 0; i < initialWorkers; i++) {
            loadNext();
        }
    }

    onInitialLoadingComplete() {
        if (this.loadingProgressBar) {
            this.loadingProgressBar.style.width = "100%";
        }
        if (this.loadingPercentText) {
            this.loadingPercentText.textContent = "100%";
        }
        if (this.loadingStatusText) {
            this.loadingStatusText.textContent = "✅ 全部核心音频、拓扑底图与立绘神经元 100% 校验完成！";
        }

        // 显示进入游戏激活按钮（顺带触发移动端音频上下文唤醒）
        if (this.btnLoadingStart) {
            this.btnLoadingStart.classList.remove("hidden");
            this.btnLoadingStart.onclick = () => {
                this.finishInitialLoading();
            };
        } else {
            setTimeout(() => this.finishInitialLoading(), 300);
        }
    }

    finishInitialLoading() {
        if (this.isInitialLoadingDone) return;
        this.isInitialLoadingDone = true;

        if (typeof Sound !== "undefined" && Sound.unlock) {
            Sound.unlock();
            Sound.preloadDefaults();
        }

        if (this.screenLoading) {
            this.screenLoading.classList.add("loading-fade-out");
            setTimeout(() => {
                this.screenLoading.classList.add("hidden");
            }, 400);
        }
    }

    bindEvents() {
        // 移动端抽屉日志侧栏开闭
        document.getElementById("btn-toggle-log-drawer")?.addEventListener("click", () => {
            document.getElementById("action-log-sidebar")?.classList.toggle("mobile-open");
        });
        document.getElementById("btn-close-log-sidebar")?.addEventListener("click", () => {
            document.getElementById("action-log-sidebar")?.classList.remove("mobile-open");
        });

        // 顶栏任务清单入口
        this.btnViewMissions?.addEventListener("click", () => {
            this.showMissionsModal();
        });
        this.btnCloseMissions?.addEventListener("click", () => {
            this.modalMissions?.classList.add("hidden");
        });

        // 主菜单：5x5 关卡选择弹窗入口
        this.btnOpenLevelSelect?.addEventListener("click", () => {
            this.showLevelSelectModal();
        });
        document.getElementById("btn-close-level-select")?.addEventListener("click", () => {
            this.modalLevelSelect?.classList.add("hidden");
        });

        // 主菜单：记忆图鉴 · 角色专属分支入口
        this.btnMenuPersonaLog?.addEventListener("click", () => {
            this.showPersonaLogModal();
        });
        this.btnClosePersonaLog?.addEventListener("click", () => {
            this.modalPersonaLog?.classList.add("hidden");
        });

        // 小地图战术微型雷达快捷交互
        this.btnRadarExpand?.addEventListener("click", () => {
            this.showMapModal();
        });
        this.miniRadarCanvas?.addEventListener("click", () => {
            this.showMapModal();
        });
        document.getElementById("compass-center-hub")?.addEventListener("click", () => {
            this.showMapModal();
        });
        this.btnRadarToggle?.addEventListener("click", () => {
            this.toggleMiniRadar();
        });

        // 兼容原按钮直接触发 (Level 1 / Level 2)
        document.getElementById("btn-menu-new-game")?.addEventListener("click", () => {
            this.startNewGame(1);
        });

        document.getElementById("btn-menu-level2")?.addEventListener("click", () => {
            this.startNewGame(2);
        });

        document.getElementById("btn-menu-load-game")?.addEventListener("click", () => {
            this.loadGameProgress();
        });

        document.getElementById("btn-menu-exit")?.addEventListener("click", () => {
            alert("感谢体验《潜伏危机：循环伪装体》！您可以关闭此网页标签页。");
        });

        // 顶栏通用按钮
        document.getElementById("btn-view-map")?.addEventListener("click", () => {
            this.showMapModal();
        });
        document.getElementById("btn-close-map")?.addEventListener("click", () => {
            this.modalMap.classList.add("hidden");
        });

        // 地图 Tab 模式切换
        const tabLive = document.getElementById("btn-tab-live-map");
        const tabSketch = document.getElementById("btn-tab-sketch-map");
        const btnToggleFocus = document.getElementById("btn-toggle-map-focus");
        const viewLive = document.getElementById("map-live-view");
        const viewSketch = document.getElementById("map-sketch-view");

        tabLive?.addEventListener("click", () => {
            tabLive.classList.add("active");
            tabSketch?.classList.remove("active");
            viewLive?.classList.remove("hidden");
            viewSketch?.classList.add("hidden");
            this.renderLiveMap();
        });

        tabSketch?.addEventListener("click", () => {
            tabSketch.classList.add("active");
            tabLive?.classList.remove("active");
            viewSketch?.classList.remove("hidden");
            viewLive?.classList.add("hidden");
        });

        btnToggleFocus?.addEventListener("click", () => {
            if (this.mapRenderer) {
                const newMode = this.mapRenderer.toggleViewMode();
                btnToggleFocus.textContent = newMode === "full" ? "🌌 全舰全景" : "🔭 扇区聚焦";
                this.renderLiveMap();
            }
        });

        // 全屏沉浸式切换
        const btnToggleFullscreen = document.getElementById("btn-toggle-map-fullscreen");
        const mapModalBox = document.querySelector(".map-modal-box");
        btnToggleFullscreen?.addEventListener("click", () => {
            if (mapModalBox) {
                mapModalBox.classList.toggle("map-fullscreen");
                btnToggleFullscreen.textContent = mapModalBox.classList.contains("map-fullscreen") ? "🗗 窗口模式" : "⛶ 全屏模式";
                setTimeout(() => this.renderLiveMap(), 50);
            }
        });

        // 浮动缩放与居中控制条 (模态弹窗)
        document.getElementById("btn-map-zoom-in")?.addEventListener("click", () => this.mapRenderer?.zoomIn());
        document.getElementById("btn-map-zoom-out")?.addEventListener("click", () => this.mapRenderer?.zoomOut());
        document.getElementById("btn-map-center")?.addEventListener("click", () => this.mapRenderer?.resetView());

        // 主舞台大地图浮动微控工具
        document.getElementById("btn-stage-map-focus")?.addEventListener("click", () => {
            if (this.stageMapRenderer) {
                const newMode = this.stageMapRenderer.toggleViewMode();
                const btn = document.getElementById("btn-stage-map-focus");
                if (btn) btn.textContent = newMode === "full" ? "🌌 全景" : "🔭 聚焦";
                this.renderStageMap();
            }
        });
        document.getElementById("btn-stage-map-zoom-in")?.addEventListener("click", () => this.stageMapRenderer?.zoomIn());
        document.getElementById("btn-stage-map-zoom-out")?.addEventListener("click", () => this.stageMapRenderer?.zoomOut());
        document.getElementById("btn-stage-map-reset")?.addEventListener("click", () => this.stageMapRenderer?.resetView());

        // 主舞台轻量任务卡折叠切换
        document.getElementById("stage-mission-toggle-btn")?.addEventListener("click", () => {
            this.stageMissionCard?.classList.toggle("collapsed");
        });

        // 主舞台背景大地图 Canvas 点击：直接点击房间移动或快速往返！
        const stageCanvas = this.stageMapCanvas || document.getElementById("stage-map-canvas");
        stageCanvas?.addEventListener("click", (e) => {
            if (this.isMovingAnimation) return;
            if (this.stageMapRenderer && this.stageMapRenderer.isDragging) return;

            const rect = stageCanvas.getBoundingClientRect ? stageCanvas.getBoundingClientRect() : { left: 0, top: 0, width: 680, height: 460 };
            const clientX = e.clientX !== undefined ? e.clientX : ((e.x || 0) + (rect.left || 0));
            const clientY = e.clientY !== undefined ? e.clientY : ((e.y || 0) + (rect.top || 0));
            const clickX = clientX - (rect.left || 0);
            const clickY = clientY - (rect.top || 0);

            if (this.stageMapRenderer) {
                const clickedNode = this.stageMapRenderer.getNodeAtPosition(clickX, clickY, this.currentLevel?.map);
                if (clickedNode) {
                    this.handleMapNodeClick(clickedNode);
                }
            }
        });

        // 实时地图 Canvas 点击与悬浮快速往返交互 (模态弹窗)
        const liveCanvas = document.getElementById("live-map-canvas");
        liveCanvas?.addEventListener("click", (e) => {
            // 若当前正在移动动画中或拖拽地图平移后抬手，不触发快速往返
            if (this.isMovingAnimation) return;
            if (this.mapRenderer && this.mapRenderer.isDragging) return;

            const rect = liveCanvas.getBoundingClientRect ? liveCanvas.getBoundingClientRect() : { left: 0, top: 0, width: 680, height: 460 };
            const clientX = e.clientX !== undefined ? e.clientX : ((e.x || 0) + (rect.left || 0));
            const clientY = e.clientY !== undefined ? e.clientY : ((e.y || 0) + (rect.top || 0));
            const clickX = clientX - (rect.left || 0);
            const clickY = clientY - (rect.top || 0);

            if (this.mapRenderer) {
                const clickedNode = this.mapRenderer.getNodeAtPosition(clickX, clickY, this.currentLevel?.map);
                if (clickedNode) {
                    this.handleMapNodeClick(clickedNode);
                }
            }
        });

        liveCanvas?.addEventListener("mousemove", (e) => {
            if (this.isMovingAnimation || !this.mapRenderer) return;
            const rect = liveCanvas.getBoundingClientRect ? liveCanvas.getBoundingClientRect() : { left: 0, top: 0, width: 680, height: 460 };
            const scaleX = (liveCanvas.width || 680) / (rect.width || 680 || 1);
            const scaleY = (liveCanvas.height || 460) / (rect.height || 460 || 1);
            const clientX = e.clientX !== undefined ? e.clientX : ((e.x || 0) + (rect.left || 0));
            const clientY = e.clientY !== undefined ? e.clientY : ((e.y || 0) + (rect.top || 0));
            const mouseX = (clientX - (rect.left || 0)) * scaleX;
            const mouseY = (clientY - (rect.top || 0)) * scaleY;

            const node = this.mapRenderer.getNodeAtPosition(mouseX, mouseY, this.currentLevel?.map);
            const isVisited = node && this.explorationEngine.visitedNodes.has(node.id);
            const isCurrent = node && node.id === this.explorationEngine.currentNodeId;

            if (this.phase === "q3_explore" && isVisited && !isCurrent) {
                if (liveCanvas.style) liveCanvas.style.cursor = "pointer";
                if (this.hoveredMapNodeId !== node.id) {
                    this.hoveredMapNodeId = node.id;
                    this.renderLiveMap();
                }
            } else {
                if (liveCanvas.style) liveCanvas.style.cursor = "default";
                if (this.hoveredMapNodeId) {
                    this.hoveredMapNodeId = null;
                    this.renderLiveMap();
                }
            }
        });

        liveCanvas?.addEventListener("mouseleave", () => {
            if (liveCanvas.style) liveCanvas.style.cursor = "default";
            if (this.hoveredMapNodeId) {
                this.hoveredMapNodeId = null;
                this.renderLiveMap();
            }
        });

        document.getElementById("btn-save-progress")?.addEventListener("click", () => {
            this.saveGameProgress();
        });

        document.getElementById("btn-exit-to-menu")?.addEventListener("click", () => {
            if (confirm("确定要保存并返回主菜单吗？")) {
                this.saveGameProgress();
                this.showMenu();
            }
        });

        // 探索移动按钮绑定 (点击后打开地图并触发平移动画)
        Object.entries(this.directionButtons).forEach(([dir, btn]) => {
            btn?.addEventListener("click", () => {
                if (this.phase === "q3_explore") {
                    this.performMoveWithMapAnimation(dir);
                }
            });
        });

        // q1 黑屏白字点击推进
        this.screenBlack?.addEventListener("click", () => {
            this.handleQ1BlackClick();
        });

        // 傍晚来临全黑屏点击推进
        this.screenEveningBlack?.addEventListener("click", () => {
            this.handleEveningBlackClick();
        });

        // 遇害公布全黑屏死亡立绘点击推进
        this.screenDeathBlack?.addEventListener("click", () => {
            this.handleDeathBlackClick();
        });

        // 检查存档并激活“加载存档”按钮
        this.updateMenuButtons();

        // 移动端横屏自动检测与旋转控制
        this.initOrientationManager();
    }

    initOrientationManager() {
        const updateOrientationState = () => {
            if (typeof window === "undefined") return;
            const isPortrait = window.matchMedia && window.matchMedia("(orientation: portrait)").matches;
            const isNarrow = window.innerWidth <= 820 || (window.screen && window.screen.width <= 820);
            const isForceLandscape = document.body?.classList.contains("force-landscape");

            // 如果处于原生横屏状态，或者玩家已经开启了强制横屏旋转，则隐藏提示层
            if (!isPortrait || isForceLandscape) {
                this.screenOrientationHint?.classList.add("hidden");
            } else if (isPortrait && isNarrow) {
                let ignored = false;
                try {
                    ignored = sessionStorage.getItem("gnosia_ignore_orientation_hint") === "1";
                } catch (e) {}
                if (!ignored) {
                    this.screenOrientationHint?.classList.remove("hidden");
                }
            }
        };

        // 监听系统屏幕尺寸与旋转
        window.addEventListener("resize", () => {
            updateOrientationState();
            if (this.currentLevelMap && this.mapRenderer) {
                setTimeout(() => {
                    this.mapRenderer.render(this.currentLevelMap, this.explorationEngine?.visitedNodes, this.explorationEngine?.currentNodeId);
                }, 50);
            }
        });

        window.addEventListener("orientationchange", () => {
            setTimeout(updateOrientationState, 150);
        });

        // 提示层：强制横屏显示
        this.btnForceLandscape?.addEventListener("click", () => {
            document.body?.classList.add("force-landscape");
            this.screenOrientationHint?.classList.add("hidden");
            if (this.currentLevelMap && this.mapRenderer) {
                setTimeout(() => {
                    this.mapRenderer.render(this.currentLevelMap, this.explorationEngine?.visitedNodes, this.explorationEngine?.currentNodeId);
                }, 100);
            }
        });

        // 提示层：保持竖屏直接玩
        this.btnIgnoreOrientation?.addEventListener("click", () => {
            this.screenOrientationHint?.classList.add("hidden");
            try {
                sessionStorage.setItem("gnosia_ignore_orientation_hint", "1");
            } catch (e) {}
        });

        // 右上角浮动快捷旋转按钮：随时一键自由切换
        this.btnToggleLandscape?.addEventListener("click", () => {
            const nowForced = document.body?.classList.toggle("force-landscape");
            this.screenOrientationHint?.classList.add("hidden");
            if (this.currentLevelMap && this.mapRenderer) {
                setTimeout(() => {
                    this.mapRenderer.render(this.currentLevelMap, this.explorationEngine?.visitedNodes, this.explorationEngine?.currentNodeId);
                }, 100);
            }
        });

        // 首次加载检测
        setTimeout(updateOrientationState, 80);
    }

    updateMenuButtons() {
        const btnLoad = document.getElementById("btn-menu-load-game");
        if (btnLoad) {
            btnLoad.disabled = !this.saveSystem.hasSave();
        }
    }

    showMenu() {
        this.phase = "menu";
        this.screenMenu.classList.remove("hidden");
        this.screenBlack.classList.add("hidden");
        this.screenEveningBlack?.classList.add("hidden");
        this.screenDeathBlack?.classList.add("hidden");
        this.screenLevel4Cutscene?.classList.add("hidden");
        this.screenGame.classList.add("hidden");
        this.modalLevelSelect?.classList.add("hidden");
        this.modalMissions?.classList.add("hidden");
        this.modalPersonaLog?.classList.add("hidden");
        this.modalEncounter?.classList.add("hidden");
        this.modalPowerRestore?.classList.add("hidden");
        this.modalInquiry?.classList.add("hidden");
        this.modalJudgement?.classList.add("hidden");
        this.modalNight?.classList.add("hidden");
        this.modalResult?.classList.add("hidden");
        this.hudMiniRadar?.classList.add("hidden");
        this.updateMenuButtons();
    }

    /**
     * 打开当前关卡任务清单模态弹窗
     */
    showMissionsModal() {
        this.renderMissionsPanel();
        this.modalMissions?.classList.remove("hidden");
    }

    /**
     * 渲染当前关卡任务清单 (侧边栏及弹窗)
     */
    renderMissionsPanel() {
        const rules = this.currentLevel?.unlockRules || [];
        if (this.missionsSummaryTag) {
            this.missionsSummaryTag.textContent = `${rules.length}个解锁点`;
        }

        const activeNpcIds = this.teamMembers.filter(m => !m.isProtagonist && m.status === "active").map(m => m.id);
        const deadNpcIds = Array.from(this.allNpcMap.values()).filter(m => m.status === "dead").map(m => m.id);
        const allMimics = Array.from(this.allNpcMap.values()).filter(m => m.role === "wolf");
        const mimicsInTeam = allMimics.filter(m => activeNpcIds.includes(m.id));

        let sidebarHtml = "";
        let modalHtml = "";

        rules.forEach((rule, idx) => {
            const taskNumStr = ["一", "二", "三", "四", "五"][idx] || `${idx + 1}`;
            const taskName = rule.taskName || `任务${taskNumStr}：${rule.title || "特定撤离"}`;
            const taskObjective = rule.taskObjective || "达成特定撤离条件并到达终点大门";
            // 绝不预先透露解锁的是哪个具体关卡
            const taskReward = "解构未知深层扇区 🔒???";

            // 检查历史解锁状态
            const isUnlockedHistory = (rule.unlockLevelIds || []).every(id => this.saveSystem.isLevelUnlocked(id));

            // 当局实时队伍状态判定
            let realtimeStatus = "";
            let realtimeClass = "";
            const cond = rule.condition || { type: "clear_any" };

            if (cond.type === "clear_any") {
                if (this.currentLevel?.levelId === 2 && rule.id === "l2_power_restore_clear") {
                    if (this.level2PowerRestored) {
                        realtimeStatus = "🟢 主电源已合闸通电，抵达逃生舱即可撤离脱出";
                        realtimeClass = "realtime-ready";
                    } else {
                        realtimeStatus = "⚡ 逃生舱主电源切断中（需先前往停电始发地修复电源）";
                        realtimeClass = "realtime-waiting";
                    }
                } else if (this.currentLevel?.levelId === 3 && rule.id === "l3_power_restore_clear") {
                    if (this.level3PowerRestored) {
                        realtimeStatus = "🟢 主电网已合闸通电，抵达逃生舱即可撤离脱出";
                        realtimeClass = "realtime-ready";
                    } else {
                        realtimeStatus = "⚡ 逃生舱主电网切断中（需先前往停电始发地修复电源）";
                        realtimeClass = "realtime-waiting";
                    }
                } else {
                    realtimeStatus = "🏃 突破重叠回廊，开启终点折跃气闸即可达成";
                    realtimeClass = "realtime-ready";
                }
            } else if (cond.type === "require_npc_count") {
                const reqCount = cond.count || cond.minCount || 4;
                const currentCount = activeNpcIds.length;
                if (currentCount >= reqCount) {
                    realtimeStatus = `🟢 队伍已有 ${currentCount} 名同伴随行（已满足 ≥ ${reqCount} 人撤离要求）`;
                    realtimeClass = "realtime-ready";
                } else {
                    realtimeStatus = `⏳ 队伍现有 ${currentCount}/${reqCount} 名同伴随行（仍需搜寻救助更多同伴）`;
                    realtimeClass = "realtime-waiting";
                }
            } else if (cond.type === "require_npcs") {
                const reqIds = cond.npcIds || [];
                const allInTeam = reqIds.every(id => activeNpcIds.includes(id));
                const anyDead = reqIds.some(id => deadNpcIds.includes(id));
                if (allInTeam) {
                    const reqNames = reqIds.map(id => this.allNpcMap.get(id)?.name || id).join("、");
                    realtimeStatus = `🟢 [${reqNames}] 已接入队伍信标，抵达终点即可达成`;
                    realtimeClass = "realtime-ready";
                } else if (anyDead) {
                    realtimeStatus = `❌ 关键目标生命体征已湮灭（本循环无法达成）`;
                    realtimeClass = "realtime-failed";
                } else {
                    const missingNames = reqIds.filter(id => !activeNpcIds.includes(id)).map(id => this.allNpcMap.get(id)?.name || id).join("、");
                    realtimeStatus = `⏳ [${missingNames}] 尚未汇合（需在回廊中搜寻救助）`;
                    realtimeClass = "realtime-waiting";
                }
            } else if (cond.type === "require_all_mimics") {
                if (allMimics.length > 0 && mimicsInTeam.length === allMimics.length) {
                    realtimeStatus = `🟢 场上所有拟态伪装体 (${mimicsInTeam.length}/${allMimics.length}) 均在队内，抵达终点即可达成`;
                    realtimeClass = "realtime-ready";
                } else {
                    realtimeStatus = `🕵️ 拟态引渡同步率 (${mimicsInTeam.length}/${allMimics.length})`;
                    realtimeClass = "realtime-waiting";
                }
            } else if (cond.type === "solo_only") {
                if (activeNpcIds.length === 0) {
                    realtimeStatus = "🟢 当前仅孤身一人，抵达终点即可达成";
                    realtimeClass = "realtime-ready";
                } else {
                    realtimeStatus = "👥 当前有同伴随行（单人脱出要求零随行）";
                    realtimeClass = "realtime-waiting";
                }
            } else {
                realtimeStatus = "🎯 特殊条件待达成";
                realtimeClass = "realtime-waiting";
            }

            const statusBadgeText = isUnlockedHistory ? "● 已探明" : "🔒 待解锁";
            const statusBadgeClass = isUnlockedHistory ? "mission-status-unlocked" : "mission-status-locked";

            // 侧边栏精简卡片
            sidebarHtml += `
                <div class="mission-item-card ${isUnlockedHistory ? 'mission-completed' : ''}">
                    <div class="mission-card-top">
                        <span class="mission-name">${taskName}</span>
                        <span class="mission-status-tag ${statusBadgeClass}">${statusBadgeText}</span>
                    </div>
                    <div class="mission-objective">${taskObjective}</div>
                    <div class="mission-reward">🎁 奖励：${taskReward}</div>
                    <div class="mission-realtime ${realtimeClass}">${realtimeStatus}</div>
                </div>
            `;

            // 模态弹窗详细卡片
            modalHtml += `
                <div class="mission-modal-item ${isUnlockedHistory ? 'mission-completed' : ''}">
                    <div class="mission-card-top">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-size:1.1rem;">🎯</span>
                            <span class="mission-name" style="font-size:0.95rem;">${taskName}</span>
                        </div>
                        <span class="mission-status-tag ${statusBadgeClass}">${statusBadgeText}</span>
                    </div>
                    <div class="mission-objective" style="font-size:0.86rem; color:#cbd5e1;">目标描述：${taskObjective}</div>
                    <div class="mission-reward" style="font-size:0.82rem;">🎁 通关解锁报酬：${taskReward}</div>
                    <div class="mission-realtime ${realtimeClass}" style="font-size:0.82rem; padding:4px 8px; background:rgba(0,0,0,0.25); border-radius:4px;">
                        当前进展：${realtimeStatus}
                    </div>
                </div>
            `;
        });

        if (this.missionsSidebarList) {
            this.missionsSidebarList.innerHTML = sidebarHtml;
        }
        if (this.missionModalList) {
            this.missionModalList.innerHTML = modalHtml;
        }
        if (this.stageMissionContent) {
            this.stageMissionContent.innerHTML = sidebarHtml;
        }
    }

    /**
     * 打开 5×5 关卡选择弹窗
     */
    showLevelSelectModal() {
        if (!this.modalLevelSelect) return;
        this.renderLevelSelectGrid();
        this.modalLevelSelect.classList.remove("hidden");
    }

    /**
     * 渲染 5×5 关卡选择网格 (共25关，根据存储与条件动态解锁)
     */
    renderLevelSelectGrid() {
        if (!this.levelGrid) return;
        this.levelGrid.innerHTML = "";

        const unlockedLevels = this.saveSystem.getUnlockedLevels();

        const levelNames = [
            "残破遗迹", "深层重叠", "湮灭奇点", "高熵裂隙", "拟态深渊",
            "量子回声", "虚数空间", "超弦引力", "矩阵崩塌", "绝对零度",
            "暗物质界", "时间牢笼", "拟人茧房", "异构核心", "折叠维度",
            "因果律断", "空洞节点", "反转信标", "终极拟态", "意识海床",
            "镜像死局", "光锥视界", "高维裂解", "原初黑洞", "终焉回响"
        ];

        for (let i = 1; i <= 25; i++) {
            const card = document.createElement("button");
            const isUnlocked = unlockedLevels.includes(i);
            const levelNumStr = i < 10 ? `0${i}` : `${i}`;
            const levelName = levelNames[i - 1] || `扇区 ${levelNumStr}`;

            card.className = `level-card ${isUnlocked ? "level-unlocked" : "level-locked"} ${i === 2 ? "level-2" : ""} ${i === 14 ? "level-14" : ""}`;
            card.id = `btn-level-${i}`;
            if (i === 1) {
                card.setAttribute("data-legacy-id", "btn-menu-new-game");
            }
            if (i === 2) {
                card.setAttribute("data-legacy-id", "btn-menu-level2");
            }
            card.setAttribute("data-level", String(i));

            if (!isUnlocked) {
                card.disabled = true;
            }

            card.innerHTML = `
                <span class="card-num">SECTOR ${levelNumStr}</span>
                <span class="card-name">${levelName}</span>
                <span class="card-status">${isUnlocked ? "● 开放" : "🔒 待解锁"}</span>
            `;

            card.addEventListener("click", () => {
                if (isUnlocked) {
                    this.modalLevelSelect?.classList.add("hidden");
                    this.startNewGame(i);
                } else {
                    if (typeof Sound !== "undefined" && Sound.playTick) Sound.playTick();
                    alert(`【扇区 ${levelNumStr} 锁定】该关卡尚未解构，请在前面的关卡中寻找特定线索或带离关键人员脱离以解锁！`);
                }
            });

            this.levelGrid.appendChild(card);
        }
    }

    // =========================================================================
    // Q1: 黑屏中间有白字
    // =========================================================================
    startNewGame(levelId = 1) {
        const levelConfig = LevelRegistry.find(l => l.levelId === levelId) || LevelRegistry[0];
        const freshMap = (typeof buildSpaceshipLevelMap === "function" && levelConfig.levelId >= 1 && levelConfig.levelId <= 25)
            ? buildSpaceshipLevelMap(levelConfig.levelId)
            : JSON.parse(JSON.stringify(levelConfig.map));
        this.currentLevel = { ...levelConfig, map: freshMap };

        // 初始化主角
        this.protagonist = {
            ...CharacterRegistry.protagonist,
            role: levelConfig.defaultProtagonistRole || "seer",
            inquiryCount: 0,
            status: "active",
            fallbackSvg: CharacterRegistry.getAvatarSvg(CharacterRegistry.protagonist)
        };

        // 初始化候选NPC状态池与身份洗牌
        this.initCharactersForLevel(levelConfig);

        // 重置体力与天数
        this.stamina = levelConfig.initialStamina || StaminaConfig.initialStamina;
        this.dayCount = 1;
        this.actionLogs = [];
        this.stepsWithNpc = {};
        this.nightCounterDeflected = false;
        this.nightModeDefended = false;
        this.level2PowerRestored = false;
        this.level3PowerRestored = false;
        this.level4PatrolVisited = new Set();
        this.unlockedNpcRooms = new Set();
        this.modalEncounter?.classList.add("hidden");
        this.modalPowerRestore?.classList.add("hidden");
        this.modalInquiry?.classList.add("hidden");
        this.modalJudgement?.classList.add("hidden");
        this.modalNight?.classList.add("hidden");
        this.modalResult?.classList.add("hidden");
        this.screenLevel4Cutscene?.classList.add("hidden");
        this.logAction(`【开始新循环】启动关卡：${levelConfig.title}。主角 L.P.H 身份：${WorldviewConfig.roleNames[this.protagonist.role].name}`);

        // 初始化地图
        this.explorationEngine.initLevelMap(this.currentLevel.map);
        this.checkAndUnlockNpcRooms();

        // 异步预加载游戏核心音效与角色表情立绘资源，保证后续走图、触发事件与NPC交互零卡顿零延迟
        if (typeof Sound !== "undefined" && Sound.preloadDefaults) {
            Sound.preloadDefaults();
        }
        if (typeof CharacterRegistry !== "undefined" && CharacterRegistry.preloadForLevel) {
            CharacterRegistry.preloadForLevel(levelConfig);
        }

        // 进入 q1: 黑屏白字
        this.enterQ1BlackScreen();
    }

    initCharactersForLevel(levelConfig) {
        this.allNpcMap.clear();
        this.teamMembers = [this.protagonist];

        // 准备候选NPC：深拷贝候选对象，防止状态污染
        const rawCandidates = levelConfig.candidateNPCs || [];
        const pool = rawCandidates.map(c => ({
            id: c.id,
            assignedRole: c.assignedRole !== undefined ? c.assignedRole : null
        }));

        // 计算本局潜伏伪人的实际数量 (支持随机范围 [min, max] 或固定数值)
        let actualWolfCount = 1;
        let min = 1, max = 1;
        if (Array.isArray(levelConfig.wolfCountRange) && levelConfig.wolfCountRange.length >= 2) {
            min = Math.max(0, parseInt(levelConfig.wolfCountRange[0], 10) || 0);
            max = Math.max(min, parseInt(levelConfig.wolfCountRange[1], 10) || min);
            actualWolfCount = Math.floor(Math.random() * (max - min + 1)) + min;
        } else if (Array.isArray(levelConfig.wolfCount) && levelConfig.wolfCount.length >= 2) {
            min = Math.max(0, parseInt(levelConfig.wolfCount[0], 10) || 0);
            max = Math.max(min, parseInt(levelConfig.wolfCount[1], 10) || min);
            actualWolfCount = Math.floor(Math.random() * (max - min + 1)) + min;
        } else if (typeof levelConfig.wolfCount === 'number') {
            min = max = Math.max(0, parseInt(levelConfig.wolfCount, 10));
            actualWolfCount = min;
        } else if (typeof levelConfig.wolfCountRange === 'number') {
            min = max = Math.max(0, parseInt(levelConfig.wolfCountRange, 10));
            actualWolfCount = min;
        }

        // 边界保护：伪人数量不能超过候选NPC池总人数
        actualWolfCount = Math.max(min, Math.min(max, actualWolfCount));
        actualWolfCount = Math.min(pool.length, actualWolfCount);
        console.log(`[关卡生成] 候选总数: ${pool.length}, 伪人范围: [${min}, ${max}], 本局暗中生成的伪人数量: ${actualWolfCount}`);

        // 随机挑选指定数量作为伪人 (采用经典 Fisher-Yates 洗牌算法，杜绝非均匀偏差)
        const shuffled = [...pool];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        shuffled.forEach((cand, idx) => {
            const rawChar = CharacterRegistry.npcs[cand.id];
            if (!rawChar) return;

            // 分配身份：优先看是否显式指定了 assignedRole，否则按随机抽出的 actualWolfCount 分配
            let role = cand.assignedRole;
            if (!role) {
                role = idx < actualWolfCount ? "wolf" : "villager";
            }

            const npcObj = {
                ...rawChar,
                role: role,
                inquiryCount: 0, // 被玩家选择询问的累计次数
                status: "unmet", // unmet(未遇), active(队内活人), confined(被禁锢), exiled(被放逐), dead(遇害)
                svgAvatar: CharacterRegistry.getAvatarSvg(rawChar),
                fallbackSvg: CharacterRegistry.getAvatarSvg(rawChar)
            };

            this.allNpcMap.set(npcObj.id, npcObj);
        });

        // 处理初始自带同伴
        if (levelConfig.initialTeam && levelConfig.initialTeam.length > 0) {
            levelConfig.initialTeam.forEach(npcId => {
                const npc = this.allNpcMap.get(npcId);
                if (npc) {
                    npc.status = "active";
                    this.teamMembers.push(npc);
                }
            });
        }
    }

    enterQ1BlackScreen() {
        this.phase = "q1_black";
        this.screenMenu.classList.add("hidden");
        this.screenGame.classList.add("hidden");
        this.screenBlack.classList.remove("hidden");

        this.q1Texts = this.currentLevel.blackScreenText || [
            "冷冻休眠仓的气压泄放声在空旷的回廊中回荡...",
            "警告：队伍中可能潜伏着未知的伪人拟态感染体。",
            "抵达终点脱离大门是唯一的逃生通路。",
            "——点击屏幕进入游戏。"
        ];
        this.q1Index = 0;
        this.renderQ1Text();
    }

    renderQ1Text() {
        if (this.q1Index < this.q1Texts.length) {
            this.blackTextContent.style.opacity = "0";
            setTimeout(() => {
                this.blackTextContent.textContent = this.q1Texts[this.q1Index];
                this.blackTextContent.style.opacity = "1";
            }, 150);
        } else {
            // 所有文字播放完毕，进入 q2 正式游戏页面
            this.enterQ2GameInit();
        }
    }

    handleQ1BlackClick() {
        if (this.phase !== "q1_black") return;
        this.q1Index++;
        this.renderQ1Text();
    }

    // =========================================================================
    // Q2: 点击后进入正式游戏页面
    // =========================================================================
    enterQ2GameInit() {
        this.phase = "q2_intro";
        this.screenBlack.classList.add("hidden");
        this.screenGame.classList.remove("hidden");

        this.updateHeaderUI();
        this.renderActionLogs();

        // 播放开局第一段视觉小说对话
        const startNode = this.explorationEngine.getCurrentNode();
        this.dialogueUI.playSequence([
            {
                speaker: { name: "环境广播", themeColor: "#38bdf8" },
                text: `系统自检完毕。当前定位坐标：${startNode ? startNode.name : "正门"}。`
            },
            {
                speaker: this.protagonist,
                text: `我已经苏醒。作为队伍的指挥者，我必须谨慎探索前进，并警惕潜伏在同伴之中的伪人。`
            }
        ], () => {
            // 对话完毕，进入 q3 肉鸽探索循环
            this.enterQ3Exploration();
        });
    }

    // =========================================================================
    // Q3: 探索走图、消耗体力与事件交互
    // =========================================================================
    enterQ3Exploration() {
        this.phase = "q3_explore";
        this.checkAndUnlockNpcRooms();
        this.updateHeaderUI();
        this.renderExplorationControls();

        const currentNode = this.explorationEngine.getCurrentNode();
        if (currentNode) {
            this.dialogueUI.say(
                { name: "区域指引", themeColor: "#94a3b8" },
                `当前位于 [${currentNode.name}]。${currentNode.desc} 请选择行动方向。`
            );
        }
    }

    renderExplorationControls() {
        const available = this.explorationEngine.getAvailableDirections();
        const dirMap = {
            forward: "前 ⬆",
            backward: "后 ⬇",
            left: "左 ⬅",
            right: "右 ➡"
        };

        Object.entries(this.directionButtons).forEach(([dir, btn]) => {
            if (!btn) return;
            const targetId = available[dir];
            if (targetId) {
                const targetNode = this.currentLevel.map.nodes[targetId];
                btn.disabled = false;
                btn.classList.add("active-dir");
                btn.innerHTML = `${dirMap[dir]} <span class="dest-preview">(${targetNode ? targetNode.name : targetId})</span>`;
            } else {
                btn.disabled = true;
                btn.classList.remove("active-dir");
                btn.innerHTML = `${dirMap[dir]} <span class="dest-preview">(不可通行)</span>`;
            }
        });
    }

    // 遇到昏迷NPC交互弹窗
    showNpcEncounterModal(npc, node, onHandled) {
        if (!this.modalEncounter) return;

        // 特殊链式处理：柯尔特与巴恩斯双人站位
        // 核心要求：柯尔特与巴恩斯的收纳必须先后弹窗出现，收纳对话也是依次出现，不要只有柯尔特
        if (npc && npc.id === "colt_barnes") {
            const colt = this.allNpcMap.get("colt");
            const barnes = this.allNpcMap.get("barnes");
            if (colt && colt.status === "unmet") {
                return this.showNpcEncounterModal(colt, node, (coltJoined) => {
                    if (coltJoined && barnes && barnes.status === "unmet") {
                        return this.showNpcEncounterModal(barnes, node, (barnesJoined) => {
                            if (onHandled) onHandled(barnesJoined);
                        });
                    }
                    if (onHandled) onHandled(coltJoined);
                });
            } else if (barnes && barnes.status === "unmet") {
                return this.showNpcEncounterModal(barnes, node, onHandled);
            }
        }

        const titleElem = document.getElementById("encounter-npc-name");
        const avatarElem = document.getElementById("encounter-npc-avatar");
        const descElem = document.getElementById("encounter-npc-dialogue");
        const btnJoin = document.getElementById("btn-encounter-accept");
        const btnIgnore = document.getElementById("btn-encounter-reject");

        const firstLineParsed = CharacterRegistry.parseDialogueLine(npc.introDialogue && npc.introDialogue[0]);
        titleElem.textContent = `发现昏迷人员：${npc.name}`;
        titleElem.style.color = npc.themeColor;

        const exp = firstLineParsed.expression || "clam";
        const candidates = CharacterRegistry.getCharacterImageCandidates(npc, exp);
        const fallbackSvg = CharacterRegistry.getAvatarSvg(npc, exp);
        const candidatesAttr = JSON.stringify(candidates).replace(/"/g, '&quot;');
        avatarElem.innerHTML = `<img src="${candidates[0] || fallbackSvg}" data-candidates="${candidatesAttr}" data-index="0" data-fallback="${fallbackSvg}" alt="${npc.name}" onerror="window.handlePortraitError && window.handlePortraitError(this)">`;
        avatarElem.style.filter = `drop-shadow(0 0 12px ${npc.themeColor}80)`;

        descElem.textContent = firstLineParsed.text || "发现一名失去知觉的乘员倒在此处。";

        this.modalEncounter.classList.remove("hidden");

        const cleanup = () => {
            this.modalEncounter.classList.add("hidden");
            btnJoin.onclick = null;
            btnIgnore.onclick = null;
        };

        btnJoin.onclick = () => {
            cleanup();
            if (npc.id === "colt_barnes") {
                const colt = this.allNpcMap.get("colt");
                const barnes = this.allNpcMap.get("barnes");
                if (colt) {
                    colt.status = "active";
                    if (!this.teamMembers.some(m => m.id === "colt")) {
                        this.teamMembers.push(colt);
                    }
                }
                if (barnes) {
                    barnes.status = "active";
                    if (!this.teamMembers.some(m => m.id === "barnes")) {
                        this.teamMembers.push(barnes);
                    }
                }
                this.logAction(`【营救同伴】救醒了 [柯尔特 & 巴恩斯]，两人同时加入队伍！当前队伍人数: ${this.getAliveTeamMembers().length} 人`);
            } else {
                // 让其加入队伍
                npc.status = "active";
                this.teamMembers.push(npc);
                this.logAction(`【营救同伴】救醒了 [${npc.name}]，加入队伍！当前队伍人数: ${this.getAliveTeamMembers().length} 人`);
            }
            this.updateHeaderUI();
            this.checkAndUnlockNpcRooms();

            // 触发人物图鉴历练检定 (如邵可欣救援入队)
            this.checkPersonaSecretUnlocks("suffer_fate", { charId: npc.id, type: "rescued" });

            // 【特殊特质：Dr. Elsa / 艾尔莎 战地创伤急救】
            // 当将其收纳为队友时固定回复 30 体力值，并基于体力增加提示与多重视觉/对白反馈
            let elsaHealRecovered = 0;
            if (npc.id === "elsa" || npc.id === "dr_elsa") {
                const oldStamina = this.stamina;
                this.stamina = Math.min(StaminaConfig.maxStamina, this.stamina + 30);
                elsaHealRecovered = this.stamina - oldStamina;
                this.updateHeaderUI();
                if (this.headerStaminaFill) {
                    this.headerStaminaFill.classList.remove("stamina-boost-pulse");
                    if (this.headerStaminaFill.offsetWidth !== undefined) {
                        void this.headerStaminaFill.offsetWidth;
                    }
                    this.headerStaminaFill.classList.add("stamina-boost-pulse");
                }
                if (typeof Sound !== "undefined" && Sound.playFoodSound) {
                    Sound.playFoodSound();
                }
                if (this.showStageToast) {
                    this.showStageToast(`💉 [战地急救] 主治军医 艾尔莎 为队伍注射高能活性剂，体力恢复 +${elsaHealRecovered}！`);
                }
                this.logAction(`【战地急救】主治军医 [${npc.name}] 进行了紧急创伤救治，队伍体力值固定恢复 +${elsaHealRecovered} 点（当前: ${this.stamina}/${StaminaConfig.maxStamina}）！`);
            }

            // 播放入队对话
            const lines = (npc.introDialogue || []).slice(1).map(raw => {
                const parsed = CharacterRegistry.parseDialogueLine(raw);
                return {
                    speaker: npc,
                    text: parsed.text,
                    expression: parsed.expression
                };
            });
            if (lines.length === 0) {
                lines.push({ speaker: npc, text: `谢谢你救了我，L.P.H！我愿意跟随你一起撤离！`, expression: "happy" });
            }

            if (npc.id === "elsa" || npc.id === "dr_elsa") {
                lines.push({
                    speaker: { name: "战地医疗支援", themeColor: "#06b6d4" },
                    text: `💉 [战地急救] 艾尔莎为你注入了高能活性复合针剂，全队体力恢复了 +${elsaHealRecovered} 点！（当前体力: ${this.stamina}/${StaminaConfig.maxStamina}）`
                });
            }

            this.dialogueUI.playSequence(lines, () => {
                if (onHandled) onHandled(true);
            });
        };

        btnIgnore.onclick = () => {
            cleanup();
            this.logAction(`【暂不救助】你决定暂不唤醒昏迷的 [${npc.name}]，队伍继续前进。`);
            this.dialogueUI.say(
                this.protagonist,
                `情况不明，我们现在还没有多余的精力照顾他。稍后需要时可以再回来救助。`,
                () => {
                    if (onHandled) onHandled(false);
                }
            );
        };
    }

    /**
     * 第二关全舰停电始发地：特殊高压合闸确认弹窗
     * 满足要求：先弹出修电弹窗提示确认，合闸后再触发该房间内的NPC选择
     */
    showPowerRestoreModal(node, onConfirmed) {
        if (!this.modalPowerRestore) {
            this.modalPowerRestore = document.getElementById("modal-power-restore");
        }
        if (!this.btnPowerRestoreConfirm) {
            this.btnPowerRestoreConfirm = document.getElementById("btn-power-restore-confirm");
        }

        if (!this.modalPowerRestore || !this.btnPowerRestoreConfirm) {
            if (onConfirmed) onConfirmed();
            return;
        }

        this.modalPowerRestore.classList.remove("hidden");

        const handleConfirm = () => {
            if (this.modalPowerRestore) {
                this.modalPowerRestore.classList.add("hidden");
            }
            if (this.btnPowerRestoreConfirm) {
                this.btnPowerRestoreConfirm.onclick = null;
            }
            if (onConfirmed) onConfirmed();
        };

        this.btnPowerRestoreConfirm.onclick = handleConfirm;
    }

    // =========================================================================
    // Q4: 傍晚询问环节 (先黑屏白字，点击后再进入)
    // =========================================================================
    enterEveningPhase() {
        // 第四关专属优化：本关卡没有死寂降临，没有黑天时刻，保持探索
        if (this.currentLevel?.levelId === 4) {
            this.enterQ3Exploration();
            return;
        }

        this.eveningInquiryCount = 0;
        this.updateHeaderUI();

        // 核心优化：当队伍里没有NPC时，直接跳过到夜晚时刻，再直接进入死寂降临动画界面
        if (this.getAliveNpcTeamMembers().length === 0) {
            this.logAction(`【孤身前行】当前队伍中只有你一人，直接度过傍晚与黑夜……`);
            this.confinedNpcId = null;
            this.nightProtectedNpcId = null;
            this.witchSaved = false;
            this.nightTargetVictimId = null;
            this.enterQ7Day();
            return;
        }

        this.phase = "evening_black";
        // 切换至全黑屏转场视口 (浮层全屏覆盖，保留底层主舞台DOM杜绝地图缩放形变)
        this.screenEveningBlack?.classList.remove("hidden");
    }

    handleEveningBlackClick() {
        if (this.phase !== "evening_black") return;
        this.phase = "q4_inquiry";
        this.screenEveningBlack?.classList.add("hidden");
        this.renderStageMap();

        this.dialogueUI.say(
            { id: "broadcast", isBroadcast: true, name: "全员集结", themeColor: "#f59e0b" },
            `傍晚时分，幸存者们聚集在暂歇区。你可以选择与 1~2 名同伴单独交谈打探线索，或者直接跳过进入裁决。`,
            () => {
                this.showInquiryModal();
            }
        );
    }

    showInquiryModal() {
        const aliveNpcs = this.getAliveNpcTeamMembers();
        const listContainer = document.getElementById("inquiry-target-list");
        const btnSkip = document.getElementById("btn-inquiry-skip");
        const statusHint = document.getElementById("inquiry-status-hint");

        statusHint.textContent = `当前已询问：${this.eveningInquiryCount} / 2 名同伴`;

        listContainer.innerHTML = "";

        if (aliveNpcs.length === 0) {
            listContainer.innerHTML = `<div style="color:#94a3b8; padding:15px; text-align:center;">当前队伍中没有其他存活同伴可供询问。</div>`;
        } else {
            aliveNpcs.forEach(npc => {
                const card = document.createElement("div");
                card.className = "inquiry-card";
                card.style.borderColor = npc.themeColor;
                card.innerHTML = `
                    <div class="inquiry-card-avatar" style="border-color:${npc.themeColor}">
                        <img src="${npc.svgAvatar}" alt="${npc.name}">
                    </div>
                    <div class="inquiry-card-info">
                        <div class="inquiry-card-name" style="color:${npc.themeColor}">${npc.name}</div>
                        <div class="inquiry-card-times">已交谈次数: ${npc.inquiryCount} 次</div>
                    </div>
                    <button class="inquiry-card-btn" style="background:${npc.themeColor}33; border-color:${npc.themeColor}; color:${npc.themeColor}">交谈 ➔</button>
                `;

                card.querySelector("button").onclick = () => {
                    this.executeInquiryDialogue(npc);
                };
                listContainer.appendChild(card);
            });
        }

        btnSkip.onclick = () => {
            this.modalInquiry.classList.add("hidden");
            this.logAction(`【傍晚时刻】决定结束询问交谈，直接进入裁决阶段。`);
            this.enterQ5Judgement();
        };

        this.modalInquiry.classList.remove("hidden");
    }

    executeInquiryDialogue(npc) {
        this.modalInquiry.classList.add("hidden");
        this.eveningInquiryCount++;

        // 获取该 NPC 对应的第 N 次询问台词
        const count = npc.inquiryCount;
        let dialogueArray = [];
        if (npc.inquiryDialogues && npc.inquiryDialogues.length > 0) {
            // 如果超出设定次数，取最后一条
            const idx = Math.min(count, npc.inquiryDialogues.length - 1);
            dialogueArray = npc.inquiryDialogues[idx];
        } else {
            dialogueArray = [`（${npc.name} 保持着沉默，注视着你的眼睛）`];
        }

        // 被询问次数累加
        npc.inquiryCount++;

        this.logAction(`【深入交谈】与同伴 [${npc.name}] 进行了第 ${npc.inquiryCount} 次交谈。`);

        // 检定交谈特征解构
        this.checkPersonaSecretUnlocks("inquiry_count", { charId: npc.id, count: npc.inquiryCount });

        // 构建对白队列
        const seq = dialogueArray.map(item => {
            const parsed = CharacterRegistry.parseDialogueLine(item);
            return {
                speaker: npc,
                text: parsed.text,
                expression: parsed.expression
            };
        });

        this.dialogueUI.playSequence(seq, () => {
            // 判断是否还可以继续询问第2位
            if (this.eveningInquiryCount < 2 && this.getAliveNpcTeamMembers().length > 1) {
                // 提示是否继续
                this.showInquiryModal();
            } else {
                // 已经询问满2人，进入裁决
                this.enterQ5Judgement();
            }
        });
    }

    // =========================================================================
    // Q5: 裁决阶段 (禁锢 / 放逐 / 放弃裁决)
    // =========================================================================
    enterQ5Judgement() {
        this.phase = "q5_judgement";
        this.modalInquiry.classList.add("hidden");
        this.renderStageMap();

        this.dialogueUI.say(
            { name: "全员审决", themeColor: "#ef4444" },
            `进入裁决阶段。作为队长，你可以选择【禁锢一人】限制其夜间行动、或【放逐一人】永久除名，亦可【放弃裁决】。`,
            () => {
                this.showJudgementModal();
            }
        );
    }

    showJudgementModal() {
        const aliveNpcs = this.getAliveNpcTeamMembers();
        const container = document.getElementById("judgement-target-list");
        const btnPass = document.getElementById("btn-judgement-pass");

        container.innerHTML = "";

        if (aliveNpcs.length === 0) {
            container.innerHTML = `<div style="color:#94a3b8; text-align:center; padding:15px;">暂无其他同伴可裁决。</div>`;
        } else {
            aliveNpcs.forEach(npc => {
                const item = document.createElement("div");
                item.className = "judgement-item";
                item.style.borderColor = npc.themeColor;
                item.innerHTML = `
                    <div class="judgement-info">
                        <span class="judgement-name" style="color:${npc.themeColor}">${npc.name}</span>
                        <span class="judgement-role-hint">嫌疑观测中</span>
                    </div>
                    <div class="judgement-actions">
                        <button class="judge-btn btn-confine" title="限制其夜间活动，若其为伪人则今晚无法袭击">🔒 禁锢今夜</button>
                        <button class="judge-btn btn-exile" title="将其永久驱逐出队伍">🚪 永久放逐</button>
                    </div>
                `;

                // 禁锢按钮
                item.querySelector(".btn-confine").onclick = () => {
                    this.executeConfine(npc);
                };

                // 放逐按钮
                item.querySelector(".btn-exile").onclick = () => {
                    this.executeExile(npc);
                };

                container.appendChild(item);
            });
        }

        // 放弃裁决
        btnPass.onclick = () => {
            this.modalJudgement.classList.add("hidden");
            this.confinedNpcId = null;
            this.logAction(`【放弃裁决】出于信任与谨慎，你决定今晚不处分任何同伴。`);
            this.dialogueUI.say(
                this.protagonist,
                `没有确凿证据前不能盲目自相残杀，今夜全员各自回舱待命！`,
                () => {
                    this.enterQ6Night();
                }
            );
        };

        this.modalJudgement.classList.remove("hidden");
    }

    executeConfine(npc) {
        this.modalJudgement.classList.add("hidden");
        this.confinedNpcId = npc.id;

        const isWolf = (npc.role === "wolf");
        this.logAction(`【执行禁锢】将同伴 [${npc.name}] 锁入隔离舱禁闭，限制其夜间行动。`);

        // 触发受难历练检定 (如卡罗/莫德被禁锢)
        this.checkPersonaSecretUnlocks("suffer_fate", { charId: npc.id, type: "confined" });

        this.dialogueUI.playSequence([
            {
                speaker: this.protagonist,
                text: `[${npc.name}]，为了大家的安全，今夜请在封锁舱中度过。`
            },
            {
                speaker: npc,
                text: isWolf ? `……（眼神中闪过一丝阴鸷的冷光，顺从地走进了禁闭室）` : `既然是队长的决定，我遵守安排……但请一定要小心！`,
                expression: isWolf ? "happy" : "sad"
            }
        ], () => {
            this.enterQ6Night();
        });
    }

    executeExile(npc) {
        this.modalJudgement.classList.add("hidden");
        this.exiledNpcId = npc.id;
        npc.status = "exiled"; // 永久除名

        this.logAction(`【执行放逐】将同伴 [${npc.name}] 驱逐出队伍！队伍存活人数变更: ${this.getAliveTeamMembers().length} 人`);

        // 触发放逐伪人历练检定 (卡罗在队且放逐伪人)
        this.checkPersonaSecretUnlocks("exile_wolf_with", { isExiledWolf: npc.role === "wolf", charId: npc.id });

        this.dialogueUI.playSequence([
            {
                speaker: this.protagonist,
                text: `你的疑点太大，队伍不能承担被全灭的风险。请交出给养，独自离开这支队伍。`
            },
            {
                speaker: npc,
                text: `你会为今天的决定后悔的……祝你们好运。`,
                expression: "angry"
            }
        ], () => {
            this.updateHeaderUI();
            this.enterQ6Night();
        });
    }

    // =========================================================================
    // Q6: 黑夜阶段 (根据玩家身份发动夜间技能)
    // =========================================================================
    enterQ6Night() {
        // 第四关专属优化：本关卡没有死寂降临，没有黑天时刻，保持探索
        if (this.currentLevel?.levelId === 4) {
            this.enterQ3Exploration();
            return;
        }

        this.phase = "q6_night";
        this.nightProtectedNpcId = null;
        this.witchSaved = false;
        this.renderStageMap();

        // 先预计算伪人的拟袭击目标 (用于歌咏者女巫感知)
        this.calculateNightWolfPlan();

        this.dialogueUI.say(
            { name: "夜深人静", themeColor: "#818cf8" },
            `夜幕降临，舱内灯光切换为暗红色睡眠模式。作为【${WorldviewConfig.roleNames[this.protagonist.role].name}】，开始执行夜间行动。`,
            () => {
                this.showNightActionModal();
            }
        );
    }

    calculateNightWolfPlan() {
        this.nightTargetVictimId = null;

        // 核心规则：队伍里有伪人才能刀人！
        // 1. 检查队伍中存活的伪人
        const wolvesInTeam = this.getAliveTeamMembers().filter(m => m.role === "wolf");
        if (wolvesInTeam.length === 0) {
            console.log("[夜间伪人行动] 当前队伍中没有伪人，平安无事，绝不刀人。");
            return;
        }

        // 2. 检查队伍中的伪人是否全部被禁锢
        const activeWolvesInTeam = wolvesInTeam.filter(w => w.id !== this.confinedNpcId);
        if (activeWolvesInTeam.length === 0) {
            console.log("[夜间伪人行动] 队伍中的伪人今晚已被禁锢，无法行动。");
            return;
        }

        // 3. 队伍中有具备行动能力的伪人：必定自主猎杀队伍内的同伴（100% 刀人，绝不漏刀）
        // 目标优先级：
        // 优先 1：队伍中存活的普通人类同伴（非伪人、非主角）
        const teamHumanCandidates = this.getAliveNpcTeamMembers().filter(m => m.role !== "wolf");
        
        let target = null;
        if (teamHumanCandidates.length > 0) {
            target = teamHumanCandidates[Math.floor(Math.random() * teamHumanCandidates.length)];
        } else {
            // 优先 2：若当前队伍除伪人外已无其他同伴，伪人直接猎杀主角！
            target = this.protagonist;
        }

        if (target) {
            this.nightTargetVictimId = target.id;
            console.log(`[伪人队内猎杀] 队伍中的伪人已锁定刀人目标: ${target.name} (ID: ${target.id})`);
        }
    }

    showNightActionModal() {
        const role = this.protagonist.role;
        const titleElem = document.getElementById("night-modal-title");
        const descElem = document.getElementById("night-modal-desc");
        const listElem = document.getElementById("night-target-list");
        const btnPass = document.getElementById("btn-night-skip");

        const aliveNpcs = this.getAliveNpcTeamMembers();

        listElem.innerHTML = "";

        if (role === "seer") {
            // 魔镜 (预言家)
            titleElem.textContent = "🔮 魔镜真理检视";
            descElem.textContent = "选择一名存活同伴查验其真实身份，探明其是否已被伪人替换：";
            
            aliveNpcs.forEach(npc => {
                const btn = document.createElement("button");
                btn.className = "night-choice-btn";
                btn.style.borderColor = npc.themeColor;
                btn.innerHTML = `<span style="color:${npc.themeColor}">${npc.name}</span> <span>查验真身 ➔</span>`;
                btn.onclick = () => {
                    this.executeSeerInspect(npc);
                };
                listElem.appendChild(btn);
            });
        } else if (role === "guard") {
            // 护卫 (守卫)
            titleElem.textContent = "🛡️ 护卫守备防御";
            descElem.textContent = "选择一名存活同伴（或守护自己）通宵设防，今夜若其遭到伪人袭击将毫发无伤：";

            const guardCandidates = [...aliveNpcs, this.protagonist];
            guardCandidates.forEach(member => {
                const btn = document.createElement("button");
                btn.className = "night-choice-btn";
                btn.style.borderColor = member.themeColor || "#38bdf8";
                btn.innerHTML = `<span style="color:${member.themeColor || "#38bdf8"}">${member.name}${member.isProtagonist ? " (你自己)" : ""}</span> <span>设立护盾 ➔</span>`;
                btn.onclick = () => {
                    this.executeGuardProtect(member);
                };
                listElem.appendChild(btn);
            });
        } else if (role === "witch") {
            // 歌咏者 (女巫)
            titleElem.textContent = "✨ 歌咏者生命感知";
            if (this.nightTargetVictimId) {
                const victim = (this.nightTargetVictimId === this.protagonist.id)
                    ? this.protagonist
                    : this.getNpcById(this.nightTargetVictimId);
                descElem.innerHTML = `感知到微弱的呼救脑波！今晚同伴 <strong style="color:#ef4444">[${victim ? victim.name : "某人"}]</strong> 遭遇了致命袭击！是否施展歌咏之力挽救生命？`;

                const btnSave = document.createElement("button");
                btnSave.className = "night-choice-btn btn-save-action";
                btnSave.innerHTML = `<span>✨ 施加生命救助 (救赎 ${victim ? victim.name : ""})</span>`;
                btnSave.onclick = () => {
                    this.executeWitchSave(victim);
                };
                listElem.appendChild(btnSave);
            } else {
                descElem.textContent = "今夜舱内静谧，未感知到濒死危机。没有同伴受到致命威胁。";
            }
        } else {
            // 普通人
            titleElem.textContent = "🌙 闭目待晓";
            descElem.textContent = "你保持着警惕，静静等待黎明到来。";
        }

        btnPass.textContent = role === "witch" && this.nightTargetVictimId ? "保留神力 (不施救)" : "跳过行动";
        btnPass.onclick = () => {
            this.modalNight.classList.add("hidden");
            this.logAction(`【黑夜度过】你选择在舱室内闭目养神，静待黎明到来。`);
            this.enterQ7Day();
        };

        this.modalNight.classList.remove("hidden");
    }

    executeSeerInspect(npc) {
        this.modalNight.classList.add("hidden");
        const isWolf = (npc.role === "wolf");
        const roleInfo = WorldviewConfig.roleNames[npc.role] || { name: "普通同伴" };

        this.logAction(`【魔镜查验】查验了同伴 [${npc.name}] 的真身：${isWolf ? "【伪人！！】" : "【正常人类】"}`);

        this.dialogueUI.playSequence([
            {
                speaker: this.protagonist,
                text: `启动魔镜扫描仪，锁定 [${npc.name}] 的细胞反射波长……`
            },
            {
                speaker: { id: "broadcast", isBroadcast: true, name: "魔镜终端", themeColor: isWolf ? "#ff3366" : "#4ade80" },
                text: isWolf
                    ? `⚠️ 警报！检测到高熵拟态神经束！[${npc.name}] 确定为【${WorldviewConfig.roleNames.wolf.name}】！`
                    : `✅ 扫描结果：生体特征完全正常，[${npc.name}] 是【人类同伴】。`
            }
        ], () => {
            this.enterQ7Day();
        });
    }

    executeGuardProtect(npc) {
        this.modalNight.classList.add("hidden");
        this.nightProtectedNpcId = npc.id;

        this.logAction(`【护卫守备】通宵设防，重点守护了同伴 [${npc.name}]。`);

        this.dialogueUI.say(
            this.protagonist,
            `我在 [${npc.name}] 的门前布设了高频防御力场，今晚他不会有生命危险。`,
            () => {
                this.enterQ7Day();
            }
        );
    }

    executeWitchSave(victim) {
        this.modalNight.classList.add("hidden");
        this.witchSaved = true;

        this.logAction(`【歌咏救赎】消耗生命灵药，成功挽救了险遭抹杀的 [${victim ? victim.name : "同伴"}]！`);

        this.dialogueUI.say(
            this.protagonist,
            `咏唱生命回路，生体血清注入……成功将 [${victim ? victim.name : "同伴"}] 从死亡边缘拉了回来！`,
            () => {
                this.enterQ7Day();
            }
        );
    }

    // =========================================================================
    // Q7: 白天阶段 (公布夜晚结果，伤亡结算，全屏黑屏死亡特写，重置计数回到Q3)
    // =========================================================================
    enterDeathBlackPhase(victim, onProceed, survivedReason = null) {
        // 第四关专属优化：本关卡没有死寂降临动画
        if (this.currentLevel?.levelId === 4) {
            if (onProceed) onProceed();
            return;
        }

        this.phase = "death_black";
        this.deathBlackCallback = onProceed;
        this.deathRevealed = false;
        this.currentDeathVictim = victim;
        this.currentSurvivedReason = survivedReason;
        if (this.deathRevealTimer) {
            clearTimeout(this.deathRevealTimer);
            this.deathRevealTimer = null;
        }

        const img = document.getElementById("death-portrait-img");
        const titleElem = document.getElementById("death-victim-name");
        const textElem = document.getElementById("death-black-text");
        const badgeElem = document.getElementById("death-phase-badge") || document.querySelector(".death-phase-badge");
        const portraitFrame = document.getElementById("death-portrait-frame");
        const suspenseLayer = document.getElementById("death-suspense-layer");
        const contentContainer = document.getElementById("death-content-container");

        if (victim) {
            if (badgeElem) {
                badgeElem.textContent = "⚠️ 乘员遇害确认 (CASUALTY CONFIRMED)";
                badgeElem.classList.remove("peaceful-badge");
            }
            if (portraitFrame) {
                portraitFrame.classList.remove("peaceful-frame");
            }
            if (titleElem) {
                titleElem.textContent = `【同伴遇害：${victim.name}】`;
                titleElem.classList.remove("peaceful-title");
            }
            if (textElem) {
                textElem.innerHTML = `生活舱深处传来刺耳的蜂鸣警报，晨曦中发现了一具冰冷的遗体……<br>同伴 [${victim.name}] 昨夜遭遇潜伏伪人残酷袭击，生命体征已完全终止。`;
            }

            const exp = "dead";
            const candidates = (typeof CharacterRegistry !== "undefined" && CharacterRegistry.getCharacterImageCandidates)
                ? CharacterRegistry.getCharacterImageCandidates(victim, exp)
                : [];
            const fallbackSvg = (typeof CharacterRegistry !== "undefined" && CharacterRegistry.getAvatarSvg)
                ? CharacterRegistry.getAvatarSvg(victim, exp)
                : "";
            if (img) {
                img.onerror = () => {
                    if (window.handlePortraitError) {
                        window.handlePortraitError(img);
                    }
                };
                img.setAttribute("data-candidates", JSON.stringify(candidates));
                img.setAttribute("data-index", "0");
                img.setAttribute("data-fallback", fallbackSvg);
                img.src = candidates[0] || fallbackSvg;
            }
        } else {
            // 平安夜无人员遇害模式
            if (badgeElem) {
                badgeElem.textContent = "🕊️ 平安无事 (NO CASUALTIES)";
                badgeElem.classList.add("peaceful-badge");
            }
            if (portraitFrame) {
                portraitFrame.classList.add("peaceful-frame");
            }

            let title = "【全员生还 · 平安夜】";
            let desc = "晨曦第一道阳光穿透隔离窗，生活区生命体征读数平稳正常。<br>昨夜没有任何同伴遇害，全员安然迎来晨曦。";

            if (survivedReason === "kaze_counter") {
                title = "【战术反制 · 全员平安】";
                desc = "生活区警报静默。卡罗凭借特战直觉破门格挡，成功化解了暗影突袭！<br>昨夜没有任何同伴遇害，全员安然迎来晨曦。";
            } else if (survivedReason === "mode_shield") {
                title = "【防爆坚守 · 全员平安】";
                desc = "重装防爆力场彻底拦截了暗夜突袭！莫德死死扼守住舱门击退潜伏者！<br>昨夜没有任何同伴遇害，全员安然迎来晨曦。";
            } else if (survivedReason === "guarded") {
                title = "【护卫守备 · 全员平安】";
                desc = "护卫防御力场整夜坚固运行，成功化解了潜在抹杀危机！<br>昨夜没有任何同伴遇害，全员安然迎来晨曦。";
            } else if (survivedReason === "witch_saved") {
                title = "【歌咏救赎 · 全员平安】";
                desc = "生命歌咏回路在黑夜中及时咏唱，生体血清成功挽救了遇险同伴！<br>昨夜没有任何同伴遇害，全员安然迎来晨曦。";
            } else if (survivedReason === "confined") {
                title = "【行动受制 · 平安无事】";
                desc = "昨夜被禁锢的目标无法自由行动，舱内整夜未发生任何冲突与伤亡。<br>全员安然迎来晨曦。";
            }

            if (titleElem) {
                titleElem.textContent = title;
                titleElem.classList.add("peaceful-title");
            }
            if (textElem) {
                textElem.innerHTML = desc;
            }

            // 平安夜展示专属生还徽章
            const peaceSvg = `data:image/svg+xml;utf8,` + encodeURIComponent(`
                <svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <radialGradient id="pGlow" cx="50%" cy="45%" r="55%">
                            <stop offset="0%" stop-color="#22c55e" stop-opacity="0.35"/>
                            <stop offset="60%" stop-color="#0f2b1d" stop-opacity="0.8"/>
                            <stop offset="100%" stop-color="#091410" stop-opacity="0.95"/>
                        </radialGradient>
                    </defs>
                    <rect width="200" height="260" fill="url(#pGlow)"/>
                    <circle cx="100" cy="105" r="46" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.7"/>
                    <circle cx="100" cy="105" r="36" fill="rgba(34,197,94,0.12)" stroke="#4ade80" stroke-width="2"/>
                    <text x="100" y="118" font-size="38" text-anchor="middle" dominant-baseline="middle">🕊️</text>
                    <text x="100" y="178" font-size="13" fill="#4ade80" font-weight="bold" letter-spacing="2" text-anchor="middle">PEACEFUL NIGHT</text>
                    <text x="100" y="200" font-size="11" fill="#86efac" letter-spacing="1" text-anchor="middle">全员生还 · 晨曦破晓</text>
                </svg>
            `);
            if (img) {
                img.onerror = null;
                if (typeof img.removeAttribute === "function") {
                    img.removeAttribute("data-candidates");
                }
                img.src = peaceSvg;
            }
        }

        // 核心表现优化：黑夜行动结束后，先纯黑屏2秒，之后再渐渐浮现死者/平安夜卡片，并播放音效
        suspenseLayer?.classList.remove("fade-out");
        contentContainer?.classList.remove("death-content-revealed");
        contentContainer?.classList.add("death-content-hidden");

        // 覆盖全屏黑幕，保留主游戏舞台DOM稳定杜绝地图形变
        this.screenDeathBlack?.classList.remove("hidden");

        const blackDuration = (typeof DeathRevealConfig !== "undefined" && DeathRevealConfig.blackScreenDurationMs !== undefined)
            ? DeathRevealConfig.blackScreenDurationMs
            : 2000;

        // 设置2秒黑屏悬念定时器
        this.deathRevealTimer = setTimeout(() => {
            this.revealDeathContent();
        }, blackDuration);
    }

    /**
     * 2秒黑屏后渐渐浮现死者/平安夜卡片，并触发相应配置音效
     */
    revealDeathContent() {
        if (this.deathRevealed) return;
        this.deathRevealed = true;

        if (this.deathRevealTimer) {
            clearTimeout(this.deathRevealTimer);
            this.deathRevealTimer = null;
        }

        const suspenseLayer = document.getElementById("death-suspense-layer");
        const contentContainer = document.getElementById("death-content-container");

        suspenseLayer?.classList.add("fade-out");
        contentContainer?.classList.remove("death-content-hidden");
        contentContainer?.classList.add("death-content-revealed");

        // 播放死者展示专属音效或平安夜清脆铃音
        try {
            if (typeof Sound !== "undefined") {
                if (this.currentDeathVictim && Sound.playDeathSound) {
                    Sound.playDeathSound();
                } else if (!this.currentDeathVictim && Sound.playFoodSound) {
                    Sound.playFoodSound();
                }
            }
        } catch (err) {
            console.warn("[DeathSound] 播放音效异常:", err);
        }
    }

    handleDeathBlackClick() {
        if (this.phase !== "death_black") return;

        // 若尚处于2秒黑屏期，玩家点击屏幕可快速跳过黑屏等待，立即浮现死者
        if (!this.deathRevealed) {
            this.revealDeathContent();
            return;
        }

        // 死者已浮现状态下，点击推进至白天对话
        this.phase = "q7_day";
        this.screenDeathBlack?.classList.add("hidden");
        this.renderStageMap();

        const cb = this.deathBlackCallback;
        this.deathBlackCallback = null;
        if (cb) cb();
    }

    enterQ7Day() {
        this.phase = "q7_day";
        this.dayCount++;

        // 结算夜晚袭击
        let victimName = null;
        let survivedReason = null; // "confined", "guarded", "witch_saved", "no_attack"

        // 核心规则：队伍里有伪人才能刀人！
        const wolvesInTeam = this.getAliveTeamMembers().filter(m => m.role === "wolf");
        const activeWolvesInTeam = wolvesInTeam.filter(w => w.id !== this.confinedNpcId);

        if (wolvesInTeam.length === 0) {
            survivedReason = "no_attack"; // 队伍里没有伪人，全员安全度过黑夜
        } else if (activeWolvesInTeam.length === 0) {
            survivedReason = "confined"; // 队伍内的伪人已被白天裁决禁锢限制
        }

        let victimObj = null;
        if (!survivedReason) {
            if (!this.nightTargetVictimId) {
                survivedReason = "no_attack";
            } else if (this.nightProtectedNpcId === this.nightTargetVictimId) {
                survivedReason = "guarded"; // 护卫守护
            } else if (this.witchSaved) {
                survivedReason = "witch_saved"; // 女巫救助
            } else if (this.nightTargetVictimId === "kaze" && this.saveSystem.isCharacterPassiveUnlocked("kaze") && Math.random() < 0.35) {
                survivedReason = "kaze_counter"; // 卡罗【战术反制】成功化解！
                this.logAction("【战术反制】卡罗敏锐识破了伪装体的暗夜突袭，凭借特战直觉破门格挡反制，化险为夷！");
            } else if (this.nightTargetVictimId === this.protagonist.id && this.getAliveNpcTeamMembers().some(m => m.id === "mode") && this.saveSystem.isCharacterPassiveUnlocked("mode")) {
                survivedReason = "mode_shield"; // 莫德【防爆坚守】挺身格挡！
                this.logAction("【防爆坚守】潜伏伪装体企图暗算队长！莫德以重装防爆盾死死扼守住舱门，替队长挡下了致命抹杀！");
            } else {
                // 遇害离场
                if (this.nightTargetVictimId === this.protagonist.id) {
                    this.triggerGameOver("生活区已无其他人类同伴生还……潜伏在队伍中的伪人撕下伪装向你扑来。你在绝望中倒下了。");
                    return;
                }
                const victim = this.getNpcById(this.nightTargetVictimId);
                if (victim) {
                    victim.status = "dead";
                    victimName = victim.name;
                    victimObj = victim;
                }
            }
        }

        // 清空当晚临时状态
        const prevReason = survivedReason;
        this.confinedNpcId = null;
        this.nightProtectedNpcId = null;
        this.witchSaved = false;
        this.nightTargetVictimId = null;

        // 更新顶栏与UI
        this.updateHeaderUI();

        if (victimObj) {
            this.logAction(`【黎明公布】第 ${this.dayCount} 天：同伴 [${victimObj.name}] 昨夜遇袭身亡，当前队伍存活: ${this.getAliveTeamMembers().length} 人`);

            // 触发人物图鉴历练检定 (同伴遇害牺牲)
            this.checkPersonaSecretUnlocks("suffer_fate", { charId: victimObj.id, type: "dead" });

            // 核心优化：全屏黑屏中间展示死亡立绘特写（比例适中，不要太大也不要太小）
            this.enterDeathBlackPhase(victimObj, () => {
                const lines = [
                    {
                        speaker: { id: "broadcast", isBroadcast: true, name: "黎明广播", themeColor: "#38bdf8" },
                        text: `第 ${this.dayCount} 循环黎明到来，全员重新集结。`
                    },
                    {
                        speaker: { id: "broadcast", isBroadcast: true, name: "警报广播", themeColor: "#ef4444" },
                        text: `⚠️ 警报！检测到乘员生命体征中断，在生活舱发现了遗体……`
                    }
                ];

                // 存活同伴目睹死亡后的随机反应台词 (随机触发存活NPC的专属特殊语句)
                const aliveNpcs = this.getAliveNpcTeamMembers().filter(m => m.id !== victimObj.id);
                if (aliveNpcs.length > 0) {
                    // 随机打乱存活同伴顺序
                    const shuffled = [...aliveNpcs].sort(() => 0.5 - Math.random());
                    const reactor1 = shuffled[0];
                    const reaction1 = CharacterRegistry.getRandomDeathReaction(reactor1, victimObj);
                    if (reaction1) {
                        lines.push({
                            speaker: reactor1,
                            expression: reaction1.expression,
                            text: reaction1.text
                        });
                        this.logAction(`【同伴哀痛】[${reactor1.name}] 对 [${victimObj.name}] 的牺牲做出了反应。`);
                    }

                    // 若队伍还有其他存活NPC，有几率追加第 2 人的感叹
                    if (shuffled.length > 1 && Math.random() < 0.5) {
                        const reactor2 = shuffled[1];
                        const reaction2 = CharacterRegistry.getRandomDeathReaction(reactor2, victimObj);
                        if (reaction2) {
                            lines.push({
                                speaker: reactor2,
                                expression: reaction2.expression,
                                text: reaction2.text
                            });
                        }
                    }
                }

                this.dialogueUI.playSequence(lines, () => {
                    // 循环回到 q3 探索，步数已在傍晚时清零，开启全新一天的选择
                    this.enterQ3Exploration();
                });
            });
        } else {
            // 平安夜判定
            this.checkPersonaSecretUnlocks("peaceful_night_with", { isPeaceful: true });

            // 用户明确要求：禁锢的就算是伪人，也不要在白天广播时说出来，就说平安夜就行
            let reasonText = "平安夜！昨夜没有任何同伴遇害。";
            if (prevReason === "kaze_counter") {
                reasonText = "昨夜暗影突袭被防区特战本能挫败，平安度过！";
            } else if (prevReason === "mode_shield") {
                reasonText = "重装防爆力场彻底拦截了暗夜突袭，平安度过！";
            }

            const lines = [
                {
                    speaker: { id: "broadcast", isBroadcast: true, name: "广播通信", themeColor: "#4ade80" },
                    text: `✅ ${reasonText}`
                }
            ];

            if (prevReason === "kaze_counter") {
                const kazeNpc = this.getNpcById("kaze");
                if (kazeNpc) {
                    lines.push({
                        speaker: kazeNpc,
                        expression: "angry",
                        text: "昨晚有东西试图从通风口摸进来。不过被我短刀反制割裂了表皮，已经逃窜了。"
                    });
                }
            } else if (prevReason === "mode_shield") {
                const modeNpc = this.getNpcById("mode");
                if (modeNpc) {
                    lines.push({
                        speaker: modeNpc,
                        expression: "angry",
                        text: "队长，昨晚那帮拟态杂碎摸到你舱门前了。老子把防爆盾砸它脸上，给老子夹着尾巴滚了！"
                    });
                }
            }

            this.logAction(`【黎明公布】第 ${this.dayCount} 天：${reasonText}`);

            // 核心优化：无论是否死人，黑夜转白天均出现“死寂降临”动画界面！
            this.enterDeathBlackPhase(null, () => {
                this.dialogueUI.playSequence(lines, () => {
                    // 循环回到 q3 探索，步数已在傍晚时清零，开启全新一天的选择
                    this.enterQ3Exploration();
                });
            }, prevReason);
        }
    }

    // =========================================================================
    // 胜利与失败结算
    // =========================================================================
    triggerVictory(exitNode) {
        this.phase = "victory";
        const aliveMembers = this.getAliveTeamMembers();
        const wolfAlive = aliveMembers.filter(m => m.role === "wolf");
        const currentLvlId = this.currentLevel ? this.currentLevel.levelId : 1;

        // 第四关专属通关特殊剧情演出 (渐变黑屏闪现文字 + X异象逼近 + 终焉暗幕)
        if (currentLvlId === 4) {
            this.playLevel4EndingCutscene(() => {
                this.finalizeVictory(exitNode, aliveMembers, wolfAlive);
            });
            return;
        }

        this.finalizeVictory(exitNode, aliveMembers, wolfAlive);
    }

    finalizeVictory(exitNode, aliveMembers, wolfAlive) {
        // 收集人员撤离与伪人状态上下文
        const evacuatedNpcs = aliveMembers.filter(m => !m.isProtagonist);
        const evacuatedNpcIds = evacuatedNpcs.map(m => m.id);
        const allLevelMimics = Array.from(this.allNpcMap.values()).filter(m => m.role === "wolf");
        const allLevelNpcs = Array.from(this.allNpcMap.values());
        const isSolo = (evacuatedNpcIds.length === 0);

        const evalContext = {
            evacuatedNpcIds,
            evacuatedNpcs,
            allLevelMimics,
            allLevelNpcs,
            isSolo
        };

        // 检定非线性关卡解锁规则
        const unlockResult = UnlockEvaluator.evaluate(this.currentLevel?.unlockRules || [], evalContext);
        const newlyUnlocked = this.saveSystem.unlockLevels(unlockResult.unlockedLevelIds);

        // 检定同伴撤离深度档案解构 (带领卡罗/邵可欣/莫德撤离)
        this.checkPersonaSecretUnlocks("evacuate_with", { evacuatedNpcIds });

        let msg = "";
        if (wolfAlive.length > 0) {
            msg = "气闸开启，门外仍是起点长廊。时钟倒流，身后的拟态伪装体在阴影中露出微笑。";
        } else {
            msg = "气闸开启，门外仍是起点长廊。抓痕未愈，时钟倒流——观测者，你从未逃脱循环。";
        }

        this.showResultModal("🌀 奇点坍缩 · 循环重置 (OBSERVATION)", msg, true, { unlockResult, newlyUnlocked });
    }

    /**
     * 第四关专属通关特殊剧情演出
     * 1. 渐变黑屏然后闪现文字：
     *    1：看来今天也与往常一样
     *    2：没什么区别....
     *    3：那就到此为止吧...
     * 2. 三段文字结束后，从屏幕右侧渐变显现进来一个X（图一的图标），然后贴近主视角（此时动力操作台中心也有一个NPC图标来代表卡罗，别写名字），有些重叠部分时X停下
     * 3. 播放音频（接口预留），2秒之后再渐变黑屏
     * 4. 显现文字“看来....” “的确有些不一样...” "来不及回头...便陷入无尽的黑暗之中..."
     */
    playLevel4EndingCutscene(onComplete) {
        const screenCutscene = document.getElementById("screen-level4-cutscene");
        const blackoutLayer = document.getElementById("l4-cutscene-blackout");
        const textElem = document.getElementById("l4-cutscene-text");
        const stageLayer = document.getElementById("l4-cutscene-stage-layer");
        const entityX = document.getElementById("l4-entity-x");
        const screenGame = document.getElementById("screen-game");

        if (!screenCutscene || !blackoutLayer || !textElem || !stageLayer || !entityX) {
            if (onComplete) onComplete();
            return;
        }

        this.phase = "level4_cutscene";

        // 开启全景电影模式：让周边 HUD 工具条与侧栏隐退，把整个视野留给战术星舰大地图
        if (screenGame) screenGame.classList.add("cinematic-mode");

        // 确保舞台大地图精准居中并聚焦在【西区整备间】动力操作台 (room_npc1)
        if (this.stageMapRenderer && this.currentLevel && this.currentLevel.map) {
            this.stageMapRenderer.viewMode = "focus";
            this.stageMapRenderer.panX = 0;
            this.stageMapRenderer.panY = 0;
            this.stageMapRenderer.zoom = 1.0;
            this.stageMapRenderer.render(
                this.currentLevel.map,
                "room_npc1",
                this.visitedNodes,
                this.teamMembers
            );
        }

        screenCutscene.classList.remove("hidden");
        blackoutLayer.classList.remove("blackout-transparent");
        blackoutLayer.classList.remove("hidden");
        stageLayer.classList.remove("hidden");
        entityX.classList.remove("approaching");
        textElem.innerHTML = "";
        textElem.classList.remove("show-text");

        let skipTimer = null;
        const advanceClick = () => {
            if (skipTimer) skipTimer();
        };
        screenCutscene.onclick = advanceClick;

        const waitOrClick = (ms) => {
            return new Promise(resolve => {
                let timer = null;
                const done = () => {
                    if (timer) clearTimeout(timer);
                    skipTimer = null;
                    resolve();
                };
                timer = setTimeout(done, ms);
                skipTimer = done;
            });
        };

        const showFlashText = async (text, holdMs) => {
            textElem.classList.remove("show-text");
            await waitOrClick(350);
            textElem.textContent = text;
            textElem.classList.add("show-text");
            await waitOrClick(holdMs);
        };

        (async () => {
            // 阶段 1：地图上方渐变黑屏，闪现第一组三段文字
            await showFlashText("看来今天也与往常一样", 1600);
            await showFlashText("没什么区别....", 1600);
            await showFlashText("那就到此为止吧...", 1800);

            // 淡出文字
            textElem.classList.remove("show-text");
            await waitOrClick(500);

            // 渐变解除黑屏！直接显露出底层的星舰战术大地图！
            // 此时动力操作台中心正有卡罗专属NPC图标与主视角标记
            blackoutLayer.classList.add("blackout-transparent");
            await waitOrClick(600);

            // 阶段 2：未知X实体从屏幕右侧渐变显现并滑入，贴近主视角，局部重叠时停下
            entityX.classList.add("approaching");
            await waitOrClick(2600);

            // 停下后立即播放异象音频（预留音频接口，放入 assets/audio/ 即可生效）
            if (typeof Sound !== "undefined" && Sound.playLevel4EndingSound) {
                Sound.playLevel4EndingSound();
            }

            // 2秒之后再渐变黑屏
            await waitOrClick(2000);

            // 渐变黑屏重临（将地图覆盖进终焉暗幕）
            blackoutLayer.classList.remove("blackout-transparent");
            await waitOrClick(900);

            // 阶段 3：终焉暗幕中显现第二组文字“看来....” “的确有些不一样...” "来不及回头...便陷入无尽的黑暗之中..."
            await showFlashText("看来....", 1600);
            await showFlashText("的确有些不一样...", 1800);
            await showFlashText("来不及回头...便陷入无尽的黑暗之中...", 2400);

            textElem.classList.remove("show-text");
            await waitOrClick(800);

            // 演出完毕，恢复环境
            screenCutscene.onclick = null;
            screenCutscene.classList.add("hidden");
            if (screenGame) screenGame.classList.remove("cinematic-mode");
            if (onComplete) onComplete();
        })();
    }

    triggerGameOver(reason) {
        this.phase = "gameover";
        this.gameOverReason = reason;
        this.logAction(`【任务失败】${reason}`);
        this.showResultModal("💀 探索中止 (GAME OVER)", reason, false);
    }

    showResultModal(title, message, isVictory, unlockData = {}) {
        const titleElem = document.getElementById("result-title");
        const msgElem = document.getElementById("result-message");
        const btnNext = document.getElementById("btn-result-next");
        const btnLevelSelect = document.getElementById("btn-result-level-select");
        const btnRestart = document.getElementById("btn-result-restart");
        const btnLoad = document.getElementById("btn-result-load");

        titleElem.textContent = title;
        titleElem.style.color = isVictory ? "#38bdf8" : "#ff3366";
        msgElem.textContent = message;

        const currentLvlId = this.currentLevel ? this.currentLevel.levelId : 1;
        const newlyUnlocked = unlockData.newlyUnlocked || [];

        const unlockNoticeElem = document.getElementById("result-unlock-notice");
        if (unlockNoticeElem) {
            if (isVictory && unlockData.unlockResult && unlockData.unlockResult.triggeredRules && unlockData.unlockResult.triggeredRules.length > 0) {
                unlockNoticeElem.classList.remove("hidden");
                let html = `<div style="font-weight: bold; margin-bottom: 6px; color: #38bdf8;">🌌 扇区拓扑解析 · 观测网络重构</div>`;
                unlockData.unlockResult.triggeredRules.forEach(rule => {
                    const isNew = (rule.unlockLevelIds || []).some(id => newlyUnlocked.includes(id));
                    html += `<div style="margin: 2px 0;">✦ ${rule.title || "扇区信标"}：${rule.toast || "信标激活"} ${isNew ? '<span style="color: #4ade80; font-weight: bold;">【✨ 新解锁】</span>' : '<span style="color: #94a3b8;">【已探明】</span>'}</div>`;
                });
                unlockNoticeElem.innerHTML = html;
            } else {
                unlockNoticeElem.classList.add("hidden");
                unlockNoticeElem.innerHTML = "";
            }
        }

        // 检视 5x5 矩阵按钮
        if (btnLevelSelect) {
            if (isVictory) {
                btnLevelSelect.classList.remove("hidden");
                btnLevelSelect.onclick = () => {
                    this.modalResult.classList.add("hidden");
                    this.showMenu();
                    this.showLevelSelectModal();
                };
            } else {
                btnLevelSelect.classList.add("hidden");
            }
        }

        if (btnNext) {
            if (isVictory) {
                btnNext.classList.remove("hidden");
                // 优先指引踏入新解锁的目标扇区
                let targetLvl = null;
                if (newlyUnlocked.length > 0) {
                    targetLvl = newlyUnlocked[0];
                } else if (currentLvlId === 1 && this.saveSystem.isLevelUnlocked(2)) {
                    targetLvl = 2;
                }

                if (targetLvl && targetLvl > 0) {
                    const targetLvlConfig = LevelRegistry.find(l => l.levelId === targetLvl);
                    const targetName = targetLvlConfig ? targetLvlConfig.title : `扇区 ${targetLvl < 10 ? '0' + targetLvl : targetLvl}`;
                    btnNext.textContent = `🌌 踏入新解锁扇区 (进入 ${targetName.split("：")[0]})`;
                    btnNext.onclick = () => {
                        this.modalResult.classList.add("hidden");
                        this.startNewGame(targetLvl);
                    };
                } else {
                    btnNext.textContent = "🔄 重构奇点 (重新进入此循环)";
                    btnNext.onclick = () => {
                        this.modalResult.classList.add("hidden");
                        this.startNewGame(currentLvlId);
                    };
                }
            } else {
                btnNext.classList.add("hidden");
            }
        }

        btnRestart.onclick = () => {
            this.modalResult.classList.add("hidden");
            this.startNewGame(this.currentLevel ? this.currentLevel.levelId : 1);
        };

        btnLoad.onclick = () => {
            this.modalResult.classList.add("hidden");
            this.loadGameProgress();
        };

        this.modalResult.classList.remove("hidden");
    }

    // =========================================================================
    // 存档与读档实现
    // =========================================================================
    saveGameProgress() {
        const state = {
            levelId: this.currentLevel ? this.currentLevel.levelId : 1,
            phase: this.phase,
            dayCount: this.dayCount,
            stamina: this.stamina,
            choiceCount: this.explorationEngine.choiceCount,
            currentNodeId: this.explorationEngine.currentNodeId,
            visitedNodes: Array.from(this.explorationEngine.visitedNodes),
            consumedEvents: Array.from(this.explorationEngine.consumedEvents),
            actionLogs: this.actionLogs,
            protagonistRole: this.protagonist.role,
            teamNpcIds: this.teamMembers.filter(m => !m.isProtagonist).map(m => m.id),
            npcs: Array.from(this.allNpcMap.values()).map(npc => ({
                id: npc.id,
                role: npc.role,
                status: npc.status,
                inquiryCount: npc.inquiryCount
            })),
            unlockedNpcRooms: Array.from(this.unlockedNpcRooms || []),
            level2PowerRestored: !!this.level2PowerRestored,
            level3PowerRestored: !!this.level3PowerRestored,
            level4PatrolVisited: Array.from(this.level4PatrolVisited || [])
        };

        const success = this.saveSystem.saveGame(state);
        if (success) {
            alert("进度已成功保存在本地存储中！");
            this.logAction(`【系统存档】游戏进度与当前状态保存成功。`);
        } else {
            alert("存档保存失败，请检查浏览器存储权限。");
        }
    }

    loadGameProgress() {
        const data = this.saveSystem.loadGame();
        if (!data) {
            alert("未找到可用的历史存档记录。");
            return;
        }

        const levelConfig = LevelRegistry.find(l => l.levelId === data.levelId) || LevelRegistry[0];
        this.currentLevel = levelConfig;

        // 恢复主角
        this.protagonist = {
            ...CharacterRegistry.protagonist,
            role: data.protagonistRole || "seer",
            inquiryCount: 0,
            status: "active",
            fallbackSvg: CharacterRegistry.getAvatarSvg(CharacterRegistry.protagonist)
        };

        // 恢复NPC
        this.allNpcMap.clear();
        this.teamMembers = [this.protagonist];

        (data.npcs || []).forEach(item => {
            const rawChar = CharacterRegistry.npcs[item.id];
            if (!rawChar) return;
            const npcObj = {
                ...rawChar,
                role: item.role,
                status: item.status,
                inquiryCount: item.inquiryCount || 0,
                svgAvatar: CharacterRegistry.getAvatarSvg(rawChar),
                fallbackSvg: CharacterRegistry.getAvatarSvg(rawChar)
            };
            this.allNpcMap.set(npcObj.id, npcObj);

            if (npcObj.status === "active") {
                this.teamMembers.push(npcObj);
            }
        });

        // 恢复数值
        this.stamina = data.stamina;
        this.dayCount = data.dayCount;
        this.actionLogs = data.actionLogs || [];

        // 恢复地图状态
        this.explorationEngine.initLevelMap(levelConfig.map);
        this.explorationEngine.currentNodeId = data.currentNodeId;
        this.explorationEngine.choiceCount = data.choiceCount || 0;
        this.explorationEngine.visitedNodes = new Set(data.visitedNodes || []);
        this.explorationEngine.consumedEvents = new Set(data.consumedEvents || []);
        this.unlockedNpcRooms = new Set(data.unlockedNpcRooms || []);
        this.level2PowerRestored = !!data.level2PowerRestored;
        this.level3PowerRestored = !!data.level3PowerRestored;
        this.level4PatrolVisited = new Set(data.level4PatrolVisited || []);
        this.checkAndUnlockNpcRooms();

        this.screenMenu.classList.add("hidden");
        this.screenBlack.classList.add("hidden");
        this.screenEveningBlack?.classList.add("hidden");
        this.screenDeathBlack?.classList.add("hidden");
        this.screenGame.classList.remove("hidden");

        this.logAction(`【读档成功】恢复至第 ${this.dayCount} 天，当前位置：${this.explorationEngine.getCurrentNode()?.name || "未知"}`);

        this.enterQ3Exploration();
    }

    // =========================================================================
    // 工具辅助函数
    // =========================================================================
    getNpcById(id) {
        if (id === "colt_barnes") {
            const colt = this.allNpcMap.get("colt");
            const barnes = this.allNpcMap.get("barnes");
            if (colt && barnes) {
                return {
                    id: "colt_barnes",
                    name: "柯尔特 & 巴恩斯",
                    gender: "双人",
                    themeColor: "#f59e0b",
                    boxBorderColor: "rgba(245, 158, 11, 0.9)",
                    boxBgGlow: "rgba(245, 158, 11, 0.25)",
                    folder: "Colt",
                    avatarUrl: colt.avatarUrl,
                    expressions: colt.expressions,
                    status: (colt.status === "active" && barnes.status === "active") ? "active" : ((colt.status === "dead" && barnes.status === "dead") ? "dead" : "unmet"),
                    introDialogue: [
                        { text: "（柯尔特把玩着筹码，身旁巴恩斯正护着防爆物资箱）哟，大指挥官，可算有人摸到特勤套房了！", expression: "clam" },
                        { text: "巴恩斯：现在的规矩是全舰死寂，要想离开这鬼地方，带上我们俩是最划算的买卖！", expression: "happy" },
                        { text: "柯尔特：别发愣了，前面主反应堆还不知道堆着多少怪物呢，联手脱出吧！", expression: "angry" }
                    ]
                };
            } else if (colt) {
                return colt;
            } else if (barnes) {
                return barnes;
            }
        }
        return this.allNpcMap.get(id);
    }

    // 获取当前在队伍中且存活的所有成员（含主角）
    getAliveTeamMembers() {
        return this.teamMembers.filter(m => m.status === "active");
    }

    // 获取当前在队伍中且存活的NPC同伴（不含主角）
    getAliveNpcTeamMembers() {
        return this.teamMembers.filter(m => !m.isProtagonist && m.status === "active");
    }

    /**
     * 检定并解锁队伍中成员的专属私人舱室 (支持主角+11个NPC扩展)
     * 规则：只要队伍中带有该NPC（或主角L.P.H），即解锁对应专属房间并注入地图。
     * 一旦解锁后永久可用（即便后续NPC死亡或离队也不再锁回）。
     */
    checkAndUnlockNpcRooms() {
        if (!this.currentLevel || !this.currentLevel.map || !this.currentLevel.map.nodes) return;
        const allNpcRooms = getNpcRoomDefs();
        const aliveMembers = this.getAliveTeamMembers();

        allNpcRooms.forEach(roomDef => {
            // 必须当前关卡包含该私人舱室的物理连接门户，才可在此关卡接入拓扑！
            if (!this.currentLevel.map.nodes[roomDef.connectsTo]) return;

            const isAlreadyUnlocked = this.unlockedNpcRooms.has(roomDef.id);
            const isNpcInTeam = roomDef.isProtagonistRoom || roomDef.npcOwnerId === "lph"
                || (roomDef.npcOwnerIds
                    ? roomDef.npcOwnerIds.some(id => aliveMembers.some(m => m.id === id))
                    : aliveMembers.some(m => m.id === roomDef.npcOwnerId));

            if (isAlreadyUnlocked || isNpcInTeam) {
                if (!isAlreadyUnlocked) {
                    this.unlockedNpcRooms.add(roomDef.id);
                    const ownerNames = {
                        lph: "指挥官", kaze: "卡罗", kaluo: "卡罗", shaokexin: "邵可欣", mode: "莫德",
                        prof_lu: "陆知行", luzhixing: "陆知行", noah: "诺亚", sophia: "索菲亚",
                        vivian: "薇薇安", elena: "伊莲", elsa: "艾尔莎", dr_elsa: "艾尔莎",
                        colt: "柯尔特", barnes: "巴恩斯", colt_barnes: "柯尔特 & 巴恩斯"
                    };
                    const ownerName = ownerNames[roomDef.npcOwnerId] || (this.allNpcMap.get(roomDef.npcOwnerId)?.name || roomDef.npcOwnerId);
                    this.logAction(`【舱室解锁】[${roomDef.name}] 经过乘员 [${ownerName}] 信标授权，气闸锁已开启！`);
                    this.showStageToast(`🔓 [${roomDef.name}] 气密锁已授权解除！`);
                }

                this.injectNpcRoomToMap(roomDef);
            }
        });
    }

    /**
     * 将专属私人舱室节点动态接入当前地图拓扑网络
     */
    injectNpcRoomToMap(roomDef) {
        if (!this.currentLevel || !this.currentLevel.map || !this.currentLevel.map.nodes) return;
        const levelMap = this.currentLevel.map;
        if (levelMap.nodes[roomDef.id]) return; // 已注入

        const node = {
            id: roomDef.id,
            name: roomDef.name,
            desc: roomDef.desc,
            zone: roomDef.zone,
            coord: { x: roomDef.coord.x, y: roomDef.coord.y },
            shape: roomDef.shape || "quarters",
            equipment: roomDef.equipment || null,
            isNpcRoom: true,
            npcOwnerId: roomDef.npcOwnerId,
            diary: roomDef.diary,
            connectsTo: roomDef.connectsTo,
            connections: {}
        };

        // 建立与邻接房间的双向物理气闸连接
        if (roomDef.connectsTo) {
            const neighborNode = levelMap.nodes[roomDef.connectsTo];
            if (neighborNode) {
                const dirToNeighbor = getRelativeDirection(node.coord, neighborNode.coord);
                const dirFromNeighbor = getRelativeDirection(neighborNode.coord, node.coord);
                node.connections[dirToNeighbor] = roomDef.connectsTo;
                neighborNode.connections[dirFromNeighbor] = node.id;
            }
        }

        levelMap.nodes[roomDef.id] = node;

        if (levelMap.masterShip && levelMap.masterShip.lockedRooms) {
            delete levelMap.masterShip.lockedRooms[roomDef.id];
        }
        if (levelMap.masterShip && levelMap.masterShip.openRoomIds) {
            if (!levelMap.masterShip.openRoomIds.includes(roomDef.id)) {
                levelMap.masterShip.openRoomIds.push(roomDef.id);
            }
        }
    }

    updateHeaderUI() {
        const currentNode = this.explorationEngine.getCurrentNode();
        if (this.headerLocation) {
            this.headerLocation.textContent = currentNode ? currentNode.name : "未知区域";
        }

        if (this.headerStaminaFill && this.headerStaminaText) {
            const pct = Math.max(0, Math.min(100, (this.stamina / StaminaConfig.maxStamina) * 100));
            this.headerStaminaFill.style.width = `${pct}%`;
            this.headerStaminaText.textContent = `${this.stamina} / ${StaminaConfig.maxStamina}`;
            if (this.stamina <= 24) {
                this.headerStaminaFill.style.background = "#ef4444";
            } else if (this.stamina <= 50) {
                this.headerStaminaFill.style.background = "#f59e0b";
            } else {
                this.headerStaminaFill.style.background = "#38bdf8";
            }
        }

        if (this.headerTeamCount) {
            const alive = this.getAliveTeamMembers().length;
            this.headerTeamCount.textContent = `队伍幸存: ${alive} 人`;
        }

        if (this.headerDayText) {
            this.headerDayText.textContent = `第 ${this.dayCount} 循环`;
        }

        // 保持侧边栏与弹窗的任务清单实时刷新
        this.renderMissionsPanel();

        // 实时刷新战术微型雷达
        this.updateMiniRadar();

        // 实时刷新环境遥测与随行同伴头像栏
        this.updateTelemetryAndRoster();

        // 实时刷新主舞台背景全景蓝图
        this.renderStageMap();
    }

    updateTelemetryAndRoster() {
        // 1. 刷新环境遥测
        const sectorElem = document.getElementById("telemetry-sector-code");
        const mimicElem = document.getElementById("telemetry-mimic-signal");
        const lvlId = this.currentLevel ? this.currentLevel.levelId : 1;
        const lvlName = (this.currentLevel && (this.currentLevel.title || this.currentLevel.name)) || "残破遗迹";
        const cleanName = lvlName.replace(/^第\d+关[：:]?\s*/, "").slice(0, 10);
        const lvlStr = lvlId < 10 ? `0${lvlId}` : `${lvlId}`;

        if (sectorElem) {
            sectorElem.textContent = `SECTOR ${lvlStr} // ${cleanName}`;
        }

        if (mimicElem) {
            let hasNearbyMimic = false;
            if (this.currentLevelMap && this.explorationEngine) {
                const currentId = this.explorationEngine.currentNodeId;
                const node = this.currentLevelMap.nodes[currentId];
                if (node && node.connections) {
                    node.connections.forEach(connId => {
                        const targetNpc = Array.from(this.allNpcMap.values()).find(n => n.nodeId === connId);
                        if (targetNpc && targetNpc.role === "wolf" && targetNpc.status === "active") {
                            hasNearbyMimic = true;
                        }
                    });
                }
            }

            if (hasNearbyMimic) {
                mimicElem.className = "telemetry-text text-glow-red";
                mimicElem.textContent = "⚠️ 检出邻近拟态波";
            } else {
                mimicElem.className = "telemetry-text text-glow-green";
                mimicElem.textContent = "未探知拟态波";
            }
        }

        // 2. 刷新随行同伴羁绊卡片栏
        const deck = document.getElementById("team-roster-deck");
        if (!deck) return;

        const aliveMembers = this.getAliveTeamMembers();
        let html = "";
        aliveMembers.forEach(char => {
            if (char.isProtagonist) {
                html += `
                    <div class="roster-card" title="你（指挥官）">
                        <span style="font-size: 1rem;">🧑‍🚀</span>
                        <span class="roster-name">指挥官</span>
                        <span class="roster-status" style="color: #38bdf8;">队长</span>
                    </div>
                `;
            } else {
                const statusMap = {
                    kaze: "🗡️ 战术警惕",
                    shaokexin: "🌸 拟态直觉",
                    mode: "🛡️ 重装坚守"
                };
                const statusText = statusMap[char.id] || "🤝 随行";
                const avatar = char.avatarUrl || "assets/characters/kaze/normal.webp";
                html += `
                    <div class="roster-card" title="${char.name}（已加入随行）">
                        <img class="roster-avatar" src="${avatar}" alt="${char.name}" onerror="this.src='assets/characters/kaze/normal.webp'">
                        <span class="roster-name">${char.name}</span>
                        <span class="roster-status">${statusText}</span>
                    </div>
                `;
            }
        });
        deck.innerHTML = html;
    }

    logAction(text) {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const entry = { time: timeStr, text: text };
        this.actionLogs.push(entry);
        this.renderActionLogs();
    }

    renderActionLogs() {
        if (!this.logListElement) return;
        this.logListElement.innerHTML = "";
        this.actionLogs.slice(-40).forEach(log => {
            const li = document.createElement("li");
            li.className = "log-entry";
            li.innerHTML = `<span class="log-time">[${log.time}]</span> <span class="log-text">${log.text}</span>`;
            this.logListElement.appendChild(li);
        });
        // 自动滚动到底部
        this.logListElement.scrollTop = this.logListElement.scrollHeight;
    }

    /**
     * 选择移动方向时：自动打开地图并播放类似 Unity DoTween 的平移动画
     */
    performMoveWithMapAnimation(direction) {
        if (this.phase !== "q3_explore" || this.isMovingAnimation) return;

        const currentNode = this.explorationEngine.getCurrentNode();
        if (!currentNode || !currentNode.connections || !currentNode.connections[direction]) {
            return;
        }

        const nextNodeId = currentNode.connections[direction];
        const nextNode = this.currentLevel && this.currentLevel.map && this.currentLevel.map.nodes[nextNodeId];
        if (!nextNode) return;

        const isExitNode = !!(nextNode.isExit || (nextNode.event && nextNode.event.type === "exit"));
        const isPowerRestorationPending = (
            (this.currentLevel?.levelId === 2 && !this.level2PowerRestored) ||
            (this.currentLevel?.levelId === 3 && !this.level3PowerRestored)
        );
        const isLevel5ColtBarnesPending = (
            this.currentLevel?.levelId === 5 &&
            !(
                this.getAliveTeamMembers().some(m => m.id === "colt") &&
                this.getAliveTeamMembers().some(m => m.id === "barnes")
            )
        );
        const isEffectiveExit = isExitNode && !isPowerRestorationPending && !isLevel5ColtBarnesPending;

        // 若体力已耗尽且不是通往有效终点，直接触发结算倒下
        if (this.stamina <= 0 && !isEffectiveExit) {
            this.explorationEngine.moveTo(direction);
            return;
        }

        this.isMovingAnimation = true;

        // 播放移动探索脚步音效 (移动.wav)
        if (typeof Sound !== "undefined" && Sound.playMoveSound) {
            Sound.playMoveSound();
        }

        const onFinished = () => {
            this.isMovingAnimation = false;
            this.explorationEngine.moveTo(direction);
            this.renderStageMap();
            this.renderExplorationControls();
        };

        // 如果主舞台背景大地图存在且支持动画，直接在舞台背景上平移动画，不强制弹出弹窗
        const renderer = this.stageMapRenderer;
        if (renderer && typeof requestAnimationFrame !== "undefined") {
            const visited = this.explorationEngine.visitedNodes;
            renderer.animateMove(
                this.currentLevel.map,
                currentNode.id,
                nextNode.id,
                visited,
                this.teamMembers,
                onFinished
            );
        } else {
            // 回退兼容
            this.showMapModalForMove(currentNode, nextNode, () => {
                this.isMovingAnimation = false;
                this.modalMap?.classList.add("hidden");
                this.explorationEngine.moveTo(direction);
                this.renderStageMap();
                this.renderExplorationControls();
            });
        }
    }

    /**
     * 专属地图位移动画弹窗
     */
    showMapModalForMove(fromNode, toNode, onFinished) {
        const banner = document.getElementById("map-move-banner");
        const bannerText = document.getElementById("map-move-text");
        const tabLive = document.getElementById("btn-tab-live-map");
        const tabSketch = document.getElementById("btn-tab-sketch-map");
        const viewLive = document.getElementById("map-live-view");
        const viewSketch = document.getElementById("map-sketch-view");

        // 切换至实时定位蓝图模式
        tabLive?.classList.add("active");
        tabSketch?.classList.remove("active");
        viewLive?.classList.remove("hidden");
        viewSketch?.classList.add("hidden");

        const fromName = (fromNode && fromNode.name) || "当前位置";
        const toName = (toNode && toNode.name) || "目标位置";
        const fromId = fromNode?.id || (fromNode ? String(fromNode) : "");
        const toId = toNode?.id || (toNode ? String(toNode) : "");

        if (banner && bannerText) {
            banner.classList.remove("hidden");
            bannerText.innerHTML = `🧭 正在行进：<span style="color:#38bdf8">[${fromName}]</span> ➔ <span style="color:#4ade80">[${toName}]</span>...`;
        }

        this.modalMap.classList.remove("hidden");

        if (!this.mapRenderer) {
            const canvas = document.getElementById("live-map-canvas");
            if (canvas) {
                this.mapRenderer = new MapRenderer(canvas);
            }
        }

        let finished = false;
        const completeOnce = () => {
            if (finished) return;
            finished = true;
            if (banner) banner.classList.add("hidden");
            if (onFinished) onFinished();
        };

        const canvasElem = document.getElementById("live-map-canvas");
        const skipHandler = () => {
            if (this.mapRenderer && this.mapRenderer.skipAnimation) {
                this.mapRenderer.skipAnimation();
            }
        };

        canvasElem?.addEventListener("click", skipHandler, { once: true });

        if (this.mapRenderer && typeof requestAnimationFrame !== "undefined" && fromId && toId) {
            this.mapRenderer.animateMove(
                this.currentLevel.map,
                fromId,
                toId,
                this.explorationEngine.visitedNodes,
                this.teamMembers,
                () => {
                    canvasElem?.removeEventListener("click", skipHandler);
                    if (bannerText) {
                        bannerText.innerHTML = `📍 已抵达：<span style="color:#4ade80">[${toName}]</span>`;
                    }
                    setTimeout(() => {
                        completeOnce();
                    }, 380);
                }
            );
        } else {
            completeOnce();
        }
    }

    showMapModal() {
        const banner = document.getElementById("map-move-banner");
        const bannerText = document.getElementById("map-move-text");
        if (banner && bannerText) {
            if (this.phase === "q3_explore") {
                banner.classList.remove("hidden");
                bannerText.innerHTML = `🟢 <b>快速往返已就绪：</b>点击地图上已探索的方块，即可快速安全折返（不计入面临选择次数）`;
            } else {
                banner.classList.add("hidden");
            }
        }

        const img = document.getElementById("modal-map-img");
        if (img && this.currentLevel) {
            img.src = this.currentLevel.mapImageUrl || "assets/level1_sketch.jpg";
        }

        const notesElem = document.querySelector(".map-notes");
        if (notesElem && this.currentLevel) {
            if (this.currentLevel.levelId === 2) {
                notesElem.innerHTML = `<span>起点：东侧备勤室（医护角落）</span> ｜ <span>终点：北侧气密逃生舱</span> ｜ <span>深层散落：卡罗、莫德、陆知行</span>`;
            } else {
                notesElem.innerHTML = `<span>起点：下层中央大厅</span> ｜ <span>终点：北侧脱离大门</span> ｜ <span>沿途：卡罗(NPC1)、邵可欣(NPC2)、莫德(NPC3)</span>`;
            }
        }
        const tabSketch = document.getElementById("btn-tab-sketch-map");
        if (tabSketch && this.currentLevel) {
            tabSketch.style.display = this.currentLevel.mapImageUrl ? "" : "none";
        }

        this.modalMap.classList.remove("hidden");
        // 默认显示实时蓝图并绘制
        this.renderLiveMap();
    }

    renderLiveMap() {
        if (!this.mapRenderer) {
            const canvas = document.getElementById("live-map-canvas");
            if (canvas) {
                this.mapRenderer = new MapRenderer(canvas);
            }
        }

        const btnToggleFocus = document.getElementById("btn-toggle-map-focus");
        if (btnToggleFocus && this.mapRenderer) {
            btnToggleFocus.textContent = this.mapRenderer.viewMode === "full" ? "🌌 全舰全景" : "🔭 扇区聚焦";
        }

        if (this.mapRenderer && this.currentLevel && this.currentLevel.map) {
            this.mapRenderer.render(
                this.currentLevel.map,
                this.explorationEngine.currentNodeId,
                this.explorationEngine.visitedNodes,
                this.teamMembers,
                null,
                0,
                {
                    canFastTravel: this.phase === "q3_explore",
                    hoveredNodeId: this.hoveredMapNodeId,
                    patrolVisited: this.level4PatrolVisited
                }
            );
        }
    }

    /**
     * 渲染主舞台背景上的全景太空基地蓝图
     */
    renderStageMap() {
        if (!this.stageMapRenderer && this.stageMapCanvas) {
            this.stageMapRenderer = new MapRenderer(this.stageMapCanvas);
        }

        const btnToggleFocus = document.getElementById("btn-stage-map-focus");
        if (btnToggleFocus && this.stageMapRenderer) {
            btnToggleFocus.textContent = this.stageMapRenderer.viewMode === "full" ? "🌌 全景" : "🔭 聚焦";
        }

        if (this.stageMapRenderer && this.currentLevel && this.currentLevel.map && this.explorationEngine) {
            this.stageMapRenderer.render(
                this.currentLevel.map,
                this.explorationEngine.currentNodeId,
                this.explorationEngine.visitedNodes,
                this.teamMembers,
                null,
                0,
                {
                    canFastTravel: this.phase === "q3_explore",
                    hoveredNodeId: this.hoveredMapNodeId,
                    patrolVisited: this.level4PatrolVisited
                }
            );
        }
    }

    /**
     * 舞台轻量提示条 (Stage Toast)
     */
    showStageToast(text) {
        if (!this.stageToast) {
            this.stageToast = document.getElementById("stage-toast");
        }
        if (!this.stageToast) return;

        this.stageToast.textContent = text;
        this.stageToast.classList.add("visible");
        if (this.stageToastTimeout) {
            clearTimeout(this.stageToastTimeout);
        }
        this.stageToastTimeout = setTimeout(() => {
            this.stageToast?.classList.remove("visible");
        }, 2200);
    }

    /**
     * 处理点击地图房间节点触发移动 (支持直接点击相邻房间移动，或点击已探明远距离房间快速往返)
     */
    handleMapNodeClick(node) {
        if (!node || this.isMovingAnimation) return;

        // 1. 阶段约束：只能在白昼自由探索（q3_explore）使用
        if (this.phase !== "q3_explore") {
            this.showStageToast("⚠️ 该功能仅限白昼探索时段使用");
            if (typeof Sound !== "undefined" && Sound.playTick) Sound.playTick();
            return;
        }

        const currentNode = this.explorationEngine.getCurrentNode();
        if (!currentNode) return;

        // 2. 当前位置校验：若点击的就是当前所在房间
        if (node.id === this.explorationEngine.currentNodeId) {
            this.showStageToast(`📍 当前已在 [${node.name}]`);
            return;
        }

        // 2b. 锁闭状态判定与NPC专属舱室解锁交互
        if (node.isLocked) {
            if (node.isNpcRoom) {
                const ownerNames = {
                    lph: "指挥官", kaze: "卡罗", kaluo: "卡罗", shaokexin: "邵可欣", mode: "莫德",
                    prof_lu: "陆知行", luzhixing: "陆知行", noah: "诺亚", sophia: "索菲亚",
                    vivian: "薇薇安", elena: "伊莲", elsa: "艾尔莎", dr_elsa: "艾尔莎",
                    colt: "柯尔特", barnes: "巴恩斯", colt_barnes: "柯尔特 & 巴恩斯"
                };
                const ownerName = ownerNames[node.npcOwnerId] || "乘员";
                const isNpcInTeam = node.isProtagonistRoom || node.npcOwnerId === "lph"
                    || (node.npcOwnerIds
                        ? node.npcOwnerIds.some(id => this.getAliveTeamMembers().some(m => m.id === id))
                        : this.getAliveTeamMembers().some(m => m.id === node.npcOwnerId));

                if (isNpcInTeam) {
                    this.checkAndUnlockNpcRooms();
                    this.renderStageMap();
                    this.showStageToast(`🔓 [${node.name}] 经过 [${ownerName}] 授权已解锁！再次点击即可通行。`);
                    return;
                } else {
                    this.showStageToast(`🔒 [${node.name}] 属于私人专属舱室，需 [${ownerName}] 随行才能授权进入！`);
                    if (typeof Sound !== "undefined" && Sound.playTick) Sound.playTick();
                    return;
                }
            } else {
                const reason = node.lockReason || "防爆安全气闸锁死 · 供电切断";
                this.showStageToast(`🔒 [${node.name}] ${reason}`);
                if (typeof Sound !== "undefined" && Sound.playTick) Sound.playTick();
                return;
            }
        }

        // 3. 检查是否为相邻连通房间 (用户要求：直接点击相邻未探索或已探索房间即可移动)
        const conns = currentNode.connections || {};
        let targetDir = null;
        for (const [dir, neighborId] of Object.entries(conns)) {
            if (neighborId === node.id) {
                targetDir = dir;
                break;
            }
        }

        if (targetDir) {
            // 点击的是相邻连通房间：直接向该方向行进！
            this.performMoveWithMapAnimation(targetDir);
            return;
        }

        // 4. 非相邻房间：若已探明，触发快速往返穿梭寻路
        if (this.explorationEngine.visitedNodes.has(node.id)) {
            const path = this.explorationEngine.findVisitedPath(currentNode.id, node.id);
            if (!path || path.length < 2) {
                this.showStageToast(`⚠️ 暂无连通的已探索路线前往 [${node.name}]！`);
                return;
            }
            this.performFastTravel(node.id, path);
            return;
        }

        // 5. 非相邻且未探明的房间
        this.showStageToast(`⚠️ [${node.name}] 属于未探明迷雾区域，请先沿相邻通道探索！`);
        if (typeof Sound !== "undefined" && Sound.playTick) Sound.playTick();
    }

    /**
     * 执行带多段平移动画与脚步音效的快速往返穿梭
     */
    performFastTravel(targetNodeId, path) {
        if (this.isMovingAnimation) return;
        this.isMovingAnimation = true;

        const startNode = this.explorationEngine.getCurrentNode();
        const destNode = this.currentLevel.map.nodes[targetNodeId];
        const startName = startNode ? startNode.name : "当前位置";
        const destName = destNode ? destNode.name : targetNodeId;

        const isModalVisible = this.modalMap && !this.modalMap.classList.contains("hidden");
        const banner = document.getElementById("map-move-banner");
        const bannerText = document.getElementById("map-move-text");

        if (isModalVisible) {
            const tabLive = document.getElementById("btn-tab-live-map");
            const tabSketch = document.getElementById("btn-tab-sketch-map");
            const viewLive = document.getElementById("map-live-view");
            const viewSketch = document.getElementById("map-sketch-view");

            // 确保切换至实时定位蓝图
            tabLive?.classList.add("active");
            tabSketch?.classList.remove("active");
            viewLive?.classList.remove("hidden");
            viewSketch?.classList.add("hidden");

            if (banner && bannerText) {
                banner.classList.remove("hidden");
                bannerText.innerHTML = `🧭 正在快速往返：<span style="color:#38bdf8">[${startName}]</span> ➔ <span style="color:#4ade80">[${destName}]</span> (途经 ${path.length - 1} 间安全走廊)... ⚡ 点击画面可跳过`;
            }
        } else {
            this.showStageToast(`🧭 快速往返：[${startName}] ➔ [${destName}]...`);
        }

        const activeRenderer = isModalVisible ? this.mapRenderer : (this.stageMapRenderer || this.mapRenderer);
        const canvasElem = isModalVisible ? document.getElementById("live-map-canvas") : this.stageMapCanvas;

        let finished = false;
        const completeOnce = () => {
            if (finished) return;
            finished = true;
            this.isMovingAnimation = false;
            this.skipFastTravelAnimation = null;
            if (banner) banner.classList.add("hidden");
            if (isModalVisible) {
                this.modalMap?.classList.add("hidden");
            }

            // 执行快速往返状态结算（不累加面临选择次数）
            this.explorationEngine.fastTravelTo(targetNodeId);
            this.renderStageMap();
            this.renderExplorationControls();

            // 视觉小说对白反馈
            this.dialogueUI.say(
                { name: "区域指引", themeColor: "#4ade80" },
                `已快速返回至 [${destName}]。${destNode?.desc || ""} 请选择下一步行动方向。`
            );
        };

        const skipHandler = () => {
            if (finished) return;
            if (activeRenderer && activeRenderer.skipAnimation) {
                activeRenderer.skipAnimation();
            }
            completeOnce();
        };

        this.skipFastTravelAnimation = skipHandler;
        canvasElem?.addEventListener("click", skipHandler, { once: true });

        // 播放首个区段脚步音效 (移动.wav)
        if (typeof Sound !== "undefined" && Sound.playMoveSound) {
            Sound.playMoveSound();
        }

        if (activeRenderer && typeof requestAnimationFrame !== "undefined" && path && path.length >= 2) {
            activeRenderer.animatePath(
                this.currentLevel.map,
                path,
                this.explorationEngine.visitedNodes,
                this.teamMembers,
                (segIdx, fromId, toId) => {
                    // 每段移动播放移动脚步音效 (与普通走路声一致)
                    if (typeof Sound !== "undefined" && Sound.playMoveSound) {
                        Sound.playMoveSound();
                    }
                    if (isModalVisible && bannerText) {
                        const toN = this.currentLevel.map.nodes[toId];
                        bannerText.innerHTML = `🧭 正在快速往返：<span style="color:#38bdf8">[${startName}]</span> ➔ <span style="color:#4ade80">[${destName}]</span> (正在经过: ${toN?.name || toId})... ⚡ 点击跳过`;
                    }
                },
                () => {
                    canvasElem?.removeEventListener("click", skipHandler);
                    if (isModalVisible && bannerText) {
                        bannerText.innerHTML = `📍 已安全抵达：<span style="color:#4ade80">[${destName}]</span>`;
                    }
                    setTimeout(() => {
                        completeOnce();
                    }, 350);
                }
            );
        } else {
            completeOnce();
        }
    }

    // =========================================================================
    // 战术微型雷达 (Mini-map Radar)
    // =========================================================================
    onExploreStep() {
        this.getAliveNpcTeamMembers().forEach(npc => {
            this.stepsWithNpc[npc.id] = (this.stepsWithNpc[npc.id] || 0) + 1;
            this.checkPersonaSecretUnlocks("steps_with", { charId: npc.id, steps: this.stepsWithNpc[npc.id] });
        });
    }

    toggleMiniRadar() {
        if (!this.radarBodyWrap || !this.btnRadarToggle) return;
        const isCollapsed = this.radarBodyWrap.classList.contains("hidden");
        if (isCollapsed) {
            this.radarBodyWrap.classList.remove("hidden");
            this.btnRadarToggle.textContent = "−";
            this.btnRadarToggle.title = "折叠雷达";
        } else {
            this.radarBodyWrap.classList.add("hidden");
            this.btnRadarToggle.textContent = "+";
            this.btnRadarToggle.title = "展开雷达";
        }
    }

    updateMiniRadar() {
        if (!this.hudMiniRadar || !this.currentLevel || !this.currentLevel.map) return;

        // 仅在游戏主界面非隐藏状态下显示悬浮雷达
        const inGame = this.screenGame && !this.screenGame.classList.contains("hidden");
        if (!inGame || this.phase === "menu" || this.phase === "victory" || this.phase === "gameover") {
            this.hudMiniRadar.classList.add("hidden");
            return;
        }

        this.hudMiniRadar.classList.remove("hidden");

        const currentNodeId = this.explorationEngine.currentNodeId;
        const currNode = this.currentLevel.map.nodes[currentNodeId];

        // 刷新坐标微标牌
        if (this.radarPosTag && currNode) {
            if (currNode.coord) {
                this.radarPosTag.textContent = `[X: ${currNode.coord.x}, Y: ${currNode.coord.y}]`;
            } else {
                this.radarPosTag.textContent = `[${currNode.name ? currNode.name.slice(0, 8) : '当前'}]`;
            }
        }

        // 检定邵可欣被动技能【第六感预警 (Intuitive Pulse)】
        // 若邵可欣存活且在队内、且被动已觉醒，侦测四周未探索邻居房间是否有潜伏伪装体
        let isNearMimic = false;
        const isShaokexinActive = this.getAliveNpcTeamMembers().some(m => m.id === "shaokexin");
        const isShaokexinPassiveUnlocked = this.saveSystem.isCharacterPassiveUnlocked("shaokexin");

        if (isShaokexinActive && isShaokexinPassiveUnlocked && currNode && currNode.connections) {
            const conns = Object.values(currNode.connections);
            for (const neighborId of conns) {
                if (!this.explorationEngine.visitedNodes.has(neighborId)) {
                    const nNode = this.currentLevel.map.nodes[neighborId];
                    if (nNode && nNode.event && nNode.event.type === "npc") {
                        const targetNpc = this.allNpcMap.get(nNode.event.npcId);
                        if (targetNpc && targetNpc.role === "wolf") {
                            isNearMimic = true;
                            break;
                        }
                    }
                }
            }
        }

        if (!this.mapRenderer) {
            const liveCanvas = document.getElementById("live-map-canvas");
            this.mapRenderer = new MapRenderer(liveCanvas || this.miniRadarCanvas);
        }

        if (this.mapRenderer && this.miniRadarCanvas) {
            this.mapRenderer.renderMiniRadar(
                this.miniRadarCanvas,
                this.currentLevel.map,
                currentNodeId,
                this.explorationEngine.visitedNodes,
                isNearMimic
            );
        }
    }

    // =========================================================================
    // 人物特征 / 秘密图鉴 (Persona Log)
    // =========================================================================
    checkPersonaSecretUnlocks(triggerType, context = {}) {
        if (typeof CharacterRegistry === "undefined" || !CharacterRegistry.npcs) return;

        Object.values(CharacterRegistry.npcs).forEach(char => {
            if (!char || !char.persona || !Array.isArray(char.persona.secrets)) return;

            char.persona.secrets.forEach(secret => {
                if (this.saveSystem.isPersonaSecretUnlocked(char.id, secret.id)) return;
                let shouldUnlock = false;

                if (secret.unlockType === "inquiry_count" && triggerType === "inquiry_count") {
                    if (context.charId === char.id && (context.count || 0) >= secret.threshold) {
                        shouldUnlock = true;
                    }
                } else if (secret.unlockType === "evacuate_with" && triggerType === "evacuate_with") {
                    const evacuatedNpcIds = context.evacuatedNpcIds || [];
                    if (evacuatedNpcIds.includes(char.id)) {
                        shouldUnlock = true;
                    }
                } else if (secret.unlockType === "exile_wolf_with" && triggerType === "exile_wolf_with") {
                    const kazeInTeam = this.getAliveNpcTeamMembers().some(m => m.id === "kaze");
                    if (char.id === "kaze" && kazeInTeam && context.isExiledWolf) {
                        shouldUnlock = true;
                    }
                } else if (secret.unlockType === "peaceful_night_with" && triggerType === "peaceful_night_with") {
                    const shaoInTeam = this.getAliveNpcTeamMembers().some(m => m.id === "shaokexin");
                    if (char.id === "shaokexin" && shaoInTeam && context.isPeaceful) {
                        shouldUnlock = true;
                    }
                } else if (secret.unlockType === "suffer_fate" && triggerType === "suffer_fate") {
                    if (context.charId === char.id) {
                        shouldUnlock = true;
                    }
                } else if (secret.unlockType === "steps_with" && triggerType === "steps_with") {
                    if (context.charId === char.id && (context.steps || 0) >= secret.threshold) {
                        shouldUnlock = true;
                    }
                }

                if (shouldUnlock) {
                    const newlyUnlocked = this.saveSystem.unlockPersonaSecret(char.id, secret.id);
                    if (newlyUnlocked) {
                        this.logAction(`【档案解构】解开了 [${char.name}] 的深层记忆档案：【${secret.title}】！`);
                        this.showPersonaToast(char, secret);

                        if (this.saveSystem.isCharacterPassiveUnlocked(char.id)) {
                            this.logAction(`【特质完全觉醒】[${char.name}] 达成全记忆解构！觉醒专属被动【${char.persona.passiveSkill.name}】并开启专属剧情分支！`);
                        }
                    }
                }
            });
        });
    }

    showPersonaToast(char, secret) {
        if (typeof document === "undefined") return;

        let toast = document.getElementById("persona-unlock-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "persona-unlock-toast";
            toast.className = "persona-toast";
            document.body.appendChild(toast);
        }

        const isFullyAwakened = this.saveSystem.isCharacterPassiveUnlocked(char.id);
        toast.innerHTML = `
            <div class="persona-toast-title">
                <span>✨ 记忆图鉴解构 · ${char.name}</span>
            </div>
            <div class="persona-toast-body">
                <span>解锁档案：<b>【${secret.title}】</b></span><br>
                <span style="font-size:0.75rem; color:#94a3b8;">${secret.desc.slice(0, 36)}...</span>
                ${isFullyAwakened ? `<div style="color:#fbbf24; font-weight:bold; margin-top:4px;">🌟 达成全部解构！觉醒被动【${char.persona.passiveSkill.name}】！</div>` : ''}
            </div>
        `;

        toast.classList.remove("fade-out", "hidden");
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }

        this.toastTimeout = setTimeout(() => {
            toast.classList.add("fade-out");
            setTimeout(() => {
                toast.classList.add("hidden");
            }, 450);
        }, 3600);
    }

    showPersonaLogModal(selectedCharId = null) {
        if (!this.modalPersonaLog) return;
        if (selectedCharId) {
            this.activePersonaCharId = selectedCharId;
        } else if (!this.activePersonaCharId) {
            this.activePersonaCharId = "kaze";
        }
        this.renderPersonaLogModal(this.activePersonaCharId);
        this.modalPersonaLog.classList.remove("hidden");
    }

    renderPersonaLogModal(selectedCharId = "kaze") {
        if (!this.personaCharTabs || !this.personaCharDetail) return;
        this.activePersonaCharId = selectedCharId;

        const npcs = CharacterRegistry.npcs;
        const charKeys = ["kaze", "shaokexin", "mode"];

        // 1. 渲染角色切换 Tab 按钮
        this.personaCharTabs.innerHTML = "";
        charKeys.forEach(key => {
            const char = npcs[key];
            if (!char || !char.persona) return;

            const unlockedList = this.saveSystem.getUnlockedSecrets(char.id);
            const count = unlockedList.length;
            const total = char.persona.secrets.length;
            const isFull = count >= total;

            const tab = document.createElement("button");
            tab.className = `persona-tab-btn ${key === this.activePersonaCharId ? "active" : ""}`;
            tab.style.borderColor = key === this.activePersonaCharId ? char.themeColor : "";
            tab.innerHTML = `
                <span class="tab-char-name" style="color:${char.themeColor}">${char.name}</span>
                <span class="tab-char-count ${isFull ? 'count-complete' : ''}">(${count}/${total})</span>
            `;

            tab.addEventListener("click", () => {
                this.renderPersonaLogModal(key);
            });
            this.personaCharTabs.appendChild(tab);
        });

        // 2. 渲染选定角色的完整档案面
        const activeChar = npcs[this.activePersonaCharId];
        if (!activeChar || !activeChar.persona) return;

        const persona = activeChar.persona;
        const unlockedList = this.saveSystem.getUnlockedSecrets(activeChar.id);
        const unlockedCount = unlockedList.length;
        const totalSecrets = persona.secrets.length;
        const pct = Math.round((unlockedCount / totalSecrets) * 100);
        const isPassiveUnlocked = this.saveSystem.isCharacterPassiveUnlocked(activeChar.id);

        let secretsHtml = "";
        persona.secrets.forEach((s, idx) => {
            const isUnlocked = this.saveSystem.isPersonaSecretUnlocked(activeChar.id, s.id);
            secretsHtml += `
                <div class="persona-secret-card ${isUnlocked ? 'secret-unlocked' : 'secret-locked'}">
                    <div class="persona-secret-top">
                        <span class="persona-secret-title">
                            ${isUnlocked ? `✦ ${s.title}` : `🔒 深度记忆 #${idx + 1}`}
                        </span>
                        <span class="persona-secret-status ${isUnlocked ? 'status-unlocked' : 'status-locked'}">
                            ${isUnlocked ? '已解构' : '待探明'}
                        </span>
                    </div>
                    <div class="persona-secret-desc">
                        ${isUnlocked ? s.desc : '……此处记忆神经回路发生熵阻断裂，无法读取。'}
                    </div>
                    ${!isUnlocked ? `<div class="persona-secret-hint">💡 解锁线索：${s.hint}</div>` : ''}
                </div>
            `;
        });

        const branch = persona.exclusiveBranch;

        this.personaCharDetail.innerHTML = `
            <!-- 头部概览卡 -->
            <div class="persona-hero-card" style="border-left-color: ${activeChar.themeColor};">
                <div class="persona-hero-avatar" style="border-color: ${activeChar.themeColor};">
                    <img src="${activeChar.svgAvatar}" alt="${activeChar.name}">
                </div>
                <div class="persona-hero-info">
                    <div class="persona-hero-title-row">
                        <span class="persona-hero-name" style="color:${activeChar.themeColor};">${activeChar.name}</span>
                        <span class="persona-hero-role-tag" style="background:${activeChar.themeColor}26; border-color:${activeChar.themeColor}; color:${activeChar.themeColor};">${persona.title}</span>
                    </div>
                    <div class="persona-progress-wrap">
                        <div class="persona-progress-bar-bg">
                            <div class="persona-progress-bar-fill" style="width:${pct}%; background:${activeChar.themeColor};"></div>
                        </div>
                        <span class="persona-progress-text">记忆拼合进度: ${unlockedCount} / ${totalSecrets} (${pct}%)</span>
                    </div>
                </div>
            </div>

            <!-- 4 条核心深层记忆卡片网格 -->
            <div class="persona-secrets-grid">
                ${secretsHtml}
            </div>

            <!-- 专属保命被动技能与专属分支启航栏 -->
            <div class="persona-reward-deck">
                <div class="persona-passive-box ${isPassiveUnlocked ? 'active-skill' : ''}">
                    <div class="persona-passive-header">
                        <span>${persona.passiveSkill.icon}</span>
                        <span>专属特质：${persona.passiveSkill.name}</span>
                        <span style="font-size:0.75rem; margin-left:auto; color:${isPassiveUnlocked ? '#4ade80' : '#94a3b8'};">
                            ${isPassiveUnlocked ? '【✨ 已激活】' : '【🔒 需集齐4项记忆】'}
                        </span>
                    </div>
                    <div class="persona-passive-desc">${persona.passiveSkill.desc}</div>
                </div>

                <div class="persona-branch-action">
                    <button id="btn-launch-exclusive-branch" 
                            class="btn-launch-branch ${isPassiveUnlocked ? 'enabled' : 'disabled'}"
                            ${isPassiveUnlocked ? '' : 'disabled'}>
                        ${isPassiveUnlocked ? `🚀 开启专属分支：${branch.badge}` : `🔒 需完整拼合记忆解锁分支`}
                    </button>
                </div>
            </div>
        `;

        // 绑定专属分支进入按钮
        const btnLaunch = document.getElementById("btn-launch-exclusive-branch");
        if (btnLaunch && isPassiveUnlocked) {
            btnLaunch.onclick = () => {
                this.modalPersonaLog?.classList.add("hidden");
                this.startExclusiveBranch(branch.levelId);
            };
        }
    }

    startExclusiveBranch(levelId) {
        if (!levelId) return;
        // 自动解锁此专属关卡并启动新游戏
        this.saveSystem.unlockLevels([levelId]);
        this.screenMenu?.classList.add("hidden");
        this.startNewGame(levelId);
    }
}



    // =========================================================================
    // 游戏自启动引导入口
    // 挂载全局对象以便于调试和扩展
    window.CharacterRegistry = CharacterRegistry;
    window.LevelRegistry = LevelRegistry;
    window.WorldviewConfig = WorldviewConfig;
    window.StaminaConfig = StaminaConfig;
    window.EveningTriggerConfig = EveningTriggerConfig;
    window.AudioConfig = AudioConfig;
    window.Sound = Sound;
    window.UnlockEvaluator = UnlockEvaluator;
    window.DiaryUI = DiaryUI;
    window.MASTER_ROOM_DEFS = MASTER_ROOM_DEFS;
    window.MASTER_CONNECTIONS = MASTER_CONNECTIONS;
    window.getNpcRoomDefs = getNpcRoomDefs;
    window.buildSpaceshipLevelMap = buildSpaceshipLevelMap;

    function bootstrap() {
        if (!window.gameApp) {
            console.log("[DOPPELGANGER] 启动游戏主引擎...");
            window.gameApp = new GameEngine();
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bootstrap);
    } else {
        bootstrap();
    }
})();
