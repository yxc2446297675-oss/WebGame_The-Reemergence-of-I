function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * 根据房间形态绘制轮廓路径
 */
function drawShapePath(ctx, shape, x, y, w, h) {
    ctx.beginPath();
    switch (shape) {
        case "octagon": {
            // 八角切角舱室 (反应堆/主控)
            const c = Math.floor(Math.min(w, h) * 0.25);
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
        case "bridge": {
            // 梯形前突舰桥 (顶窄底宽)
            const cut = Math.floor(w * 0.22);
            ctx.moveTo(x + cut, y);
            ctx.lineTo(x + w - cut, y);
            ctx.lineTo(x + w, y + h);
            ctx.lineTo(x, y + h);
            ctx.closePath();
            break;
        }
        case "reactor": {
            // 核反应堆重型舱 (大角度外切八角)
            const c = Math.floor(Math.min(w, h) * 0.32);
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
        case "airlock": {
            // 双向防爆气闸舱 (两侧切角内凹)
            const c = Math.floor(Math.min(w, h) * 0.18);
            ctx.moveTo(x, y + c);
            ctx.lineTo(x + c, y);
            ctx.lineTo(x + w - c, y);
            ctx.lineTo(x + w, y + c);
            ctx.lineTo(x + w - c, y + h / 2);
            ctx.lineTo(x + w, y + h - c);
            ctx.lineTo(x + w - c, y + h);
            ctx.lineTo(x + c, y + h);
            ctx.lineTo(x, y + h - c);
            ctx.lineTo(x + c, y + h / 2);
            ctx.closePath();
            break;
        }
        case "corridor_h": {
            // 横向长条过渡回廊
            const insetY = Math.floor(h * 0.15);
            const my = y + insetY;
            const mh = h - insetY * 2;
            if (ctx.roundRect) ctx.roundRect(x - 2, my, w + 4, mh, 4);
            else ctx.rect(x - 2, my, w + 4, mh);
            break;
        }
        case "corridor_v": {
            // 纵向长条通风回廊
            const insetX = Math.floor(w * 0.15);
            const mx = x + insetX;
            const mw = w - insetX * 2;
            if (ctx.roundRect) ctx.roundRect(mx, y - 2, mw, h + 4, 4);
            else ctx.rect(mx, y - 2, mw, h + 4);
            break;
        }
        case "medical": {
            // 医疗急救舱 (圆角十字微弧)
            if (ctx.roundRect) ctx.roundRect(x, y, w, h, Math.floor(Math.min(w, h) * 0.28));
            else ctx.rect(x, y, w, h);
            break;
        }
        case "quarters": {
            // 乘组起居生活舱 (平滑倒角矩形)
            if (ctx.roundRect) ctx.roundRect(x, y, w, h, 8);
            else ctx.rect(x, y, w, h);
            break;
        }
        case "storage": {
            // 仓储货库 (上下切角六边形)
            const c = Math.floor(Math.min(w, h) * 0.2);
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
        case "lab": {
            // 科学实验室 (侧切六棱多面体)
            const cutX = Math.floor(w * 0.22);
            ctx.moveTo(x + cutX, y);
            ctx.lineTo(x + w - cutX, y);
            ctx.lineTo(x + w, y + h / 2);
            ctx.lineTo(x + w - cutX, y + h);
            ctx.lineTo(x + cutX, y + h);
            ctx.lineTo(x, y + h / 2);
            ctx.closePath();
            break;
        }
        case "rect":
        default: {
            if (ctx.roundRect) ctx.roundRect(x, y, w, h, 4);
            else ctx.rect(x, y, w, h);
            break;
        }
    }
}

/**
 * 绘制舱内极简高科技蓝图微缩设备线条
 */
function drawEquipmentBlueprint(ctx, equipment, cx, cy, boxSize) {
    if (!equipment) return;
    ctx.save();
    ctx.lineWidth = 1;
    const r = boxSize * 0.35;

    switch (equipment) {
        case "energy_ring": {
            ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
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
            ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
            ctx.beginPath();
            ctx.arc(cx, cy + r * 0.25, r * 0.7, Math.PI * 1.15, Math.PI * 1.85);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx - r * 0.5, cy + r * 0.35);
            ctx.lineTo(cx + r * 0.5, cy + r * 0.35);
            ctx.stroke();
            break;
        }
        case "medical_bed": {
            ctx.strokeStyle = "rgba(244, 63, 94, 0.45)";
            ctx.strokeRect(cx - r * 0.6, cy - r * 0.35, r * 1.2, r * 0.7);
            ctx.beginPath();
            ctx.moveTo(cx - r * 0.4, cy);
            ctx.lineTo(cx - r * 0.15, cy);
            ctx.lineTo(cx - r * 0.05, cy - r * 0.25);
            ctx.lineTo(cx + r * 0.05, cy + r * 0.25);
            ctx.lineTo(cx + r * 0.15, cy);
            ctx.lineTo(cx + r * 0.4, cy);
            ctx.stroke();
            break;
        }
        case "cryo_pods": {
            ctx.strokeStyle = "rgba(168, 85, 247, 0.45)";
            const pw = r * 0.42;
            const ph = r * 0.85;
            ctx.strokeRect(cx - r * 0.65, cy - ph / 2, pw, ph);
            ctx.strokeRect(cx + r * 0.23, cy - ph / 2, pw, ph);
            break;
        }
        case "cargo_grid": {
            ctx.strokeStyle = "rgba(245, 158, 11, 0.45)";
            const bw = r * 0.5;
            ctx.strokeRect(cx - r * 0.6, cy - r * 0.45, bw, bw);
            ctx.strokeRect(cx + r * 0.1, cy - r * 0.45, bw, bw);
            ctx.strokeRect(cx - r * 0.25, cy + r * 0.1, bw, bw * 0.75);
            break;
        }
        case "workshop_tools": {
            ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
            ctx.beginPath();
            ctx.moveTo(cx - r * 0.6, cy - r * 0.4); ctx.lineTo(cx + r * 0.6, cy + r * 0.4);
            ctx.moveTo(cx - r * 0.6, cy + r * 0.4); ctx.lineTo(cx + r * 0.6, cy - r * 0.4);
            ctx.stroke();
            break;
        }
        case "hydroponics": {
            ctx.strokeStyle = "rgba(74, 222, 128, 0.45)";
            ctx.beginPath();
            ctx.moveTo(cx - r * 0.6, cy - r * 0.3); ctx.lineTo(cx + r * 0.6, cy - r * 0.3);
            ctx.moveTo(cx - r * 0.6, cy + r * 0.3); ctx.lineTo(cx + r * 0.6, cy + r * 0.3);
            ctx.arc(cx, cy, r * 0.3, 0, Math.PI);
            ctx.stroke();
            break;
        }
        case "star_lens": {
            ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
            ctx.beginPath(); ctx.arc(cx, cy, r * 0.65, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2); ctx.stroke();
            break;
        }
        case "shield_generator": {
            ctx.strokeStyle = "rgba(34, 211, 238, 0.45)";
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
            ctx.strokeStyle = "rgba(239, 68, 68, 0.45)";
            ctx.beginPath();
            ctx.moveTo(cx - r * 0.4, cy - r * 0.6);
            ctx.lineTo(cx + r * 0.4, cy - r * 0.6);
            ctx.lineTo(cx + r * 0.6, cy + r * 0.6);
            ctx.lineTo(cx - r * 0.6, cy + r * 0.6);
            ctx.closePath();
            ctx.stroke();
            break;
        }
        case "armory_racks": {
            ctx.strokeStyle = "rgba(234, 179, 8, 0.45)";
            for (let i = -2; i <= 2; i++) {
                ctx.beginPath();
                ctx.moveTo(cx + i * (r * 0.25), cy - r * 0.5);
                ctx.lineTo(cx + i * (r * 0.25), cy + r * 0.5);
                ctx.stroke();
            }
            break;
        }
        default:
            break;
    }
    ctx.restore();
}

export class MapRenderer {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement ? canvasElement.getContext("2d") : null;
        this.animating = false;
        this.animationFrameId = null;
        this.skipAnimation = null;
        this.viewMode = "focus"; // "focus" (智能扇区聚焦) | "full" (母舰全舰全景)
    }

    /**
     * 在【🔭 扇区聚焦】与【🌌 全舰全景】之间一键切换
     */
    toggleViewMode() {
        this.viewMode = this.viewMode === "focus" ? "full" : "focus";
        return this.viewMode;
    }

    getLayout() {
        const width = 720;
        const height = 480;

        // 全舰全景模式：完整 9 列 x 7 行母舰蓝图
        if (this.viewMode === "full") {
            const minX = 0, maxX = 8;
            const minY = 0, maxY = 6;
            const cols = 9;
            const rows = 7;
            const paddingX = 42;
            const paddingY = 40;
            const availW = width - paddingX * 2;
            const availH = height - paddingY * 2;
            const cellW = Math.floor(availW / (cols - 1));
            const cellH = Math.floor(availH / (rows - 1));
            const boxSize = 36;
            const totalGridW = (cols - 1) * cellW;
            const totalGridH = (rows - 1) * cellH;
            const originX = Math.round((width - totalGridW) / 2);
            const originY = Math.round((height - totalGridH) / 2);
            return {
                originX,
                originY,
                cellW,
                cellH,
                boxSize,
                width,
                height,
                minX,
                minY,
                maxX,
                maxY
            };
        }

        // 扇区聚焦模式：自适应当前关卡开放区域的边界矩形
        let minX = 0, maxX = 4, minY = 1, maxY = 3;
        if (this.currentLevelMap && this.currentLevelMap.nodes) {
            const coords = Object.values(this.currentLevelMap.nodes).map(n => n.coord || { x: 0, y: 1 });
            if (coords.length > 0) {
                minX = Math.min(...coords.map(c => c.x));
                maxX = Math.max(...coords.map(c => c.x));
                minY = Math.min(...coords.map(c => c.y));
                maxY = Math.max(...coords.map(c => c.y));
            }
        }

        const cols = Math.max(maxX - minX + 1, 1);
        const rows = Math.max(maxY - minY + 1, 1);

        // 第一关兼容
        if (cols <= 5 && rows <= 3 && maxX <= 4 && maxY <= 3 && minX === 0 && minY === 1) {
            return {
                originX: 90,
                originY: 80,
                cellW: 120,
                cellH: 95,
                boxSize: 58,
                width: 680,
                height: 460,
                minX: 0,
                minY: 1,
                maxX: 4,
                maxY: 3
            };
        }

        // 第二关兼容
        if (cols <= 5 && rows <= 4 && maxY === 4 && minX === 0 && minY === 1) {
            return {
                originX: 95,
                originY: 52,
                cellW: 118,
                cellH: 90,
                boxSize: 52,
                width: 680,
                height: 460,
                minX: 0,
                minY: 1,
                maxX: 4,
                maxY: 4
            };
        }

        // 梯级 1~5 自适应计算 (720x480)
        const paddingX = 55;
        const paddingY = 48;
        const availW = width - paddingX * 2;
        const availH = height - paddingY * 2;

        const cellW = cols > 1 ? Math.floor(availW / (cols - 1)) : availW;
        const cellH = rows > 1 ? Math.floor(availH / (rows - 1)) : availH;

        let boxSize = Math.floor(Math.min(cellW, cellH) * 0.72);
        if (boxSize > 54) boxSize = 54;
        if (boxSize < 30) boxSize = 30;

        const totalGridW = (cols - 1) * cellW;
        const totalGridH = (rows - 1) * cellH;

        const originX = Math.round((width - totalGridW) / 2);
        const originY = Math.round((height - totalGridH) / 2);

        return {
            originX,
            originY,
            cellW,
            cellH,
            boxSize,
            width,
            height,
            minX,
            minY,
            maxX,
            maxY
        };
    }

    getNodeCenter(node) {
        if (!node) return { x: 90, y: 80 };
        const layout = this.getLayout();
        const coord = node.coord || { x: 0, y: 1 };
        const minX = layout.minX !== undefined ? layout.minX : 0;
        const minY = layout.minY !== undefined ? layout.minY : 1;
        return {
            x: layout.originX + (coord.x - minX) * layout.cellW,
            y: layout.originY + (coord.y - minY) * layout.cellH
        };
    }

    /**
     * 获取 Canvas 坐标对应的房间节点（用于点击/悬浮快速往返）
     */
    getNodeAtPosition(canvasX, canvasY, levelMap) {
        if (!levelMap || !levelMap.nodes) return null;
        const layout = this.getLayout();
        const boxSize = layout.boxSize;
        const half = boxSize / 2 + Math.max(Math.floor(boxSize * 0.25), 14);

        for (const node of Object.values(levelMap.nodes)) {
            const p = this.getNodeCenter(node);
            if (Math.abs(canvasX - p.x) <= half && Math.abs(canvasY - p.y) <= half) {
                return node;
            }
        }
        return null;
    }

    render(levelMap, currentNodeId, visitedNodes, teamMembers, animatedMarker = null, arrivalPulse = 0, options = {}) {
        if (!this.ctx || !levelMap || !levelMap.nodes) return;
        this.currentLevelMap = levelMap;

        const ctx = this.ctx;
        const layout = this.getLayout();
        const width = this.canvas.width = layout.width;
        const height = this.canvas.height = layout.height;

        // 清空背景 (深邃科技黑蓝)
        ctx.fillStyle = "#060913";
        ctx.fillRect(0, 0, width, height);

        // 绘制星空深空微弱网格
        ctx.strokeStyle = "rgba(56, 189, 248, 0.04)";
        ctx.lineWidth = 1;
        const gridSize = 24;
        for (let x = 0; x < width; x += gridSize) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }

        // 1. 计算视野迷雾：已探明房间 + 其直接相邻一格的房间
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

        const boxSize = layout.boxSize;
        const nodes = levelMap.nodes;
        const masterShip = levelMap.masterShip;

        // 2. 母舰全舰轮廓与远端迷雾/未开放房间底模绘制 (当包含 masterShip 数据时)
        if (masterShip) {
            const allRooms = masterShip.allRooms || {};
            const lockedRooms = masterShip.lockedRooms || {};
            const fogRooms = masterShip.fogRooms || {};

            // 2.1 若在全景模式下，先绘制母舰全部连通通道骨架
            if (this.viewMode === "full" && masterShip.allConnections) {
                ctx.save();
                ctx.strokeStyle = "rgba(30, 58, 138, 0.22)";
                ctx.lineWidth = 1.5;
                ctx.setLineDash([3, 3]);
                masterShip.allConnections.forEach(([rA, rB]) => {
                    const defA = allRooms[rA];
                    const defB = allRooms[rB];
                    if (defA && defB) {
                        const pA = this.getNodeCenter(defA);
                        const pB = this.getNodeCenter(defB);
                        ctx.beginPath();
                        ctx.moveTo(pA.x, pA.y);
                        ctx.lineTo(pB.x, pB.y);
                        ctx.stroke();
                    }
                });
                ctx.setLineDash([]);
                ctx.restore();
            }

            // 2.2 绘制 B 类【深空星云迷雾房间】(远端未开放，仅在全景模式下渲染轮廓)
            if (this.viewMode === "full") {
                Object.values(fogRooms).forEach(fog => {
                    const def = allRooms[fog.id];
                    if (!def) return;
                    const p = this.getNodeCenter(def);
                    const shape = def.shape || "rect";
                    const x = p.x - boxSize / 2;
                    const y = p.y - boxSize / 2;

                    ctx.save();
                    ctx.fillStyle = "rgba(15, 23, 42, 0.35)";
                    ctx.strokeStyle = "rgba(100, 116, 139, 0.18)";
                    ctx.lineWidth = 1;
                    ctx.setLineDash([2, 3]);

                    drawShapePath(ctx, shape, x, y, boxSize, boxSize);
                    ctx.fill();
                    ctx.stroke();

                    // 微弱深空迷雾字符
                    ctx.fillStyle = "rgba(100, 116, 139, 0.35)";
                    ctx.font = `bold ${Math.max(9, Math.floor(boxSize * 0.28))}px monospace`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText("░", p.x, p.y);
                    ctx.restore();
                });
            }

            // 2.3 绘制 A 类【邻近防爆锁闭房间】(有通道相邻但被安全气闸锁死 🔒)
            // 在全景模式，或扇区聚焦模式且该锁闭房间位于当前视野范围内时渲染
            Object.values(lockedRooms).forEach(locked => {
                const def = allRooms[locked.id];
                if (!def) return;
                const p = this.getNodeCenter(def);

                // 在聚焦模式下，只绘制坐标落在当前视野视窗内的邻近锁闭房间
                if (this.viewMode === "focus") {
                    if (p.x < 10 || p.x > width - 10 || p.y < 10 || p.y > height - 30) {
                        return;
                    }
                }

                const shape = def.shape || "rect";
                const x = p.x - boxSize / 2;
                const y = p.y - boxSize / 2;

                ctx.save();
                ctx.fillStyle = "rgba(69, 10, 10, 0.45)";
                ctx.strokeStyle = "rgba(239, 68, 68, 0.65)";
                ctx.lineWidth = 1.6;
                ctx.setLineDash([4, 2]);

                drawShapePath(ctx, shape, x, y, boxSize, boxSize);
                ctx.fill();
                ctx.stroke();
                ctx.setLineDash([]);

                // 绘制红色防爆安全门锁 🔒
                const lockFontSize = Math.max(10, Math.floor(boxSize * 0.38));
                ctx.font = `${lockFontSize}px sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#ef4444";
                ctx.fillText("🔒", p.x, p.y - (boxSize >= 42 ? 5 : 0));

                if (boxSize >= 42) {
                    ctx.font = "bold 8px 'PingFang SC', sans-serif";
                    ctx.fillStyle = "rgba(248, 113, 113, 0.85)";
                    ctx.fillText("安全锁死", p.x, p.y + 11);
                }
                ctx.restore();
            });
        }

        // 3. 绘制开放房间双线通道 (Double-line Corridors)
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

                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const len = Math.hypot(dx, dy);
                if (len === 0) return;

                const nx = -dy / len;
                const ny = dx / len;
                const gap = Math.max(3, Math.min(5, Math.floor(boxSize * 0.08)));

                const bothVisited = visitedSet.has(node.id) && visitedSet.has(targetId);

                // 行进动画通道高亮
                const isTraversingEdge = animatedMarker && (
                    (animatedMarker.fromId === node.id && animatedMarker.toId === targetId) ||
                    (animatedMarker.fromId === targetId && animatedMarker.toId === node.id)
                );

                if (isTraversingEdge) {
                    ctx.strokeStyle = "#38bdf8";
                    ctx.lineWidth = 3.2;
                    ctx.shadowColor = "#38bdf8";
                    ctx.shadowBlur = 12;
                    ctx.setLineDash([]);
                } else if (bothVisited) {
                    ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
                    ctx.lineWidth = 2;
                    ctx.shadowBlur = 0;
                    ctx.setLineDash([]);
                } else {
                    ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
                    ctx.lineWidth = 1.8;
                    ctx.shadowBlur = 0;
                    ctx.setLineDash([4, 4]);
                }

                // 第一条平行通道线
                ctx.beginPath();
                ctx.moveTo(p1.x + nx * gap, p1.y + ny * gap);
                ctx.lineTo(p2.x + nx * gap, p2.y + ny * gap);
                ctx.stroke();

                // 第二条平行通道线
                ctx.beginPath();
                ctx.moveTo(p1.x - nx * gap, p1.y - ny * gap);
                ctx.lineTo(p2.x - nx * gap, p2.y - ny * gap);
                ctx.stroke();

                ctx.setLineDash([]);
                ctx.shadowBlur = 0;
            });
        });

        // 3.1 若处于多节点路径快速往返中，绘制全局预备光轨
        if (animatedMarker && animatedMarker.path && animatedMarker.path.length > 1) {
            ctx.save();
            ctx.strokeStyle = "rgba(74, 222, 128, 0.4)";
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            const startFirst = this.getNodeCenter(nodes[animatedMarker.path[0]]);
            ctx.moveTo(startFirst.x, startFirst.y);
            for (let i = 1; i < animatedMarker.path.length; i++) {
                const pt = this.getNodeCenter(nodes[animatedMarker.path[i]]);
                ctx.lineTo(pt.x, pt.y);
            }
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }

        // 3.2 平移动画进行中：绘制行进激光尾迹
        if (animatedMarker && animatedMarker.progress > 0 && animatedMarker.fromId) {
            const startP = this.getNodeCenter(nodes[animatedMarker.fromId]);
            ctx.save();
            ctx.strokeStyle = "rgba(56, 189, 248, 0.9)";
            ctx.lineWidth = 3.5;
            ctx.shadowColor = "#38bdf8";
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.moveTo(startP.x, startP.y);
            ctx.lineTo(animatedMarker.x, animatedMarker.y);
            ctx.stroke();
            ctx.restore();
        }

        // 4. 绘制各个房间多边形造型与内部微缩蓝图设备
        Object.values(nodes).forEach(node => {
            if (!revealedSet.has(node.id)) {
                return;
            }

            const p = this.getNodeCenter(node);
            const isCurrent = (node.id === currentNodeId && !animatedMarker);
            const isDestination = animatedMarker && (node.id === animatedMarker.toId);
            const isVisited = visitedSet.has(node.id);
            const isHovered = options.hoveredNodeId === node.id;
            const shape = node.shape || "rect";
            const equipment = node.equipment;

            const x = p.x - boxSize / 2;
            const y = p.y - boxSize / 2;

            if (isDestination) {
                // 行进目标房间：高亮发光提示
                ctx.fillStyle = "rgba(14, 165, 233, 0.28)";
                ctx.strokeStyle = "#4ade80";
                ctx.lineWidth = 2.8;
                ctx.setLineDash([6, 3]);
            } else if (isCurrent) {
                // 当前所在房间
                ctx.fillStyle = "rgba(56, 189, 248, 0.35)";
                ctx.strokeStyle = "#38bdf8";
                ctx.lineWidth = 3;
                ctx.setLineDash([]);
            } else if (isVisited) {
                // 已完全探索过的房间
                if (isHovered && options.canFastTravel) {
                    ctx.fillStyle = "rgba(16, 185, 129, 0.3)";
                    ctx.strokeStyle = "#4ade80";
                    ctx.lineWidth = 2.8;
                } else {
                    ctx.fillStyle = "rgba(30, 41, 59, 0.85)";
                    ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
                    ctx.lineWidth = 2;
                }
                ctx.setLineDash([]);
            } else {
                // 周围一格但尚未踏入的边缘房间
                ctx.fillStyle = "rgba(15, 23, 42, 0.55)";
                ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 3]);
            }

            // 绘制个性化房间多边形
            drawShapePath(ctx, shape, x, y, boxSize, boxSize);
            ctx.fill();
            ctx.stroke();
            ctx.setLineDash([]);

            // 绘制内部极简蓝图设备线条 (仅在已探索或当前目标时展现)
            if (isVisited || isDestination || isCurrent) {
                drawEquipmentBlueprint(ctx, equipment, p.x, p.y, boxSize);
            }

            // 当前或目标房间光晕特效
            if (isCurrent || isDestination) {
                ctx.shadowColor = isDestination ? "#4ade80" : "#38bdf8";
                ctx.shadowBlur = 16;
                ctx.strokeStyle = isDestination ? "#4ade80" : "#ffffff";
                drawShapePath(ctx, shape, x - 2, y - 2, boxSize + 4, boxSize + 4);
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            // 文字标注
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            let label = "";
            let subLabel = "";
            let tagColor = "#f1f5f9";
            const showSub = boxSize >= 38;

            if (isVisited || (animatedMarker && node.id === animatedMarker.toId)) {
                if (node.id === "room_start" || node.isStart || (levelMap && node.id === levelMap.startNodeId)) {
                    label = "起点"; subLabel = showSub ? "出发点" : ""; tagColor = "#38bdf8";
                } else if (node.id === "room_npc1") {
                    label = "NPC1"; subLabel = showSub ? "卡泽" : ""; tagColor = "#38bdf8";
                } else if (node.id === "room_npc2") {
                    label = "NPC2"; subLabel = showSub ? "邵可欣" : ""; tagColor = "#f43f5e";
                } else if (node.id === "room_npc3") {
                    label = "NPC3"; subLabel = showSub ? "莫尔德" : ""; tagColor = "#a855f7";
                } else if (node.isExit || node.id === "room_exit" || (node.event && node.event.type === "exit")) {
                    label = "终点"; subLabel = showSub ? "脱离舱" : ""; tagColor = "#4ade80";
                } else if (node.event && node.event.type === "food") {
                    label = "给养"; subLabel = showSub ? "补给" : ""; tagColor = "#f59e0b";
                } else if (node.event && node.event.type === "npc") {
                    label = "NPC"; subLabel = showSub ? (node.event.npcId || "同伴") : ""; tagColor = "#c084fc";
                } else {
                    // 若有房间名，显示前2~3个字符
                    const cleanName = (node.name || "").replace(/【.*?】/, "");
                    label = cleanName ? cleanName.slice(0, 3) : "走廊";
                    tagColor = "#94a3b8";
                }
            } else {
                label = "？";
                subLabel = showSub ? "待探明" : "";
                tagColor = "rgba(148, 163, 184, 0.75)";
            }

            const mainFontSize = Math.max(Math.min(Math.floor(boxSize * 0.28), 13), 9);
            const subFontSize = Math.max(mainFontSize - 2, 8);

            ctx.font = `bold ${mainFontSize}px 'PingFang SC', sans-serif`;
            ctx.fillStyle = tagColor;
            ctx.fillText(label, p.x, p.y - (subLabel ? Math.round(subFontSize * 0.65) : 0));

            if (subLabel) {
                ctx.font = `${subFontSize}px 'PingFang SC', sans-serif`;
                ctx.fillStyle = (isVisited || (animatedMarker && node.id === animatedMarker.toId))
                    ? tagColor
                    : "rgba(148, 163, 184, 0.6)";
                ctx.fillText(subLabel, p.x, p.y + Math.round(mainFontSize * 0.85));
            }

            // 静态光标标记
            if (isCurrent && !animatedMarker) {
                ctx.fillStyle = "#38bdf8";
                const hereFontSize = Math.max(Math.min(Math.floor(boxSize * 0.2), 10), 8);
                ctx.font = `bold ${hereFontSize}px 'Orbitron', monospace`;
                ctx.fillText(boxSize >= 36 ? "📍HERE" : "📍", p.x, p.y - boxSize / 2 - 6);
            } else if (options.canFastTravel && isVisited && !animatedMarker) {
                const isHover = options.hoveredNodeId === node.id;
                ctx.fillStyle = isHover ? "#4ade80" : "rgba(74, 222, 128, 0.85)";
                const travelFontSize = Math.max(Math.min(Math.floor(boxSize * 0.18), 9), 8);
                ctx.font = `bold ${travelFontSize}px 'Orbitron', sans-serif`;
                ctx.fillText(boxSize >= 38 ? "⚡快速往返" : "⚡", p.x, p.y - boxSize / 2 - 6);
            }
        });

        // 5. 行进动画光标渲染
        if (animatedMarker) {
            const curX = animatedMarker.x;
            const curY = animatedMarker.y;

            ctx.save();

            // 5.1 抵达冲击波
            if (arrivalPulse > 0) {
                const pulseR = 16 + arrivalPulse * 38;
                const alpha = Math.max(0, 1 - arrivalPulse);
                ctx.strokeStyle = `rgba(74, 222, 128, ${alpha})`;
                ctx.lineWidth = 3 * alpha;
                ctx.beginPath();
                ctx.arc(curX, curY, pulseR, 0, Math.PI * 2);
                ctx.stroke();
            }

            // 5.2 雷达波纹
            const now = Date.now();
            const ring1 = 18 + 5 * Math.sin(now / 140);
            ctx.strokeStyle = "rgba(56, 189, 248, 0.55)";
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(curX, curY, ring1, 0, Math.PI * 2);
            ctx.stroke();

            // 5.3 核心玩家小球标记
            ctx.shadowColor = "#38bdf8";
            ctx.shadowBlur = 18;
            ctx.fillStyle = arrivalPulse > 0 ? "#10b981" : "#0284c7";
            ctx.beginPath();
            ctx.arc(curX, curY, 14, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 12px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("📍", curX, curY - 1);

            // 5.4 悬浮名字标签
            const tagText = arrivalPulse > 0 ? "抵达" : "L.P.H";
            ctx.font = "bold 10px 'Orbitron', monospace";
            const tagW = ctx.measureText(tagText).width + 12;
            ctx.fillStyle = "rgba(11, 17, 32, 0.92)";
            ctx.fillRect(curX - tagW / 2, curY - 32, tagW, 16);
            ctx.strokeStyle = arrivalPulse > 0 ? "#4ade80" : "#38bdf8";
            ctx.lineWidth = 1;
            ctx.strokeRect(curX - tagW / 2, curY - 32, tagW, 16);

            ctx.fillStyle = arrivalPulse > 0 ? "#4ade80" : "#38bdf8";
            ctx.fillText(tagText, curX, curY - 23);

            ctx.restore();
        }

        // 6. 底部科技图例条
        ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
        ctx.fillRect(10, height - 34, width - 20, 28);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
        ctx.strokeRect(10, height - 34, width - 20, 28);

        ctx.font = "12px 'PingFang SC', sans-serif";
        ctx.textAlign = "left";
        ctx.fillStyle = "#cbd5e1";

        const modeBadge = this.viewMode === "focus" ? "[🔭 扇区聚焦]" : "[🌌 全舰全景]";
        if (options.canFastTravel) {
            ctx.fillText(`${modeBadge} 点击已探索房间可【快速往返】 ｜ 🔒 气闸防爆隔离 ｜ ░ 远端深空迷雾`, 18, height - 16);
        } else {
            ctx.fillText(`${modeBadge} 当前区域清晰透视 ｜ 🔒 气闸锁死隔离 ｜ 点击上方按钮切换全舰全景`, 18, height - 16);
        }
    }

    /**
     * 单段平滑位移动画
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
        const moveDuration = 720;
        const holdDuration = 380;
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
     * 多节点连续平滑穿梭路径动画
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
        const segmentDuration = Math.max(260, Math.min(420, 1600 / numSegments));
        const totalMoveDuration = segmentDuration * numSegments;
        const holdDuration = 360;
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
     * 绘制微型战术雷达 (Mini-map Radar)
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

        ctx.strokeStyle = isNearMimic ? "rgba(234, 179, 8, 0.3)" : "rgba(56, 189, 248, 0.18)";
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
