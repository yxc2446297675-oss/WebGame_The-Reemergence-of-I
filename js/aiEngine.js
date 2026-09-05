/**
 * 古诺西亚核心 AI 评议与辩论决策引擎 (Gnosia AI Debate Engine)
 * 计算每个 NPC 的博弈推理、怀疑度积累、起跳悍跳、投票模型与夜间结算
 */
import { Sound } from './audio.js';

export class GnosiaEngine {
    constructor(characters, levelConfig) {
        this.characters = characters;
        this.levelConfig = levelConfig;
        this.currentDay = 1;
        this.currentTurnIndex = 0;
        this.maxDebateRoundsPerDay = 5; // 每天最多5轮深度交锋后强制进入投票
        this.currentRound = 1;
        this.lastAction = null; // 记录上一位发言者的动作，用于触发赞同/反驳链
        this.lastFrozenCharacter = null;
        this.nightResults = [];
        this.debateLogs = [];
        this.claimedRoles = {}; // 记录公开起跳的角色映射 { seer: [charId1, charId2], ... }
    }

    // 获取所有存活角色
    getAliveCharacters() {
        return this.characters.filter(c => c.isAlive && !c.isFrozen);
    }

    // 查找角色对象
    getCharacter(id) {
        return this.characters.find(c => c.id === id);
    }

    // 获取玩家对象 (L.P.H)
    getPlayer() {
        return this.characters.find(c => c.isPlayer);
    }

    // ==========================================
    // 1. 白天评议会逻辑 (Daytime Debate AI)
    // ==========================================

    // AI 执行单次发言决策
    makeAIDecision(actor) {
        const alive = this.getAliveCharacters().filter(c => c.id !== actor.id);
        if (alive.length === 0) return null;

        const isWolf = actor.role.id === "wolf";

        // 决策 A: 是否需要自宣起跳身份 (Claim Role)?
        if (!actor.claimedRole && actor.role.canClaim && actor.role.id !== "villager") {
            // 真实神职有概率在首日或次日跳出报查验
            const claimChance = actor.role.id === "seer" ? 0.45 : 0.25;
            if (Math.random() < claimChance) {
                actor.claimedRole = actor.role.id;
                Sound.playAgree();
                return {
                    actor: actor,
                    type: "CLAIM",
                    roleName: actor.role.name,
                    text: actor.dialogues.claim ? actor.dialogues.claim(actor.role.name) : `「事到如今我必须站出来！我的真实身份是【${actor.role.name}】！」`
                };
            }
        }

        // 决策 B: 赞同前一位发言 (AGREE)
        if (this.lastAction && this.lastAction.type === "DOUBT" && this.lastAction.target) {
            const doubtedTarget = this.lastAction.target;
            // 如果我也看这个目标很不顺眼 (怀疑度 > 40)
            if (actor.suspicionScores[doubtedTarget.id] > 35 && this.lastAction.actor.id !== actor.id) {
                actor.suspicionScores[doubtedTarget.id] += 12;
                Sound.playAgree();
                return {
                    actor: actor,
                    type: "AGREE",
                    target: doubtedTarget,
                    text: actor.dialogues.agree ? actor.dialogues.agree(doubtedTarget.name) : `「我赞同【${this.lastAction.actor.name}】的直觉，【${doubtedTarget.name}】确实很可疑。」`
                };
            }

            // 决策 C: 反驳/维护前一位被怀疑者 (DEFEND)
            // 如果被指责的人是我很信任的人
            if (actor.trustScores[doubtedTarget.id] > 60 && actor.suspicionScores[doubtedTarget.id] < 30) {
                actor.suspicionScores[doubtedTarget.id] = Math.max(0, actor.suspicionScores[doubtedTarget.id] - 15);
                actor.trustScores[this.lastAction.actor.id] -= 10; // 对指责者好感下降
                Sound.playDefend();
                return {
                    actor: actor,
                    type: "DEFEND",
                    target: doubtedTarget,
                    text: actor.dialogues.defend ? actor.dialogues.defend(doubtedTarget.name) : `「等等！我认为【${doubtedTarget.name}】是清白的，我们不能盲目跟风！」`
                };
            }
        }

        // 决策 D: 主动发起怀疑 (DOUBT) - 核心博弈
        // 寻找怀疑值最高的角色（同时受潜行属性 Stealth 削减）
        alive.sort((a, b) => {
            const suspA = (actor.suspicionScores[a.id] || 0) - (a.stats.stealth * 0.25) - (a.stats.charm * 0.2);
            const suspB = (actor.suspicionScores[b.id] || 0) - (b.stats.stealth * 0.25) - (b.stats.charm * 0.2);
            return suspB - suspA;
        });

        const target = alive[0];
        // 提升该目标在全场的怀疑度
        actor.suspicionScores[target.id] += 15;
        Sound.playDoubt();

        return {
            actor: actor,
            type: "DOUBT",
            target: target,
            text: actor.dialogues.doubt ? actor.dialogues.doubt(target.name) : `「【${target.name}】，从刚才起你的言行就很不自然。我怀疑你是潜伏的古诺西亚！」`
        };
    }

