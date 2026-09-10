/**
 * 存档与读档管理系统 (Save / Load System)
 * 具备沙箱安全防护与无痕模式/iframe内存降级保护，完美适配虎扑AI工坊等平台环境
 */

export class SaveSystem {
    constructor(saveKey = "DOPPELGANGER_ROGUE_SAVE_V1", unlockedKey = "DOPPELGANGER_UNLOCKED_LEVELS_V1", personaKey = "DOPPELGANGER_PERSONA_SECRETS_V1", completedKey = "DOPPELGANGER_COMPLETED_LEVELS_V1", talentKey = "DOPPELGANGER_TALENT_TREE_V1") {
        this.saveKey = saveKey;
        this.unlockedKey = unlockedKey;
        this.personaKey = personaKey;
        this.completedKey = completedKey;
        this.talentKey = talentKey;
        this.memoryStore = {};
        this.isLocalStorageAvailable = this.checkLocalStorage();

        // 存档逻辑更改：清除旧版残留的局内快照，严格贯彻“只记录通过关卡，不记录局内状态”
        this.clearSave();
    }

    checkLocalStorage() {
        try {
            const testKey = "__storage_test__";
            window.localStorage.setItem(testKey, testKey);
            window.localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            console.warn("[SaveSystem] LocalStorage 不可用 (可能处于安全沙箱或无痕模式)，自动切换为内存安全存储。");
            return false;
        }
    }

    hasSave() {
        // 存档逻辑更改：判定依据为是否具有通过的关卡记录（或已推进解锁非初始关卡）
        const completed = this.getCompletedLevels();
        if (Array.isArray(completed) && completed.length > 0) {
            return true;
        }
        const unlocked = this.getUnlockedLevels();
        return Array.isArray(unlocked) && unlocked.length > 1;
    }

    saveGame(gameState) {
        // 存档逻辑更改：现在只记录通过的关卡，不记录局内游戏状态
        this.clearSave();
        if (typeof gameState === "number" && gameState > 0) {
            return this.markLevelCompleted(gameState);
        }
        if (gameState && typeof gameState.levelId === "number" && gameState.levelId > 0 && gameState.isVictory) {
            return this.markLevelCompleted(gameState.levelId);
        }
        return true;
    }

    loadGame() {
        // 存档逻辑更改：仅返回通关进度信息与推荐推进关卡，不返回局内临时状态
        const completedLevels = this.getCompletedLevels();
        const unlockedLevels = this.getUnlockedLevels();
        if ((!completedLevels || completedLevels.length === 0) && (!unlockedLevels || unlockedLevels.length <= 1)) {
            return null;
        }
        const uncompleted = unlockedLevels.filter(id => !completedLevels.includes(id));
        const targetLevelId = uncompleted.length > 0
            ? Math.max(...uncompleted)
            : (completedLevels.length > 0 ? Math.max(...completedLevels) : 1);

        return {
            completedLevels,
            unlockedLevels,
            targetLevelId
        };
    }

    clearSave() {
        try {
            delete this.memoryStore[this.saveKey];
            if (this.isLocalStorageAvailable) {
                window.localStorage.removeItem(this.saveKey);
            }
        } catch (e) {
            console.error("[SaveSystem] 清理存档失败:", e);
        }
    }

