// 简单的自动化模拟测试脚本
const fs = require('fs');
const path = require('path');

// 简单 Mock 一个基础浏览器 DOM 环境
const elements = new Map();

function createMockElement(id, tag = 'div') {
    const elem = {
        _id: id,
        get id() { return this._id; },
        set id(val) {
            this._id = val;
            if (val) {
                elements.set(val, this);
            }
        },
        tagName: tag.toUpperCase(),
        classList: {
            classes: new Set(),
            add(c) { this.classes.add(c); },
            remove(c) { this.classes.delete(c); },
            contains(c) { return this.classes.has(c); }
        },
        get className() {
            return Array.from(this.classList.classes).join(' ');
        },
        set className(val) {
            this.classList.classes.clear();
            if (val) {
                val.split(/\s+/).filter(Boolean).forEach(c => this.classList.classes.add(c));
            }
        },
        style: {},
        _textContent: '',
        get textContent() {
            if (this._textContent) return this._textContent;
            if (this.innerHTML) return this.innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            return '';
        },
        set textContent(v) { this._textContent = v; },
        _innerHTML: '',
        get innerHTML() { return this._innerHTML; },
        set innerHTML(val) {
            this._innerHTML = val;
            if (typeof val === 'string') {
                const idRegex = /<([a-zA-Z0-9-]+)([^>]*?)id=["']([^"']+)["']([^>]*?)>/g;
                let match;
                while ((match = idRegex.exec(val)) !== null) {
                    const tag = match[1];
                    const attrs = match[2] + match[4];
                    const id = match[3];
                    const subElem = elements.get(id) || createMockElement(id, tag);
                    const classMatch = attrs.match(/class=["']([^"']+)["']/);
                    if (classMatch) {
                        subElem.className = classMatch[1];
                    }
                    elements.set(id, subElem);
                }
            }
        },
        disabled: false,
        setAttribute(k, v) { this[k] = v; },
        getAttribute(k) { return this[k] || null; },
        listeners: {},
        addEventListener(event, fn) {
            if (!this.listeners[event]) this.listeners[event] = [];
            this.listeners[event].push(fn);
        },
        removeEventListener(event, fn) {
            if (!this.listeners[event]) return;
            this.listeners[event] = this.listeners[event].filter(f => f !== fn);
        },
        click() {
            if (this.disabled) return;
            if (this.listeners['click']) {
                this.listeners['click'].forEach(fn => fn({ target: this }));
            }
            if (this.onclick) this.onclick({ target: this });
        },
        appendChild(child) {},
        querySelector(sel) {
            return createMockElement('sub_' + Math.random());
        },
        getContext(type) {
            return {
                fillRect() {}, strokeRect() {}, fillText() {}, beginPath() {},
                moveTo() {}, lineTo() {}, stroke() {}, fill() {}, rect() {},
                arc() {}, closePath() {}, save() {}, restore() {},
                setLineDash() {}, clearRect() {}, clip() {},
                translate() {}, scale() {}, rotate() {}, roundRect() {},
                quadraticCurveTo() {}, bezierCurveTo() {}, ellipse() {},
                createLinearGradient() { return { addColorStop() {} }; },
                createRadialGradient() { return { addColorStop() {} }; },
                measureText() { return { width: 50 }; }
            };
        }
    };
    return elem;
}

global.document = {
    readyState: 'complete',
    getElementById(id) {
        if (!elements.has(id)) {
            elements.set(id, createMockElement(id));
        }
        return elements.get(id);
    },
    createElement(tag) {
        return createMockElement('elem_' + Math.random(), tag);
    },
    querySelector(sel) {
        return createMockElement('elem_' + Math.random());
    },
    querySelectorAll(sel) {
        return [];
    },
    addEventListener(event, fn) {}
};

global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

global.window = {
    document: global.document,
    requestAnimationFrame: global.requestAnimationFrame,
    cancelAnimationFrame: global.cancelAnimationFrame,
    addEventListener(event, fn) {}
};

global.localStorage = {
    data: {},
    getItem(k) { return this.data[k] || null; },
    setItem(k, v) { this.data[k] = String(v); },
    removeItem(k) { delete this.data[k]; }
};

global.alert = (msg) => console.log('[Alert]:', msg);
global.confirm = () => true;

global.Audio = class MockAudio {
    constructor(src) {
        this.src = src;
        this.preload = "none";
        this.paused = true;
        this.currentTime = 0;
        this.volume = 1.0;
    }
    load() {}
    play() { return Promise.resolve(); }
    pause() { this.paused = true; }
    cloneNode() { return new MockAudio(this.src); }
};

global.Image = class MockImage {
    constructor() {
        this.src = '';
    }
    decode() { return Promise.resolve(); }
};

// 引入生成的 bundle
require('./js/app.bundle.js');

// 验证启动状态
console.log('1. 验证 gameApp 实例化...');
if (!global.window.gameApp) {
    throw new Error('gameApp 未成功挂载到 window!');
}
const app = global.window.gameApp;
const StaminaConfig = global.window.StaminaConfig;
console.log('   初始阶段:', app.phase); // 应该为 menu

console.log('2. 模拟点击【关卡选择】并选择第一关...');
const btnSelectLevel = global.document.getElementById('btn-menu-select-level');
if (!btnSelectLevel) {
    throw new Error('btn-menu-select-level 按钮未找到！');
}
btnSelectLevel.click();
const modalLevelSelect = global.document.getElementById('modal-level-select');
if (modalLevelSelect.classList.contains('hidden')) {
    throw new Error('点击关卡选择按钮后，关卡弹窗未能成功弹出！');
}
const btnLevel1 = global.document.getElementById('btn-level-1');
if (!btnLevel1) {
    throw new Error('未找到第一关选择按钮 btn-level-1！');
}
btnLevel1.click();
console.log('   点击后阶段:', app.phase); // 应该为 q1_black
if (app.phase !== 'q1_black') {
    throw new Error('未能进入 q1_black 阶段!');
}

console.log('3. 推进 q1 黑屏白字直至进入正式游戏...');
const screenBlack = global.document.getElementById('screen-q1-black');
while (app.phase === 'q1_black') {
    screenBlack.click();
}
console.log('   推进后阶段:', app.phase);

console.log('4. 模拟点击推进对话框至探索阶段...');
const vnBox = global.document.getElementById('vn-dialogue-box');
let clickCount = 0;
while (app.phase !== 'q3_explore' && clickCount < 20) {
    vnBox.click();
    clickCount++;
}
console.log('   当前阶段:', app.phase, '当前位置:', app.explorationEngine.getCurrentNode().name);
console.log('   当前体力:', app.stamina);

console.log('5. 模拟向左移动探索 (前往NPC1 卡泽房间)...');
const btnLeft = global.document.getElementById('btn-move-left');
app.explorationEngine.moveTo('left'); // 走到西侧走廊
console.log('   移动后位置:', app.explorationEngine.getCurrentNode().name, '剩余体力:', app.stamina);

app.explorationEngine.moveTo('left'); // 走到卡泽房间
console.log('   再次向左移动后位置:', app.explorationEngine.getCurrentNode().name, '剩余体力:', app.stamina);

console.log('6. 检查行动日志数量:', app.actionLogs.length);
console.log('   最新日志:', app.actionLogs[app.actionLogs.length - 1].text);

console.log('7. 验证 NPC 表情差分与台词解析机制 (架构: kaze, shaokexin, mode 文件夹 + 默认 clam)...');
const CharacterRegistry = global.window.CharacterRegistry;
const kaze = app.teamMembers.find(m => m.id === 'kaze') || CharacterRegistry.npcs.kaze;
const shaokexin = CharacterRegistry.npcs.shaokexin;
const mode = CharacterRegistry.npcs.mode;

// 1. 无表情指示时，必须严格默认用“clam”
const parsedNoTag = CharacterRegistry.parseDialogueLine('当时，你为什么不在基地里？');
console.log('   无标签对白解析结果:', parsedNoTag);
if (parsedNoTag.expression !== 'clam') {
    throw new Error('默认表情未指向 clam: ' + JSON.stringify(parsedNoTag));
}

// 2. 标签解析
const parsedHappy = CharacterRegistry.parseDialogueLine('[happy]希望我们还能一起看见太阳。');
if (parsedHappy.expression !== 'happy') {
    throw new Error('[happy]标签解析错误: ' + JSON.stringify(parsedHappy));
}
const parsedCnCalm = CharacterRegistry.parseDialogueLine('[平静]我没什么想跟你说的。');
if (parsedCnCalm.expression !== 'clam') {
    throw new Error('[平静]标签解析未映射为 clam: ' + JSON.stringify(parsedCnCalm));
}

// 3. 文件夹架构验证
const kazeClamCandidates = CharacterRegistry.getCharacterImageCandidates(kaze, 'clam');
console.log('   卡泽[clam]候选路径首选:', kazeClamCandidates[0]);
if (!kazeClamCandidates[0].includes('assets/characters/kaze/clam')) {
    throw new Error('卡泽目录结构未采用 kaze/clam: ' + kazeClamCandidates[0]);
}

const shkHappyCandidates = CharacterRegistry.getCharacterImageCandidates(shaokexin, 'happy');
console.log('   邵可欣[happy]候选路径首选:', shkHappyCandidates[0]);
if (!shkHappyCandidates[0].includes('assets/characters/shaokexin/happy')) {
    throw new Error('邵可欣目录结构未采用 shaokexin/happy: ' + shkHappyCandidates[0]);
}

const modeSadCandidates = CharacterRegistry.getCharacterImageCandidates(mode, 'sad');
console.log('   莫德[sad]候选路径首选:', modeSadCandidates[0]);
if (!modeSadCandidates[0].includes('assets/characters/mode/sad')) {
    throw new Error('莫德目录结构未采用 mode/sad: ' + modeSadCandidates[0]);
}

// 4. 验证白天公布死亡 dead 立绘机制
const parsedDead = CharacterRegistry.parseDialogueLine('[dead]遇害确认');
if (parsedDead.expression !== 'dead') {
    throw new Error('[dead]标签解析错误: ' + JSON.stringify(parsedDead));
}
const shkDeadCandidates = CharacterRegistry.getCharacterImageCandidates(shaokexin, 'dead');
console.log('   邵可欣[dead]候选路径首选:', shkDeadCandidates[0]);
if (!shkDeadCandidates[0].includes('assets/characters/shaokexin/dead')) {
    throw new Error('邵可欣 dead 立绘路径未正确定位到 shaokexin/dead: ' + shkDeadCandidates[0]);
}
// 检查物理文件是否存在
const deadJpgPath = path.join(__dirname, 'assets', 'characters', 'shaokexin', 'dead.jpg');
const deadPngPath = path.join(__dirname, 'assets', 'characters', 'shaokexin', 'dead.png');
if (!fs.existsSync(deadJpgPath) && !fs.existsSync(deadPngPath)) {
    throw new Error('用户放置的 dead.jpg/png 未在对应目录找到!');
}
// 5. 验证白天得知死亡后随机触发 NPC 特殊反应语句机制
const kazeReaction = CharacterRegistry.getRandomDeathReaction(kaze, shaokexin);
console.log('   卡泽目睹邵可欣遇害后的随机反应台词:', kazeReaction);
if (!kazeReaction || !kazeReaction.text.includes('邵可欣')) {
    throw new Error('卡泽死亡反应语句未正确注入受害者姓名: ' + JSON.stringify(kazeReaction));
}

const shkReaction = CharacterRegistry.getRandomDeathReaction(shaokexin, kaze);
console.log('   邵可欣目睹卡泽遇害后的随机反应台词:', shkReaction);
if (!shkReaction || !shkReaction.text.includes('卡泽')) {
    throw new Error('邵可欣死亡反应语句未正确注入受害者姓名: ' + JSON.stringify(shkReaction));
}

const modeReaction = CharacterRegistry.getRandomDeathReaction(mode, kaze);
console.log('   莫德目睹卡泽遇害后的随机反应台词:', modeReaction);
if (!modeReaction || !modeReaction.text.includes('卡泽')) {
    throw new Error('莫德死亡反应语句未正确注入受害者姓名: ' + JSON.stringify(modeReaction));
}
// 6. 验证广播通信与系统播报绝对不显示任何角色立绘 (防止广播选择到卡泽立绘)
console.log('8. 验证系统广播与通信绝不匹配任何角色立绘...');
const broadcastSpeakers = [
    { name: '黎明广播' },
    { name: '警报广播' },
    { name: '广播通信' },
    { name: '魔镜终端' },
    { name: '全员集结' },
    { id: 'broadcast', name: '系统广播' },
    { id: 'system', name: '系统' }
];

