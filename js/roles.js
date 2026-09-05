/**
 * 身份系统 (Role System)
 * 采用面向对象策略模式 (Strategy Pattern) 与 工厂注册表模式 (Registry)
 * 具备极高的延展性：新增任何神职/第三方身份只需继承 Role 基类并注册
 */
import { WorldviewConfig } from './config.js';

export class Role {
    constructor(id) {
        this.id = id;
        const config = WorldviewConfig.roleNames[id] || {
            name: id,
            team: "human",
            desc: "未知身份",
            color: "#ffffff"
        };
        this.name = config.name;
        this.alias = config.alias || config.name;
        this.team = config.team; // "human" | "enemy" | "third"
        this.color = config.color;
        this.description = config.desc;
        this.hasNightAction = false;
        this.canClaim = true; // 是否可以在评议会中起跳自宣身份
    }

    // 白天评议会自宣发言
    getClaimStatement(characterName) {
        return `「听我说，各位。我的真实身份是【${this.name}】。」`;
    }

    // 夜晚行动抽象接口
    performNightAction(actor, target, context) {
        return { success: false, log: "" };
    }
}

// 1. 船员 / 平民
export class VillagerRole extends Role {
    constructor() {
        super("villager");
        this.hasNightAction = false;
    }
}

// 2. 古诺西亚 / 狼人
export class WolfRole extends Role {
    constructor() {
        super("wolf");
        this.hasNightAction = true;
    }

    performNightAction(actor, target, context) {
        if (!target || !target.isAlive) {
            return { success: false, log: "无效的抹杀目标" };
        }
        return {
            success: true,
            actionType: "kill",
            targetId: target.id,
            log: `古诺西亚将目标锁定了【${target.name}】。`
        };
    }
}

// 3. 工程师 / 预言家
export class SeerRole extends Role {
    constructor() {
        super("seer");
        this.hasNightAction = true;
    }

    performNightAction(actor, target, context) {
        if (!target || !target.isAlive) {
            return { success: false, log: "请选择存活的船员进行扫描。" };
        }
        const isEnemy = target.role.team === "enemy";
        const enemyName = WorldviewConfig.roleNames.wolf.name;
        const humanName = WorldviewConfig.roleNames.villager.name;
        const resultText = isEnemy ? `【${enemyName}】(危险目标!)` : `【人类 (${humanName})】(安全)`;
        
        return {
            success: true,
            actionType: "inspect",
            targetId: target.id,
            targetName: target.name,
            isEnemy: isEnemy,
            resultText: resultText,
            log: `扫描中枢报告：【${target.name}】的生体检测判定为：${resultText}`
        };
    }
}

// 4. 医生 / 女巫/灵媒
export class WitchRole extends Role {
    constructor() {
        super("witch");
        this.hasNightAction = true;
        this.hasPotion = true; // 一次性救人/解剖验尸权限
    }

    performNightAction(actor, target, context) {
        // 医生夜晚验尸被冷冻者的真实身份
        const frozenTarget = context.lastFrozenCharacter;
        if (!frozenTarget) {
            return { success: true, log: "今日暂无冷冻者需要检疫。" };
        }
        const isEnemy = frozenTarget.role.team === "enemy";
        const enemyName = WorldviewConfig.roleNames.wolf.name;
        const humanName = WorldviewConfig.roleNames.villager.name;
        const resultText = isEnemy ? `【${enemyName}】` : `【人类 (${humanName})】`;
        
        return {
            success: true,
            actionType: "autopsy",
            targetId: frozenTarget.id,
            targetName: frozenTarget.name,
            isEnemy: isEnemy,
            resultText: resultText,
            log: `解剖报告：昨日冷冻者【${frozenTarget.name}】生前确认为：${resultText}`
        };
    }
}

// 5. 守护天使 / 守卫
export class GuardRole extends Role {
    constructor() {
        super("guard");
        this.hasNightAction = true;
        this.lastGuardedId = null;
    }

    performNightAction(actor, target, context) {
        if (!target || !target.isAlive) {
            return { success: false, log: "无法守护不存在或已阵亡的目标。" };
        }
        if (this.lastGuardedId && this.lastGuardedId === target.id) {
            return { success: false, log: "不能连续两夜守护同一名目标！" };
        }
        this.lastGuardedId = target.id;
        return {
            success: true,
            actionType: "guard",
            targetId: target.id,
            targetName: target.name,
            log: `能量护盾已成功部署在【${target.name}】的寝室周围。`
        };
    }
}

// 身份统一注册表与工厂
export class RoleFactory {
    static create(roleId) {
        switch (roleId) {
            case "wolf": return new WolfRole();
            case "villager": return new VillagerRole();
            case "seer": return new SeerRole();
            case "witch": return new WitchRole();
            case "guard": return new GuardRole();
            default: return new VillagerRole();
        }
    }
}
