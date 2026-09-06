const fs = require('fs');
const { MASTER_ROOM_DEFS, MASTER_CONNECTIONS } = require('./js/spaceshipMasterMap.js');

const cols = 9, rows = 7;
const cellW = 126, cellH = 105;
const padX = 70, padY = 60;
const svgW = cols * cellW + padX * 2;
const svgH = rows * cellH + padY * 2;

let linesSvg = '';
MASTER_CONNECTIONS.forEach(([a, b]) => {
    const rA = MASTER_ROOM_DEFS[a];
    const rB = MASTER_ROOM_DEFS[b];
    if (!rA || !rB) return;
    const x1 = padX + rA.coord.x * cellW + cellW / 2;
    const y1 = padY + rA.coord.y * cellH + cellH / 2;
    const x2 = padX + rB.coord.x * cellW + cellW / 2;
    const y2 = padY + rB.coord.y * cellH + cellH / 2;
    linesSvg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(56,189,248,0.4)" stroke-width="3" />\n`;
});

const zoneColors = {
    command: { bg: '#1e3a8a', stroke: '#60a5fa', text: '#93c5fd', name: '舰艏指控' },
    hub: { bg: '#1e293b', stroke: '#38bdf8', text: '#bae6fd', name: '中央枢纽' },
    living: { bg: '#4c1d95', stroke: '#c084fc', text: '#e9d5ff', name: '生活起居' },
    ecology: { bg: '#064e3b', stroke: '#34d399', text: '#a7f3d0', name: '生态支持' },
    cargo: { bg: '#78350f', stroke: '#fbbf24', text: '#fde68a', name: '货运仓储' },
    engineering: { bg: '#831843', stroke: '#f472b6', text: '#fbcfe8', name: '动力反应' },
    thruster: { bg: '#7c2d12', stroke: '#fb923c', text: '#fed7aa', name: '跃迁推进' }
};

let roomsSvg = '';
Object.values(MASTER_ROOM_DEFS).forEach(r => {
    const cx = padX + r.coord.x * cellW + cellW / 2;
    const cy = padY + r.coord.y * cellH + cellH / 2;
    const w = 106, h = 76;
    const x = cx - w / 2, y = cy - h / 2;
    const zc = zoneColors[r.zone] || zoneColors.hub;
    const shortName = r.name.replace(/【.*?】/, '').slice(0, 6);
    const tag = (r.name.match(/【(.*?)】/) || ['', ''])[1];

    roomsSvg += `
    <g transform="translate(${x}, ${y})">
        <rect width="${w}" height="${h}" rx="8" fill="${zc.bg}" fill-opacity="0.8" stroke="${zc.stroke}" stroke-width="2" />
        <text x="${w / 2}" y="18" text-anchor="middle" font-size="10" font-weight="bold" fill="${zc.text}" font-family="sans-serif">【${tag}】</text>
        <text x="${w / 2}" y="38" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff" font-family="sans-serif">${shortName}</text>
        <text x="${w / 2}" y="54" text-anchor="middle" font-size="9" fill="#94a3b8" font-family="monospace">[X:${r.coord.x}, Y:${r.coord.y}]</text>
        <text x="${w / 2}" y="67" text-anchor="middle" font-size="8" fill="${zc.stroke}" font-family="monospace">形:${r.shape} · 设:${r.equipment || '无'}</text>
    </g>\n`;
});

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>太空母舰基地蓝图 (Master Spaceship Map · 58 舱室全景检阅)</title>
    <style>
        body { margin: 0; background: #030712; color: #f8fafc; font-family: 'PingFang SC', -apple-system, sans-serif; padding: 20px; text-align: center; }
        h1 { color: #38bdf8; font-size: 24px; margin-bottom: 6px; letter-spacing: 1px; }
        .meta { color: #94a3b8; font-size: 13px; margin-bottom: 16px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; margin: 0 4px; border: 1px solid rgba(255,255,255,0.15); }
        .legend { display: flex; justify-content: center; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
        .svg-container { overflow: auto; border: 1px solid #1e293b; background: radial-gradient(circle at 50% 50%, #0d1b33 0%, #030712 100%); border-radius: 12px; box-shadow: 0 0 35px rgba(56,189,248,0.2); display: inline-block; max-width: 98vw; padding: 10px; }
        svg { display: block; margin: 0 auto; }
        .deck-label { position: absolute; left: 10px; font-size: 11px; color: #64748b; }
    </style>
</head>
<body>
    <h1>🚀 远征星舰【代号：重现之重】全舰母地图 (Master Spaceship Base)</h1>
    <div class="meta">58 间各异多边形舱室 ｜ 9×7 全维坐标矩阵 ｜ 5 阶渐进式开放扇区 ｜ 100% 物理双向可达 ｜ 蓝图微缩设备全面装配</div>
    <div class="legend">
        <span class="badge" style="background:#1e3a8a; color:#93c5fd;">Y=0 舰艏指控 (Bridge)</span>
        <span class="badge" style="background:#1e293b; color:#bae6fd;">Y=1,2,3 中央枢纽 (Hub)</span>
        <span class="badge" style="background:#4c1d95; color:#e9d5ff;">Y=2 东侧生活起居 (Living)</span>
        <span class="badge" style="background:#064e3b; color:#a7f3d0;">Y=2,4 生态循环 (Ecology)</span>
        <span class="badge" style="background:#78350f; color:#fde68a;">Y=4 重载机库货运 (Cargo)</span>
        <span class="badge" style="background:#831843; color:#fbcfe8;">Y=5 聚变反应堆动力 (Reactor)</span>
        <span class="badge" style="background:#7c2d12; color:#fed7aa;">Y=6 离子推进与跃迁星门 (Thruster)</span>
    </div>
    <div class="svg-container">
        <svg width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(56,189,248,0.06)" stroke-width="1"/>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            ${linesSvg}
            ${roomsSvg}
        </svg>
    </div>
</body>
</html>`;

fs.writeFileSync('preview_master_map.html', html, 'utf8');
console.log('[OK] preview_master_map.html 生成成功！');
