const fs = require('fs');
const { MASTER_ROOM_DEFS, MASTER_CONNECTIONS, NPC_PRIVATE_QUARTERS } = require('./js/spaceshipMasterMap.js');

// 坐标界限计算
const allRooms = Object.values(MASTER_ROOM_DEFS);
const xs = allRooms.map(r => r.coord.x);
const ys = allRooms.map(r => r.coord.y);
const minX = Math.min(...xs); // -1
const maxX = Math.max(...xs); // 8
const minY = Math.min(...ys); // -1
const maxY = Math.max(...ys); // 6

const cols = maxX - minX + 1; // 10 列 (-1 ~ 8)
const rows = maxY - minY + 1; // 8 行 (-1 ~ 6)

const cellW = 168, cellH = 138;
const padX = 90, padY = 80;
const svgW = cols * cellW + padX * 2;
const svgH = rows * cellH + padY * 2;
const roomW = 142, roomH = 100;

// 区域视觉配色方案
const zoneColors = {
    bow: { bg: '#0b1e3b', border: '#38bdf8', text: '#bae6fd', name: '舰艏指控', glow: 'rgba(56,189,248,0.3)' },
    hub: { bg: '#172554', border: '#60a5fa', text: '#bfdbfe', name: '中央枢纽', glow: 'rgba(96,165,250,0.25)' },
    research: { bg: '#022c22', border: '#34d399', text: '#a7f3d0', name: '生化科研', glow: 'rgba(52,211,153,0.3)' },
    medical: { bg: '#064e3b', border: '#10b981', text: '#6ee7b7', name: '纳米医疗', glow: 'rgba(16,185,129,0.35)' },
    living: { bg: '#3b0764', border: '#c084fc', text: '#e9d5ff', name: '生活起居', glow: 'rgba(192,132,252,0.3)' },
    ecology: { bg: '#14532d', border: '#4ade80', text: '#bbf7d0', name: '生态支持', glow: 'rgba(74,222,128,0.3)' },
    security: { bg: '#451a03', border: '#f59e0b', text: '#fde68a', name: '安全军械', glow: 'rgba(245,158,11,0.3)' },
    engineering: { bg: '#701a75', border: '#e879f9', text: '#fae8ff', name: '工程维保', glow: 'rgba(232,121,249,0.3)' },
    propulsion: { bg: '#4c0519', border: '#fb7185', text: '#fecdd3', name: '动力反应堆', glow: 'rgba(251,113,133,0.35)' },
    stern: { bg: '#431407', border: '#fb923c', text: '#fed7aa', name: '跃迁推进', glow: 'rgba(251,146,60,0.35)' }
};

// 微缩设备图标
const equipIcons = {
    bridge_console: '🎛️',
    sub_helm: '🕹️',
    console: '🎛️',
    sensor_dome: '📡',
    star_lens: '🔭',
    tactical_sandtable: '🗺️',
    server_rack: '🖥️',
    comm_station: '📶',
    medical_bed: '🩺',
    cryo_pods: '🧊',
    cargo_grid: '📦',
    hydroponics: '🌿',
    shield_coil: '🛡️',
    reactor_core: '⚛️',
    thruster_nozzle: '🚀',
    workshop_tools: '🔧',
    airlock_dock: '🚪',
    security_gate: '🚧'
};