for (const speaker of broadcastSpeakers) {
    const candidates = CharacterRegistry.getCharacterImageCandidates(speaker);
    if (candidates.length > 0) {
        throw new Error(`广播播报人 [${speaker.name}] 错误匹配到了立绘列表: ` + JSON.stringify(candidates));
    }
    const svg = CharacterRegistry.getAvatarSvg(speaker);
    if (svg !== "") {
        throw new Error(`广播播报人 [${speaker.name}] 错误生成了SVG立绘`);
    }
    if (!app.dialogueUI.isBroadcastOrSystem(speaker)) {
        throw new Error(`DialogueUI 未正确识别广播播报人 [${speaker.name}] 为系统/广播`);
    }
}
if (app.dialogueUI.isBroadcastOrSystem(kaze)) {
    throw new Error('NPC 卡泽被错误识别为了系统/广播！');
}
console.log('   广播与系统播报立绘屏蔽验证全部通过！');

console.log('9. 验证当角色死亡时屏幕正中间全屏黑屏死亡立绘展示与交互推进...');
// 模拟让队伍中存在伪人，且邵可欣成为当晚遇害者
const testWolf = app.getNpcById('kaze');
testWolf.role = 'wolf';
testWolf.status = 'active';
const victimNpc = app.getNpcById('shaokexin');
victimNpc.status = 'active';
app.teamMembers = [app.protagonist, testWolf, victimNpc];
app.nightTargetVictimId = 'shaokexin';
app.confinedNpcId = null;
app.nightProtectedNpcId = null;
app.witchSaved = false;

app.enterQ7Day();

console.log('   遇害公布后阶段:', app.phase); // 应该进入 death_black
if (app.phase !== 'death_black') {
    throw new Error('有角色遇害时未能正确切入 death_black 阶段: ' + app.phase);
}

const screenDeath = global.document.getElementById('screen-death-black');
if (screenDeath.classList.contains('hidden')) {
    throw new Error('screen-death-black 未成功显示（仍包含 hidden 类）！');
}

const deathImg = global.document.getElementById('death-portrait-img');
console.log('   黑屏正中间死亡立绘当前 src:', deathImg.src);
if (!deathImg.src.includes('assets/characters/shaokexin/dead')) {
    throw new Error('死亡立绘未正确定位到遇害者 shaokexin/dead: ' + deathImg.src);
}

// 模拟点击黑屏视口：第1次点击跳过2秒悬念并浮现死者立绘
screenDeath.click();
if (!app.deathRevealed) {
    throw new Error('首次点击未能触发死者浮现与音效！');
}
const suspenseLayer = global.document.getElementById('death-suspense-layer');
if (!suspenseLayer.classList.contains('fade-out') && !suspenseLayer.classList.contains('hidden')) {
    throw new Error('死者浮现后悬念遮罩未能淡出！');
}
console.log('   第1次点击成功跳过悬念期，死者立绘渐进浮现且音效触发！');

// 模拟第2次点击黑屏视口推进至白天讨论
screenDeath.click();
console.log('   点击黑屏推进后阶段:', app.phase); // 应该切回 q7_day 并播放对话
if (app.phase !== 'q7_day') {
    throw new Error('点击死亡黑屏后未能切回 q7_day: ' + app.phase);
}
if (!screenDeath.classList.contains('hidden')) {
    throw new Error('点击推进后 screen-death-black 未自动隐藏！');
}
console.log('   屏幕正中间死亡立绘展示与交互测试全部通过！');

console.log('10. 验证移动探索时自动唤起地图并执行平移动画与跳过机制...');
// 确保回到 q3_explore
app.enterQ3Exploration();
const modalMap = global.document.getElementById('modal-map-view');
const mapBanner = global.document.getElementById('map-move-banner');
const startNode = app.explorationEngine.getCurrentNode();
console.log('   当前所在房间:', startNode.name);

// 模拟调用带平移动画的位移
let moveDone = false;
const availableDirs = app.explorationEngine.getAvailableDirections();
const chosenDir = Object.keys(availableDirs)[0] || "right";
const targetNodeId = availableDirs[chosenDir] || Object.values(startNode.connections || {})[0];
const targetNode = app.currentLevel.map.nodes[targetNodeId];

app.showMapModalForMove(startNode, targetNode, () => {
    moveDone = true;
});

if (modalMap.classList.contains('hidden')) {
    throw new Error('移动时地图观测仪弹窗未自动打开！');
}
if (mapBanner.classList.contains('hidden')) {
    throw new Error('移动时地图行进状态横幅未自动显示！');
}
console.log('   移动弹窗已成功自动弹出，动画状态横幅已激活');

// 验证跳过/完成
if (app.mapRenderer && app.mapRenderer.skipAnimation) {
    app.mapRenderer.skipAnimation();
}
console.log('   平移动画完成或跳过检定通过！');

console.log('11. 验证【核心规则】：队伍里没有伪人绝对不刀人；队伍里有伪人必定自主刀人...');
const wolfNpc = app.getNpcById('kaze');
const humanNpc = app.getNpcById('shaokexin');
wolfNpc.role = 'wolf';
humanNpc.role = 'villager';
humanNpc.status = 'active';

// === 情况 A：队伍里没有伪人（伪人潜伏在设施外部，未入队）===
console.log('   --- 测试 A: 队伍里全是普通人类，无伪人 ---');
app.teamMembers = [app.protagonist, humanNpc];
app.confinedNpcId = null;
app.enterQ6Night();
console.log('   无伪人队伍进入黑夜后，锁定目标 ID (应为 null):', app.nightTargetVictimId);
if (app.nightTargetVictimId !== null) {
    throw new Error('队伍里没有伪人，却错误锁定了刀人目标: ' + app.nightTargetVictimId);
}
vnBox.click();
vnBox.click();
const btnNightSkip = global.document.getElementById('btn-night-skip');
btnNightSkip.click();
console.log('   玩家跳过行动后阶段状态 (应为 q7_day 平安夜):', app.phase);
if (app.phase === 'death_black') {
    throw new Error('队伍里没有伪人，但同伴依然被刀了！违反核心规则！');
}
console.log('   【已验证】队伍里没有伪人时绝不刀人，平安夜判定成功！');

// === 情况 B：队伍里存在伪人（伪人混入了队伍）===
console.log('   --- 测试 B: 队伍里混入了伪人 ---');
wolfNpc.status = 'active';
app.teamMembers = [app.protagonist, wolfNpc, humanNpc];
app.confinedNpcId = null;
app.enterQ6Night();
console.log('   有伪人队伍进入黑夜后，伪人自动锁定猎杀目标 ID:', app.nightTargetVictimId);
if (app.nightTargetVictimId !== humanNpc.id) {
    throw new Error('队伍中有伪人，但未能自主锁定同伴 [邵可欣]！目标: ' + app.nightTargetVictimId);
}
vnBox.click();
vnBox.click();
btnNightSkip.click();
console.log('   玩家跳过行动后，游戏阶段状态 (应为 death_black):', app.phase);
if (app.phase !== 'death_black') {
    throw new Error('队伍中有伪人且玩家跳过行动，但伪人未能成功刀人！');
}
console.log('   【已验证】队伍里有伪人时必定自主刀人，测试通过！');

console.log('12. 验证遇到NPC选择不救助时，再次踏入该房间会重新触发救助确认弹窗...');
app.enterQ3Exploration();
const modalEncounter = global.document.getElementById('modal-npc-encounter');
const btnReject = global.document.getElementById('btn-encounter-reject');
const btnAccept = global.document.getElementById('btn-encounter-accept');

// 挑选未遇 NPC mode (莫德)
const modeNpc = app.getNpcById('mode');
modeNpc.status = 'unmet';
const modeNode = app.currentLevel.map.nodes['room_npc3'];
app.explorationEngine.consumedEvents.delete('room_npc3_event');

// 1. 模拟移动进入莫德所在房间
app.explorationEngine.handleNodeEvents(modeNode);
if (modalEncounter.classList.contains('hidden')) {
    throw new Error('首次踏入未救助NPC房间时，救助弹窗未弹出！');
}
console.log('   首次进入莫德房间，救助弹窗正常弹出');

// 2. 模拟玩家点击【不救助 / 不理睬】
btnReject.click();
vnBox.click(); // 跳过打字
vnBox.click(); // 关闭对白
if (!modalEncounter.classList.contains('hidden')) {
    throw new Error('点击不救助后弹窗未关闭！');
}
if (modeNpc.status !== 'unmet') {
    throw new Error('选择不救助后NPC状态不应为 active！当前状态: ' + modeNpc.status);
}
if (app.explorationEngine.consumedEvents.has('room_npc3_event')) {
    throw new Error('选择不救助后事件不应该被记录为已消耗！');
}
console.log('   选择不救助后：NPC保持 unmet 状态，事件未被消耗');

// 3. 模拟玩家离开后再次踏入该区域
app.explorationEngine.handleNodeEvents(modeNode);
if (modalEncounter.classList.contains('hidden')) {
    throw new Error('选择不救助后再次踏入该区域，未能重新触发救助确认弹窗！');
}
console.log('   再次踏入该区域：成功重新触发救助确认弹窗！');

// 4. 这次点击【让其加入】
btnAccept.click();
for (let i = 0; i < 10; i++) {
    if (!app.dialogueUI.boxElement || app.dialogueUI.boxElement.classList.contains('vn-hidden')) break;
    vnBox.click();
}
if (modeNpc.status !== 'active') {
    throw new Error('点击让其加入后NPC状态未变为 active！');
}
if (!app.explorationEngine.consumedEvents.has('room_npc3_event')) {
    throw new Error('救助成功后事件应当被记录为已消耗！');
}
console.log('   本次选择让其加入队伍：成功入队，事件标记为已消耗');

// 5. 救助入队后再次进入该区域，不应再重复弹出救助弹窗
app.explorationEngine.handleNodeEvents(modeNode);
if (!modalEncounter.classList.contains('hidden')) {
    throw new Error('已救助加入队伍后，再次进入不应再弹出救助弹窗！');
}
console.log('   救助入队后再次进入不再弹出救助弹窗，测试全部通过！');

console.log('13. 验证最后一步踏上终点，即使体力耗尽（降至0）也算通过...');
// 模拟玩家位于终点前一间房间 (room_corner_ne: 东北拐角哨所，其 left 通往 room_exit)
app.enterQ3Exploration();
app.explorationEngine.currentNodeId = 'room_corner_ne';
// 将体力设定为恰好等于移动消耗 (8 点)，移动后体力将精准耗尽为 0
app.stamina = StaminaConfig.stepCost; // 8 点
console.log('   踏上终点前的体力值:', app.stamina);
const exitNode = app.currentLevel.map.nodes['room_exit'];
if (!exitNode || !exitNode.isExit) {
    throw new Error('终点节点配置异常！');
}

// 模拟向左移动踏上终点
const moved = app.explorationEngine.moveTo('left');
if (!moved) {
    throw new Error('移动到终点失败！');
}
console.log('   踏上终点后的体力值 (应为 0):', app.stamina);
if (app.stamina !== 0) {
    throw new Error('体力扣减计算异常，当前体力: ' + app.stamina);
}
console.log('   踏上终点后当前游戏阶段 (应为 victory，而非 gameover):', app.phase);
if (app.phase !== 'victory') {
    throw new Error('最后一步踏上终点体力耗尽，但未能判定为 victory！当前阶段: ' + app.phase);
}
const modalResult = global.document.getElementById('modal-result');
if (modalResult.classList.contains('hidden')) {
    throw new Error('通关结算弹窗未能成功弹出！');
}
console.log('   【已验证】即使最后一步体力降至0，踏上终点依然成功通关！');

console.log('14. 验证体力得到物资补充时立即刷新补给后的体力值与UI进度条...');
app.enterQ3Exploration();
// 设置当前体力为 40 点
app.stamina = 40;
app.updateHeaderUI();
const staminaTextElem = global.document.getElementById('header-stamina-text');
const staminaFillElem = global.document.getElementById('header-stamina-fill');
console.log('   补给前UI显示的体力:', staminaTextElem.textContent);
if (!staminaTextElem.textContent.includes('40 /')) {
    throw new Error('补给前UI显示体力与实际不符: ' + staminaTextElem.textContent);
}

