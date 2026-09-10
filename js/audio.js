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
        const soundUrl = customUrl || (typeof AudioConfig !== 'undefined' && AudioConfig.foodSoundUrl) || "assets/audio/food.wav";
        const volume = (typeof AudioConfig !== 'undefined' && AudioConfig.foodSoundVolume !== undefined) ? AudioConfig.foodSoundVolume : 0.80;
        this.playAudioFile(soundUrl, volume, this.synthesizeFoodChime, "物资获取音效");
    }

    // 9. 广播警报/危险警告专属音效 (支持自定义 警告.wav + Web Audio 红警蜂鸣双音保底)
    playAlarmSound(customUrl = null) {
        const soundUrl = customUrl || (typeof AudioConfig !== 'undefined' && AudioConfig.alarmSoundUrl) || "assets/audio/alarm.wav";
        const volume = (typeof AudioConfig !== 'undefined' && AudioConfig.alarmSoundVolume !== undefined) ? AudioConfig.alarmSoundVolume : 0.85;
        this.playAudioFile(soundUrl, volume, this.synthesizeAlarmKlaxon, "广播警报音效");
    }

    // 10. 移动探索位移专属音效 (支持自定义 移动.wav + Web Audio 气动步进音保底)
    playMoveSound(customUrl = null) {
        const now = Date.now();
        if (this.lastMoveSoundTime && now - this.lastMoveSoundTime < 120) return;
        this.lastMoveSoundTime = now;

        const soundUrl = customUrl || (typeof AudioConfig !== 'undefined' && AudioConfig.moveSoundUrl) || "assets/audio/move.wav";
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

export const Sound = new SoundEngine();

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

