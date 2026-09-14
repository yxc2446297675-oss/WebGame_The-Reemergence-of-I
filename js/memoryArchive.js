/**
 * 记忆图鉴 · 残响收录（Memory Archive）
 * 记录探索中收集到的日记与舰船事件，可扩展。
 */

/** @typedef {{ id: string, category: 'diary'|'event', title: string, subtitle?: string, summary: string, body: string, hint: string, theme?: string }} ArchiveEntryDef */

export const ARCHIVE_OWNER_NAMES = {
    lph: "L.P.H",
    kaze: "卡罗",
    shaokexin: "邵可欣",
    mode: "莫德",
    prof_lu: "陆知行",
    noah: "诺亚",
    sophia: "索菲亚",
    vivian: "薇薇安",
    elena: "伊莲",
    elsa: "艾尔莎",
    dr_elsa: "艾尔莎",
    colt: "柯尔特",
    barnes: "巴恩斯"
};

/** 固定事件条目（日记条目由私人舱室动态生成） */
export const ARCHIVE_EVENT_DEFS = [
    {
        id: "event_power_outage",
        category: "event",
        title: "全舰停电",
        subtitle: "主配电值班舱 · 合闸记录",
        summary: "你亲手合上了高压母线总断路器。",
        body: "主配电值班舱内焦糊味未散。闸刀自「断开」位咬合回通电位的瞬间，逃生舱气动锁与主电网同时苏醒。\n\n这不是一次普通的过载跳闸——有人在爆炸前切断了整艘船的呼吸。",
        hint: "首次在停电始发地完成合闸修复后收录",
        theme: "#fbbf24"
    },
    {
        id: "event_chip_stolen",
        category: "event",
        title: "芯片被偷",
        subtitle: "维生环境总控机房 · 失窃现场",
        summary: "核心温控芯片只失踪这一枚。",
        body: "维生循环主机机柜被暴力撬开。控制全舰大气与主冷却配比的【核心温控芯片】已被拔走，插槽锁扣呈液压钳夹断状。\n\n气流紊乱由此开始，并一路传导至底层聚变堆的过热崩溃——全舰只失踪这一枚芯片，却足以改写所有人的命运。",
        hint: "首次踏入维生环境总控机房后收录",
        theme: "#38bdf8"
    }
];

/** 调试：启动时一键收齐全部残响（正式发布前改回 false） */
export const DEBUG_UNLOCK_ALL_ARCHIVE = true;

export class MemoryArchive {
    /**
     * @param {import('./saveSystem.js').SaveSystem} saveSystem
     * @param {() => any[]} getPrivateQuarters - 返回 NPC_PRIVATE_QUARTERS
     */
    constructor(saveSystem, getPrivateQuarters) {
        this.saveSystem = saveSystem;
        this.getPrivateQuarters = getPrivateQuarters;
        this.archiveKey = "DOPPELGANGER_MEMORY_ARCHIVE_V1";
    }

    getUnlockedIds() {
        try {
            let raw = null;
            if (this.saveSystem.isLocalStorageAvailable) {
                raw = window.localStorage.getItem(this.archiveKey);
            }
            if (!raw) raw = this.saveSystem.memoryStore[this.archiveKey];
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (_) {
            return [];
        }
    }

    isUnlocked(id) {
        return this.getUnlockedIds().includes(id);
    }

    _persist(list) {
        const serialized = JSON.stringify(list);
        this.saveSystem.memoryStore[this.archiveKey] = serialized;
        try {
            if (this.saveSystem.isLocalStorageAvailable) {
                window.localStorage.setItem(this.archiveKey, serialized);
            }
        } catch (_) { /* sandbox */ }
    }

    /**
     * @returns {boolean} 是否为新收录
     */
    unlock(id) {
        if (!id) return false;
        const list = this.getUnlockedIds();
        if (list.includes(id)) return false;
        list.push(id);
        this._persist(list);
        return true;
    }

    /**
     * 调试/作弊：一次收齐当前图鉴目录全部条目
     * @returns {number} 新收录条数
     */
    unlockAll() {
        const catalog = this.buildCatalog();
        const set = new Set(this.getUnlockedIds());
        let added = 0;
        catalog.forEach((e) => {
            if (!e?.id || set.has(e.id)) return;
            set.add(e.id);
            added += 1;
        });
        this._persist([...set]);
        return added;
    }

    diaryId(ownerId) {
        return `diary_${ownerId}`;
    }

    /** 从私人舱室表构建全部可收录条目 */
    buildCatalog() {
        /** @type {ArchiveEntryDef[]} */
        const entries = [];
        const quarters = typeof this.getPrivateQuarters === "function"
            ? this.getPrivateQuarters()
            : [];

        (quarters || []).forEach((q) => {
            if (!q || !q.npcOwnerId || !Array.isArray(q.diary) || q.diary.length === 0) return;
            const ownerId = q.npcOwnerId;
            const name = ARCHIVE_OWNER_NAMES[ownerId] || ownerId;
            const pages = q.diary.map((p, i) => {
                const t = p.title || `第 ${i + 1} 页`;
                const c = p.content || "";
                return `【${t}】\n${c}`;
            }).join("\n\n————\n\n");
            entries.push({
                id: this.diaryId(ownerId),
                category: "diary",
                title: `${name}的日记`,
                subtitle: q.name || "私人舱室记录",
                summary: `收录自${name}的私人舱室手记。`,
                body: pages,
                hint: `首次接触并阅读${name}的私人记录后收录`,
                theme: "#94a3b8",
                ownerId
            });
        });

        ARCHIVE_EVENT_DEFS.forEach((e) => entries.push({ ...e }));
        return entries;
    }

    getCategories() {
        return [
            { id: "all", label: "全部" },
            { id: "diary", label: "私人日记" },
            { id: "event", label: "舰船事件" }
        ];
    }

    getEntry(id) {
        return this.buildCatalog().find((e) => e.id === id) || null;
    }

    getUnlockedEntries() {
        const unlocked = new Set(this.getUnlockedIds());
        return this.buildCatalog().filter((e) => unlocked.has(e.id));
    }

    countProgress() {
        const all = this.buildCatalog();
        const unlocked = this.getUnlockedIds();
        return { total: all.length, unlocked: unlocked.length };
    }
}
