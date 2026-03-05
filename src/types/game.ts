import { PlayerState } from './player';
import { ShopState, Item } from './item';
import { NPC } from './npc';
import { ActiveEventEffect, GameEvent } from './event';
import { EndingType, GameStats } from './ending';

/**
 * 游戏阶段枚举
 */
export enum GamePhase {
  /** 初始化/角色生成 */
  INIT = 'INIT',
  /** 准备阶段（商店购物） */
  PREP = 'PREP',
  /** 相亲对话进行中 */
  DATE = 'DATE',
  /** 结果展示 */
  RESULT = 'RESULT',
}

/**
 * 对话阶段枚举
 */
export enum DialoguePhase {
  /** 开场破冰 */
  OPENING = 'OPENING',
  /** 话题交锋 */
  COMBAT = 'COMBAT',
  /** 结算阶段 */
  SETTLEMENT = 'SETTLEMENT',
}

/**
 * 穿帮风险记录
 */
export interface ExposureRisk {
  /** 来源（道具ID或"lie"） */
  source: string;
  /** 基础穿帮率 */
  baseRate: number;
  /** 关联的回合数 */
  round: number;
  /** 是否已判定 */
  checked: boolean;
  /** 判定结果（如已判定） */
  exposed?: boolean;
}

/**
 * 当前相亲状态
 */
export interface DateState {
  /** 当前 NPC */
  npc: NPC | null;
  /** 当前满意度 (0-100) */
  satisfaction: number;
  /** 当前信任度 (0-100) */
  trust: number;
  /** 当前回合数 */
  currentRound: number;
  /** 最大回合数 */
  maxRounds: number;
  /** 对话阶段 */
  dialoguePhase: DialoguePhase;
  /** 当前话题ID */
  currentTopicId: string | null;
  /** 已讨论的话题ID列表 */
  discussedTopics: string[];
  /** 穿帮风险列表 */
  exposureRisks: ExposureRisk[];
  /** 激活的事件效果 */
  activeEffects: ActiveEventEffect[];
  /** 已触发的事件ID */
  triggeredEvents: string[];
  /** 虚荣值 */
  vanity: number;
  /** 是否已坦白 */
  hasConfessed: boolean;
}

/**
 * 历史记录项
 */
export interface HistoryEntry {
  round: number;
  action: 'TRUTH' | 'LIE' | 'LIE_ITEM' | 'DEFLECT' | 'CONFESS';
  topicId?: string;
  itemId?: string;
  satisfactionChange: number;
  trustChange: number;
  wasExposed?: boolean;
}

/**
 * 游戏历史记录
 */
export interface GameHistory {
  entries: HistoryEntry[];
}

/**
 * 完整游戏状态
 */
export interface GameState {
  /** 游戏阶段 */
  gamePhase: GamePhase;
  /** 玩家状态 */
  player: PlayerState;
  /** 商店状态 */
  shop: ShopState;
  /** 当前相亲状态 */
  currentDate: DateState;
  /** 游戏历史 */
  history: GameHistory;
  /** 随机种子 */
  randomSeed: number;
  /** 当前随机数生成器状态 */
  rngState: number;
  /** 结局类型（游戏结束时设置） */
  endingType: EndingType | null;
  /** 游戏统计 */
  stats: GameStats | null;
}

/**
 * 创建初始游戏状态
 */
export function createInitialGameState(seed?: number): GameState {
  const randomSeed = seed ?? Math.floor(Math.random() * 2147483647);
  
  return {
    gamePhase: GamePhase.INIT,
    player: {
      attributes: {
        wealth: 50,
        appearance: 50,
        family: 50,
        career: 50,
        stressResistance: 50,
      },
      gold: 1000,
      inventory: [],
      usedItems: [],
      archetype: undefined as any,
    },
    shop: {
      availableItems: [],
      soldItems: [],
    },
    currentDate: {
      npc: null,
      satisfaction: 50,
      trust: 100,
      currentRound: 0,
      maxRounds: 5,
      dialoguePhase: DialoguePhase.OPENING,
      currentTopicId: null,
      discussedTopics: [],
      exposureRisks: [],
      activeEffects: [],
      triggeredEvents: [],
      vanity: 0,
      hasConfessed: false,
    },
    history: {
      entries: [],
    },
    randomSeed,
    rngState: randomSeed,
    endingType: null,
    stats: null,
  };
}
