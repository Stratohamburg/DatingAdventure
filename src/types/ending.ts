/**
 * 结局类型枚举
 */
export enum EndingType {
  /** 结局 A: 虚假的繁荣 - 靠假货成功但活在谎言中 */
  FALSE_PROSPERITY = 'FALSE_PROSPERITY',
  /** 结局 B: 老实人的悲歌 - 全程诚实但失败 */
  HONEST_MANS_LAMENT = 'HONEST_MANS_LAMENT',
  /** 结局 C: 意外的真爱 - 使用假货后坦白获得原谅 (隐藏结局) */
  TRUE_LOVE = 'TRUE_LOVE',
  /** 结局 D: 社死现场 - 被当场揭穿并公开处刑 */
  SOCIAL_DEATH = 'SOCIAL_DEATH',
  /** 普通成功 - 靠真实资产成功 */
  NORMAL_SUCCESS = 'NORMAL_SUCCESS',
  /** 普通失败 - 普通失败 */
  NORMAL_FAILURE = 'NORMAL_FAILURE',
}

/**
 * 结局评价标签
 */
export interface EndingTag {
  label: string;
  description: string;
}

/**
 * 结局定义
 */
export interface Ending {
  /** 结局ID */
  endingId: string;
  /** 结局类型 */
  type: EndingType;
  /** 结局名称 */
  name: string;
  /** 结局描述 */
  description: string;
  /** 结局长文本（详细叙述） */
  narrative: string;
  /** 评价标签 */
  tags: EndingTag[];
  /** 是否为隐藏结局 */
  isHidden: boolean;
  /** 达成难度描述 */
  difficulty?: string;
}

/**
 * 游戏统计数据（用于结局展示）
 */
export interface GameStats {
  /** 总回合数 */
  totalRounds: number;
  /** 诚实回答次数 */
  truthCount: number;
  /** 撒谎次数 */
  lieCount: number;
  /** 转移话题次数 */
  deflectCount: number;
  /** 使用道具次数 */
  itemUsedCount: number;
  /** 使用虚假道具次数 */
  fakeItemUsedCount: number;
  /** 穿帮次数 */
  exposureCount: number;
  /** 最终满意度 */
  finalSatisfaction: number;
  /** 最终信任度 */
  finalTrust: number;
  /** 虚荣值 */
  vanityValue: number;
  /** 是否坦白过 */
  hasConfessed: boolean;
  /** 诚实率 (0-100) */
  honestyRate: number;
}