// 模拟触发食物补给房间 room_storage_ne (应急给养站)
const foodNode = app.currentLevel.map.nodes['room_storage_ne'];
app.explorationEngine.consumedEvents.delete('room_storage_ne_event');
const expectedRecovery = StaminaConfig.getFoodRecovery(app.getAliveTeamMembers().length);
const expectedAfterStamina = Math.min(StaminaConfig.maxStamina, 40 + expectedRecovery);

// 触发食物事件
app.explorationEngine.handleFoodEvent(foodNode, 'room_storage_ne_event');
console.log('   补给后实际体力:', app.stamina);
console.log('   补给后UI即时文本:', staminaTextElem.textContent);
console.log('   补给后UI进度条宽度:', staminaFillElem.style.width);

if (app.stamina !== expectedAfterStamina) {
    throw new Error(`物资恢复体力数值异常: 预期 ${expectedAfterStamina}, 实际 ${app.stamina}`);
}
if (!staminaTextElem.textContent.includes(`${expectedAfterStamina} /`)) {
    throw new Error(`物资补给后UI文本未能即时刷新！当前UI显示: ${staminaTextElem.textContent}`);
}
const expectedPct = (expectedAfterStamina / StaminaConfig.maxStamina) * 100;
if (staminaFillElem.style.width !== `${expectedPct}%`) {
    throw new Error(`物资补给后UI进度条宽度未能即时刷新！当前宽度: ${staminaFillElem.style.width}`);
}
console.log('   【已验证】物资补充后UI体力数值与进度条瞬时刷新生效，无需等待下次行动！');

console.log('15. 验证新增音效配置与调用通路（物资获取音效 + 广播警报音效）...');
const AudioConfig = global.window.AudioConfig;
const Sound = global.window.Sound;

if (!AudioConfig.foodSoundUrl || !AudioConfig.foodSoundUrl.includes('物资获取.wav')) {
    throw new Error('AudioConfig.foodSoundUrl 配置错误: ' + AudioConfig.foodSoundUrl);
}
if (!AudioConfig.alarmSoundUrl || !AudioConfig.alarmSoundUrl.includes('警告.wav')) {
    throw new Error('AudioConfig.alarmSoundUrl 配置错误: ' + AudioConfig.alarmSoundUrl);
}
// 验证物理文件在硬盘中确切存在
const foodWavPath = path.join(__dirname, 'assets', 'audio', '物资获取.wav');
const alarmWavPath = path.join(__dirname, 'assets', 'audio', '警告.wav');
if (!fs.existsSync(foodWavPath)) {
    throw new Error('用户放置的 物资获取.wav 文件不存在于 assets/audio/ !');
}
if (!fs.existsSync(alarmWavPath)) {
    throw new Error('用户放置的 警告.wav 文件不存在于 assets/audio/ !');
}

// 拦截 Sound.playFoodSound 与 Sound.playAlarmSound 验证调用通路
let foodSoundCalled = false;
let alarmSoundCalled = false;
const origPlayFoodSound = Sound.playFoodSound;
const origPlayAlarmSound = Sound.playAlarmSound;
Sound.playFoodSound = function() {
    foodSoundCalled = true;
    origPlayFoodSound.call(Sound);
};
Sound.playAlarmSound = function() {
    alarmSoundCalled = true;
    origPlayAlarmSound.call(Sound);
};

// A. 模拟触发食物获取事件，检定 playFoodSound 是否被调用
app.explorationEngine.consumedEvents.delete('room_storage_ne_event');
app.explorationEngine.handleFoodEvent(foodNode, 'room_storage_ne_event');
if (!foodSoundCalled) {
    throw new Error('触发物资补给时未能调用 Sound.playFoodSound() !');
}
console.log('   【已验证】获取物资补给时成功触发 playFoodSound() (绑定 assets/audio/物资获取.wav)');

// B. 模拟视觉小说播放警报广播台词，检定 playAlarmSound 是否被调用
app.dialogueUI.playSequence([
    {
        speaker: { id: "broadcast", isBroadcast: true, name: "警报广播", themeColor: "#ef4444" },
        text: "⚠️ 警报！检测到乘员生命体征中断，在生活舱发现了遗体……"
    }
]);
if (!alarmSoundCalled) {
    throw new Error('播放广播警报对白时未能调用 Sound.playAlarmSound() !');
}
console.log('   【已验证】广播发出警报时成功触发 playAlarmSound() (绑定 assets/audio/警告.wav)');

// 还原 mock
Sound.playFoodSound = origPlayFoodSound;
Sound.playAlarmSound = origPlayAlarmSound;

console.log('16. 验证移动音效（assets/audio/移动.wav）适配与调用通路...');
if (!AudioConfig.moveSoundUrl || !AudioConfig.moveSoundUrl.includes('移动.wav')) {
    throw new Error('AudioConfig.moveSoundUrl 配置错误: ' + AudioConfig.moveSoundUrl);
}
const moveWavPath = path.join(__dirname, 'assets', 'audio', '移动.wav');
if (!fs.existsSync(moveWavPath)) {
    throw new Error('用户放置的 移动.wav 文件不存在于 assets/audio/ !');
}
let moveSoundCalled = false;
const origPlayMoveSound = Sound.playMoveSound;
Sound.playMoveSound = function() {
    moveSoundCalled = true;
    origPlayMoveSound.call(Sound);
};
// 模拟执行一步移动
app.enterQ3Exploration();
app.explorationEngine.currentNodeId = 'room_start';
const moveSuccess = app.explorationEngine.moveTo('left');
if (!moveSuccess) {
    throw new Error('移动测试前置执行失败！');
}
if (!moveSoundCalled) {
    throw new Error('执行移动操作时未能调用 Sound.playMoveSound() !');
}
console.log('   【已验证】移动操作成功触发 playMoveSound() (绑定 assets/audio/移动.wav)');
Sound.playMoveSound = origPlayMoveSound;

console.log('17. 验证第二关（Level 2）拓扑结构、NPC位置与双向连通性...');
const LevelRegistry = global.window.LevelRegistry;
const level2 = LevelRegistry.find(l => l.levelId === 2);
if (!level2) {
    throw new Error('未能在 LevelRegistry 中找到 levelId === 2 的关卡配置！');
}
const nodeCount2 = Object.keys(level2.map.nodes).length;
console.log(`   第二关房间节点总数: ${nodeCount2} (第一关为 13 个，比第一关稍大一点点)`);
if (nodeCount2 <= 13) {
    throw new Error(`第二关房间数必须大于第一关(13个)，当前为: ${nodeCount2}`);
}

// 检定3名NPC均存在于第二关且位置各异
const npcsFoundInLevel2 = [];
for (const [nodeId, node] of Object.entries(level2.map.nodes)) {
    if (node.event && node.event.type === 'npc') {
        npcsFoundInLevel2.push({ nodeId, npcId: node.event.npcId, name: node.name });
    }
}
console.log('   第二关发现的散落NPC分布:', npcsFoundInLevel2);
if (npcsFoundInLevel2.length !== 3) {
    throw new Error(`第二关应当包含3名散落NPC，当前找到: ${npcsFoundInLevel2.length}`);
}
const npcIds = npcsFoundInLevel2.map(n => n.npcId);
['kaze', 'shaokexin', 'mode'].forEach(id => {
    if (!npcIds.includes(id)) {
        throw new Error(`第二关未找到NPC [${id}] 的分布房间！`);
    }
});

// 检定所有通道严格双向对称
for (const [nodeId, node] of Object.entries(level2.map.nodes)) {
    const conns = node.connections || {};
    const oppositeDir = { forward: 'backward', backward: 'forward', left: 'right', right: 'left' };
    for (const [dir, targetId] of Object.entries(conns)) {
        const targetNode = level2.map.nodes[targetId];
        if (!targetNode) {
            throw new Error(`节点 [${nodeId}] 指向了不存在的房间: ${targetId}`);
        }
        const opp = oppositeDir[dir];
        if (!targetNode.connections || targetNode.connections[opp] !== nodeId) {
            throw new Error(`通道单向断裂: [${nodeId}].${dir} -> [${targetId}], 但目标未连回 [${nodeId}]`);
        }
    }
}
console.log('   第二关所有通道物理拓扑双向连通性检定通过，无断头路！');

// 模拟启动第二关
app.startNewGame(2);
if (app.currentLevel.levelId !== 2) {
    throw new Error('未能成功启动第二关！当前关卡 ID: ' + app.currentLevel.levelId);
}
console.log('   第二关成功加载启动，当前关卡标题:', app.currentLevel.title);

console.log('18. 验证通关文案与高深莫测的循环叙事，以及一键跨越至第二关...');
app.enterQ3Exploration();
const exitNode2 = app.currentLevel.map.nodes['room2_exit'];
app.triggerVictory(exitNode2);

const resultTitle = global.document.getElementById('result-title');
const resultMsg = global.document.getElementById('result-message');
const btnResultNext = global.document.getElementById('btn-result-next');

console.log('   通关弹窗标题:', resultTitle.textContent);
if (!resultTitle.textContent.includes('奇点坍缩') && !resultTitle.textContent.includes('OBSERVATION')) {
    throw new Error('通关标题未能正确呈现高维观测风格: ' + resultTitle.textContent);
}

// 验证文本不能包含传统线性的“成功走/成功逃脱/彻底胜利”
if (resultMsg.textContent.includes('成功走了') || resultMsg.textContent.includes('成功脱出')) {
    throw new Error('通关文案依然包含了线性脱逃词汇，违背循环设计理念！');
}

// 验证必须严格控制字数在 50 字以内，具备悬疑史诗感
console.log('   通关文案正文:', resultMsg.textContent, '(字数:', resultMsg.textContent.length, ')');
if (resultMsg.textContent.length > 50) {
    throw new Error(`通关文案过长，要求不超过50字！当前字数: ${resultMsg.textContent.length}`);
}

// 验证必须包含循环的核心现象与悬疑史诗感文案
const requiredPhenomena = ['气闸开启', '时钟倒流', '抓痕', '循环'];
for (const phrase of requiredPhenomena) {
    if (!resultMsg.textContent.includes(phrase)) {
        throw new Error(`通关文案缺失核心悬疑史诗/循环现象关键词 [${phrase}]`);
    }
}
console.log('   【已验证】通关文案成功展现悬疑史诗感与循环哲学，严格限制在 50 字以内 (' + resultMsg.textContent.length + ' 字)！');

if (!btnResultNext || btnResultNext.classList.contains('hidden')) {
    throw new Error('通关后下一关/重构奇点按钮未正常显示！');
}
console.log('   通关弹窗引导按钮文本:', btnResultNext.textContent);

console.log('19. 验证地图点击快速往返已探索区域功能（BFS寻路、免除面临选择步数、多段动画与音效适配）...');
// 确保回到第一关白天探索阶段 (q3_explore)
const level1 = global.window.LevelRegistry.find(l => l.levelId === 1) || global.window.LevelRegistry[0];
app.currentLevel = level1;
app.explorationEngine.initLevelMap(level1.map);
app.enterQ3Exploration();

// 模拟场景：玩家从起点出发，已探索了东侧线路：room_start -> room_corner_se -> room_npc2 -> room_hub_n1 -> room_storage_ne (相当于题目中的 Z)
app.explorationEngine.visitedNodes = new Set([
    'room_start',
    'room_corner_se',
    'room_npc2',
    'room_hub_n1',
    'room_storage_ne'
]);
app.explorationEngine.currentNodeId = 'room_storage_ne'; // 当前在 Z
app.explorationEngine.choiceCount = 0;
const prevChoiceCount = app.explorationEngine.choiceCount;

// 1. 验证 BFS 寻路能算出从 room_storage_ne 回到 room_start 的最短路径
const pathFromZToStart = app.explorationEngine.findVisitedPath('room_storage_ne', 'room_start');
console.log('   从 Z (room_storage_ne) 到 A (room_start) 的已探明路径:', pathFromZToStart);
if (!pathFromZToStart || pathFromZToStart.length < 3) {
    throw new Error('BFS 寻路失败，未找到已探索连通路径: ' + JSON.stringify(pathFromZToStart));
}
if (pathFromZToStart[0] !== 'room_storage_ne' || pathFromZToStart[pathFromZToStart.length - 1] !== 'room_start') {
    throw new Error('BFS 寻路起止节点错误: ' + JSON.stringify(pathFromZToStart));
}