// 科幻星舰多边形轮廓生成器 (SVG relative path)
function getShapeSvgPath(shape, w, h) {
    switch (shape) {
        // 1. 雷达穹顶 (抛物天线弧面)
        case "sensor_dome":
            return `M 0 ${h} L 0 ${h * 0.55} C ${w * 0.08} ${-h * 0.08}, ${w * 0.92} ${-h * 0.08}, ${w} ${h * 0.55} L ${w} ${h} Z`;

        // 2. 尖锐前探推演五角舱
        case "tactical_wedge":
        case "vanguard_apex":
            return `M ${w * 0.5} 0 L ${w} ${h * 0.44} L ${w * 0.82} ${h} L ${w * 0.18} ${h} L 0 ${h * 0.44} Z`;

        // 3. 梯形主副指挥舰桥
        case "bridge":
        case "bridge_sub":
        case "captain_pulpit":
            return `M ${w * 0.2} 0 L ${w * 0.8} 0 L ${w} ${h * 0.38} L ${w * 0.88} ${h} L ${w * 0.12} ${h} L 0 ${h * 0.38} Z`;

        // 4. 重核聚变托卡马克主反应堆 (带四角外伸抗磁护耳)
        case "tokamak_reactor":
        case "reactor": {
            const c = Math.floor(w * 0.24);
            const ear = Math.floor(w * 0.07);
            return `M ${c} 0 L ${w - c} 0 L ${w} ${c} L ${w + ear} ${c} L ${w + ear} ${h - c} L ${w} ${h - c} L ${w - c} ${h} L ${c} ${h} L 0 ${h - c} L ${-ear} ${h - c} L ${-ear} ${c} L 0 ${c} Z`;
        }

        // 5. 重装八角舱 (AI超脑 / 异构标本 / 苏醒大厅)
        case "ai_core_hex":
        case "specimen_vault":
        case "hub_central_oct":
        case "octagon": {
            const c = Math.floor(Math.min(w, h) * 0.26);
            return `M ${c} 0 L ${w - c} 0 L ${w} ${c} L ${w} ${h - c} L ${w - c} ${h} L ${c} ${h} L 0 ${h - c} L 0 ${c} Z`;
        }

        // 6. 医疗急救十字十二边形级联舱
        case "medical_cross":
        case "medical": {
            const cw = Math.floor(w * 0.24);
            const ch = Math.floor(h * 0.22);
            return `M ${cw} 0 L ${w - cw} 0 L ${w - cw} ${ch} L ${w} ${ch} L ${w} ${h - ch} L ${w - cw} ${h - ch} L ${w - cw} ${h} L ${cw} ${h} L ${cw} ${h - ch} L 0 ${h - ch} L 0 ${ch} L ${cw} ${ch} Z`;
        }

        // 7. 通讯信标发射塔楼
        case "comm_tower":
            return `M ${w * 0.15} ${h * 0.22} L ${w * 0.85} 0 L ${w} ${h * 0.85} L ${w * 0.78} ${h} L 0 ${h} Z`;

        // 8. 环景深空观景穹顶
        case "observation_dome":
        case "observation_bay_e":
        case "panoramic_pod":
            return `M 0 ${h} L 0 ${h * 0.2} C ${w * 0.35} ${-h * 0.08}, ${w * 0.95} ${h * 0.1}, ${w} ${h * 0.65} L ${w * 0.85} ${h} Z`;

        // 9. 束腰内凹双重气密锁
        case "airlock_dock":
        case "airlock_dock_w":
        case "airlock_dock_e":
        case "decon_airlock":
        case "airlock": {
            const c = Math.floor(Math.min(w, h) * 0.18);
            const waist = Math.floor(w * 0.08);
            return `M ${c} 0 L ${w - c} 0 L ${w} ${c} L ${w - waist} ${h * 0.5} L ${w} ${h - c} L ${w - c} ${h} L ${c} ${h} L 0 ${h - c} L ${waist} ${h * 0.5} L 0 ${c} Z`;
        }

        // 10. 终焉奇点星门 / 脱出拱门
        case "singularity_gate_ring":
        case "star_gate_arch": {
            const c = Math.floor(w * 0.24);
            return `M ${c} 0 L ${w - c} 0 L ${w} ${h * 0.5} L ${w - c} ${h} L ${c} ${h} L 0 ${h * 0.5} Z`;
        }

        // 11. 左舷主离子推进器 (向后扩散喷口)
        case "engine_bell_l":
            return `M ${w * 0.28} 0 L ${w * 0.82} 0 L ${w * 0.88} ${h * 0.45} L ${w} ${h} Q ${w * 0.45} ${h * 0.85}, 0 ${h} L ${w * 0.12} ${h * 0.45} Z`;

        // 12. 右舷主离子推进器 (向后扩散喷口)
        case "engine_bell_r":
            return `M ${w * 0.18} 0 L ${w * 0.72} 0 L ${w * 0.88} ${h * 0.45} L ${w} ${h} Q ${w * 0.55} ${h * 0.85}, 0 ${h} L ${w * 0.12} ${h * 0.45} Z`;

        // 13. 尖椎逃生艇
        case "escape_pod_w":
            return `M ${w * 0.6} 0 L ${w} ${h * 0.25} L ${w * 0.75} ${h} L 0 ${h * 0.6} L ${w * 0.2} ${h * 0.15} Z`;
        case "escape_pod_e":
            return `M ${w * 0.4} 0 L ${w * 0.8} ${h * 0.15} L ${w} ${h * 0.6} L ${w * 0.25} ${h} L 0 ${h * 0.25} Z`;

        // 14. 水培生态温室 (有机流线椭圆)
        case "hydro_dome":
            return `M ${w * 0.5} 0 C ${w * 1.05} 0, ${w * 1.05} ${h}, ${w * 0.5} ${h} C ${-w * 0.05} ${h}, ${-w * 0.05} 0, ${w * 0.5} 0 Z`;

        // 15. 穿梭机库 / 自动化餐厅 (平底宽梯形)
        case "hangar_bay":
        case "mess_hall": {
            const cut = Math.floor(w * 0.15);
            return `M ${cut} 0 L ${w - cut} 0 L ${w} ${h} L 0 ${h} Z`;
        }

        // 16. 重型仓储库 (宽六角强化仓)
        case "cargo_depot":
        case "storage": {
            const c = Math.floor(Math.min(w, h) * 0.22);
            return `M ${c} 0 L ${w - c} 0 L ${w} ${h * 0.5} L ${w - c} ${h} L ${c} ${h} L 0 ${h * 0.5} Z`;
        }

        // 17. 船员起居生活舱群
        case "living_quarters":
        case "crew_cabin":
        case "quarters": {
            const cut = Math.floor(w * 0.12);
            return `M ${cut} 0 L ${w - cut} 0 L ${w} ${cut} L ${w} ${h - cut} L ${w - cut} ${h} L ${cut} ${h} L 0 ${h - cut} L 0 ${cut} Z`;
        }

        // 18. 多棱切角防爆掩体
        case "secure_bunker":
        case "armory_vault":
        case "fortified_bastion":
            return `M ${w * 0.35} 0 L ${w * 0.85} 0 L ${w} ${h * 0.35} L ${w} ${h * 0.85} L ${w * 0.7} ${h} L ${w * 0.15} ${h} L 0 ${h * 0.7} L 0 ${h * 0.35} Z`;

        // 19. 通风十字交叉口
        case "junction_cross": {
            const m1 = Math.floor(w * 0.26);
            const m2 = Math.floor(w * 0.74);
            return `M ${m1} 0 L ${m2} 0 L ${m2} ${m1} L ${w} ${m1} L ${w} ${m2} L ${m2} ${m2} L ${m2} ${h} L ${m1} ${h} L ${m1} ${m2} L 0 ${m2} L 0 ${m1} L ${m1} ${m1} Z`;
        }

        // 20. 拐角弯道 (L型)
        case "corner_elbow": {
            const m = Math.floor(w * 0.45);
            return `M 0 0 L ${w} 0 L ${w} ${m} L ${m} ${m} L ${m} ${h} L 0 ${h} Z`;
        }

        // 21. 横向加固走廊
        case "corridor_h":
        case "corridor_horizontal": {
            const my = Math.floor(h * 0.18);
            const mh = h - Math.floor(h * 0.36);
            return `M -2 ${my} L ${w + 2} ${my} L ${w + 2} ${my + mh} L -2 ${my + mh} Z`;
        }

        // 22. 纵向管道走廊
        case "corridor_v":
        case "corridor_vertical": {
            const mx = Math.floor(w * 0.18);
            const mw = w - Math.floor(w * 0.36);
            return `M ${mx} -2 L ${mx + mw} -2 L ${mx + mw} ${h + 2} L ${mx} ${h + 2} Z`;
        }

        // 23. 人工重力总井
        case "gravity_torus": {
            const c = Math.floor(w * 0.25);
            return `M ${c} 0 L ${w - c} 0 Q ${w - c / 2} ${h * 0.5}, ${w - c} ${h} L ${c} ${h} Q ${c / 2} ${h * 0.5}, ${c} 0 Z`;
        }

        // 24. 偏折护盾投影罩
        case "shield_projector":
            return `M 0 ${h * 0.85} Q ${w * 0.5} ${h * 0.4}, ${w} ${h * 0.85} L ${w * 0.85} 0 L ${w * 0.15} 0 Z`;

        // 25. 废料回收漏斗井
        case "salvage_hopper":
            return `M 0 0 L ${w} ${h * 0.2} L ${w * 0.75} ${h} L ${w * 0.25} ${h} Z`;

        // 26. 默认高科技蜂窝切角多边形
        default: {
            const cutX = Math.floor(w * 0.18);
            return `M ${cutX} 0 L ${w - cutX} 0 L ${w} ${h * 0.5} L ${w - cutX} ${h} L ${cutX} ${h} L 0 ${h * 0.5} Z`;
        }
    }
}

