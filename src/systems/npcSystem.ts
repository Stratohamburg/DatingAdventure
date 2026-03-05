import { NPC, NPCArchetype, DialogueTopic, DialogueOption } from '../types/npc';
import { PlayerAttributes } from '../types/player';
import { PRNGState, weightedRandomChoice, randomChoice } from '../utils/prng';
import { configLoader } from '../utils/configLoader';

/**
 * NPC 系统
 * 处理 NPC 相关的逻辑计算
 */

/**
 * 计算初始满意度
 * 基于 NPC 类型和玩家外显属性
 */
export function calculateInitialSatisfaction(
  npc: NPC,
  playerAttributes: PlayerAttributes,
  appearanceBonus: number = 0
): number {
  const baseValue = npc.satisfactionThreshold.initial;
  
  // 颜值加成
  let appearanceEffect = (playerAttributes.appearance - 50) / 5;
  
  // 颜控派双倍加成
  if (npc.archetype === NPCArchetype.VISUALIZER) {
    appearanceEffect *= 2;
  }
  
  // 外显财富加成（通过道具提供的颜值加成模拟）
  const wealthEffect = appearanceBonus / 2;
  
  // 务实派对低财富有惩罚
  let wealthPenalty = 0;
  if (npc.archetype === NPCArchetype.PRAGMATIST && playerAttributes.wealth < 50) {
    wealthPenalty = (50 - playerAttributes.wealth) / 3;
  }
  
  const finalValue = Math.round(baseValue + appearanceEffect + wealthEffect - wealthPenalty);
  return Math.max(0, Math.min(100, finalValue));
}

/**
 * 根据 NPC 类型和权重选择下一个话题
 */
export function selectNextTopic(
  prng: PRNGState,
  npc: NPC,
  discussedTopics: string[]
): DialogueTopic | null {
  const availableTopics = Object.values(npc.dialogueTree).filter(
    (topic) => !discussedTopics.includes(topic.topicId)
  );

  if (availableTopics.length === 0) {
    return null;
  }

  // 如果有权重配置，使用加权随机
  if (npc.topicWeights) {
    const weights = availableTopics.map(
      (topic) => npc.topicWeights![topic.topicId] || 1.0
    );
    return weightedRandomChoice(prng, availableTopics, weights);
  }

  // 否则均匀随机
  return randomChoice(prng, availableTopics);
}

/**
 * 根据玩家背包过滤可用选项
 */
export function filterAvailableOptions(
  topic: DialogueTopic,
  playerInventory: string[],
  usedItems: string[]
): DialogueOption[] {
  return topic.options.filter((option) => {
    if (option.itemRequired) {
      // 需要道具且未使用过
      return (
        playerInventory.includes(option.itemRequired) &&
        !usedItems.includes(option.itemRequired)
      );
    }
    return true;
  });
}

/**
 * 获取 NPC 原型的特殊规则描述
 */
export function getArchetypeSpecialRules(archetype: NPCArchetype): string[] {
  switch (archetype) {
    case NPCArchetype.PRAGMATIST:
      return [
        '对房产和收入话题权重 +50%',
        '对假工资条分辨能力低',
        '但对实物道具敏感',
      ];
    case NPCArchetype.VISUALIZER:
      return [
        '颜值加成翻倍',
        '对经济条件容忍度提高',
        '重视外表包装',
      ];
    case NPCArchetype.SOULMATE:
      return [
        '诚实选项满意度加成提高',
        '对 PUA 话术免疫',
        '使用 PUA 会立即被识破',
      ];
    case NPCArchetype.GOLD_DIGGER:
      return [
        '观察力极高 (95)',
        '所有假货穿帮率 80%+',
        '只能靠真金白银',
        'BOSS 级难度',
      ];
    default:
      return [];
  }
}

/**
 * 检查是否应该应用 PUA 惩罚
 * 灵魂伴侣派对 PUA 话术免疫
 */
export function shouldApplyPUAPenalty(
  npc: NPC,
  hasPUABook: boolean,
  optionUsesPUA: boolean
): boolean {
  return (
    npc.archetype === NPCArchetype.SOULMATE &&
    hasPUABook &&
    optionUsesPUA
  );
}

/**
 * 计算 NPC 对虚假道具的穿帮概率修正
 */
export function calculateObservationModifier(npc: NPC): number {
  const observation = npc.stats.observation;
  
  if (observation >= 70) {
    return 20; // 高观察力 +20%
  } else if (observation <= 30) {
    return -10; // 低观察力 -10%
  }
  return 0;
}

/**
 * 顶级猎手特殊规则：所有假货穿帮率设为 80% 或更高
 */
export function applyGoldDiggerExposureRule(
  npc: NPC,
  baseExposureRate: number
): number {
  if (npc.archetype === NPCArchetype.GOLD_DIGGER) {
    return Math.max(80, baseExposureRate);
  }
  return baseExposureRate;
}

/**
 * 获取 NPC 原型的中文名称
 */
export function getNPCArchetypeName(archetype: NPCArchetype): string {
  const names: Record<NPCArchetype, string> = {
    [NPCArchetype.PRAGMATIST]: '务实派',
    [NPCArchetype.VISUALIZER]: '颜控派',
    [NPCArchetype.SOULMATE]: '灵魂伴侣派',
    [NPCArchetype.GOLD_DIGGER]: '顶级猎手',
  };
  return names[archetype] || '未知';
}

/**
 * 随机选择一个 NPC
 */
export function selectRandomNPC(prng: PRNGState): NPC {
  const npcs = configLoader.getNPCs();
  return randomChoice(prng, npcs);
}