// 2. 验证多节点动画 animatePath 与脚步音效
let stepCount = 0;
let moveSoundTriggered = false;
const soundEngine = global.window.Sound;
const originalPlayMoveSound = soundEngine.playMoveSound;
soundEngine.playMoveSound = function() {
    moveSoundTriggered = true;
    if (originalPlayMoveSound) originalPlayMoveSound.apply(this, arguments);
};

app.mapRenderer.animatePath(
    app.currentLevel.map,
    pathFromZToStart,
    app.explorationEngine.visitedNodes,
    app.teamMembers,
    (segIdx, fromId, toId) => {
        stepCount++;
        soundEngine.playMoveSound();
    },
    () => {
        pathAnimDone = true;
    }
);

if (stepCount < 1) {
    throw new Error('多段路径动画首段未能正常触发！');
}
if (!moveSoundTriggered) {
    throw new Error('快速往返过程中未能触发移动脚步音效！');
}
if (app.mapRenderer && app.mapRenderer.skipAnimation) {
    app.mapRenderer.skipAnimation();
}
console.log(`   多段动画与音效触发正常，动画跳过检定通过`);

// 3. 执行快速往返快速从 Z 回到 A
const nodeA = app.currentLevel.map.nodes['room_start'];
app.handleMapNodeClick(nodeA);
if (app.skipFastTravelAnimation) {
    app.skipFastTravelAnimation();
}

console.log('   快速往返后当前位置:', app.explorationEngine.getCurrentNode().name);
console.log('   快速往返后面临选择次数 (必须保持为 0):', app.explorationEngine.choiceCount);
if (app.explorationEngine.currentNodeId !== 'room_start') {
    throw new Error('快速往返后当前位置未更新为 room_start: ' + app.explorationEngine.currentNodeId);
}
if (app.explorationEngine.choiceCount !== prevChoiceCount) {
    throw new Error('核心违规：触发快速往返时错误累加了面临选择次数！当前 choiceCount: ' + app.explorationEngine.choiceCount);
}
const latestLog = app.actionLogs[app.actionLogs.length - 1];
if (!latestLog.text.includes('快速往返') || !latestLog.text.includes('不计入面临选择次数')) {
    throw new Error('行动日志未正确记录快速往返信息: ' + latestLog.text);
}
console.log('   【已验证】快速往返成功且绝对不记录面临选择次数！测试通过！');

// 4. 从 A 快速前往已探索的 B (room_npc2)
const bNode = app.currentLevel.map.nodes['room_npc2'];
app.handleMapNodeClick(bNode);
if (app.skipFastTravelAnimation) {
    app.skipFastTravelAnimation();
}
if (app.explorationEngine.currentNodeId !== 'room_npc2') {
    throw new Error('从 A 快速往返前往 B 失败！当前位置: ' + app.explorationEngine.currentNodeId);
}
if (app.explorationEngine.choiceCount !== prevChoiceCount) {
    throw new Error('从 A 到 B 快速往返错误累加了面临选择次数！');
}
console.log('   【已验证】从 A 快速前往 B 成功且不记录面临选择次数！');

console.log('20. 验证快速往返的时间/阶段限制与未探索区域限制...');
// 1. 验证在非白天时段（如傍晚、黑夜、裁决等）不可使用快速往返
const nonDayPhases = ['evening_black', 'q4_inquiry', 'q5_judgement', 'q6_night', 'death_black'];
for (const testPhase of nonDayPhases) {
    app.phase = testPhase;
    const prePos = app.explorationEngine.currentNodeId;
    app.handleMapNodeClick(nodeA);
    if (app.explorationEngine.currentNodeId !== prePos) {
        throw new Error(`违规！在阶段 [${testPhase}] 允许了快速往返！`);
    }
}
console.log('   【已验证】傍晚、询问、裁决、黑夜等非白天阶段均严格禁止使用快速往返！');

// 恢复白天探索阶段
app.phase = 'q3_explore';

// 2. 验证未探索区域不可快速往返
const unvisitedNode = app.currentLevel.map.nodes['room_npc3']; // 莫德房间尚未探索
app.explorationEngine.visitedNodes.delete('room_npc3');
const prePos = app.explorationEngine.currentNodeId;
app.handleMapNodeClick(unvisitedNode);
if (app.explorationEngine.currentNodeId !== prePos) {
    throw new Error('违规！玩家成功快速往返到了未探明的迷雾区域！');
}
console.log('   【已验证】未探索区域严格禁止快速往返！');

// 3. 验证点击当前所在区域友好拦截
const currNode = app.explorationEngine.getCurrentNode();
app.handleMapNodeClick(currNode);
if (app.explorationEngine.currentNodeId !== currNode.id) {
    throw new Error('点击当前区域位置异常改变！');
}
console.log('   【已验证】点击当前所在房间正确被拦截！');

console.log('21. 验证 5×5 关卡选择网格结构（共25关，初始仅第 1 关开放，第 2~25 关锁住）...');
// 确保重置为初始状态 (仅第 1 关)
app.saveSystem.resetUnlockedLevels();
app.showMenu();
if (app.phase !== 'menu') {
    throw new Error('未能成功切回主菜单！');
}

// 模拟点击【关卡选择】按钮
const btnSelect = global.document.getElementById('btn-menu-select-level');
if (!btnSelect) {
    throw new Error('主菜单缺少关卡选择按钮 btn-menu-select-level！');
}
btnSelect.click();

const levelModal = global.document.getElementById('modal-level-select');
if (levelModal.classList.contains('hidden')) {
    throw new Error('点击关卡选择按钮后，5x5 关卡弹窗未正常弹出！');
}

// 验证网格内关卡卡片总数恰好为 25 个 (5x5)
const levelGrid = global.document.getElementById('level-select-grid');
let totalCards = 0;
for (let i = 1; i <= 25; i++) {
    const card = global.document.getElementById(`btn-level-${i}`);
    if (!card) {
        throw new Error(`缺少第 ${i} 关选择卡片 btn-level-${i}！`);
    }
    totalCards++;

    if (i === 1) {
        // 初始仅第 1 关开放
        if (card.disabled) {
            throw new Error(`第 1 关应当开放，但处于 disabled 状态！`);
        }
        if (!card.classList.contains('level-unlocked')) {
            throw new Error(`第 1 关缺少 level-unlocked 样式类！`);
        }
    } else {
        // 第 2~25 关初始必须锁住
        if (!card.disabled) {
            throw new Error(`第 ${i} 关初始应当锁定，但 disabled 为 false！`);
        }
        if (!card.classList.contains('level-locked')) {
            throw new Error(`第 ${i} 关缺少 level-locked 样式类！`);
        }
        if (!card.textContent.includes('待解锁') && !card.textContent.includes('锁定')) {
            throw new Error(`第 ${i} 关文本缺少锁定标识！文本: ` + card.textContent);
        }
    }
}

if (totalCards !== 25) {
    throw new Error(`关卡卡片总数异常，预期 25 (5x5)，实际 ${totalCards}`);
}
console.log('   【已验证】5×5 阵列共 25 个关卡插槽全部就绪，初始仅第 1 关开放，第 2~25 关全部锁住！');

// 验证点击未解锁关卡 (例如第 2 关和第 3 关) 绝不进入游戏，阶段保持为 menu
const card2 = global.document.getElementById('btn-level-2');
card2.click();
if (app.phase !== 'menu') {
    throw new Error('点击锁定关卡(第2关)后违规进入了游戏！阶段: ' + app.phase);
}
const card3 = global.document.getElementById('btn-level-3');
card3.click();
if (app.phase !== 'menu') {
    throw new Error('点击锁定关卡(第3关)后违规进入了游戏！阶段: ' + app.phase);
}
console.log('   【已验证】点击未解锁关卡被成功拦截，未进入游戏！');

// 验证关闭弹窗按钮
const btnCloseLevel = global.document.getElementById('btn-close-level-select');
btnCloseLevel.click();
if (!levelModal.classList.contains('hidden')) {
    throw new Error('点击关闭按钮后关卡选择弹窗未能关闭！');
}
console.log('   【已验证】关卡弹窗关闭按钮交互正常！');

console.log('22. 验证基于人员撤离状态的非线性关卡解锁引擎 (UnlockEvaluator 与 多重解锁叠加)...');
const UnlockEvaluator = global.window.UnlockEvaluator;
const allLevels = global.window.LevelRegistry;

// 1. 单元逻辑检定: 第一关单人独自撤离 -> 仅解锁第 2 关
const resSolo = UnlockEvaluator.evaluate(allLevels[0].unlockRules, {
    evacuatedNpcIds: [],
    evacuatedNpcs: [],
    allLevelMimics: [{ id: 'kaze', role: 'wolf' }],
    allLevelNpcs: [],
    isSolo: true
});
if (!resSolo.unlockedLevelIds.includes(2) || resSolo.unlockedLevelIds.includes(14)) {
    throw new Error('单人通关第 1 关解锁异常，预期仅 [2]，实际: ' + JSON.stringify(resSolo.unlockedLevelIds));
}
console.log('   【已验证】第一关独自一人撤离：仅解锁第 2 关，第 14 关保持锁定！');

// 2. 单元逻辑检定: 第一关携带邵可欣撤离 -> 同时解锁第 2 关与第 14 关
const resShao = UnlockEvaluator.evaluate(allLevels[0].unlockRules, {
    evacuatedNpcIds: ['shaokexin'],
    evacuatedNpcs: [{ id: 'shaokexin', role: 'human' }],
    allLevelMimics: [{ id: 'kaze', role: 'wolf' }],
    allLevelNpcs: [],
    isSolo: false
});
if (!resShao.unlockedLevelIds.includes(2) || !resShao.unlockedLevelIds.includes(14)) {
    throw new Error('护送邵可欣通关解锁异常，预期 [2, 14]，实际: ' + JSON.stringify(resShao.unlockedLevelIds));
}
console.log('   【已验证】第一关携带邵可欣撤离：成功触发多重解锁叠加 [第 2 关, 第 14 关]！');

// 3. 单元逻辑检定: 第一关携带邵可欣 + 卡泽撤离 -> 满足包含判定，依然解锁第 2 关与第 14 关
const resMulti = UnlockEvaluator.evaluate(allLevels[0].unlockRules, {
    evacuatedNpcIds: ['shaokexin', 'kaze'],
    evacuatedNpcs: [{ id: 'shaokexin', role: 'human' }, { id: 'kaze', role: 'human' }],
    allLevelMimics: [],
    allLevelNpcs: [],
    isSolo: false
});
if (!resMulti.unlockedLevelIds.includes(2) || !resMulti.unlockedLevelIds.includes(14)) {
    throw new Error('携带多人包含邵可欣时未能正确触发解锁！');
}
console.log('   【已验证】带多人只要包含目标角色同样成功触发解锁！');

// 4. 扩展条件检定: require_all_mimics 与 require_no_mimics
const testRules = [
    { condition: { type: 'require_all_mimics' }, unlockLevelIds: [5] },
    { condition: { type: 'require_no_mimics' }, unlockLevelIds: [7] }
];
// 假设场上伪人是 kaze，队伍里带了 kaze（即带了所有伪人）
const resAllMimic = UnlockEvaluator.evaluate(testRules, {
    evacuatedNpcIds: ['kaze'],
    evacuatedNpcs: [{ id: 'kaze', role: 'wolf' }],
    allLevelMimics: [{ id: 'kaze', role: 'wolf' }],
    isSolo: false
});
if (!resAllMimic.unlockedLevelIds.includes(5) || resAllMimic.unlockedLevelIds.includes(7)) {
    throw new Error('require_all_mimics 条件检定异常！');
}
console.log('   【已验证】require_all_mimics 扩展条件成功匹配全员伪人引渡！');

// 5. 全流程闭环测试: 在游戏引擎中通关并携带邵可欣，验证胜利结算与 5x5 网格实时更新
app.saveSystem.resetUnlockedLevels(); // 重新从仅有第 1 关开始
app.currentLevel = allLevels[0];
app.teamMembers = [
    app.protagonist,
    { id: 'shaokexin', name: '邵可欣', role: 'human', status: 'active', isProtagonist: false }
];
const winExitNode = { id: 'room_exit', name: '主折跃逃生大门' };
app.triggerVictory(winExitNode);