    // 玩家执行怀疑
    playerDoubt(target) {
        const player = this.getPlayer();
        target.stats.charm = Math.max(0, target.stats.charm - 5);
        // 全场 NPC 对目标的怀疑度上升
        this.getAliveCharacters().forEach(c => {
            if (c.id !== player.id) {
                c.suspicionScores[target.id] = (c.suspicionScores[target.id] || 0) + 20;
            }
        });
        Sound.playDoubt();
        const action = {
            actor: player,
            type: "DOUBT",
            target: target,
            text: player.dialogues.doubt(target.name)
        };
        this.lastAction = action;
        return action;
    }

    // 玩家执行辩护
    playerDefend(target) {
        const player = this.getPlayer();
        this.getAliveCharacters().forEach(c => {
            if (c.id !== player.id) {
                c.suspicionScores[target.id] = Math.max(0, (c.suspicionScores[target.id] || 0) - 20);
                c.trustScores[target.id] = (c.trustScores[target.id] || 50) + 15;
            }
        });
        Sound.playDefend();
        const action = {
            actor: player,
            type: "DEFEND",
            target: target,
            text: player.dialogues.defend(target.name)
        };
        this.lastAction = action;
        return action;
    }

    // 玩家执行赞同
    playerAgree() {
        const player = this.getPlayer();
        if (!this.lastAction || !this.lastAction.target) return null;
        const target = this.lastAction.target;
        this.getAliveCharacters().forEach(c => {
            c.suspicionScores[target.id] = (c.suspicionScores[target.id] || 0) + 10;
        });
        Sound.playAgree();
        const action = {
            actor: player,
            type: "AGREE",
            target: target,
            text: player.dialogues.agree(target.name)
        };
        this.lastAction = action;
        return action;
    }

    // 玩家自宣起跳身份
    playerClaim() {
        const player = this.getPlayer();
        player.claimedRole = player.role.id;
        Sound.playAgree();
        const action = {
            actor: player,
            type: "CLAIM",
            roleName: player.role.name,
            text: player.dialogues.claim(player.role.name)
        };
        this.lastAction = action;
        return action;
    }

    // ==========================================
    // 2. 投票放逐与冷冻逻辑 (Cold Sleep Voting)
    // ==========================================
    resolveVote(playerVoteTargetId) {
        const alive = this.getAliveCharacters();
        // 清空得票
        alive.forEach(c => c.votesCount = 0);
        const voteDetails = [];

        alive.forEach(voter => {
            let votedTarget = null;
            if (voter.isPlayer) {
                votedTarget = alive.find(c => c.id === playerVoteTargetId) || alive[0];
            } else {
                // NPC 根据累计怀疑度 - 魅力值 投票
                const candidates = alive.filter(c => c.id !== voter.id);
                candidates.sort((a, b) => {
                    const scoreA = (voter.suspicionScores[a.id] || 0) - (a.stats.charm * 0.3);
                    const scoreB = (voter.suspicionScores[b.id] || 0) - (b.stats.charm * 0.3);
                    return scoreB - scoreA;
                });
                votedTarget = candidates[0];
            }

            votedTarget.votesCount++;
            voteDetails.push({
                voter: voter.name,
                target: votedTarget.name
            });
        });

        // 统计最高票
        alive.sort((a, b) => b.votesCount - a.votesCount);
        const maxVotes = alive[0].votesCount;
        const highestCandidates = alive.filter(c => c.votesCount === maxVotes);

        // 如果平票，随机或按逻辑抉择，这里由被怀疑最高的冷冻
        const frozenCharacter = highestCandidates[0];
        frozenCharacter.isFrozen = true;
        this.lastFrozenCharacter = frozenCharacter;
        Sound.playColdSleep();

        return {
            frozenCharacter: frozenCharacter,
            voteDetails: voteDetails,
            isTie: highestCandidates.length > 1
        };
    }

