import { DialogueOption, DialogueOptionType, NPC, NPCArchetype } from '../types/npc';
import { DialoguePhase, ExposureRisk, HistoryEntry } from '../types/game';
import { Item, ItemCategory } from '../types/item';
import { PRNGState, rollProbability } from '../utils/prng';
import { configLoader } from '../utils/configLoader';
import {
  calculateObservationModifier,
  applyGoldDiggerExposureRule,
} from './npcSystem';

/**
 * 对话战斗系统
 * 处理回合制对话的核心逻辑
 */

/**
 * 对话阶段管理
 */
export function getNextDialoguePhase(
  currentPhase: DialoguePhase,
  currentRound: number,
  maxRounds: number,
  satisfaction: number,
  trust: number
): DialoguePhase {
  // 检查立即失败条件
  if (satisfaction <= 0 || trust <= 0) {
    return DialoguePhase.SETTLEMENT;
  }

  switch (currentPhase) {
    case DialoguePhase.OPENING:
      return DialoguePhase.COMBAT;
    case DialoguePhase.COMBAT:
      if (currentRound >= maxRounds) {
        return DialoguePhase.SETTLEMENT;
      }
      return DialoguePhase.COMBAT;
    case DialoguePhase.SETTLEMENT:
      return DialoguePhase.SETTLEMENT;
    default:
      return currentPhase;
  }
}

/**
 * 检查游戏是否结束
 */
export function checkGameEnd(
  satisfaction: number,
  trust: number,
  currentRound: number,
  maxRounds: number,
  dialoguePhase: DialoguePhase
): { isEnded: boolean; isVictory: boolean | null; reason: string } {
  // 信任度归零 - 立即失败
  if (trust <= 0) {
    return {
      isEnded: true,
      isVictory: false,
      reason: '信任度归零，谎言被完全识破！',
    };
  }

  // 满意度归零 - 立即失败
  if (satisfaction <= 0) {
    return {
      isEnded: true,
      isVictory: false,
      reason: '满意度归零，女嘉宾愤然离席！',
    };
  }

  // 对话结束
  if (dialoguePhase === DialoguePhase.SETTLEMENT || currentRound >= maxRounds) {
    const isVictory = satisfaction >= 80;
    return {
      isEnded: true,
      isVictory,
      reason: isVictory ? '相亲成功！' : '相亲失败，满意度不足。',
    };
  }

  return { isEnded: false, isVictory: null, reason: '' };
}

/**
 * 计算选项效果
 */
export interface OptionEffectResult {
  satisfactionChange: number;
  trustChange: number;
  shouldAddExposureRisk: boolean;
  exposureRisk?: ExposureRisk;
  vanityIncrease: number;
  itemUsed?: string;
}

export function calculateOptionEffect(
  option: DialogueOption,
  npc: NPC,
  playerStressResistance: number,
  currentRound: number,
  item?: Item
): OptionEffectResult {
  const result: OptionEffectResult = {
    satisfactionChange: option.effect.satisfaction,
    trustChange: option.effect.trust || 0,
    shouldAddExposureRisk: false,
    vanityIncrease: 0,
  };

  // 处理不同类型的选项
  switch (option.type) {
    case DialogueOptionType.TRUTH:
      // 诚实选项：灵魂伴侣派加成
      if (npc.archetype === NPCArchetype.SOULMATE) {
        result.satisfactionChange = Math.round(result.satisfactionChange * 1.3);
        result.trustChange += 5;
      }
      break;

    case DialogueOptionType.LIE:
      // 撒谎：增加虚荣值，添加穿帮风险
      result.vanityIncrease = 1;
      result.shouldAddExposureRisk = option.riskCheck;
      if (option.riskCheck) {
        result.exposureRisk = {
          source: 'lie',
          baseRate: 25, // 基础撒谎穿帮率
          round: currentRound,
          checked: false,
        };
      }
      break;

    case DialogueOptionType.LIE_ITEM:
      // 使用道具撒谎
      result.vanityIncrease = 1;
      result.itemUsed = option.itemRequired;
      
      if (item && option.riskCheck) {
        result.shouldAddExposureRisk = true;
        
        // 计算穿帮率
        let exposureRate = item.exposureRate;
        exposureRate = applyGoldDiggerExposureRule(npc, exposureRate);
        exposureRate += calculateObservationModifier(npc);
        exposureRate -= playerStressResistance / 5; // 心理素质减少穿帮率
        
        result.exposureRisk = {
          source: item.itemId,
          baseRate: Math.max(5, Math.min(95, exposureRate)),
          round: currentRound,
          checked: false,
        };
      }
      
      // 应用道具效果
      if (item?.effect) {
        if (item.effect.satisfaction) {
          result.satisfactionChange = item.effect.satisfaction;
        }
        if (item.effect.trust) {
          result.trustChange += item.effect.trust;
        }
      }
      break;

    case DialogueOptionType.DEFLECT:
      // 转移话题：不增加风险
      break;
  }

  return result;
}