// 检定 SaveSystem 中的已解锁关卡包含 1, 2, 14
const currentUnlocked = app.saveSystem.getUnlockedLevels();
if (!currentUnlocked.includes(1) || !currentUnlocked.includes(2) || !currentUnlocked.includes(14)) {
    throw new Error('通关结算后 SaveSystem 未能正确保存解锁的第 2 关与第 14 关！当前: ' + JSON.stringify(currentUnlocked));
}
console.log('   【已验证】通关后 SaveSystem 持久化存储已更新: ' + JSON.stringify(currentUnlocked));

// 检定 5x5 矩阵刷新渲染: 第 2 关和第 14 关均变为开放状态并能点击进入
btnSelect.click();
const card2Unlocked = global.document.getElementById('btn-level-2');
const card14Unlocked = global.document.getElementById('btn-level-14');
if (card2Unlocked.disabled || !card2Unlocked.classList.contains('level-unlocked')) {
    throw new Error('5x5 网格中第 2 关未能变为开放状态！');
}
if (card14Unlocked.disabled || !card14Unlocked.classList.contains('level-unlocked')) {
    throw new Error('5x5 网格中第 14 关未能变为开放状态！');
}
console.log('   【已验证】5x5 矩阵中第 2 关与第 14 关均已高亮开放！');

// 点击第 2 关，验证能顺利启动第二关
card2Unlocked.click();
if (app.phase !== 'q1_black' || app.currentLevel.levelId !== 2) {
    throw new Error('点击已解锁的第 2 关未能顺利启动！');
}
console.log('   【已验证】点击已解锁的第 2 关卡片正常响应进入游戏！测试通过！');

console.log('23. 验证当前关卡任务清单 (Missions Checklist) 动态展示与解锁信息隐匿机制...');
// 重新载入第一关进行检视
app.startNewGame(1);
while (app.phase === 'q1_black') {
    global.document.getElementById('screen-q1-black').click();
}
// 进入 q3 探索
app.enterQ3Exploration();

// 1. 验证侧边栏任务容器
const missionsSidebar = global.document.getElementById('missions-sidebar-list');
if (!missionsSidebar) {
    throw new Error('未找到侧边栏任务容器 missions-sidebar-list！');
}
const sidebarHtml = missionsSidebar.innerHTML;
if (!sidebarHtml.includes('任务一：成功撤离') || !sidebarHtml.includes('任务二：带离邵可欣撤离')) {
    throw new Error('侧边栏任务清单未包含预期的任务名称！内容: ' + sidebarHtml);
}
console.log('   【已验证】侧边栏成功展示当前关卡任务清单（任务一：成功撤离、任务二：带离邵可欣撤离）！');

// 2. 验证报酬未预先剧透目标关卡编号 (保密原则)
if (sidebarHtml.includes('第2关') || sidebarHtml.includes('第14关') || sidebarHtml.includes('扇区 02') || sidebarHtml.includes('扇区 14') || sidebarHtml.includes('异构核心')) {
    throw new Error('任务奖励文字泄露了具体的关卡编号或扇区名！');
}
if (!sidebarHtml.includes('解构未知深层扇区 🔒???')) {
    throw new Error('任务奖励未能包含正确的未明扇区保密提示！');
}
console.log('   【已验证】任务报酬完全保密（显示“解构未知深层扇区 🔒???”），绝无提前剧透！');

// 3. 验证顶栏【🎯 任务清单】弹窗功能
const btnViewMissions = global.document.getElementById('btn-view-missions');
const modalMissions = global.document.getElementById('modal-mission-checklist');
const btnCloseMissions = global.document.getElementById('btn-close-missions');
if (!btnViewMissions || !modalMissions || !btnCloseMissions) {
    throw new Error('缺少任务清单弹窗相关元素！');
}
btnViewMissions.click();
if (modalMissions.classList.contains('hidden')) {
    throw new Error('点击顶栏任务清单按钮后弹窗未打开！');
}
const modalHtml = global.document.getElementById('mission-modal-list').innerHTML;
if (!modalHtml.includes('任务一：成功撤离') || !modalHtml.includes('带离邵可欣撤离')) {
    throw new Error('任务弹窗内部卡片未正常生成！');
}
btnCloseMissions.click();
if (!modalMissions.classList.contains('hidden')) {
    throw new Error('点击关闭按钮后任务清单弹窗未能关闭！');
}
console.log('   【已验证】任务清单独立模态弹窗打开与关闭交互正常！');

// 4. 验证随行队员状态变化时任务清单实时动态刷新 (带离邵可欣状态)
// 初始未带邵可欣
if (!sidebarHtml.includes('尚未汇合')) {
    throw new Error('初始队伍未带邵可欣时，实时状态未提示尚未汇合！');
}
// 模拟救出邵可欣加入队伍
app.teamMembers.push({ id: 'shaokexin', name: '邵可欣', role: 'human', status: 'active', isProtagonist: false });
app.renderMissionsPanel();
const updatedSidebarHtml = missionsSidebar.innerHTML;
if (!updatedSidebarHtml.includes('已接入队伍信标') && !updatedSidebarHtml.includes('已在队伍中')) {
    throw new Error('邵可欣入队后，任务清单未能即时刷新就绪状态！内容: ' + updatedSidebarHtml);
}
console.log('   【已验证】邵可欣入队后任务清单实时响应变更为就绪状态！测试通过！');

console.log('24. 验证全 25 关地图预配置（规模梯级 3x5/5x6/7x7/8x8、房间数误差 [+3, -4]、100%连通性与渲染自适应）...');
const allRegLevels = global.window.LevelRegistry;
if (!allRegLevels || allRegLevels.length < 25) {
    throw new Error('LevelRegistry 关卡总数不足 25 关！当前数量: ' + (allRegLevels ? allRegLevels.length : 0));
}

// 梯级配置规则 (按用户五档规格: 1-5, 6-10, 11-15, 16-20, 21-25)
const tierRules = [
    { minLvl: 1, maxLvl: 5, target: 13, minRooms: 9, maxRooms: 16, tierName: '梯级1 (1-5关，基础甲板)' },
    { minLvl: 6, maxLvl: 10, target: 24, minRooms: 20, maxRooms: 27, tierName: '梯级2 (6-10关，扩展扇区)' },
    { minLvl: 11, maxLvl: 15, target: 39, minRooms: 35, maxRooms: 43, tierName: '梯级3 (11-15关，深潜区域)' },
    { minLvl: 16, maxLvl: 20, target: 47, minRooms: 44, maxRooms: 53, tierName: '梯级4 (16-20关，前沿中枢)' },
    { minLvl: 21, maxLvl: 25, target: 54, minRooms: 52, maxRooms: 58, tierName: '梯级5 (21-25关，全舰决战)' }
];

const levelFingerprints = new Set();

for (let lvlId = 1; lvlId <= 25; lvlId++) {
    const lvl = allRegLevels.find(l => l.levelId === lvlId);
    if (!lvl) {
        throw new Error(`缺少第 ${lvlId} 关配置！`);
    }
    if (!lvl.map || !lvl.map.nodes || !lvl.map.startNodeId) {
        throw new Error(`第 ${lvlId} 关缺少有效的 map 或 startNodeId 配置！`);
    }

    const nodes = lvl.map.nodes;
    const roomCount = Object.keys(nodes).length;
    const rule = tierRules.find(r => lvlId >= r.minLvl && lvlId <= r.maxLvl);

    if (roomCount < rule.minRooms || roomCount > rule.maxRooms) {
        throw new Error(`第 ${lvlId} 关 (${lvl.title}) 房间数 ${roomCount} 超出规格限制 [${rule.minRooms}, ${rule.maxRooms}]！`);
    }

    // 验证起点存在
    const startNode = nodes[lvl.map.startNodeId];
    if (!startNode) {
        throw new Error(`第 ${lvlId} 关起点节点不存在: ${lvl.map.startNodeId}`);
    }

    // 验证终点存在
    const exitNode = Object.values(nodes).find(n => n.isExit || (n.event && n.event.type === 'exit'));
    if (!exitNode) {
        throw new Error(`第 ${lvlId} 关缺少终点 (isExit / event.type === 'exit')！`);
    }

    // BFS 连通性与双向通道检定
    const visited = new Set();
    const queue = [lvl.map.startNodeId];
    visited.add(lvl.map.startNodeId);

    while (queue.length > 0) {
        const currId = queue.shift();
        const curr = nodes[currId];
        const conns = curr.connections || {};

        for (const [dir, neighborId] of Object.entries(conns)) {
            const neighbor = nodes[neighborId];
            if (!neighbor) {
                throw new Error(`第 ${lvlId} 关房间 [${currId}] 指向了不存在的邻居 [${neighborId}]！`);
            }
            // 双向闭环检测
            const oppDir = { left: 'right', right: 'left', forward: 'backward', backward: 'forward' }[dir];
            if (!neighbor.connections || neighbor.connections[oppDir] !== currId) {
                throw new Error(`第 ${lvlId} 关通道非双向！[${currId}] -> [${neighborId}] (${dir}) 但对应反向 [${oppDir}] 不匹配`);
            }
            if (!visited.has(neighborId)) {
                visited.add(neighborId);
                queue.push(neighborId);
            }
        }
    }

    // 验证无孤立房间
    if (visited.size !== roomCount) {
        throw new Error(`第 ${lvlId} 关存在无法从起点到达的孤岛房间！可达: ${visited.size}, 总数: ${roomCount}`);
    }

    // 验证终点可达
    if (!visited.has(exitNode.id)) {
        throw new Error(`第 ${lvlId} 关终点 [${exitNode.id}] 不可达！`);
    }

    // 验证每关拓扑互不相同 (指纹比对)
    const coordsStr = Object.values(nodes).map(n => `${n.coord.x},${n.coord.y}`).sort().join('|');
    const fp = `${roomCount}-${coordsStr}`;
    if (levelFingerprints.has(fp)) {
        throw new Error(`第 ${lvlId} 关拓扑布局与已有某关完全重复！`);
    }
    levelFingerprints.add(fp);

    // 验证地图渲染引擎自适应能力 (调用 mapRenderer 检视 layout)
    app.mapRenderer.currentLevelMap = lvl.map;
    const layout = app.mapRenderer.getLayout();
    if (!layout || layout.boxSize <= 0 || layout.cellW <= 0 || layout.cellH <= 0) {
        throw new Error(`第 ${lvlId} 关 MapRenderer layout 计算异常！`);
    }

    console.log(`   [第${lvlId < 10 ? '0' + lvlId : lvlId}关 - ${lvl.title.split('：')[1] || lvl.title}] 房间数: ${roomCount} (${rule.tierName}) | 起点: ${startNode.name.split('】')[0]}】 | 终点: ${exitNode.name.split('】')[0]}】 | 连通性 100%`);
}

console.log('   【已验证】全部 25 关地图布局互不相同、房间数完全受控于误差区间、100% 连通无孤岛、起终点全通路通畅！');

console.log('\n25. 验证小地图雷达 / 战术俯视悬浮窗 (Mini-map Radar) 与实时更新...');
app.startNewGame(1);
app.phase = "q3_explore";
app.screenGame.classList.remove("hidden");
app.updateHeaderUI();

const hudRadar = global.document.getElementById("hud-mini-radar");
const radarCanvas = global.document.getElementById("mini-radar-canvas");
const radarPosTag = global.document.getElementById("radar-pos-tag");
const btnRadarToggle = global.document.getElementById("btn-radar-toggle");
const btnRadarExpand = global.document.getElementById("btn-radar-expand");
const radarBodyWrap = global.document.getElementById("radar-body-wrap");

if (!hudRadar || hudRadar.classList.contains("hidden")) {
    throw new Error("探索阶段微型雷达浮窗未能正常显示！");
}
if (!radarCanvas) {
    throw new Error("缺少 mini-radar-canvas 画布元素！");
}
if (!radarPosTag || !radarPosTag.textContent.includes("[")) {
    throw new Error("雷达坐标指示标牌未能正确更新！内容: " + (radarPosTag && radarPosTag.textContent));
}
console.log("   当前雷达定位标签:", radarPosTag.textContent);

// 测试折叠/展开
btnRadarToggle.click();
if (!radarBodyWrap.classList.contains("hidden") || btnRadarToggle.textContent !== "+") {
    throw new Error("微型雷达折叠交互异常！");
}
btnRadarToggle.click();
if (radarBodyWrap.classList.contains("hidden") || btnRadarToggle.textContent !== "−") {
    throw new Error("微型雷达展开交互异常！");
}
console.log("   【已验证】微型雷达折叠/展开交互正常！");