    // =========================================================================
    // 关卡解锁持久化管理 (默认初始仅开放第 1 关)
    // =========================================================================
    getUnlockedLevels() {
        try {
            let raw = null;
            if (this.isLocalStorageAvailable) {
                raw = window.localStorage.getItem(this.unlockedKey);
            }
            if (!raw) {
                raw = this.memoryStore[this.unlockedKey];
            }
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const validIds = parsed.map(n => Number(n)).filter(n => !isNaN(n) && n > 0);
                    if (!validIds.includes(1)) validIds.unshift(1);
                    return Array.from(new Set(validIds)).sort((a, b) => a - b);
                }
            }
        } catch (e) {
            console.error("[SaveSystem] 获取已解锁关卡失败:", e);
        }
        return [1]; // 默认初始仅开放第 1 关
    }

    isLevelUnlocked(levelId) {
        const list = this.getUnlockedLevels();
        return list.includes(Number(levelId));
    }

    unlockLevels(levelIds = []) {
        if (!Array.isArray(levelIds) || levelIds.length === 0) {
            return [];
        }
        const currentList = this.getUnlockedLevels();
        const currentSet = new Set(currentList);
        const newlyUnlocked = [];

        levelIds.forEach(id => {
            const numId = Number(id);
            if (!isNaN(numId) && numId > 0 && !currentSet.has(numId)) {
                currentSet.add(numId);
                newlyUnlocked.push(numId);
            }
        });

        if (newlyUnlocked.length > 0) {
            const updatedList = Array.from(currentSet).sort((a, b) => a - b);
            const serialized = JSON.stringify(updatedList);
            this.memoryStore[this.unlockedKey] = serialized;
            if (this.isLocalStorageAvailable) {
                try {
                    window.localStorage.setItem(this.unlockedKey, serialized);
                } catch (e) {
                    console.error("[SaveSystem] 存储解锁关卡失败:", e);
                }
            }
            console.log(`[SaveSystem] 新增解锁关卡: [${newlyUnlocked.join(", ")}]，当前开放列表: [${updatedList.join(", ")}]`);
        }

        return newlyUnlocked;
    }

    resetUnlockedLevels() {
        const defaultList = [1];
        const serialized = JSON.stringify(defaultList);
        this.memoryStore[this.unlockedKey] = serialized;
        if (this.isLocalStorageAvailable) {
            try {
                window.localStorage.setItem(this.unlockedKey, serialized);
            } catch (e) {
                console.error("[SaveSystem] 重置关卡解锁失败:", e);
            }
        }
        return defaultList;
    }

    // =========================================================================
    // 关卡完成标记（与解锁列表独立；例如第十三关通关不解锁后续，仅记完成）
    // =========================================================================
    getCompletedLevels() {
        try {
            let raw = null;
            if (this.isLocalStorageAvailable) {
                raw = window.localStorage.getItem(this.completedKey);
            }
            if (!raw) {
                raw = this.memoryStore[this.completedKey];
            }
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    return Array.from(new Set(
                        parsed.map(n => Number(n)).filter(n => !isNaN(n) && n > 0)
                    )).sort((a, b) => a - b);
                }
            }
        } catch (e) {
            console.error("[SaveSystem] 获取已完成关卡失败:", e);
        }
        return [];
    }

    isLevelCompleted(levelId) {
        return this.getCompletedLevels().includes(Number(levelId));
    }

    markLevelCompleted(levelId) {
        const numId = Number(levelId);
        if (isNaN(numId) || numId <= 0) return false;
        const current = new Set(this.getCompletedLevels());
        if (current.has(numId)) return false;
        current.add(numId);
        const updatedList = Array.from(current).sort((a, b) => a - b);
        const serialized = JSON.stringify(updatedList);
        this.memoryStore[this.completedKey] = serialized;
        if (this.isLocalStorageAvailable) {
            try {
                window.localStorage.setItem(this.completedKey, serialized);
            } catch (e) {
                console.error("[SaveSystem] 存储完成关卡失败:", e);
            }
        }
        return true;
    }

    // =========================================================================
    // 人物特征 / 秘密图鉴 (Persona Log) 持久化管理
    // =========================================================================
    getPersonaSecretsMap() {
        try {
            let raw = null;
            if (this.isLocalStorageAvailable) {
                raw = window.localStorage.getItem(this.personaKey);
            }
            if (!raw) {
                raw = this.memoryStore[this.personaKey];
            }
            if (raw) {
                return JSON.parse(raw) || {};
            }
        } catch (e) {
            console.error("[SaveSystem] 获取图鉴档案失败:", e);
        }
        return {};
    }

    getUnlockedSecrets(charId) {
        const map = this.getPersonaSecretsMap();
        return Array.isArray(map[charId]) ? map[charId] : [];
    }

    isPersonaSecretUnlocked(charId, secretId) {
        const list = this.getUnlockedSecrets(charId);
        return list.includes(secretId);
    }

    unlockPersonaSecret(charId, secretId) {
        if (!charId || !secretId) return false;
        const map = this.getPersonaSecretsMap();
        if (!Array.isArray(map[charId])) {
            map[charId] = [];
        }
        if (map[charId].includes(secretId)) {
            return false; // 已经解锁过
        }
        map[charId].push(secretId);

        const serialized = JSON.stringify(map);
        this.memoryStore[this.personaKey] = serialized;
        if (this.isLocalStorageAvailable) {
            try {
                window.localStorage.setItem(this.personaKey, serialized);
            } catch (e) {
                console.error("[SaveSystem] 存储图鉴档案失败:", e);
            }
        }
        console.log(`[SaveSystem] ✨ 成功解构新档案: 角色 [${charId}] - 秘密 [${secretId}]`);
        return true;
    }

    isCharacterPassiveUnlocked(charId) {
        const list = this.getUnlockedSecrets(charId);
        return list.length >= 4; // 达成全部 4 项解构
    }

    resetPersonaSecrets() {
        this.memoryStore[this.personaKey] = "{}";
        if (this.isLocalStorageAvailable) {
            try {
                window.localStorage.removeItem(this.personaKey);
            } catch (e) {
                console.error("[SaveSystem] 重置图鉴档案失败:", e);
            }
        }
        return {};
    }

    // =========================================================================
    // 定锚科技树持久化 (Anchor Talent Tree)
    // =========================================================================
    getTalentState() {
        try {
            let raw = null;
            if (this.isLocalStorageAvailable) {
                raw = window.localStorage.getItem(this.talentKey);
            }
            if (!raw) {
                raw = this.memoryStore[this.talentKey];
            }
            if (raw) {
                const parsed = JSON.parse(raw);
                return {
                    points: Math.max(0, Number(parsed.points) || 0),
                    unlocked: Array.isArray(parsed.unlocked) ? parsed.unlocked.filter(Boolean) : [],
                    awardedLevels: Array.isArray(parsed.awardedLevels)
                        ? parsed.awardedLevels.map(n => Number(n)).filter(n => !isNaN(n) && n > 0)
                        : []
                };
            }
        } catch (e) {
            console.error("[SaveSystem] 读取定锚科技树失败:", e);
        }
        return { points: 0, unlocked: [], awardedLevels: [] };
    }

    setTalentState(state) {
        const normalized = {
            points: Math.max(0, Number(state && state.points) || 0),
            unlocked: Array.isArray(state && state.unlocked) ? state.unlocked.filter(Boolean) : [],
            awardedLevels: Array.isArray(state && state.awardedLevels)
                ? Array.from(new Set(state.awardedLevels.map(n => Number(n)).filter(n => !isNaN(n) && n > 0)))
                : []
        };
        const serialized = JSON.stringify(normalized);
        this.memoryStore[this.talentKey] = serialized;
        if (this.isLocalStorageAvailable) {
            try {
                window.localStorage.setItem(this.talentKey, serialized);
            } catch (e) {
                console.error("[SaveSystem] 存储定锚科技树失败:", e);
            }
        }
        return normalized;
    }
}