// 1. 生成通道网络 (Connections SVG)
let linesSvg = '';
MASTER_CONNECTIONS.forEach(([a, b]) => {
    const rA = MASTER_ROOM_DEFS[a];
    const rB = MASTER_ROOM_DEFS[b];
    if (!rA || !rB) return;

    const x1 = padX + (rA.coord.x - minX) * cellW + cellW / 2;
    const y1 = padY + (rA.coord.y - minY) * cellH + cellH / 2;
    const x2 = padX + (rB.coord.x - minX) * cellW + cellW / 2;
    const y2 = padY + (rB.coord.y - minY) * cellH + cellH / 2;

    const isNpcConnection = rA.isNpcRoom || rB.isNpcRoom;
    if (isNpcConnection) {
        // NPC 专属房间通道：金黄虚线脉冲
        linesSvg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#f59e0b" stroke-width="3" stroke-dasharray="8,5" stroke-opacity="0.9" class="conn-line conn-npc" data-conn="${a}-${b}" />\n`;
    } else {
        // 普通主通道：高科技发光天青色管道
        linesSvg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(56,189,248,0.35)" stroke-width="3.5" class="conn-line conn-main" data-conn="${a}-${b}" />\n`;
    }
});

// 2. 生成所有 62 个舱室节点 (Rooms SVG)
let roomsSvg = '';
Object.values(MASTER_ROOM_DEFS).forEach(r => {
    const cx = padX + (r.coord.x - minX) * cellW + cellW / 2;
    const cy = padY + (r.coord.y - minY) * cellH + cellH / 2;
    const x = cx - roomW / 2;
    const y = cy - roomH / 2;

    let zc = zoneColors[r.zone] || zoneColors.hub;
    let isNpc = !!r.isNpcRoom;
    let npcColor = '#f59e0b';

    if (isNpc) {
        if (r.npcOwnerId === 'shaokexin') npcColor = '#f472b6';
        else if (r.npcOwnerId === 'mode') npcColor = '#a78bfa';
        else if (r.npcOwnerId === 'kaze' || r.npcOwnerId === 'kaluo') npcColor = '#38bdf8';
        else if (r.npcOwnerId === 'prof_lu' || r.npcOwnerId === 'luzhixing') npcColor = '#10b981';
        else if (r.npcOwnerId === 'noah') npcColor = '#6366f1';
        else if (r.npcOwnerId === 'sophia') npcColor = '#ec4899';
        else if (r.npcOwnerId === 'vivian') npcColor = '#f43f5e';
        else if (r.npcOwnerId === 'elena') npcColor = '#fb923c';
        else if (r.npcOwnerId === 'elsa' || r.npcOwnerId === 'dr_elsa') npcColor = '#06b6d4';
        else if (r.npcOwnerId === 'colt_barnes' || r.npcOwnerId === 'colt') npcColor = '#f59e0b';
        else if (r.npcOwnerId === 'barnes') npcColor = '#84cc16';
        else npcColor = '#fbbf24';
    }

    const shortName = r.name.replace(/【.*?】/, '').trim();
    const tag = (r.name.match(/【(.*?)】/) || ['', ''])[1];
    const pathD = getShapeSvgPath(r.shape, roomW, roomH);
    const equipIcon = equipIcons[r.equipment] || '⚙️';

    // 状态徽标
    let badges = [];
    if (r.id === 'room_start') badges.push('<tspan fill="#34d399" font-weight="bold">🚩起点</tspan>');
    if (r.isExit) badges.push('<tspan fill="#f59e0b" font-weight="bold">🏆终点</tspan>');
    if (r.isDetectionRoom) badges.push('<tspan fill="#10b981" font-weight="bold">🧪检测</tspan>');
    if (r.diary && r.diary.length > 0) badges.push(`<tspan fill="${npcColor}">📖日记×${r.diary.length}</tspan>`);
    if (r.id === 'room_storage_ne' || r.id === 'room_west_end') badges.push('<tspan fill="#fbbf24">🍱给养</tspan>');

    const badgeStr = badges.join(' ');
    const strokeColor = isNpc ? npcColor : zc.border;
    const strokeWidth = isNpc ? 2.5 : 2;
    const strokeDash = isNpc ? 'stroke-dasharray="6,3"' : '';

    roomsSvg += `
    <g class="room-node ${isNpc ? 'is-npc-room' : ''} ${r.isDetectionRoom ? 'is-detection-room' : ''}" 
       id="node-${r.id}"
       data-room-id="${r.id}" 
       data-zone="${r.zone}"
       data-shape="${r.shape}"
       transform="translate(${x}, ${y})"
       tabindex="0">
        <!-- 房间多边形底层主体 -->
        <path d="${pathD}" fill="${zc.bg}" fill-opacity="0.88" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${strokeDash} class="room-poly" />
        
        <!-- 舱室顶部标头 -->
        <text x="${roomW / 2}" y="19" text-anchor="middle" font-size="10" font-weight="bold" fill="${isNpc ? npcColor : zc.text}" class="room-tag">【${tag}】</text>
        
        <!-- 舱室核心名称与微缩图标 -->
        <text x="${roomW / 2}" y="41" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff" class="room-title">
            <tspan font-size="12.5">${equipIcon}</tspan> ${shortName}
        </text>
        
        <!-- 坐标与特有形状 -->
        <text x="${roomW / 2}" y="61" text-anchor="middle" font-size="8.8" fill="#94a3b8" font-family="monospace">
            [X:${r.coord.x}, Y:${r.coord.y}] · ${r.shape}
        </text>

        <!-- 状态徽章条 -->
        <text x="${roomW / 2}" y="79" text-anchor="middle" font-size="8.5" font-family="sans-serif">
            ${badgeStr || `<tspan fill="${zc.border}">设:${r.equipment || '常规'}</tspan>`}
        </text>
    </g>\n`;
});