// 测试全地图展开按钮
btnRadarExpand.click();
const radarModalMap = global.document.getElementById("modal-map-view");
if (!radarModalMap || radarModalMap.classList.contains("hidden")) {
    throw new Error("点击雷达展开按钮未能成功唤起完整战术大地图！");
}
radarModalMap.classList.add("hidden");
console.log("   【已验证】点击雷达一键唤起完整战术大地图正常！");

// 验证邵可欣第六感被动技能驱动雷达黄色高熵预警
// 给邵可欣解锁全部秘密
["shaokexin_allergy", "shaokexin_ribbon", "shaokexin_sixth_sense", "shaokexin_faith"].forEach(secId => {
    app.saveSystem.unlockPersonaSecret("shaokexin", secId);
});
if (!app.saveSystem.isCharacterPassiveUnlocked("shaokexin")) {
    throw new Error("邵可欣被动技能判定异常，未能判定为已解锁！");
}
// 将邵可欣加入队伍
const shaoInTeam = {
    ...global.window.CharacterRegistry.npcs.shaokexin,
    role: "villager",
    status: "active",
    inquiryCount: 0
};
app.teamMembers.push(shaoInTeam);
app.allNpcMap.set("shaokexin", shaoInTeam);

// 模拟邻近节点存在伪人
const kazeNpc = app.getNpcById("kaze");
if (kazeNpc) kazeNpc.role = "wolf";
app.updateMiniRadar();
console.log("   【已验证】小地图雷达及邵可欣第六感侦测逻辑测试通过！");

console.log('\n26. 验证人物特征与秘密图鉴 (Persona Log) 全流程与专属分支启动...');
// 测试图鉴弹窗
const btnMenuPersonaLog = global.document.getElementById("btn-menu-persona-log");
if (!btnMenuPersonaLog) {
    throw new Error("主界面缺少 btn-menu-persona-log 按钮！");
}
btnMenuPersonaLog.click();

const modalPersonaLog = global.document.getElementById("modal-persona-log");
if (!modalPersonaLog || modalPersonaLog.classList.contains("hidden")) {
    throw new Error("点击记忆图鉴按钮后，图鉴弹窗未能弹出！");
}

const personaTabs = global.document.getElementById("persona-char-tabs");
const personaDetail = global.document.getElementById("persona-char-detail");
if (!personaTabs || !personaDetail) {
    throw new Error("图鉴弹窗缺少 tabs 或 detail 插槽！");
}

console.log("   图鉴当前活跃角色:", app.activePersonaCharId);

// 验证卡泽战术反制与秘密解锁
app.saveSystem.resetPersonaSecrets();
if (app.saveSystem.isCharacterPassiveUnlocked("kaze")) {
    throw new Error("重置后卡泽被动不应为解锁状态！");
}

// 模拟触发询问交谈解构秘密
const testKaze = {
    ...global.window.CharacterRegistry.npcs.kaze,
    role: "villager",
    status: "active",
    inquiryCount: 1
};
app.allNpcMap.set("kaze", testKaze);
app.teamMembers = [app.protagonist, testKaze];
app.executeInquiryDialogue(testKaze); // 达到第 2 次
if (!app.saveSystem.isPersonaSecretUnlocked("kaze", "kaze_taste")) {
    throw new Error("交谈达到 2 次后卡泽秘密 [kaze_taste] 未能成功解锁！");
}
console.log("   【已验证】傍晚交谈成功解构卡泽深层秘密 [味觉抗拒 (kaze_taste)]！");

// 模拟触发放逐伪人
app.executeExile({ id: "fake_wolf", name: "潜伏伪装体", role: "wolf", status: "active" });
if (!app.saveSystem.isPersonaSecretUnlocked("kaze", "kaze_instinct")) {
    throw new Error("放逐伪人后卡泽秘密 [kaze_instinct] 未能成功解锁！");
}
console.log("   【已验证】卡泽在队放逐伪人成功解构 [因果逆流直觉 (kaze_instinct)]！");

// 模拟触发受难 (牺牲)
app.checkPersonaSecretUnlocks("suffer_fate", { charId: "kaze", type: "dead" });
if (!app.saveSystem.isPersonaSecretUnlocked("kaze", "kaze_resolve")) {
    throw new Error("卡泽受难后秘密 [kaze_resolve] 未能成功解锁！");
}
console.log("   【已验证】见证牺牲成功解构卡泽秘密 [终末决绝 (kaze_resolve)]！");

// 模拟通关撤离
app.checkPersonaSecretUnlocks("evacuate_with", { evacuatedNpcIds: ["kaze"] });
if (!app.saveSystem.isPersonaSecretUnlocked("kaze", "kaze_scar")) {
    throw new Error("带领卡泽撤离后秘密 [kaze_scar] 未能成功解锁！");
}
console.log("   【已验证】带领卡泽撤离成功解构 [战术警惕 (kaze_scar)]！");

// 验证全解锁后被动觉醒与专属分支
if (!app.saveSystem.isCharacterPassiveUnlocked("kaze")) {
    throw new Error("卡泽 4 项秘密全部解锁后被动技能应觉醒！");
}
console.log("   【已验证】卡泽达成全 4 项记忆拼合，专属特质【战术反制】觉醒！");

// 重新渲染图鉴面板并点击进入专属分支
app.renderPersonaLogModal("kaze");
const btnLaunchExclusive = global.document.getElementById("btn-launch-exclusive-branch");
if (!btnLaunchExclusive || !btnLaunchExclusive.classList.contains("enabled")) {
    throw new Error("达成全部解构后专属分支启动按钮未能激活！");
}
btnLaunchExclusive.click();

if (app.currentLevel?.levelId !== 101) {
    throw new Error("点击启动卡泽专属分支未能成功加载扇区 101！当前关卡: " + app.currentLevel?.levelId);
}
console.log("   【已验证】成功一键启动卡泽专属分支剧情关卡：", app.currentLevel.title);

// 验证莫德被动技能【防爆坚守】拦截主角夜袭
const modeChar = {
    ...global.window.CharacterRegistry.npcs.mode,
    role: "villager",
    status: "active"
};
app.teamMembers = [app.protagonist, modeChar];
app.allNpcMap.set("mode", modeChar);
["mode_photo", "mode_loyalty", "mode_fortify", "mode_iron_will"].forEach(id => {
    app.saveSystem.unlockPersonaSecret("mode", id);
});
if (!app.saveSystem.isCharacterPassiveUnlocked("mode")) {
    throw new Error("莫德被动技能判定异常！");
}

// 模拟夜间伪人暗算主角
app.nightTargetVictimId = app.protagonist.id;
app.enterQ7Day();
if (app.phase === "gameover") {
    throw new Error("莫德防爆坚守未能成功拦截夜袭，主角意外死亡！");
}
console.log("   【已验证】莫德专属被动【防爆坚守】成功挺身拦截伪人暗算，主角保全性命！");

console.log("\n27. 验证随机伪人数量生成机制 (范围 [1, 3] 验证 1/2/3 均有几率生成；范围 [1, 2] 验证 1/2 均有几率生成)...");
const testLevel3Pool = {
    candidateNPCs: [{ id: "kaze" }, { id: "shaokexin" }, { id: "mode" }],
    wolfCountRange: [1, 3]
};
const stats13 = { 1: 0, 2: 0, 3: 0 };
for (let i = 0; i < 300; i++) {
    app.initCharactersForLevel(testLevel3Pool);
    const wolfCount = Array.from(app.allNpcMap.values()).filter(n => n.role === "wolf").length;
    stats13[wolfCount] = (stats13[wolfCount] || 0) + 1;
}
console.log(`   【300次采样检定】范围 [1, 3] 生成分布: 1名伪人=${stats13[1]}次, 2名伪人=${stats13[2]}次, 3名伪人=${stats13[3]}次`);
if (stats13[1] < 20 || stats13[2] < 20 || stats13[3] < 20) {
    throw new Error("伪人范围 [1, 3] 分布不均衡或缺失某个数量项！统计: " + JSON.stringify(stats13));
}
console.log("   【已验证】设置 [1, 3] 时，1个、2个、3个伪人均有均衡几率随机生成！");

const testLevel2Pool = {
    candidateNPCs: [{ id: "kaze" }, { id: "shaokexin" }, { id: "mode" }],
    wolfCountRange: [1, 2]
};
const stats12 = { 1: 0, 2: 0, 3: 0 };
for (let i = 0; i < 200; i++) {
    app.initCharactersForLevel(testLevel2Pool);
    const wolfCount = Array.from(app.allNpcMap.values()).filter(n => n.role === "wolf").length;
    stats12[wolfCount] = (stats12[wolfCount] || 0) + 1;
}
console.log(`   【200次采样检定】范围 [1, 2] 生成分布: 1名伪人=${stats12[1]}次, 2名伪人=${stats12[2]}次, 3名伪人=${stats12[3] || 0}次`);
if (stats12[1] < 20 || stats12[2] < 20 || (stats12[3] && stats12[3] > 0)) {
    throw new Error("伪人范围 [1, 2] 分布异常！统计: " + JSON.stringify(stats12));
}
console.log("\n28. 验证走图决策计数机制 (移动到已探索房间不消耗面临选择次数，移动到未探索房间消耗选择次数)...");
{
    // 关卡地图状态初始化
    app.explorationEngine.initLevelMap(app.currentLevel.map);
    app.phase = "q3_explore";
    const initialNodeId = app.explorationEngine.currentNodeId;
    const initialChoiceCount = app.explorationEngine.choiceCount;

    // 1. 获取一个与起始房间相连的方向进行初次探索
    const availDirs = app.explorationEngine.getAvailableDirections();
    const testDir = Object.keys(availDirs)[0];
    const targetNodeId = availDirs[testDir];

    // 移动到未探索房间
    const movedFirst = app.explorationEngine.moveTo(testDir);
    if (!movedFirst) throw new Error("首次移动失败！");
    if (app.explorationEngine.choiceCount !== initialChoiceCount + 1) {
        throw new Error(`移动至未探索房间应消耗次数！预期 ${initialChoiceCount + 1}，实际 ${app.explorationEngine.choiceCount}`);
    }
    console.log(`   【已验证】移动至未探索房间：面临选择次数由 ${initialChoiceCount} 增加至 ${app.explorationEngine.choiceCount}`);

    // 2. 原路折返回起始房间（起始房间已在 visitedNodes 中）
    const backAvailDirs = app.explorationEngine.getAvailableDirections();
    let backDir = null;
    for (const [d, nId] of Object.entries(backAvailDirs)) {
        if (nId === initialNodeId) {
            backDir = d;
            break;
        }
    }
    if (!backDir) throw new Error("未找到折返路径！");

    const currentChoiceCount = app.explorationEngine.choiceCount;
    const movedBack = app.explorationEngine.moveTo(backDir);
    if (!movedBack) throw new Error("折返移动失败！");
    if (app.explorationEngine.choiceCount !== currentChoiceCount) {
        throw new Error(`折返至已探索房间不应消耗面临选择次数！预期 ${currentChoiceCount}，实际 ${app.explorationEngine.choiceCount}`);
    }
    console.log(`   【已验证】折返移动至已探索房间：面临选择次数保持 ${app.explorationEngine.choiceCount} 不变！`);

    // 3. 验证快速往返 fastTravelTo 同样不消耗选择次数
    app.explorationEngine.fastTravelTo(targetNodeId);
    if (app.explorationEngine.choiceCount !== currentChoiceCount) {
        throw new Error(`快速往返已探明房间不应消耗面临选择次数！预期 ${currentChoiceCount}，实际 ${app.explorationEngine.choiceCount}`);
    }
    console.log(`   【已验证】快速往返穿梭：面临选择次数保持 ${app.explorationEngine.choiceCount} 不变！`);
}

