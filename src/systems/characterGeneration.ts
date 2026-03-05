import { PlayerAttributes, PlayerArchetype, PlayerState } from '../types/player';
import {
  PRNGState,
  randomAttribute,
  randomRange,
} from '../utils/prng';

/**
 * 角色生成系统
 * 负责生成玩家的随机属性和初始状态
 */

/**
 * 基础资金常量
 */
const BASE_GOLD = 1000;

/**
 * 财富值到金币的转换系数
 */
const WEALTH_TO_GOLD_MULTIPLIER = 100;

/**
 * 收入等级配置
 */
const INCOME_TIERS = {
  LOW: { min: 0, max: 30, income: 100 },
  MEDIUM: { min: 31, max: 60, income: 200 },
  HIGH: { min: 61, max: 100, income: 350 },
};

/**
 * 生成完全随机的属性
 */
export function generateRandomAttributes(prng: PRNGState): PlayerAttributes {
  return {
    wealth: randomAttribute(prng),
    appearance: randomAttribute(prng),
    family: randomAttribute(prng),
    career: randomAttribute(prng),
    stressResistance: randomAttribute(prng),
  };
}

/**
 * 生成富二代原型属性
 * 财富值 90+，其他属性随机
 */
export function generateRichKidAttributes(prng: PRNGState): PlayerAttributes {
  return {
    wealth: randomRange(prng, 90, 100),
    appearance: randomAttribute(prng),
    family: randomRange(prng, 70, 100), // 家庭背景也较好
    career: randomAttribute(prng),
    stressResistance: randomAttribute(prng),
  };
}

/**
 * 生成凤凰男原型属性
 * 家庭背景 10-，工作履历 70+
 */
export function generatePhoenixManAttributes(prng: PRNGState): PlayerAttributes {
  return {
    wealth: randomRange(prng, 20, 50), // 靠自己奋斗，有一定积蓄
    appearance: randomAttribute(prng),
    family: randomRange(prng, 0, 15), // 家庭背景差
    career: randomRange(prng, 70, 100), // 工作能力强
    stressResistance: randomRange(prng, 60, 90), // 心理素质较好（经历过磨练）
  };
}

/**
 * 生成普通人原型属性
 * 所有属性在 40-60 之间
 */
export function generateAverageJoeAttributes(prng: PRNGState): PlayerAttributes {
  return {
    wealth: randomRange(prng, 40, 60),
    appearance: randomRange(prng, 40, 60),
    family: randomRange(prng, 40, 60),
    career: randomRange(prng, 40, 60),
    stressResistance: randomRange(prng, 40, 60),
  };
}

/**
 * 生成天崩开局原型属性
 * 所有属性 30 以下
 */
export function generateHardModeAttributes(prng: PRNGState): PlayerAttributes {
  return {
    wealth: randomRange(prng, 5, 30),
    appearance: randomRange(prng, 5, 30),
    family: randomRange(prng, 5, 30),
    career: randomRange(prng, 5, 30),
    stressResistance: randomRange(prng, 5, 30),
  };
}

/**
 * 根据原型生成属性
 */
export function generateAttributesByArchetype(
  prng: PRNGState,
  archetype: PlayerArchetype
): PlayerAttributes {
  switch (archetype) {
    case PlayerArchetype.RICH_KID:
      return generateRichKidAttributes(prng);
    case PlayerArchetype.PHOENIX_MAN:
      return generatePhoenixManAttributes(prng);
    case PlayerArchetype.AVERAGE_JOE:
      return generateAverageJoeAttributes(prng);
    case PlayerArchetype.HARD_MODE:
      return generateHardModeAttributes(prng);
    case PlayerArchetype.RANDOM:
    default:
      return generateRandomAttributes(prng);
  }
}

/**
 * 计算初始资金
 * 公式: 基础资金(1000) + 财富值 * 100
 */
export function calculateInitialGold(wealth: number): number {
  return BASE_GOLD + wealth * WEALTH_TO_GOLD_MULTIPLIER;
}

/**
 * 计算每回合收入
 * 根据工作履历属性计算
 */
export function calculateRoundIncome(career: number): number {
  if (career <= INCOME_TIERS.LOW.max) {
    return INCOME_TIERS.LOW.income;
  } else if (career <= INCOME_TIERS.MEDIUM.max) {
    return INCOME_TIERS.MEDIUM.income;
  } else {
    return INCOME_TIERS.HIGH.income;
  }
}

/**
 * 获取收入等级描述
 */
export function getIncomeTierDescription(career: number): string {
  if (career <= INCOME_TIERS.LOW.max) {
    return '低收入 (灵活就业)';
  } else if (career <= INCOME_TIERS.MEDIUM.max) {
    return '中等收入 (普通白领)';
  } else {
    return '高收入 (大厂/公务员)';
  }
}

/**
 * 生成完整的玩家初始状态
 */
export function generatePlayerState(
  prng: PRNGState,
  archetype: PlayerArchetype
): PlayerState {
  const attributes = generateAttributesByArchetype(prng, archetype);
  const gold = calculateInitialGold(attributes.wealth);

  return {
    attributes,
    gold,
    inventory: [],
    usedItems: [],
    archetype,
  };
}

/**
 * 获取原型的中文名称
 */
export function getArchetypeName(archetype: PlayerArchetype): string {
  const names: Record<PlayerArchetype, string> = {
    [PlayerArchetype.RANDOM]: '完全随机',
    [PlayerArchetype.RICH_KID]: '富二代',
    [PlayerArchetype.PHOENIX_MAN]: '凤凰男',
    [PlayerArchetype.AVERAGE_JOE]: '普通人',
    [PlayerArchetype.HARD_MODE]: '天崩开局',
  };
  return names[archetype] || '未知';
}

/**
 * 获取原型的描述
 */
export function getArchetypeDescription(archetype: PlayerArchetype): string {
  const descriptions: Record<PlayerArchetype, string> = {
    [PlayerArchetype.RANDOM]: '命运的骰子，全凭运气',
    [PlayerArchetype.RICH_KID]: '含着金汤匙出生，人生Easy模式',
    [PlayerArchetype.PHOENIX_MAN]: '寒门出贵子，靠实力逆袭',
    [PlayerArchetype.AVERAGE_JOE]: '普普通通，平平淡淡才是真',
    [PlayerArchetype.HARD_MODE]: '上天想看看你的极限在哪里',
  };
  return descriptions[archetype] || '';
}
