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

export class MapRenderer {
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