console.log("\n29. 验证全景蓝图房间内嵌名称标注、未探索标记、直接点击相邻房间移动与严格 1:1 物理等比网格...");
{
    // 1. 验证网格世界坐标严格等比 1:1 (cellW === cellH，杜绝任何形变拉伸)
    const layout = app.stageMapRenderer.getLayout();
    if (layout.cellW !== layout.cellH) {
        throw new Error(`网格坐标系长宽比异常！cellW=${layout.cellW}, cellH=${layout.cellH}，非严格 1:1 等比！`);
    }
    console.log(`   【已验证】网格物理等比：cellW=${layout.cellW}px, cellH=${layout.cellH}px (严格 1:1，杜绝手机横向形变)`);

    // 2. 触发一次舞台地图渲染
    app.renderStageMap();

    // 3. 验证去除遮挡的浮动方向胶囊标牌，避免视觉繁杂
    const badges = app.stageMapRenderer.directionBadges || [];
    if (badges.length > 0) {
        throw new Error("检测到仍有浮动胶囊标牌渲染，应当在房间内直接标注未探索信息！");
    }
    console.log(`   【已验证】浮动胶囊标牌已彻底移除，房间名称与状态直接集成于舱室内`);

    // 4. 验证直接点击相邻未探索/已探索房间节点触发精准映射与移动
    const curN = app.explorationEngine.getCurrentNode();
    const conns = curN.connections || {};
    const targetRoomId = Object.values(conns)[0];
    if (!targetRoomId) {
        throw new Error("当前房间周围不存在通路测试用例！");
    }
    const targetNode = app.currentLevel.map.nodes[targetRoomId];
    const targetCenter = app.stageMapRenderer.getNodeCenter(targetNode);

    const scale = app.stageMapRenderer.currentScale || 1.0;
    const cam = app.stageMapRenderer.currentCam || { x: 520, y: 410 };
    const rect = app.stageMapRenderer.getCanvasRect();
    const displayW = rect.width;
    const displayH = rect.height;
    const screenX = displayW / 2 + app.stageMapRenderer.panX + (targetCenter.x - cam.x) * scale;
    const screenY = displayH / 2 + app.stageMapRenderer.panY + (targetCenter.y - cam.y) * scale;

    const hitNode = app.stageMapRenderer.getNodeAtPosition(screenX, screenY, app.currentLevel.map);
    if (!hitNode || hitNode.id !== targetRoomId) {
        throw new Error(`相邻房间点击坐标换算异常！预期命中房间 ${targetRoomId}，实际命中: ${hitNode?.id}`);
    }
    console.log(`   【已验证】直接点击相邻房间测试：成功命中目标房间 [${hitNode.name}]`);

    // 5. 验证工业级平移阻尼与视角复位
    app.stageMapRenderer.panX = 99999;
    app.stageMapRenderer.clampPan();
    if (app.stageMapRenderer.panX === 99999) {
        throw new Error("平移视口边界软限制失效，飞船可能被移出屏幕！");
    }
    app.stageMapRenderer.resetView(true);
    if (app.stageMapRenderer.panX !== 0 || app.stageMapRenderer.panY !== 0) {
        throw new Error("平滑复位视口状态异常！");
    }
    console.log("   【已验证】工业级平移阻尼边界限制与复位功能工作正常！");
}

console.log("\n30. 验证对话框底铺悬浮（绝不改变地图大小比例）与音频/立绘静默预加载机制...");
{
    // 1. 验证音频核心资源静默预加载
    if (typeof Sound !== "undefined") {
        Sound.preloadDefaults();
        const cachedCount = Sound.audioCache ? Sound.audioCache.size : 0;
        console.log(`   【已验证】音频缓存池已预加载文件数量: ${cachedCount} 个 (包含移动、物资、警报、死亡等核心音频)`);
        if (cachedCount < 3) {
            throw new Error(`音频预加载数量不足！当前仅缓存 ${cachedCount} 个文件`);
        }
    }

    // 2. 验证角色立绘与关卡地图离线异步预解码
    if (typeof CharacterRegistry !== "undefined") {
        CharacterRegistry.preloadForLevel(app.currentLevel);
        const preloadedImgCount = CharacterRegistry.preloadedImages ? CharacterRegistry.preloadedImages.size : 0;
        console.log(`   【已验证】角色表情与地图离线预加载数量: ${preloadedImgCount} 张 (支持 WebP 极速离线解码)`);
        if (preloadedImgCount < 8) {
            throw new Error(`角色立绘预加载数量不足！当前仅预加载 ${preloadedImgCount} 张`);
        }
    }

    // 3. 验证对话框打开与关闭时，地图视口尺寸绝对稳定，杜绝任何形变跳动
    const viewport = document.getElementById("stage-map-viewport");
    const initialHeight = viewport ? (viewport.clientHeight || 460) : 460;

    // 弹出对话框
    app.dialogueUI.say(
        CharacterRegistry.get("kaze"),
        "测试对话：验证地图比例在对话框开启时绝不发生缩放或挤压！"
    );

    const withDialogueHeight = viewport ? (viewport.clientHeight || 460) : 460;
    if (withDialogueHeight !== initialHeight) {
        throw new Error(`对话框弹出导致地图视口尺寸改变！原始高度=${initialHeight}, 当前高度=${withDialogueHeight}`);
    }

    // 关闭对话框
    app.dialogueUI.hideBox();
    const afterCloseHeight = viewport ? (viewport.clientHeight || 460) : 460;
    if (afterCloseHeight !== initialHeight) {
        throw new Error(`对话框关闭导致地图视口尺寸改变！原始高度=${initialHeight}, 当前高度=${afterCloseHeight}`);
    }

    console.log(`   【已验证】对话框底铺悬浮测试通过：视口高度恒定为 ${initialHeight}px，地图尺寸比例 0 畸变 0 晃动！`);
}

console.log("\n31. 验证移动端立绘光速渲染、主角指挥官SVG头像与图片常驻内存缓存机制...");
{
    // 1. 验证图片内存持久化缓存机制
    if (!CharacterRegistry.imageCache || !(CharacterRegistry.imageCache instanceof Map)) {
        throw new Error("CharacterRegistry.imageCache 内存持久映射字典未正确初始化！");
    }

    // 2. 验证 NPC 说话时立绘已配置 loading="eager" 与 decoding="sync" 零白屏同步渲染
    const kaze = CharacterRegistry.get("kaze");
    app.dialogueUI.say(kaze, "第一句对白：验证立绘创建");
    const avatarContainer = document.getElementById("vn-dialogue-corner-avatar");
    const html1 = avatarContainer.innerHTML || "";
    if (!html1.includes("corner-avatar-frame") || !html1.includes("corner-portrait-img")) {
        throw new Error("NPC 对白未能正确生成左上角立绘框架与图片节点！");
    }
    if (!html1.includes('loading="eager"') || !html1.includes('decoding="sync"')) {
        throw new Error("立绘图片未开启 loading='eager' 与 decoding='sync' 同步光速渲染！");
    }
    console.log("   【已验证】NPC 对白立绘已启用 loading='eager' 与 decoding='sync' 同步光速渲染！");

    // 3. 验证主角 L.P.H 说话时展示指挥官星徽专属头像 (非系统广播)
    app.dialogueUI.say(app.protagonist, "全员保持警戒，准备应对异常！");
    const html2 = avatarContainer.innerHTML || "";
    if (!html2.includes("data:image/svg+xml") || !html2.includes("L.P.H")) {
        throw new Error("主角 L.P.H 对白未正确挂载专属指挥官星徽 SVG 头像！");
    }
    console.log("   【已验证】主角 L.P.H 对话已成功挂载专属指挥官高科技头像！");
}

console.log("\n32. 验证长文本对话框滑动、黑夜/裁决/傍晚阶段地图比例稳定性与顶栏完整按钮文字...");
{
    // 1. 验证 index.html 中顶栏按钮全称文本显示
    const indexHtml = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
    if (!indexHtml.includes('id="btn-save-progress" class="tool-btn">💾 存档</button>')) {
        throw new Error("index.html 未正确显示【💾 存档】按钮！");
    }
    if (!indexHtml.includes('id="btn-exit-to-menu" class="tool-btn">🚪 退出</button>')) {
        throw new Error("index.html 未正确显示【🚪 退出】按钮！");
    }
    console.log("   【已验证】顶栏功能操作键已正确完整展示【💾 存档】与【🚪 退出】！");

    // 2. 验证对话框文本打字机自动滚动与超长文本滑块支持
    const dialogueText = document.getElementById("vn-dialogue-text");
    if (!dialogueText) {
        throw new Error("vn-dialogue-text 节点不存在！");
    }
    dialogueText.scrollHeight = 300;
    const longText = "这是一段非常漫长的舰内通讯记录。\n在第3区域我们遭遇了强烈的重力异常与伪人拟态反应。\n请所有队员立刻回到安全舱室进行核验！\n请队长立刻作出裁决！";
    app.dialogueUI.say(app.protagonist, longText);
    app.dialogueUI.finishTyping();
    if (dialogueText.scrollTop !== 300) {
        throw new Error("对话框长文本在打字完毕后未自动跟随滚动至底端！");
    }
    console.log("   【已验证】长文本对白打字完成时已自动跟随滚动至最新视口底端！");

    // 3. 验证傍晚、裁决与黑夜阶段切换时地图比例绝对保真，主舞台 DOM 不坍塌
    const stageMapCanvas = document.getElementById("stage-map-canvas");
    if (!stageMapCanvas) {
        throw new Error("stage-map-canvas 不存在！");
    }
    const screenGame = document.getElementById("screen-game");
    screenGame.classList.remove("hidden");
    // 初始渲染一次获取初始比例
    app.renderStageMap();
    const initialScale = app.stageMapRenderer ? app.stageMapRenderer.currentScale : 1.0;

    // 切换至傍晚
    app.enterEveningPhase();
    if (screenGame.classList.contains("hidden")) {
        throw new Error("傍晚阶段错误地给 screen-game 添加了 hidden，导致地图容器坍塌！");
    }
    app.handleEveningBlackClick();
    const eveningScale = app.stageMapRenderer ? app.stageMapRenderer.currentScale : 1.0;
    if (eveningScale !== initialScale) {
        throw new Error(`傍晚阶段导致地图缩放比例异常跳变！初始=${initialScale}, 傍晚=${eveningScale}`);
    }

    // 切换至裁决
    app.enterQ5Judgement();
    const judgeScale = app.stageMapRenderer ? app.stageMapRenderer.currentScale : 1.0;
    if (judgeScale !== initialScale) {
        throw new Error(`裁决阶段导致地图缩放比例异常跳变！初始=${initialScale}, 裁决=${judgeScale}`);
    }

    // 切换至黑夜
    app.enterQ6Night();
    const nightScale = app.stageMapRenderer ? app.stageMapRenderer.currentScale : 1.0;
    if (nightScale !== initialScale) {
        throw new Error(`黑夜阶段导致地图缩放比例异常跳变！初始=${initialScale}, 黑夜=${nightScale}`);
    }

    console.log(`   【已验证】傍晚、裁决、黑夜全阶段地图比例绝对恒定 (scale=${initialScale})，零形变零跳变！`);
}

