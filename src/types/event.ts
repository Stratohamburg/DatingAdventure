/**
 * 随机事件效果类型
 */
export enum EventEffectType {
  /** 穿帮概率修正 */
  EXPOSURE_MODIFIER = 'EXPOSURE_MODIFIER',
  /** 满意度修正 */
  SATISFACTION_MODIFIER = 'SATISFACTION_MODIFIER',
  /** 信任度修正 */
  TRUST_MODIFIER = 'TRUST_MODIFIER',
  /** 强制诚实 */
  FORCE_TRUTH = 'FORCE_TRUTH',
  /** 免费转移话题 */
  FREE_DEFLECT = 'FREE_DEFLECT',
  /** 禁用转移话题 */
  DISABLE_DEFLECT = 'DISABLE_DEFLECT',
  /** 触发穿帮判定 */
  TRIGGER_EXPOSURE_CHECK = 'TRIGGER_EXPOSURE_CHECK',
}

/**
 * 事件持续时间
 */
export enum EventDuration {
  /** 仅当前回合 */
  THIS_ROUND = 'THIS_ROUND',
  /** 整场相亲 */
  THIS_DATE = 'THIS_DATE',
  /** 立即生效 */
  IMMEDIATE = 'IMMEDIATE',
}

/**
 * 事件选项（需要玩家选择的事件）
 */
export interface EventChoice {
  /** 选项文本 */
  text: string;
  /** 选项效果 */
  effect: {
    type: EventEffectType;
    value: number;
  };
}

/**
 * 随机事件定义
 */
export interface GameEvent {
  /** 事件ID */
  eventId: string;
  /** 事件名称 */
  name: string;
  /** 事件描述文本 */
  description: string;
  /** 触发权重 (越高越容易触发) */
  triggerWeight: number;
  /** 效果类型 */
  effectType: EventEffectType;
  /** 效果数值 */
  effectValue: number;
  /** 持续时间 */
  duration: EventDuration;
  /** 是否需要玩家选择 */
  requiresChoice: boolean;
  /** 选项列表（仅当 requiresChoice 为 true） */
  choices?: EventChoice[];
  /** 触发条件（如需要玩家之前撒过谎） */
  conditions?: EventCondition[];
}

/**
 * 事件触发条件
 */
export interface EventCondition {
  /** 条件类型 */
  type: 'HAS_LIED' | 'HAS_FAKE_ITEM' | 'ROUND_MIN' | 'ROUND_MAX';
  /** 条件值 */
  value?: number | string | boolean;
}

/**
 * 当前激活的事件效果
 */
export interface ActiveEventEffect {
  eventId: string;
  effectType: EventEffectType;
  effectValue: number;
  expiresAtRound?: number;
}
