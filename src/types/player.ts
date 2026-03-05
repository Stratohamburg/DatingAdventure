/**
 * 玩家属性接口
 * 定义玩家的五项核心属性
 */
export interface PlayerAttributes {
  /** 财富值 (0-100): 决定初始资金，影响能否购买高价道具 */
  wealth: number;
  /** 颜值 (0-100): 影响女方初始印象分 */
  appearance: number;
  /** 家庭背景 (0-100): 父母职业、退休金、是否双保 */
  family: number;
  /** 工作履历 (0-100): 职业类型，影响每回合资金回复 */
  career: number;
  /** 心理素质 (0-100): 隐藏属性，决定撒谎时的穿帮率修正 */
  stressResistance: number;
}

/**
 * 玩家角色原型枚举
 */
export enum PlayerArchetype {
  /** 完全随机 */
  RANDOM = 'RANDOM',
  /** 富二代: 财富值 90+，其他属性随机 */
  RICH_KID = 'RICH_KID',
  /** 凤凰男: 家庭背景 10-，工作履历 70+ */
  PHOENIX_MAN = 'PHOENIX_MAN',
  /** 普通人: 所有属性在 40-60 之间 */
  AVERAGE_JOE = 'AVERAGE_JOE',
  /** 天崩开局: 所有属性 30 以下 */
  HARD_MODE = 'HARD_MODE',
}

/**
 * 玩家状态
 */
export interface PlayerState {
  /** 玩家属性 */
  attributes: PlayerAttributes;
  /** 当前金币 */
  gold: number;
  /** 背包中的道具ID列表 */
  inventory: string[];
  /** 已使用的道具ID列表 */
  usedItems: string[];
  /** 选择的原型 */
  archetype: PlayerArchetype;
}

/**
 * 根据心理素质获取描述文本
 */
export function getStressResistanceDescription(value: number): string {
  if (value >= 80) return '镇定自若';
  if (value >= 60) return '沉稳';
  if (value >= 40) return '一般';
  if (value >= 20) return '紧张';
  return '慌乱';
}
