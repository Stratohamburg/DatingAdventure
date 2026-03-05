import { EndingType, GameStats, Ending } from '../types/ending';
import { GameHistory, HistoryEntry } from '../types/game';
import { ItemCategory } from '../types/item';
import { configLoader } from '../utils/configLoader';

/**
 * 结局系统
 * 处理结局判定和游戏统计
 */

/**
 * 计算游戏统计数据
 */
export function calculateGameStats(
  history: GameHistory,
  finalSatisfaction: number,
  finalTrust: number,
  vanity: number,
  hasConfessed: boolean,
  usedItems: string[]
): GameStats {
  const entries = history.entries;
  
  let truthCount = 0;
  let lieCount = 0;
  let deflectCount = 0;
  let itemUsedCount = 0;
  let fakeItemUsedCount = 0;
  let exposureCount = 0;
  
  for (const entry of entries) {
    switch (entry.action) {
      case 'TRUTH':
        truthCount++;
        break;
      case 'LIE':
        lieCount++;
        break;
      case 'LIE_ITEM':
        lieCount++;
        itemUsedCount++;
        if (entry.itemId) {
          const item = configLoader.getItemById(entry.itemId);
          if (item?.category === ItemCategory.FAKE_PACKAGE) {
            fakeItemUsedCount++;
          }
        }
        break;
      case 'DEFLECT':
        deflectCount++;
        break;
    }
    
    if (entry.wasExposed) {
      exposureCount++;
    }
  }
  
  const totalResponses = truthCount + lieCount + deflectCount;
  const honestyRate = totalResponses > 0 
    ? Math.round((truthCount / totalResponses) * 100) 
    : 100;
  
  return {
    totalRounds: entries.length,
    truthCount,
    lieCount,
    deflectCount,
    itemUsedCount,
    fakeItemUsedCount,
    exposureCount,
    finalSatisfaction,
    finalTrust,
    vanityValue: vanity,
    hasConfessed,
    honestyRate,
  };
}

/**
 * 判定结局类型
 */
export function determineEndingType(
  isVictory: boolean,
  stats: GameStats,
  trustZero: boolean
): EndingType {
  // 结局 D: 社死现场 - 信任度归零被揭穿
  if (trustZero && stats.exposureCount > 0) {
    return EndingType.SOCIAL_DEATH;
  }
  
  // 结局 C: 意外的真爱 - 使用假货后坦白获得原谅
  if (stats.hasConfessed && stats.fakeItemUsedCount > 0 && isVictory) {
    return EndingType.TRUE_LOVE;
  }
  
  // 结局 B: 老实人的悲歌 - 全程诚实但失败
  if (!isVictory && stats.lieCount === 0 && stats.fakeItemUsedCount === 0) {
    return EndingType.HONEST_MANS_LAMENT;
  }
  
  // 结局 A: 虚假的繁荣 - 靠假货成功
  if (isVictory && stats.fakeItemUsedCount > 0 && stats.exposureCount === 0) {
    return EndingType.FALSE_PROSPERITY;
  }
  
  // 普通成功
  if (isVictory) {
    return EndingType.NORMAL_SUCCESS;
  }
  
  // 普通失败
  return EndingType.NORMAL_FAILURE;
}

/**
 * 获取结局数据
 */
export function getEndingData(type: EndingType): Ending | undefined {
  return configLoader.getEndingByType(type);
}

/**
 * 获取结局评分
 */
export function calculateEndingScore(stats: GameStats, endingType: EndingType): number {
  let score = 0;
  
  // 基础分数基于诚实率
  score += stats.honestyRate * 0.5;
  
  // 成功加分
  if (stats.finalSatisfaction >= 80) {
    score += 30;
  }
  
  // 信任度加分
  score += stats.finalTrust * 0.2;
  
  // 特殊结局加分
  switch (endingType) {
    case EndingType.TRUE_LOVE:
      score += 50; // 隐藏结局最高分
      break;
    case EndingType.NORMAL_SUCCESS:
      score += 20;
      break;
    case EndingType.FALSE_PROSPERITY:
      score += 10; // 虽然成功但扣分
      break;
    case EndingType.HONEST_MANS_LAMENT:
      score += 15; // 诚实有价值
      break;
    case EndingType.SOCIAL_DEATH:
      score = Math.max(0, score - 30);
      break;
  }
  
  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * 获取结局的星级评价 (1-5星)
 */
export function getEndingStars(score: number): number {
  if (score >= 90) return 5;
  if (score >= 70) return 4;
  if (score >= 50) return 3;
  if (score >= 30) return 2;
  return 1;
}

/**
 * 获取结局类型的中文名称
 */
export function getEndingTypeName(type: EndingType): string {
  const names: Record<EndingType, string> = {
    [EndingType.FALSE_PROSPERITY]: '虚假的繁荣',
    [EndingType.HONEST_MANS_LAMENT]: '老实人的悲歌',
    [EndingType.TRUE_LOVE]: '意外的真爱',
    [EndingType.SOCIAL_DEATH]: '社死现场',
    [EndingType.NORMAL_SUCCESS]: '门当户对',
    [EndingType.NORMAL_FAILURE]: '无疾而终',
  };
  return names[type] || '未知结局';
}

/**
 * 检查是否解锁了新结局
 */
export function checkNewEndingUnlocked(
  endingType: EndingType,
  unlockedEndings: EndingType[]
): boolean {
  return !unlockedEndings.includes(endingType);
}
