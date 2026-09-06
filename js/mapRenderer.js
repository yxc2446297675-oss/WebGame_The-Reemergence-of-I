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
        case "bridge": {
            // 梯形前探式主控舰桥 (顶窄底宽 + 前部观察视窗弧)
            const cut = Math.floor(w * 0.22);
            ctx.moveTo(x + cut, y);
            ctx.lineTo(x + w - cut, y);
            ctx.lineTo(x + w, y + h);
            ctx.lineTo(x, y + h);
            ctx.closePath();
            break;
        }
        case "octagon":
        case "reactor": {
            // 重型装甲八角聚变核心舱 (四角大倒角)
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
        case "medical": {
            // 医疗救护舱 (四角圆弧 + 顶部微凹门斗)
            const r = Math.floor(Math.min(w, h) * 0.24);
            if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
            else ctx.rect(x, y, w, h);
            break;
        }
        case "quarters": {
            // 船员起居生活舱 (平滑胶囊圆角)
            if (ctx.roundRect) ctx.roundRect(x, y, w, h, 10);
            else ctx.rect(x, y, w, h);
            break;
        }
        case "storage": {
            // 六角仓储库房 (上下宽切角)
            const c = Math.floor(Math.min(w, h) * 0.2);
            ctx.moveTo(x + c, y);
            ctx.lineTo(x + w - c, y);
            ctx.lineTo(x + w, y + h / 2);
            ctx.lineTo(x + w - c, y + h);
            ctx.lineTo(x + c, y + h);
            ctx.lineTo(x, y + h / 2);
            ctx.closePath();
            break;
        }
        case "airlock": {
            // 防爆气闸 (两侧切角内凹侧翼)
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
            const my = y + Math.floor(h * 0.18);
            const mh = h - Math.floor(h * 0.36);
            if (ctx.roundRect) ctx.roundRect(x - 2, my, w + 4, mh, 4);
            else ctx.rect(x - 2, my, w + 4, mh);
            break;
        }
        case "corridor_v": {
            const mx = x + Math.floor(w * 0.18);
            const mw = w - Math.floor(w * 0.36);
            if (ctx.roundRect) ctx.roundRect(mx, y - 2, mw, h + 4, 4);
            else ctx.rect(mx, y - 2, mw, h + 4);
            break;
        }
        case "lab": {
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

export class MapRenderer {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement ? canvasElement.getContext("2d") : null;
        this.animating = false;
        this.animationFrameId = null;
        this.skipAnimation = null;
        this.viewMode = "focus"; // "focus" | "full"

        // 交互平移与缩放引擎属性 (支持手机双指缩放、单指拖拽、电脑鼠标拖拽与滚轮缩放)
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1.0;
        this.isDragging = false;
        this.pointerDown = false;
        this.startPointer = { x: 0, y: 0 };
        this.startPan = { x: 0, y: 0 };
        this.initialPinchDist = 0;
        this.startZoom = 1.0;
        this.nodeClickHandler = null;

        this.initInteractiveGestures();
    }

    /**
     * 绑定手机手指触摸拖拽与电脑鼠标平移缩放手势
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
                this.renderCurrentState();
            }
        });

        window.addEventListener("mouseup", () => {
            if (this.pointerDown) {
                this.pointerDown = false;
                if (canvas.style) canvas.style.cursor = "grab";
            }
        });

        // 鼠标滚轮自由缩放 (以鼠标光标所在点为缩放中心)
        canvas.addEventListener("wheel", (e) => {
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.12 : 0.89;
            const newZoom = Math.max(0.5, Math.min(3.5, this.zoom * factor));
            
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // 调整 pan 偏移保持光标锚点不变
            this.panX = mouseX - (mouseX - this.panX) * (newZoom / this.zoom);
            this.panY = mouseY - (mouseY - this.panY) * (newZoom / this.zoom);
            this.zoom = newZoom;
            this.renderCurrentState();
        }, { passive: false });

        // 手机触摸手势 (单指拖拽 + 双指缩放)
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
                this.startZoom = this.zoom;
                this.startPan = { x: this.panX, y: this.panY };
            }
        }, { passive: true });

        canvas.addEventListener("touchmove", (e) => {
            if (e.touches.length === 1 && this.pointerDown) {
                const t = e.touches[0];
                const dx = t.clientX - this.startPointer.x;
                const dy = t.clientY - this.startPointer.y;
                if (Math.hypot(dx, dy) > 5) {
                    this.isDragging = true;
                    this.panX = this.startPan.x + dx;
                    this.panY = this.startPan.y + dy;
                    this.renderCurrentState();
                }
            } else if (e.touches.length >= 2 && this.initialPinchDist > 0) {
                const t1 = e.touches[0];
                const t2 = e.touches[1];
                const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
                const factor = dist / this.initialPinchDist;
                this.zoom = Math.max(0.5, Math.min(3.2, this.startZoom * factor));
                this.renderCurrentState();
            }
        }, { passive: true });

        canvas.addEventListener("touchend", () => {
            this.pointerDown = false;
            this.initialPinchDist = 0;
        }, { passive: true });

        canvas.addEventListener("touchcancel", () => {
            this.pointerDown = false;
            this.initialPinchDist = 0;
        }, { passive: true });
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
     * 重置平移缩放，居中当前所在位置
     */
    resetView() {
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1.0;
        this.renderCurrentState();
    }

    zoomIn() {
        this.zoom = Math.min(3.2, this.zoom * 1.25);
        this.renderCurrentState();
    }

    zoomOut() {
        this.zoom = Math.max(0.5, this.zoom * 0.8);
        this.renderCurrentState();
    }

    /**
     * 在【🔭 扇区聚焦】与【🌌 全舰全景】之间切换
     */
    toggleViewMode() {
        this.viewMode = this.viewMode === "focus" ? "full" : "focus";
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1.0;
        return this.viewMode;
    }

    getLayout() {
        const width = 840;
        const height = 560;

        if (this.viewMode === "full") {
            const minX = 0, maxX = 8;
            const minY = 0, maxY = 6;
            const cols = 9;
            const rows = 7;
            const paddingX = 48;
            const paddingY = 44;
            const availW = width - paddingX * 2;
            const availH = height - paddingY * 2;
            const cellW = Math.floor(availW / (cols - 1));
            const cellH = Math.floor(availH / (rows - 1));
            const boxSize = 44;
            const totalGridW = (cols - 1) * cellW;
            const totalGridH = (rows - 1) * cellH;
            const originX = Math.round((width - totalGridW) / 2);
            const originY = Math.round((height - totalGridH) / 2);
            return { originX, originY, cellW, cellH, boxSize, width, height, minX, minY, maxX, maxY };
        }

        // 'focus' 模式
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

        // 第一关特例兼容
        if (cols <= 5 && rows <= 3 && maxX <= 4 && maxY <= 3 && minX === 0 && minY === 1) {
            return {
                originX: 110,
                originY: 100,
                cellW: 145,
                cellH: 125,
                boxSize: 72,
                width: 780,
                height: 520,
                minX: 0,
                minY: 1,
                maxX: 4,
                maxY: 3
            };
        }

        const paddingX = 64;
        const paddingY = 56;
        const availW = width - paddingX * 2;
        const availH = height - paddingY * 2;

        const cellW = cols > 1 ? Math.floor(availW / (cols - 1)) : availW;
        const cellH = rows > 1 ? Math.floor(availH / (rows - 1)) : availH;

        let boxSize = Math.floor(Math.min(cellW, cellH) * 0.72);
        if (boxSize > 68) boxSize = 68;
        if (boxSize < 34) boxSize = 34;

        const totalGridW = (cols - 1) * cellW;
        const totalGridH = (rows - 1) * cellH;

        const originX = Math.round((width - totalGridW) / 2);
        const originY = Math.round((height - totalGridH) / 2);

        return { originX, originY, cellW, cellH, boxSize, width, height, minX, minY, maxX, maxY };
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
     * 将屏幕点击/触摸坐标逆换算为世界画布坐标 (考虑 panX, panY 与 zoom 缩放)
     */
    getNodeAtPosition(canvasX, canvasY, levelMap) {
        if (!levelMap || !levelMap.nodes) return null;
        const layout = this.getLayout();

        // 逆向变换
        const worldX = (canvasX - this.panX) / this.zoom;
        const worldY = (canvasY - this.panY) / this.zoom;

        const boxSize = layout.boxSize;
        const half = boxSize / 2 + Math.max(Math.floor(boxSize * 0.3), 16);

        for (const node of Object.values(levelMap.nodes)) {
            const p = this.getNodeCenter(node);
            if (Math.abs(worldX - p.x) <= half && Math.abs(worldY - p.y) <= half) {
                return node;
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

        // 动态适配容器视口尺寸 (满屏高清渲染)
        const parentW = this.canvas.parentElement ? this.canvas.parentElement.clientWidth : 0;
        const parentH = this.canvas.parentElement ? this.canvas.parentElement.clientHeight : 0;
        const targetW = Math.max(layout.width, parentW || 720);
        const targetH = Math.max(layout.height, parentH || 480);

        if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
            this.canvas.width = targetW;
            this.canvas.height = targetH;
        }

        const width = targetW;
        const height = targetH;

        // 1. 清空背景 (深邃科技黑夜背景)
        ctx.fillStyle = "#050811";
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        // 应用平移与缩放矩阵变换
        if (ctx.translate) ctx.translate(this.panX, this.panY);
        if (ctx.scale) ctx.scale(this.zoom, this.zoom);

        // 绘制微弱背景装甲格栅
        ctx.strokeStyle = "rgba(56, 189, 248, 0.035)";
        ctx.lineWidth = 1;
        const gridSize = 28;
        for (let x = -width; x < width * 2; x += gridSize) {
            ctx.beginPath(); ctx.moveTo(x, -height); ctx.lineTo(x, height * 2); ctx.stroke();
        }
        for (let y = -height; y < height * 2; y += gridSize) {
            ctx.beginPath(); ctx.moveTo(-width, y); ctx.lineTo(width * 2, y); ctx.stroke();
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

        // 5. 绘制【靠近揭示的防爆锁闭房间】(仅在靠近时展现)
        Object.values(visibleLockedRooms).forEach(locked => {
            const def = masterShip.allRooms[locked.id];
            if (!def) return;
            const p = this.getNodeCenter(def);
            const shape = def.shape || "rect";
            const x = p.x - boxSize / 2;
            const y = p.y - boxSize / 2;

            ctx.save();
            // 厚重黑色外装甲壁
            ctx.fillStyle = "#150404";
            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 2.2;
            ctx.setLineDash([4, 2]);

            drawRoomPolygon(ctx, shape, x, y, boxSize, boxSize);
            ctx.fill();
            ctx.stroke();

            // 红色防爆隔离门锁 🔒
            ctx.fillStyle = "#ef4444";
            ctx.font = `${Math.max(11, Math.floor(boxSize * 0.36))}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🔒", p.x, p.y - (boxSize >= 42 ? 4 : 0));

            if (boxSize >= 42) {
                ctx.font = "bold 8px 'PingFang SC', sans-serif";
                ctx.fillStyle = "rgba(248, 113, 113, 0.9)";
                ctx.fillText("气闸锁死", p.x, p.y + 11);
            }
            ctx.restore();
        });

        // 6. 绘制各个开放舱室 (专属甲板色彩、厚重装甲外壁、门部门斗、内部微缩设备)
        Object.values(nodes).forEach(node => {
            if (!revealedSet.has(node.id)) return;

            const p = this.getNodeCenter(node);
            const isCurrent = (node.id === currentNodeId && !animatedMarker);
            const isDestination = animatedMarker && (node.id === animatedMarker.toId);
            const isVisited = visitedSet.has(node.id);
            const isHovered = options.hoveredNodeId === node.id;
            const shape = node.shape || "rect";
            const equipment = node.equipment;

            const x = p.x - boxSize / 2;
            const y = p.y - boxSize / 2;

            // 根据所属分区选取专属地面色彩主题
            let themeKey = node.zone || "hub";
            if (node.isStart || node.id === "room_start" || (levelMap && node.id === levelMap.startNodeId)) themeKey = "start";
            else if (node.isExit || node.id === "room_exit" || (node.event && node.event.type === "exit")) themeKey = "exit";
            const theme = DECK_THEMES[themeKey] || DECK_THEMES.hub;

            ctx.save();

            // 6.1 绘制厚实深黑装甲底座 (外壁厚度)
            ctx.fillStyle = theme.wall;
            drawRoomPolygon(ctx, shape, x - 2, y - 2, boxSize + 4, boxSize + 4);
            ctx.fill();

            // 6.2 舱室内部地坪填色 (区分生活、指挥、医疗、工程等真实质感)
            if (isVisited) {
                ctx.fillStyle = isHovered ? theme.floorVisited : theme.floor;
                ctx.strokeStyle = theme.border;
                ctx.lineWidth = 2.2;
            } else {
                ctx.fillStyle = "rgba(15, 23, 42, 0.65)";
                ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 3]);
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
            }

            // 6.6 舱室文字标注
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            let label = "";
            let subLabel = "";
            let tagColor = "#ffffff";
            const showSub = boxSize >= 40;

            if (isVisited || (animatedMarker && node.id === animatedMarker.toId)) {
                if (node.id === "room_start" || node.isStart || (levelMap && node.id === levelMap.startNodeId)) {
                    label = "起点"; subLabel = showSub ? "出发点" : ""; tagColor = "#93c5fd";
                } else if (node.id === "room_npc1") {
                    label = "NPC1"; subLabel = showSub ? "卡泽" : ""; tagColor = "#60a5fa";
                } else if (node.id === "room_npc2") {
                    label = "NPC2"; subLabel = showSub ? "邵可欣" : ""; tagColor = "#f472b6";
                } else if (node.id === "room_npc3") {
                    label = "NPC3"; subLabel = showSub ? "莫德" : ""; tagColor = "#c084fc";
                } else if (node.isExit || node.id === "room_exit" || (node.event && node.event.type === "exit")) {
                    label = "终点"; subLabel = showSub ? "折跃门" : ""; tagColor = "#4ade80";
                } else if (node.event && node.event.type === "food") {
                    label = "给养"; subLabel = showSub ? "补给" : ""; tagColor = "#f59e0b";
                } else if (node.event && node.event.type === "npc") {
                    label = "NPC"; subLabel = showSub ? (node.event.npcId || "同伴") : ""; tagColor = "#c084fc";
                } else {
                    const cleanName = (node.name || "").replace(/【.*?】/, "");
                    label = cleanName ? cleanName.slice(0, 3) : "舱室";
                    tagColor = "#e2e8f0";
                }
            } else {
                label = "？";
                subLabel = showSub ? "待探明" : "";
                tagColor = "rgba(148, 163, 184, 0.75)";
            }

            const mainFontSize = Math.max(Math.min(Math.floor(boxSize * 0.26), 13), 9);
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

            // 静态角标
            if (isCurrent && !animatedMarker) {
                ctx.fillStyle = "#38bdf8";
                const hereFontSize = Math.max(Math.min(Math.floor(boxSize * 0.2), 10), 8);
                ctx.font = `bold ${hereFontSize}px 'Orbitron', monospace`;
                ctx.fillText(boxSize >= 40 ? "📍HERE" : "📍", p.x, p.y - boxSize / 2 - 8);
            } else if (options.canFastTravel && isVisited && !animatedMarker) {
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

        // 8. 绘制屏幕固定 HUD (底部提示与缩放指示)
        ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
        ctx.fillRect(10, height - 36, width - 20, 28);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
        ctx.strokeRect(10, height - 36, width - 20, 28);

        ctx.font = "12px 'PingFang SC', sans-serif";
        ctx.textAlign = "left";
        ctx.fillStyle = "#cbd5e1";

        const zoomPercent = Math.round(this.zoom * 100);
        ctx.fillText(`🎮 触摸/鼠标拖拽全屏平移 ｜ 滚轮/双指缩放 [${zoomPercent}%] ｜ 🔒 气闸锁死(靠近可见) ｜ 点击已探明舱室快速往返`, 18, height - 17);
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