// 3. 构造全套可交互 HTML 页面
const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 远征星舰【代号：重现之重】全舰母地图 (Master Spaceship Map · 62 舱室全景蓝图)</title>
    <style>
        :root {
            --bg-color: #030712;
            --panel-bg: rgba(15, 23, 42, 0.94);
            --border-glow: #38bdf8;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
        }
        * { box-sizing: border-box; }
        body { 
            margin: 0; 
            background: var(--bg-color); 
            color: var(--text-main); 
            font-family: 'PingFang SC', -apple-system, 'Microsoft YaHei', sans-serif; 
            padding: 16px 20px; 
            overflow-x: hidden;
        }
        header { text-align: center; margin-bottom: 12px; }
        h1 { 
            color: #38bdf8; 
            font-size: 24px; 
            margin: 0 0 6px 0; 
            letter-spacing: 1px;
            text-shadow: 0 0 20px rgba(56,189,248,0.4);
        }
        .meta-bar { 
            color: var(--text-muted); 
            font-size: 13px; 
            display: flex;
            justify-content: center;
            gap: 16px;
            flex-wrap: wrap;
            margin-bottom: 14px;
        }
        .stat-item { color: #f1f5f9; font-weight: 500; }
        .stat-item b { color: #38bdf8; }

        /* 顶部操作与筛选栏 */
        .controls-toolbar {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
            margin-bottom: 16px;
            flex-wrap: wrap;
        }
        .filter-btn {
            background: rgba(30, 41, 59, 0.8);
            border: 1px solid rgba(56, 189, 248, 0.25);
            color: #cbd5e1;
            padding: 5px 12px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .filter-btn:hover, .filter-btn.active {
            background: rgba(56, 189, 248, 0.25);
            border-color: #38bdf8;
            color: #38bdf8;
            box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
        }
        .search-input {
            background: rgba(15, 23, 42, 0.9);
            border: 1px solid #334155;
            color: #f8fafc;
            padding: 6px 14px;
            border-radius: 6px;
            font-size: 12px;
            outline: none;
            width: 220px;
            transition: border-color 0.2s;
        }
        .search-input:focus {
            border-color: #38bdf8;
            box-shadow: 0 0 8px rgba(56, 189, 248, 0.3);
        }

        /* 区域图例 */
        .legend-bar { 
            display: flex; 
            justify-content: center; 
            gap: 8px; 
            margin-bottom: 16px; 
            flex-wrap: wrap; 
        }
        .badge { 
            display: inline-flex; 
            align-items: center;
            padding: 3px 10px; 
            border-radius: 6px; 
            font-size: 11.5px; 
            font-weight: bold; 
            border: 1px solid rgba(255,255,255,0.15); 
        }

        /* 主蓝图画卷容器 */
        .viewport-wrapper {
            position: relative;
            max-width: 100%;
            overflow: auto;
            border: 1px solid #1e293b;
            background: radial-gradient(circle at 50% 50%, #0d1b33 0%, #030712 100%);
            border-radius: 12px;
            box-shadow: 0 0 45px rgba(56,189,248,0.15);
            padding: 10px;
            margin-bottom: 24px;
        }
        svg { display: block; margin: 0 auto; user-select: none; }

        /* 节点与连线交互样式 */
        .room-node {
            cursor: pointer;
            transition: transform 0.2s, filter 0.2s;
            outline: none;
        }
        .room-node:hover {
            filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.8));
        }
        .room-node.is-selected .room-poly {
            stroke: #fef08a !important;
            stroke-width: 3.5 !important;
            filter: drop-shadow(0 0 16px #eab308);
        }
        .room-node.is-npc-room:hover {
            filter: drop-shadow(0 0 14px rgba(245, 158, 11, 0.85));
        }
        .room-node.is-detection-room:hover {
            filter: drop-shadow(0 0 14px rgba(16, 185, 129, 0.85));
        }
        .room-node.is-dimmed {
            opacity: 0.18;
            filter: grayscale(80%);
        }
        .conn-line.is-dimmed {
            opacity: 0.08;
        }

        /* 侧边检阅档案抽屉 */
        .inspector-drawer {
            position: fixed;
            top: 20px;
            right: -420px;
            width: 390px;
            max-height: calc(100vh - 40px);
            background: var(--panel-bg);
            border: 1px solid rgba(56, 189, 248, 0.4);
            border-radius: 12px;
            box-shadow: -10px 0 35px rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(12px);
            padding: 20px;
            z-index: 1000;
            transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            overflow-y: auto;
            text-align: left;
        }
        .inspector-drawer.open { right: 20px; }
        .drawer-close {
            position: absolute;
            top: 14px;
            right: 16px;
            background: transparent;
            border: none;
            color: #94a3b8;
            font-size: 20px;
            cursor: pointer;
        }
        .drawer-close:hover { color: #f8fafc; }
        .drawer-title { font-size: 17px; font-weight: bold; color: #38bdf8; margin: 0 0 8px 0; }
        .drawer-tag { display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: 4px; margin-bottom: 12px; }
        .drawer-section { margin-bottom: 14px; font-size: 13px; line-height: 1.6; }
        .drawer-section-title { font-size: 12px; font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
        .drawer-desc { color: #cbd5e1; background: rgba(15, 23, 42, 0.6); padding: 10px; border-radius: 6px; border-left: 3px solid #38bdf8; }
        .diary-card {
            background: rgba(30, 41, 59, 0.7);
            border: 1px solid rgba(245, 158, 11, 0.3);
            border-radius: 6px;
            padding: 10px;
            margin-top: 8px;
        }
        .diary-card h4 { margin: 0 0 6px 0; color: #fde68a; font-size: 13px; }
        .diary-card p { margin: 0; color: #cbd5e1; font-size: 12px; white-space: pre-wrap; }

        /* 底部提示 */
        .footer-note { font-size: 12px; color: #64748b; margin-top: 10px; }
    </style>
</head>
<body>
    <header>
        <h1>🚀 远征星舰【代号：重现之重】全舰母地图 (Master Blueprint)</h1>
        <div class="meta-bar">
            <span class="stat-item">全舰总舱室: <b>${allRooms.length} 间</b> (58功能主舱 + ${NPC_PRIVATE_QUARTERS.length}专属私人舱)</span>
            <span class="stat-item">网格矩阵: <b>${cols} × ${rows}</b> (X:${minX}~${maxX}, Y:${minY}~${maxY})</span>
            <span class="stat-item">双向密闭通道: <b>${MASTER_CONNECTIONS.length} 条</b> (含${NPC_PRIVATE_QUARTERS.length}条专属气闸)</span>
            <span class="stat-item">状态: <b style="color:#34d399;">100% 连通可达 · 零断头死锁</b></span>
        </div>
    </header>

    <!-- 顶部操作与筛选栏 -->
    <div class="controls-toolbar">
        <input type="text" id="searchInput" class="search-input" placeholder="🔍 搜索舱室名称 / 形状 / 设备 / NPC..." oninput="handleSearch(this.value)">
        <button class="filter-btn active" onclick="setFilter('all', this)">全部舱室 (${allRooms.length})</button>
        <button class="filter-btn" onclick="setFilter('npc', this)">🔒 NPC私人舱 (${NPC_PRIVATE_QUARTERS.length})</button>
        <button class="filter-btn" onclick="setFilter('special', this)">⭐ 终点/检测/给养</button>
        <button class="filter-btn" onclick="setFilter('bow', this)">舰艏</button>
        <button class="filter-btn" onclick="setFilter('medical_bio', this)">生化医疗</button>
        <button class="filter-btn" onclick="setFilter('hub_living', this)">中枢生活</button>
        <button class="filter-btn" onclick="setFilter('engineering', this)">工程动力</button>
        <button class="filter-btn" onclick="setFilter('stern', this)">舰尾跃迁</button>
        <button class="filter-btn" onclick="resetHighlight()">🔄 重置高亮</button>
    </div>

    <!-- 区域图例 -->
    <div class="legend-bar">
        <span class="badge" style="background:#0b1e3b; color:#bae6fd; border-color:#38bdf8;">舰艏指控 (Y=0)</span>
        <span class="badge" style="background:#022c22; color:#a7f3d0; border-color:#34d399;">生化医疗 (Y=1)</span>
        <span class="badge" style="background:#172554; color:#bfdbfe; border-color:#60a5fa;">中央枢纽 (Y=2,3)</span>
        <span class="badge" style="background:#3b0764; color:#e9d5ff; border-color:#c084fc;">生活起居 (Y=2,3)</span>
        <span class="badge" style="background:#14532d; color:#bbf7d0; border-color:#4ade80;">生态水培 (Y=2,4)</span>
        <span class="badge" style="background:#701a75; color:#fae8ff; border-color:#e879f9;">工程维保 (Y=4,5)</span>
        <span class="badge" style="background:#4c0519; color:#fecdd3; border-color:#fb7185;">动力反应堆 (Y=5)</span>
        <span class="badge" style="background:#431407; color:#fed7aa; border-color:#fb923c;">跃迁推进 (Y=6)</span>
        <span class="badge" style="background:#1c1917; color:#fef08a; border-color:#f59e0b;">🔒 NPC专属私人舱</span>
        <span class="badge" style="background:#064e3b; color:#6ee7b7; border-color:#10b981;">🧪 队伍伪人检测台</span>
    </div>

    <!-- SVG 蓝图视口 -->
    <div class="viewport-wrapper">
        <svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse">
                    <path d="M 36 0 L 0 0 0 36" fill="none" stroke="rgba(56,189,248,0.05)" stroke-width="1"/>
                </pattern>
                <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#0f2b48" stop-opacity="0.5"/>
                    <stop offset="100%" stop-color="#030712" stop-opacity="1"/>
                </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#bgGlow)" />
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            <!-- 通道层 -->
            <g id="connections-layer">
                ${linesSvg}
            </g>
            
            <!-- 舱室层 -->
            <g id="rooms-layer">
                ${roomsSvg}
            </g>
        </svg>
    </div>

    <!-- 侧边舱室详情检阅档案抽屉 -->
    <aside id="inspectorDrawer" class="inspector-drawer">
        <button class="drawer-close" onclick="closeDrawer()">&times;</button>
        <h3 id="dName" class="drawer-title">【舱室名】</h3>
        <div id="dTag" class="drawer-tag">所属区域</div>

        <div class="drawer-section">
            <div class="drawer-section-title">📍 舰载位置与几何构造</div>
            <div id="dCoords" style="color:#38bdf8; font-family:monospace;">坐标: [X:0, Y:0] · 形状: -</div>
        </div>

        <div class="drawer-section">
            <div class="drawer-section-title">⚙️ 搭载机能与设备</div>
            <div id="dEquip" style="color:#cbd5e1;">-</div>
        </div>

        <div class="drawer-section">
            <div class="drawer-section-title">📝 舱室背景世界观档案</div>
            <div id="dDesc" class="drawer-desc">-</div>
        </div>

        <div class="drawer-section" id="dDiariesSec" style="display:none;">
            <div class="drawer-section-title" style="color:#f59e0b;">📖 乘员专属碎片化日记 (随行解锁)</div>
            <div id="dDiariesList"></div>
        </div>

        <div class="drawer-section">
            <div class="drawer-section-title">🔗 物理双向可达相邻舱室</div>
            <div id="dConns" style="font-size:12px; color:#94a3b8;">-</div>
        </div>
    </aside>

    <div class="footer-note">
        💡 提示：点击地图中的任意舱室，可在右侧展开该舱室的详细功能、设备规范、背景档案以及 NPC 私人日记篇目。
    </div>

    <!-- 交互数据与脚本 -->
    <script>
        const ROOM_DATA = ${JSON.stringify(MASTER_ROOM_DEFS)};
        const CONNECTIONS = ${JSON.stringify(MASTER_CONNECTIONS)};

        // 计算各舱室的连通邻居
        const adjacency = {};
        CONNECTIONS.forEach(([a, b]) => {
            if (!adjacency[a]) adjacency[a] = [];
            if (!adjacency[b]) adjacency[b] = [];
            adjacency[a].push(b);
            adjacency[b].push(a);
        });

        // 绑定节点点击
        document.querySelectorAll('.room-node').forEach(node => {
            node.addEventListener('click', (e) => {
                const roomId = node.getAttribute('data-room-id');
                selectRoom(roomId);
            });
        });

        function selectRoom(roomId) {
            const r = ROOM_DATA[roomId];
            if (!r) return;

            document.querySelectorAll('.room-node').forEach(n => n.classList.remove('is-selected'));
            const activeNode = document.getElementById('node-' + roomId);
            if (activeNode) activeNode.classList.add('is-selected');

            document.getElementById('dName').textContent = r.name;
            document.getElementById('dTag').textContent = '区域: ' + r.zone.toUpperCase() + (r.isNpcRoom ? ' · 🔒乘员专属私人舱室' : '');
            document.getElementById('dTag').style.background = r.isNpcRoom ? '#78350f' : '#1e3a8a';
            document.getElementById('dTag').style.color = r.isNpcRoom ? '#fde68a' : '#93c5fd';

            document.getElementById('dCoords').textContent = \`拓扑网格: [X: \${r.coord.x}, Y: \${r.coord.y}] ｜ 科幻外形: \${r.shape}\`;
            document.getElementById('dEquip').textContent = \`搭载微缩构件: \${r.equipment || '常规标准舱壁'} \${r.isDetectionRoom ? '｜ 🧪 [队伍伪人数量扫描终端]' : ''}\`;
            document.getElementById('dDesc').textContent = r.desc || '（暂无详细记录）';

            // 日记展示
            const dSec = document.getElementById('dDiariesSec');
            const dList = document.getElementById('dDiariesList');
            if (r.diary && r.diary.length > 0) {
                dSec.style.display = 'block';
                dList.innerHTML = r.diary.map((d, idx) => \`
                    <div class="diary-card">
                        <h4>\${d.title}</h4>
                        <p>\${d.content}</p>
                    </div>
                \`).join('');
            } else {
                dSec.style.display = 'none';
                dList.innerHTML = '';
            }

            // 相邻房间
            const neighbors = adjacency[roomId] || [];
            const neighborNames = neighbors.map(id => {
                const nr = ROOM_DATA[id];
                return nr ? nr.name.replace(/【.*?】/, '') : id;
            });
            document.getElementById('dConns').textContent = neighborNames.length > 0 ? neighborNames.join(' ➔ ') : '（独立单向节点）';

            document.getElementById('inspectorDrawer').classList.add('open');
        }

        function closeDrawer() {
            document.getElementById('inspectorDrawer').classList.remove('open');
            document.querySelectorAll('.room-node').forEach(n => n.classList.remove('is-selected'));
        }

        // 筛选逻辑
        function setFilter(type, btn) {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            if (btn) btn.classList.add('active');

            document.querySelectorAll('.room-node').forEach(node => {
                const id = node.getAttribute('data-room-id');
                const zone = node.getAttribute('data-zone');
                const r = ROOM_DATA[id];
                let match = false;

                if (type === 'all') match = true;
                else if (type === 'npc') match = !!r.isNpcRoom;
                else if (type === 'special') match = (r.isExit || r.isDetectionRoom || id === 'room_start' || id === 'room_storage_ne' || id === 'room_west_end');
                else if (type === 'bow') match = (zone === 'bow');
                else if (type === 'medical_bio') match = (zone === 'medical' || zone === 'research');
                else if (type === 'hub_living') match = (zone === 'hub' || zone === 'living' || zone === 'ecology');
                else if (type === 'engineering') match = (zone === 'engineering' || zone === 'propulsion' || zone === 'security');
                else if (type === 'stern') match = (zone === 'stern');

                if (match) {
                    node.classList.remove('is-dimmed');
                } else {
                    node.classList.add('is-dimmed');
                }
            });
        }

        // 搜索逻辑
        function handleSearch(val) {
            const q = val.trim().toLowerCase();
            if (!q) {
                resetHighlight();
                return;
            }

            document.querySelectorAll('.room-node').forEach(node => {
                const id = node.getAttribute('data-room-id');
                const r = ROOM_DATA[id];
                const text = (r.name + ' ' + r.shape + ' ' + (r.equipment || '') + ' ' + (r.desc || '')).toLowerCase();
                if (text.includes(q)) {
                    node.classList.remove('is-dimmed');
                } else {
                    node.classList.add('is-dimmed');
                }
            });
        }

        function resetHighlight() {
            document.querySelectorAll('.room-node').forEach(node => node.classList.remove('is-dimmed'));
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            const allBtn = document.querySelector('.filter-btn');
            if (allBtn) allBtn.classList.add('active');
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.value = '';
        }
    </script>
</body>
</html>`;

fs.writeFileSync('preview_master_map.html', html, 'utf8');
console.log(`[OK] preview_master_map.html 重新生成成功！(含 ${allRooms.length} 间舱室真实科幻多边形、${NPC_PRIVATE_QUARTERS.length} 个专属私人舱室、专属日记、伪人检测室与交互检阅抽屉)`);

