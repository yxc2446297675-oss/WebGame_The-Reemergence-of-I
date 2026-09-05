function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class MapRenderer {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement ? canvasElement.getContext("2d") : null;
        this.animating = false;
        this.animationFrameId = null;
        this.skipAnimation = null;
    }

    getLayout() {
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
        if (cols <= 5 && rows <= 3 && maxX <= 4 && maxY <= 3) {
            return {
                originX: 90,
                originY: 80,
                cellW: 120,
                cellH: 95,
                boxSize: 58,
                width: 680,
                height: 460,
                minX: 0,
                minY: 1
            };
        }

        // 第二关兼容
        if (cols <= 5 && rows <= 4 && maxY === 4 && minX === 0) {
            return {
                originX: 95,
                originY: 52,
                cellW: 118,
                cellH: 90,
                boxSize: 52,
                width: 680,
                height: 460,
                minX: 0,
                minY: 1
            };
        }

        // 梯级 1~4 自适应计算 (720x480)
        const width = 720;
        const height = 480;
        const paddingX = 55;
        const paddingY = 48;
        const availW = width - paddingX * 2;
        const availH = height - paddingY * 2;

        const cellW = cols > 1 ? Math.floor(availW / (cols - 1)) : availW;
        const cellH = rows > 1 ? Math.floor(availH / (rows - 1)) : availH;

        let boxSize = Math.floor(Math.min(cellW, cellH) * 0.72);
        if (boxSize > 52) boxSize = 52;
        if (boxSize < 28) boxSize = 28;

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
            minY
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

        // 绘制微弱背景网格
        ctx.strokeStyle = "rgba(56, 189, 248, 0.05)";
        ctx.lineWidth = 1;
        const gridSize = 25;
        for (let x = 0; x < width; x += gridSize) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }

        // 1. 计算视野迷雾：已探明房间 + 其直接相邻一格的房间
        const visitedSet = new Set(visitedNodes || []);
        if (currentNodeId) visitedSet.add(currentNodeId);

        // 动效中支持起点与终点预热
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

        // 2. 绘制双线通道 (Double-line Corridors)
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
                const gap = 5; // 双线间距的一半

                const bothVisited = visitedSet.has(node.id) && visitedSet.has(targetId);

                // 正在平移动画通行的走廊，施加动态高亮光晕
                const isTraversingEdge = animatedMarker && (
                    (animatedMarker.fromId === node.id && animatedMarker.toId === targetId) ||
                    (animatedMarker.fromId === targetId && animatedMarker.toId === node.id)
                );

                if (isTraversingEdge) {
                    ctx.strokeStyle = "#38bdf8";
                    ctx.lineWidth = 3;
                    ctx.shadowColor = "#38bdf8";
                    ctx.shadowBlur = 12;
                    ctx.setLineDash([]);
                } else if (bothVisited) {
                    ctx.strokeStyle = "rgba(56, 189, 248, 0.65)";
                    ctx.lineWidth = 2;
                    ctx.shadowBlur = 0;
                    ctx.setLineDash([]);
                } else {
                    ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
                    ctx.lineWidth = 2;
                    ctx.shadowBlur = 0;
                    ctx.setLineDash([4, 4]);
                }

                // 第一条平行线
                ctx.beginPath();
                ctx.moveTo(p1.x + nx * gap, p1.y + ny * gap);
                ctx.lineTo(p2.x + nx * gap, p2.y + ny * gap);
                ctx.stroke();

                // 第二条平行线
                ctx.beginPath();
                ctx.moveTo(p1.x - nx * gap, p1.y - ny * gap);
                ctx.lineTo(p2.x - nx * gap, p2.y - ny * gap);
                ctx.stroke();

                ctx.setLineDash([]);
                ctx.shadowBlur = 0;
            });
        });

        // 2.0 若处于多节点路径快速往返中，绘制全局预备光轨
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

        // 2.1 平移动画进行中：绘制行进激光尾迹
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

        // 3. 绘制各个房间方块 (仅绘制在 revealedSet 内的房间)
        Object.values(nodes).forEach(node => {
            if (!revealedSet.has(node.id)) {
                return;
            }

            const p = this.getNodeCenter(node);
            const isCurrent = (node.id === currentNodeId && !animatedMarker);
            const isDestination = animatedMarker && (node.id === animatedMarker.toId);
            const isVisited = visitedSet.has(node.id);
            const isHovered = options.hoveredNodeId === node.id;

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
                // 已完全探索过的房间 (若在悬停状态下加强高亮)
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
                // 周围一格但尚未踏入的迷雾边缘房间
                ctx.fillStyle = "rgba(15, 23, 42, 0.5)";
                ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 3]);
            }

            ctx.beginPath();
            ctx.rect(x, y, boxSize, boxSize);
            ctx.fill();
            ctx.stroke();
            ctx.setLineDash([]);

            // 当前或目标房间光晕特效
            if (isCurrent || isDestination) {
                ctx.shadowColor = isDestination ? "#4ade80" : "#38bdf8";
                ctx.shadowBlur = 16;
                ctx.strokeStyle = isDestination ? "#4ade80" : "#ffffff";
                ctx.strokeRect(x - 2, y - 2, boxSize + 4, boxSize + 4);
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
                    label = "走廊"; tagColor = "#94a3b8";
                }
            } else {
                label = "？";
                subLabel = showSub ? "待探明" : "";
                tagColor = "rgba(148, 163, 184, 0.75)";
            }

            const mainFontSize = Math.max(Math.min(Math.floor(boxSize * 0.28), 13), 10);
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
                // 可快速往返房间角标提示
                const isHover = options.hoveredNodeId === node.id;
                ctx.fillStyle = isHover ? "#4ade80" : "rgba(74, 222, 128, 0.85)";
                const travelFontSize = Math.max(Math.min(Math.floor(boxSize * 0.18), 9), 8);
                ctx.font = `bold ${travelFontSize}px 'Orbitron', sans-serif`;
                ctx.fillText(boxSize >= 38 ? "⚡快速往返" : "⚡", p.x, p.y - boxSize / 2 - 6);
            }
        });

        // 4. 类似 Unity DoTween 平移动画光标渲染 (平滑穿梭于两点之间)
        if (animatedMarker) {
            const curX = animatedMarker.x;
            const curY = animatedMarker.y;

            ctx.save();

            // 4.1 抵达时的扩张脉冲冲击波
            if (arrivalPulse > 0) {
                const pulseR = 16 + arrivalPulse * 38;
                const alpha = Math.max(0, 1 - arrivalPulse);
                ctx.strokeStyle = `rgba(74, 222, 128, ${alpha})`;
                ctx.lineWidth = 3 * alpha;
                ctx.beginPath();
                ctx.arc(curX, curY, pulseR, 0, Math.PI * 2);
                ctx.stroke();
            }

            // 4.2 雷达扫描扩散外环
            const now = Date.now();
            const ring1 = 18 + 5 * Math.sin(now / 140);
            ctx.strokeStyle = "rgba(56, 189, 248, 0.55)";
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(curX, curY, ring1, 0, Math.PI * 2);
            ctx.stroke();

            const ring2 = 25 + 4 * Math.cos(now / 190);
            ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(curX, curY, ring2, 0, Math.PI * 2);
            ctx.stroke();

            // 4.3 核心玩家小球标记 (发光徽章)
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

            // 核心标记文字
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 12px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("📍", curX, curY - 1);

            // 4.4 悬浮名字标签
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

        // 底部图例
        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.fillRect(10, height - 34, width - 20, 28);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
        ctx.strokeRect(10, height - 34, width - 20, 28);

        ctx.font = "12px 'PingFang SC', sans-serif";
        ctx.textAlign = "left";
        ctx.fillStyle = "#cbd5e1";
        if (options.canFastTravel) {
            ctx.fillText("💡 白昼探索机制：直接点击地图上已探索的方块，即可【快速往返】穿梭（不计入面临选择次数）", 18, height - 16);
        } else {
            ctx.fillText("迷雾探索机制：已探索区域(实线明亮) ｜ 周围一格待探明(虚线？) ｜ 快速往返仅限白天探索可用", 18, height - 16);
        }
    }

    /**
     * 类似 Unity DoTween 的平滑位移动画 (单段)
     * @param {Object} levelMap 关卡地图配置
     * @param {string} fromNodeId 出发房间ID
     * @param {string} toNodeId 目标房间ID
     * @param {Set|Array} visitedNodes 已探索房间集合
     * @param {Array} teamMembers 队伍列表
     * @param {Function} onComplete 动画完成回调
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

        // 兼容非浏览器或无 requestAnimationFrame 环境 (如 Node.js 模拟环境)
        if (typeof requestAnimationFrame === "undefined") {
            this.render(levelMap, toNodeId, visitedNodes, teamMembers);
            if (onComplete) onComplete();
            return;
        }

        this.animating = true;
        this.currentLevelMap = levelMap;
        let finished = false;
        const moveDuration = 720; // 阶段1: 720ms 平滑位移
        const holdDuration = 380; // 阶段2: 380ms 抵达脉冲光晕
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
     * 多节点连续平滑穿梭路径动画 (用于地图快速往返)
     * @param {Object} levelMap 关卡地图配置
     * @param {Array<string>} pathNodeIds 完整节点ID序列 [startId, n1, n2, ..., destId]
     * @param {Set|Array} visitedNodes 已探索房间集合
     * @param {Array} teamMembers 队伍列表
     * @param {Function} onSegmentStep 每一个新区段开始时的回调 (segIndex, fromId, toId)
     * @param {Function} onComplete 路径穿梭完全结束的回调
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

        // 兼容非浏览器或无 requestAnimationFrame 环境
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
        // 单段行进时间：平滑适中 (根据节点数弹性调整 280ms ~ 420ms)
        const segmentDuration = Math.max(260, Math.min(420, 1600 / numSegments));
        const totalMoveDuration = segmentDuration * numSegments;
        const holdDuration = 360; // 抵达目标时的光晕脉冲保持时间
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
                
                // 每迈入一个新区段，触发脚步音效和区段回调
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
                // 抵达目标房间脉冲
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
     * 绘制主界面右上角高科技微型雷达 (Mini-map Radar)
     * 以 currentNodeId 为中心，聚焦当前房间与周边相邻连通房间 (局部视口)
     */
    renderMiniRadar(canvas, levelMap, currentNodeId, visitedNodes, isNearMimic = false) {
        if (!canvas || !levelMap || !levelMap.nodes) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const w = canvas.width = 140;
        const h = canvas.height = 140;

        // 深邃雷达底色
        ctx.fillStyle = "#050914";
        ctx.fillRect(0, 0, w, h);

        // 绘制雷达扫描圆环与十字线
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

        // 绘制连接线与邻接房间
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

        // 绘制中心当前节点
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

        // 邵可欣被动高熵预警
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