    // ==========================================
    // 3. 夜晚行动与技能结算 (Night Actions)
    // ==========================================
    resolveNight(playerNightTargetId = null) {
        const alive = this.getAliveCharacters();
        const logs = [];
        let killedTarget = null;
        let guardedTarget = null;
        let inspectResult = null;
        let autopsyResult = null;

        // 1. 守卫执行守护
        const guard = alive.find(c => c.role.id === "guard");
        if (guard) {
            let target = null;
            if (guard.isPlayer) {
                target = alive.find(c => c.id === playerNightTargetId);
            } else {
                // AI 守卫倾向保护已被证实的预言家或高信任者
                target = alive.find(c => c.claimedRole === "seer") || alive[Math.floor(Math.random() * alive.length)];
            }
            if (target) {
                const res = guard.role.performNightAction(guard, target, this);
                if (res.success) {
                    guardedTarget = target;
                    if (guard.isPlayer) logs.push(res.log);
                }
            }
        }

        // 2. 预言家执行查验
        const seer = alive.find(c => c.role.id === "seer");
        if (seer) {
            let target = null;
            if (seer.isPlayer) {
                target = alive.find(c => c.id === playerNightTargetId);
            } else {
                // AI 预言家查验未公开身份且可疑度高的人
                const uninspected = alive.filter(c => c.id !== seer.id);
                target = uninspected[Math.floor(Math.random() * uninspected.length)];
            }
            if (target) {
                const res = seer.role.performNightAction(seer, target, this);
                if (res.success) {
                    inspectResult = res;
                    if (seer.isPlayer) logs.push(res.log);
                }
            }
        }

        // 3. 医生对上一日冷冻者验尸
        const witch = alive.find(c => c.role.id === "witch");
        if (witch && this.lastFrozenCharacter) {
            const res = witch.role.performNightAction(witch, null, this);
            autopsyResult = res;
            if (witch.isPlayer) logs.push(res.log);
        }

        // 4. 古诺西亚/狼人夜间暗杀
        const wolves = alive.filter(c => c.role.id === "wolf");
        if (wolves.length > 0) {
            const nonWolves = alive.filter(c => c.role.id !== "wolf");
            if (nonWolves.length > 0) {
                let killCandidate = null;
                const playerWolf = wolves.find(w => w.isPlayer);
                if (playerWolf && playerNightTargetId) {
                    killCandidate = nonWolves.find(c => c.id === playerNightTargetId);
                }
                if (!killCandidate) {
                    // AI 狼人优先杀跳神的人（如自称工程师者）
                    killCandidate = nonWolves.find(c => c.claimedRole === "seer") || nonWolves[Math.floor(Math.random() * nonWolves.length)];
                }

                // 检验是否被守护天使防住！
                if (guardedTarget && guardedTarget.id === killCandidate.id) {
                    logs.push(`【夜间广播】：昨夜飞船防卫屏障曾爆发剧烈能量偏转，无人伤亡！（平安夜）`);
                } else {
                    killCandidate.isAlive = false;
                    killedTarget = killCandidate;
                    logs.push(`【紧急播报】：今晨发现【${killCandidate.name}】已在寝室内被抹杀，遭遇不测！`);
                }
            }
        }

        this.currentDay++;
        this.currentRound = 1;
        this.lastAction = null;

        return {
            killedTarget: killedTarget,
            guardedTarget: guardedTarget,
            inspectResult: inspectResult,
            autopsyResult: autopsyResult,
            logs: logs
        };
    }

    // ==========================================
    // 4. 胜负判定 (Victory Check)
    // ==========================================
    checkGameOver() {
        const alive = this.getAliveCharacters();
        const aliveWolves = alive.filter(c => c.role.id === "wolf");
        const aliveHumans = alive.filter(c => c.role.id !== "wolf");

        // 人类获胜条件：所有古诺西亚均已被冷冻
        if (aliveWolves.length === 0) {
            Sound.playVictory();
            return {
                isGameOver: true,
                winner: "human",
                title: "人类阵营全面胜利！",
                message: "所有潜伏在船员中的古诺西亚伪装体均已被成功排查并送入冷冻舱！飞船航向已恢复正常，跃迁成功！"
            };
        }

        // 古诺西亚获胜条件：古诺西亚数量 >= 存活人类数量
        if (aliveWolves.length >= aliveHumans.length) {
            Sound.playDefeat();
            return {
                isGameOver: true,
                winner: "wolf",
                title: "古诺西亚阵营彻底支配！",
                message: "古诺西亚的数量已压制人类船员，全舰控制权限被强行夺取……飞船陷入永久的死寂。"
            };
        }

        return { isGameOver: false };
    }
}
