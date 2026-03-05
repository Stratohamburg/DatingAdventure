/**
 * NPC 原型枚举
 */
export enum NPCArchetype {
  /** 务实派: 极度看重存款和房产 */
  PRAGMATIST = 'PRAGMATIST',
  /** 颜控派: 颜值权重极高 */
  VISUALIZER = 'VISUALIZER',
  /** 灵魂伴侣派: 看重三观和对话逻辑 */
  SOULMATE = 'SOULMATE',
  /** 顶级猎手: 拥有极高观察力的 BOSS 级对手 */
  GOLD_DIGGER = 'GOLD_DIGGER',
}

/**
 * NPC 基础属性
 */
export interface NPCStats {
  /** 观察力 (0-100): 影响识破假货概率 */
  observation: number;
  /** 物质欲 (0-100): 影响金钱对满意度加成 */
  materialism: number;
  /** 浪漫值 (0-100): 影响情话和坦白的效果 */
  romanticism: number;
}

/**
 * 满意度阈值配置
 */
export interface SatisfactionThreshold {
  /** 初始满意度基础值 */
  initial: number;
  /** 失败阈值 */
  fail: number;
  /** 成功阈值 */
  success: number;
}

/**
 * 对话选项类型
 */
export enum DialogueOptionType {
  /** 诚实回答 */
  TRUTH = 'TRUTH',
  /** 撒谎 */
  LIE = 'LIE',
  /** 使用道具撒谎 */
  LIE_ITEM = 'LIE_ITEM',
  /** 转移话题 */
  DEFLECT = 'DEFLECT',
}

/**
 * 对话选项效果
 */
export interface DialogueOptionEffect {
  satisfaction: number;
  trust?: number;
}

/**
 * 对话选项
 */
export interface DialogueOption {
  /** 选项类型 */
  type: DialogueOptionType;
  /** 显示文本 */
  text: string;
  /** 效果 */
  effect: DialogueOptionEffect;
  /** 需要的道具ID（仅 LIE_ITEM 类型） */
  itemRequired?: string;
  /** 是否触发穿帮判定 */
  riskCheck: boolean;
}

/**
 * 话题
 */
export interface DialogueTopic {
  /** 话题ID */
  topicId: string;
  /** NPC 提问文本 */
  question: string;
  /** 可选回答 */
  options: DialogueOption[];
}

/**
 * 对话树
 */
export interface DialogueTree {
  [topicId: string]: DialogueTopic;
}

/**
 * NPC 定义
 */
export interface NPC {
  /** 唯一标识符 */
  npcId: string;
  /** 显示名称 */
  name: string;
  /** 简介描述 */
  description: string;
  /** 原型类型 */
  archetype: NPCArchetype;
  /** 基础属性 */
  stats: NPCStats;
  /** 满意度阈值 */
  satisfactionThreshold: SatisfactionThreshold;
  /** 对话树 */
  dialogueTree: DialogueTree;
  /** 话题权重配置 */
  topicWeights?: Record<string, number>;
}
