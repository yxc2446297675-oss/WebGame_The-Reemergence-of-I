/**
 * 存档与读档管理系统 (Save / Load System)
 * 具备沙箱安全防护与无痕模式/iframe内存降级保护，完美适配虎扑AI工坊等平台环境
 */

export class SaveSystem {
    constructor(saveKey = "DOPPELGANGER_ROGUE_SAVE_V1", unlockedKey = "DOPPELGANGER_UNLOCKED_LEVELS_V1", personaKey = "DOPPELGANGER_PERSONA_SECRETS_V1") {
        this.saveKey = saveKey;
        this.unlockedKey = unlockedKey;
        this.personaKey = personaKey;
        this.memoryStore = {};
        this.isLocalStorageAvailable = this.checkLocalStorage();
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
        if (this.isLocalStorageAvailable) {
            try {
                return !!window.localStorage.getItem(this.saveKey);
            } catch (e) {
                return !!this.memoryStore[this.saveKey];
            }
        }
        return !!this.memoryStore[this.saveKey];
    }

    saveGame(gameState) {
        try {
            const serialized = JSON.stringify(gameState);
            this.memoryStore[this.saveKey] = serialized;
            if (this.isLocalStorageAvailable) {
                window.localStorage.setItem(this.saveKey, serialized);
            }
            return true;
        } catch (e) {
            console.error("[SaveSystem] 存档失败:", e);
            return false;
        }
    }

    loadGame() {
        try {
            let data = null;
            if (this.isLocalStorageAvailable) {
                data = window.localStorage.getItem(this.saveKey);
            }
            if (!data) {
                data = this.memoryStore[this.saveKey];
            }
            if (!data) return null;
            return JSON.parse(data);
        } catch (e) {
            console.error("[SaveSystem] 读档失败:", e);
            return null;
        }
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
}
