/**
 * 第一关新手可视化 Coach Mark 步骤表 (仅 levelId === 1)
 * advance: "next" = 点旁白「下一步」；"click-target" = 必须点击高亮的真实控件
 * target: CSS 选择器 | 选择器数组 | (engine) => HTMLElement
 * placement: top | bottom | left | right（旁白相对目标的偏好位置）
 */

export const Level1TutorialPages = {
    mimic_intro: {
        title: "核心规则 · 伪人",
        body: [
            "<strong>看这里：</strong>星舰里混入了外表正常的<strong>伪人</strong>，会在夜间袭击同伴。",
            "<strong>要做什么：</strong>搜救、辨别真伪、在裁决中做选择，再抵达终点。"
        ].join("<br>"),
        target: "#stage-mission-card",
        placement: "right",
        advance: "next"
    },
    missions: {
        title: "界面 · 任务",
        body: [
            "<strong>看这里：</strong>顶部「🎯 任务」与左上角观测目标卡。",
            "<strong>要做什么：</strong>随时点开核对通关条件；带离指定同伴可能解锁隐藏扇区。"
        ].join("<br>"),
        target: ["#btn-view-missions", "#stage-mission-card"],
        placement: "bottom",
        advance: "next"
    },
    logs: {
        title: "界面 · 日志",
        body: [
            "<strong>看这里：</strong>「📜 日志」按钮与左侧行动记录。",
            "<strong>要做什么：</strong>移动、营救、询问、裁决都会记在这里——推理时请常回来翻。"
        ].join("<br>"),
        target: ["#btn-toggle-log-drawer", "#action-log-sidebar"],
        placement: "bottom",
        advance: "next"
    },
    stamina_choice: {
        title: "探索 · 体力与面临选择",
        body: [
            "<strong>看这里：</strong>顶部体力条。踏入<strong>未知舱室</strong>会扣体力，并累加「面临选择」。",
            "<strong>要做什么：</strong>折返已探明区域不耗体力；面临选择累积后，傍晚会概率到来。"
        ].join("<br>"),
        target: "#header-stamina-box",
        placement: "bottom",
        advance: "next"
    },
    move_hint: {
        title: "开始行动",
        body: [
            "<strong>看这里：</strong>高亮的方向键。",
            "<strong>要做什么：</strong>现在点击它，踏入相邻舱室开始探索！"
        ].join("<br>"),
        target: (engine) => {
            const dirMap = {
                forward: "btn-move-forward",
                backward: "btn-move-backward",
                left: "btn-move-left",
                right: "btn-move-right"
            };
            const available = engine?.explorationEngine?.getAvailableDirections?.() || [];
            for (const d of available) {
                const el = document.getElementById(dirMap[d]);
                if (el && !el.disabled) return el;
            }
            return document.getElementById("btn-move-forward")
                || document.getElementById("compass-center-hub");
        },
        placement: "top",
        advance: "click-target"
    },
    npc_recruit: {
        title: "遭遇 · 是否收纳",
        body: [
            "<strong>看这里：</strong>救助加入 / 不理睬。",
            "<strong>要做什么：</strong>新手请先<strong>救助加入</strong>至少一人，才能体验完整的询问 → 裁决 → 黑夜循环。"
        ].join("<br>"),
        target: "#btn-encounter-accept",
        placement: "top",
        advance: "next"
    },
    inquiry: {
        title: "傍晚 · 询问阶段",
        body: [
            "<strong>看这里：</strong>同伴卡片与跳过按钮。",
            "<strong>要做什么：</strong>最多与 <strong>2 名</strong>同伴交谈收集口供；也可直接跳过进入裁决。"
        ].join("<br>"),
        target: ["#inquiry-target-list", "#btn-inquiry-skip", "#modal-inquiry-select .modal-box"],
        placement: "bottom",
        advance: "next"
    },
    judgement: {
        title: "裁决时刻",
        body: [
            "<strong>看这里：</strong>禁锢 / 放逐 / 放弃裁决。",
            "<strong>要做什么：</strong>有嫌疑可先<strong>禁锢</strong>试探；没把握就放弃裁决，进入黑夜。"
        ].join("<br>"),
        target: ["#judgement-target-list", "#btn-judgement-pass", "#modal-judgement .modal-box"],
        placement: "bottom",
        advance: "next"
    },
    night: {
        title: "黑夜 · 身份行动",
        body: [
            "<strong>看这里：</strong>夜间行动目标列表。",
            "<strong>要做什么：</strong>你本关默认是<strong>魔镜</strong>——选一名同伴查验真身（人类或伪人）。"
        ].join("<br>"),
        target: ["#night-target-list", "#btn-night-skip", "#modal-night-action .modal-box"],
        placement: "bottom",
        advance: "next"
    }
};

/** 开场探索引导顺序（进入 Q3 时连续弹出） */
export const Level1ExploreTutorialSequence = [
    "mimic_intro",
    "missions",
    "logs",
    "stamina_choice",
    "move_hint"
];