/**
 * 转移话题的金币消耗
 */
export function getDeflectCost(): number {
  return 150; // 固定消耗 150 金币
}

/**
 * 执行穿帮判定
 */
export function performExposureCheck(
  prng: PRNGState,
  risk: ExposureRisk,
  npc: NPC,
  playerStressResistance: number
): { exposed: boolean; dialogue: string } {
  // 计算最终穿帮概率
  let finalRate = risk.baseRate;
  finalRate += calculateObservationModifier(npc);
  finalRate -= playerStressResistance / 5;
  
  // 应用顶级猎手规则
  finalRate = applyGoldDiggerExposureRule(npc, finalRate);
  
  // 限制范围
  finalRate = Math.max(5, Math.min(95, finalRate));
  
  // 进行判定
  const exposed = rollProbability(prng, finalRate);
  
  // 获取穿帮台词
  let dialogue = '她似乎察觉到了什么不对...';
  if (exposed && risk.source !== 'lie') {
    const item = configLoader.getItemById(risk.source);
    if (item?.exposureDialogue) {
      dialogue = item.exposureDialogue;
    }
  } else if (exposed) {
    dialogue = '你的表情出卖了你，她看出你在说谎。';
  }
  
  return { exposed, dialogue };
}

/**
 * 计算穿帮后果
 */
export function calculateExposureConsequences(
  risk: ExposureRisk
): { satisfactionPenalty: number; trustPenalty: number } {
  if (risk.source === 'lie') {
    return {
      satisfactionPenalty: -15,
      trustPenalty: -20,
    };
  } else {
    // 道具穿帮更严重
    return {
      satisfactionPenalty: -20,
      trustPenalty: -30,
    };
  }
}

/**
 * 创建历史记录条目
 */
export function createHistoryEntry(
  round: number,
  optionType: DialogueOptionType,
  topicId: string | undefined,
  itemId: string | undefined,
  satisfactionChange: number,
  trustChange: number,
  wasExposed: boolean
): HistoryEntry {
  let action: HistoryEntry['action'];
  
  switch (optionType) {
    case DialogueOptionType.TRUTH:
      action = 'TRUTH';
      break;
    case DialogueOptionType.LIE:
      action = 'LIE';
      break;
    case DialogueOptionType.LIE_ITEM:
      action = 'LIE_ITEM';
      break;
    case DialogueOptionType.DEFLECT:
      action = 'DEFLECT';
      break;
    default:
      action = 'TRUTH';
  }
  
  return {
    round,
    action,
    topicId,
    itemId,
    satisfactionChange,
    trustChange,
    wasExposed,
  };
}

/**
 * 获取选项类型的中文描述
 */
export function getOptionTypeLabel(type: DialogueOptionType): string {
  const labels: Record<DialogueOptionType, string> = {
    [DialogueOptionType.TRUTH]: '诚实',
    [DialogueOptionType.LIE]: '撒谎',
    [DialogueOptionType.LIE_ITEM]: '使用道具',
    [DialogueOptionType.DEFLECT]: '转移话题',
  };
  return labels[type] || '未知';
}

/**
 * 获取选项类型的颜色类名
 */
export function getOptionTypeColor(type: DialogueOptionType): string {
  switch (type) {
    case DialogueOptionType.TRUTH:
      return 'option-truth';
    case DialogueOptionType.LIE:
    case DialogueOptionType.LIE_ITEM:
      return 'option-lie';
    case DialogueOptionType.DEFLECT:
      return 'option-deflect';
    default:
      return '';
  }
}
