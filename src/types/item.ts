/**
 * 道具分类
 */
export enum ItemCategory {
  /** 真实资产: 高价，无穿帮风险 */
  REAL_ASSET = 'REAL_ASSET',
  /** 虚假包装: 低价，有穿帮概率 */
  FAKE_PACKAGE = 'FAKE_PACKAGE',
  /** 特殊道具: 有特殊效果或副作用 */
  SPECIAL = 'SPECIAL',
}

/**
 * 道具效果类型
 */
export interface ItemEffect {
  /** 满意度变化 */
  satisfaction?: number;
  /** 信任度变化 */
  trust?: number;
  /** 颜值加成 */
  appearanceBonus?: number;
  /** 解锁特殊对话选项 */
  unlockOptions?: string[];
}

/**
 * 道具定义
 */
export interface Item {
  /** 唯一标识符 */
  itemId: string;
  /** 道具名称 */
  name: string;
  /** 道具描述 */
  description: string;
  /** 道具分类 */
  category: ItemCategory;
  /** 购买价格 */
  price: number;
  /** 道具效果 */
  effect: ItemEffect;
  /** 穿帮概率 (0-100)，仅 FAKE_PACKAGE 类型有效 */
  exposureRate: number;
  /** 穿帮时的台词 */
  exposureDialogue?: string;
  /** 是否可重复购买 */
  repeatable: boolean;
}

/**
 * 商店状态
 */
export interface ShopState {
  /** 可购买的道具列表 */
  availableItems: Item[];
  /** 已售出的道具ID列表（不可重复购买的） */
  soldItems: string[];
}