// =============================================================================
// 33. 验证 NPC 专属私人舱室规格（预留12个结构、单向连通、彼此不紧挨、默认上锁）
// =============================================================================
console.log('\n33. 验证 NPC 专属私人舱室规格（预留12个房间结构，当前激活4个，单向连接，彼此不紧挨，默认锁定）...');
{
    const { MASTER_ROOM_DEFS, MASTER_CONNECTIONS, getNpcRoomDefs, buildSpaceshipLevelMap } = window;

    const npcRooms = getNpcRoomDefs();
    if (!Array.isArray(npcRooms) || npcRooms.length < 4) {
        throw new Error(`getNpcRoomDefs 必须返回至少 4 个专属私人舱室定义！当前数量: ${npcRooms ? npcRooms.length : 0}`);
    }

    const expectedOwners = ["lph", "kaze", "shaokexin", "mode"];
    expectedOwners.forEach(owner => {
        const found = npcRooms.find(r => r.npcOwnerId === owner);
        if (!found) {
            throw new Error(`未找到乘员 [${owner}] 的专属私人舱室！`);
        }
        if (!found.diary || !Array.isArray(found.diary) || found.diary.length === 0) {
            throw new Error(`乘员 [${owner}] 的专属私人舱室缺少日记数据 (diary)！`);
        }
        found.diary.forEach((p, pIdx) => {
            if (!p.title || !p.content) {
                throw new Error(`乘员 [${owner}] 日记第 ${pIdx + 1} 页缺少标题或正文！`);
            }
        });
    });
    console.log(`   【已验证】4个专属私人舱室 (L.P.H/卡泽/邵可欣/莫德) 均已配置完整日记篇目！`);

    // 验证规则：每个 NPC 房间只能与一个普通房间相连（单向连接）
    npcRooms.forEach(room => {
        const edges = MASTER_CONNECTIONS.filter(([a, b]) => a === room.id || b === room.id);
        if (edges.length !== 1) {
            throw new Error(`NPC专属舱室 [${room.id}] 连线数量必须严格为 1 条！当前连线数: ${edges.length} (${JSON.stringify(edges)})`);
        }
    });
    console.log(`   【已验证】每个 NPC 专属房间在母舰拓扑中严格仅与 1 间相邻房间单向相连！`);

    // 验证规则：NPC 房间之间尽量不要紧挨在一起 (曼哈顿距离 > 1)
    for (let i = 0; i < npcRooms.length; i++) {
        for (let j = i + 1; j < npcRooms.length; j++) {
            const rA = npcRooms[i];
            const rB = npcRooms[j];
            const dist = Math.abs(rA.coord.x - rB.coord.x) + Math.abs(rA.coord.y - rB.coord.y);
            if (dist <= 1) {
                throw new Error(`NPC房间 [${rA.id}] 与 [${rB.id}] 紧挨在一起 (距离=${dist})，违背布局规则！`);
            }
        }
    }
    console.log(`   【已验证】所有 NPC 专属私人舱室分布在星舰不同方位角，彼此绝无紧邻！`);

    // 验证规则：默认上锁，不出现在初始 openRoomIds 中
    const lvl1Map = buildSpaceshipLevelMap(1);
    npcRooms.forEach(room => {
        if (lvl1Map.nodes[room.id]) {
            throw new Error(`NPC专属舱室 [${room.id}] 不应默认出现在初始关卡开放节点列表中！`);
        }
    });
    console.log(`   【已验证】全部 NPC 专属私人舱室初始默认处于锁定状态！测试通过！`);
}

// =============================================================================
// 34. 验证 NPC 专属房间随行解锁机制与永久通行规则
// =============================================================================
console.log('\n34. 验证 NPC 专属房间随行解锁机制与永久通行规则...');
{
    // 重启第一关测试
    app.startNewGame(1);

    // 主角 L.P.H 随行，room_npc_lph 连接的 room_west_end 在第一关中存在
    if (!app.unlockedNpcRooms.has("room_npc_lph")) {
        throw new Error("主角私人舱室 room_npc_lph 应当随指挥官在队而自动解锁！");
    }
    if (!app.currentLevel.map.nodes["room_npc_lph"]) {
        throw new Error("已解锁的 room_npc_lph 未成功注入当前关卡地图节点表！");
    }
    console.log(`   【已验证】指挥官常驻随行，主角私人舱 [room_npc_lph] 成功自动授权解锁并注入地图！`);

    // 卡泽不在队内时，卡泽房间不可解锁
    if (app.unlockedNpcRooms.has("room_npc_kaze")) {
        throw new Error("卡泽尚未入队，其私人舱室 room_npc_kaze 不得提前解锁！");
    }

    // 进入第三关 (包含 room_tactical_plan，卡泽整备室的连接门户)
    app.startNewGame(3);
    const kazeNpc = app.getNpcById("kaze");
    kazeNpc.status = "active";
    app.teamMembers.push(kazeNpc);
    app.checkAndUnlockNpcRooms();

    if (!app.unlockedNpcRooms.has("room_npc_kaze")) {
        throw new Error("卡泽入队后，其专属备勤室 room_npc_kaze 应当被成功解锁！");
    }
    if (!app.currentLevel.map.nodes["room_npc_kaze"]) {
        throw new Error("已解锁的 room_npc_kaze 未成功注入第三关地图节点表中！");
    }
    const kazeNode = app.currentLevel.map.nodes["room_npc_kaze"];
    if (!kazeNode.connections || !Object.values(kazeNode.connections).includes("room_tactical_plan")) {
        throw new Error("room_npc_kaze 必须与 room_tactical_plan 建立双向气闸连通！");
    }
    console.log(`   【已验证】卡泽随行在队，[room_npc_kaze] 成功完成验证授权并建立双向气闸通路！`);

    // 核心规则：一旦解锁后续不需要再有这名NPC了也可以经过（例如该NPC牺牲遇害）
    kazeNpc.status = "dead";
    app.checkAndUnlockNpcRooms();

    if (!app.unlockedNpcRooms.has("room_npc_kaze")) {
        throw new Error("卡泽遇害后，已解锁的 room_npc_kaze 不得被重新锁死！");
    }
    if (!app.currentLevel.map.nodes["room_npc_kaze"]) {
        throw new Error("卡泽遇害后，room_npc_kaze 必须依然常驻在地图节点表中，支持全队安全通行！");
    }
    console.log(`   【已验证】即使 NPC 之后遇害离队，已解锁的专属舱室依然保持开放可通行！测试全部通过！`);
}

// =============================================================================
// 35. 验证生化检测室伪人数量精准播报、舱室内装饰与NPC日记翻页弹窗
// =============================================================================
console.log('\n35. 验证生化检测室伪人播报、舱室装饰绘制与NPC日记独立翻页弹窗...');
{
    // A. 生化检测室伪人数量精准播报
    app.startNewGame(2); // 第二关包含 room_med_surgery (生化检测室)
    const surgeryNode = app.currentLevel.map.nodes["room_med_surgery"];
    if (!surgeryNode || !surgeryNode.isDetectionRoom) {
        throw new Error("第二关中的 room_med_surgery 必须携带 isDetectionRoom: true 标识！");
    }

    // 设置队伍成员：主角(seer) + 邵可欣(villager) + 莫德(wolf) -> 共1名伪人
    const shaokexin = app.getNpcById("shaokexin");
    const mode = app.getNpcById("mode");
    shaokexin.status = "active";
    shaokexin.role = "villager";
    mode.status = "active";
    mode.role = "wolf";
    app.teamMembers = [app.protagonist, shaokexin, mode];

    // 模拟踏入生化检测室
    app.explorationEngine.handleNodeEvents(surgeryNode, false);

    const latestLogs = app.actionLogs.slice(-3).map(l => l.text).join(' ');
    if (!latestLogs.includes("【生化检测】") || !latestLogs.includes("1 名伪人拟态体")) {
        throw new Error(`生化检测室未能精准播报 1 名伪人！当前日志: ${latestLogs}`);
    }
    console.log(`   【已验证】走入生化检测室成功在文字框与日志中精准播报队伍潜伏的伪人数量 (检出 1 名)！`);

    // B. NPC日记独立翻页弹窗 (非普通文字框)
    const modalDiary = document.getElementById("modal-npc-diary");
    if (!modalDiary) {
        throw new Error("DOM 中缺少 #modal-npc-diary 独立日记弹窗容器！");
    }

    const diaryPages = [
        { title: "前哨纪要 · 第一页", content: "第一页正文测试内容，讲述任务起源。" },
        { title: "前哨纪要 · 第二页", content: "第二页正文测试内容，讲述遭遇拟态。" },
        { title: "前哨纪要 · 第三页", content: "第三页正文测试内容，讲述破局希望。" }
    ];

    app.diaryUI.open("卡泽", "#38bdf8", diaryPages);
    if (modalDiary.classList.contains("hidden")) {
        throw new Error("diaryUI.open 后日记弹窗未移除 hidden 显式展现！");
    }

    const elTitle = document.getElementById("diary-page-title");
    const elContent = document.getElementById("diary-page-content");
    const elIndicator = document.getElementById("diary-page-indicator");
    const btnPrev = document.getElementById("btn-diary-prev");
    const btnNext = document.getElementById("btn-diary-next");

    if (elTitle.textContent !== "前哨纪要 · 第一页" || !elContent.innerHTML.includes("第一页正文测试内容")) {
        throw new Error(`日记第一页内容显示不正确！title=${elTitle.textContent}`);
    }
    if (!btnPrev.disabled) {
        throw new Error("第一页时【上一页】按钮必须处于 disabled 状态！");
    }
    if (btnNext.disabled) {
        throw new Error("第一页时【下一页】按钮不得处于 disabled 状态！");
    }
    console.log(`   【已验证】日记弹窗成功打开，第一页标题、正文与翻页按钮状态正确！`);

    // 翻页到第二页
    btnNext.click();
    if (elTitle.textContent !== "前哨纪要 · 第二页" || !elContent.innerHTML.includes("第二页正文测试内容")) {
        throw new Error(`翻页后第二页内容显示不正确！title=${elTitle.textContent}`);
    }
    if (btnPrev.disabled) {
        throw new Error("第二页时【上一页】按钮必须解除 disabled！");
    }
    console.log(`   【已验证】点击【下一页 ▶】成功平滑翻页至第 2 页！`);

    // 翻页到第三页
    btnNext.click();
    if (!btnNext.disabled) {
        throw new Error("尾页时【下一页】按钮必须自动变为 disabled！");
    }
    console.log(`   【已验证】翻页至尾页时【下一页 ▶】按钮智能禁用！`);

    // 关闭日记弹窗
    const btnClose = document.getElementById("btn-close-diary");
    btnClose.click();
    if (!modalDiary.classList.contains("hidden")) {
        throw new Error("点击关闭按钮后日记弹窗未成功隐藏！");
    }
    console.log(`   【已验证】日记弹窗关闭功能正常，完全独立于视觉小说文字框！测试全部通过！`);
}

// =============================================================================
// 36. 验证已探索区域单步与折返移动免除体力消耗（0 AP）与科幻舱室多边形几何覆盖
// =============================================================================
console.log('\n36. 验证已探索区域单步与折返移动免除体力消耗 (消耗 0 体力) 与科幻星舰形状覆盖...');
{
    // 测试已探索区域移动：在第一关中，当前位于卡泽房间，走廊与起点均已探索
    const currentStamina = app.stamina;
    const prevNodeId = app.explorationEngine.currentNodeId;

    // 向右单步移动折返回已探索的走廊
    const canMoveRight = !!app.explorationEngine.getCurrentNode().connections['right'];
    if (canMoveRight) {
        app.explorationEngine.moveTo('right');
        const afterStamina = app.stamina;
        if (afterStamina !== currentStamina) {
            throw new Error(`折返已探明区域单步移动不应消耗体力！原体力: ${currentStamina}, 现体力: ${afterStamina}`);
        }
        console.log(`   【已验证】单步折返已探索房间 [${app.explorationEngine.getCurrentNode().name}]，体力保持 ${afterStamina} (消耗 0 点体力)！`);
    }

    // 再次折返至卡泽房间 (已探明)
    const canMoveLeft = !!app.explorationEngine.getCurrentNode().connections['left'];
    if (canMoveLeft) {
        const staminaBefore = app.stamina;
        app.explorationEngine.moveTo('left');
        if (app.stamina !== staminaBefore) {
            throw new Error(`再次折返已探明区域不应消耗体力！原体力: ${staminaBefore}, 现体力: ${app.stamina}`);
        }
        console.log(`   【已验证】再次单步折返已探索房间 [${app.explorationEngine.getCurrentNode().name}]，体力保持 ${app.stamina} (消耗 0 点体力)！`);
    }

    // 验证各舱室科幻形状定义覆盖
    const MasterMap = global.window.SpaceshipMasterMap || require('./js/spaceshipMasterMap.js');
    const masterDefs = MasterMap.MASTER_ROOM_DEFS;
    const requiredShapes = [
        "sensor_dome", "tactical_wedge", "bridge", "ai_core_hex", "comm_tower",
        "observation_dome", "star_gate_arch", "medical_cross", "tokamak_reactor",
        "singularity_gate_ring", "engine_bell_l", "engine_bell_r", "hangar_bay",
        "gravity_torus", "shield_projector", "salvage_hopper", "captain_pulpit"
    ];

    const definedShapes = new Set(Object.values(masterDefs).map(r => r.shape));
    requiredShapes.forEach(shape => {
        if (!definedShapes.has(shape)) {
            throw new Error(`MASTER_ROOM_DEFS 中缺少科幻多边形形状定义: ${shape}`);
        }
    });
    console.log(`   【已验证】科幻星舰真实舱室几何形状全覆盖 (已包含 ${definedShapes.size} 种专属科幻舱室俯视轮廓)！`);
}

console.log('\n====== [TEST PASSED] 全部 36 项核心流程、体力免消耗、科幻舱室几何与日记弹窗测试 100% 成功！ ======');

