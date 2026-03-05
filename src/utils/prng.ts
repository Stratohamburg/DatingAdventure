/**
 * 伪随机数生成器 (PRNG)
 * 使用 Mulberry32 算法，确保可复现性
 * 
 * 特点：
 * - 基于种子的确定性随机数
 * - 相同种子产生相同序列
 * - 适合 Roguelike 游戏的随机需求
 */

/**
 * Mulberry32 PRNG 状态
 */
export interface PRNGState {
  state: number;
}

/**
 * 创建新的 PRNG 实例
 * @param seed 随机种子
 */
export function createPRNG(seed: number): PRNGState {
  return { state: seed >>> 0 };
}

/**
 * 生成下一个随机数 (0-1 范围)
 * @param prng PRNG 状态（会被修改）
 * @returns 0-1 之间的浮点数
 */
export function nextRandom(prng: PRNGState): number {
  let t = (prng.state += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  prng.state = t >>> 0;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * 生成指定范围内的随机整数 (包含 min 和 max)
 * @param prng PRNG 状态
 * @param min 最小值
 * @param max 最大值
 */
export function randomInt(prng: PRNGState, min: number, max: number): number {
  return Math.floor(nextRandom(prng) * (max - min + 1)) + min;
}

/**
 * 生成 0-100 范围内的随机整数（用于属性值）
 * @param prng PRNG 状态
 */
export function randomAttribute(prng: PRNGState): number {
  return randomInt(prng, 0, 100);
}

/**
 * 生成指定范围内的随机整数
 * @param prng PRNG 状态
 * @param min 最小值
 * @param max 最大值
 */
export function randomRange(prng: PRNGState, min: number, max: number): number {
  return randomInt(prng, min, max);
}

/**
 * 进行概率判定（骰子投掷）
 * @param prng PRNG 状态
 * @param probability 成功概率 (0-100)
 * @returns 是否成功
 */
export function rollProbability(prng: PRNGState, probability: number): boolean {
  // 限制概率范围在 5%-95%
  const clampedProb = Math.max(5, Math.min(95, probability));
  const roll = randomInt(prng, 1, 100);
  return roll <= clampedProb;
}

/**
 * 从数组中随机选择一个元素
 * @param prng PRNG 状态
 * @param array 待选择的数组
 */
export function randomChoice<T>(prng: PRNGState, array: T[]): T {
  if (array.length === 0) {
    throw new Error('Cannot choose from empty array');
  }
  const index = randomInt(prng, 0, array.length - 1);
  return array[index];
}

/**
 * 根据权重随机选择一个元素
 * @param prng PRNG 状态
 * @param items 元素列表
 * @param weights 对应的权重列表
 */
export function weightedRandomChoice<T>(
  prng: PRNGState,
  items: T[],
  weights: number[]
): T {
  if (items.length !== weights.length) {
    throw new Error('Items and weights must have same length');
  }
  if (items.length === 0) {
    throw new Error('Cannot choose from empty array');
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = nextRandom(prng) * totalWeight;

  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }

  // 兜底返回最后一个
  return items[items.length - 1];
}

/**
 * Fisher-Yates 洗牌算法
 * @param prng PRNG 状态
 * @param array 待洗牌的数组（会被复制）
 */
export function shuffle<T>(prng: PRNGState, array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(prng, 0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 获取当前 PRNG 状态值（用于存档）
 */
export function getPRNGState(prng: PRNGState): number {
  return prng.state;
}

/**
 * 从状态值恢复 PRNG（用于读档）
 */
export function restorePRNG(state: number): PRNGState {
  return { state: state >>> 0 };
}
