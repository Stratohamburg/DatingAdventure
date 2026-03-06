import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { selectPlayer, selectCurrentDate, selectGame } from '../store';
import {
  modifySatisfaction,
  modifyTrust,
  incrementVanity,
  setDialoguePhase,
  nextRound,
  setCurrentTopic,
  addExposureRisk,
  addHistoryEntry,
  markItemAsUsed,
  modifyGold,
  setEnding,
} from '../store/gameSlice';
import { DialoguePhase, DialogueOption, DialogueOptionType } from '../types';
import { ItemCategory } from '../types/item';
import { configLoader } from '../utils/configLoader';
import { createPRNG } from '../utils/prng';
import {
  selectNextTopic,
  filterAvailableOptions,
  calculateInitialSatisfaction,
  getNPCArchetypeName,
} from '../systems/npcSystem';
import {
  calculateOptionEffect,
  performExposureCheck,
  calculateExposureConsequences,
  createHistoryEntry,
  getOptionTypeLabel,
  getOptionTypeColor,
  checkGameEnd,
  getDeflectCost,
} from '../systems/dialogueCombat';
import {
  calculateGameStats,
  determineEndingType,
} from '../systems/endingSystem';
import './DateScreen.css';

// 满意度/信任度边界 clamp，与 Redux reducer 保持一致
function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function DateScreen() {
  const dispatch = useAppDispatch();
  const player = useAppSelector(selectPlayer);
  const currentDate = useAppSelector(selectCurrentDate);
  const game = useAppSelector(selectGame);

  const npc = currentDate.npc;
  const [currentTopic, setCurrentTopicState] = useState<any>(null);
  const [availableOptions, setAvailableOptions] = useState<DialogueOption[]>([]);
  const [message, setMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [exposureMessage, setExposureMessage] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化相亲
  useEffect(() => {
    if (npc && !isInitialized) {
      // 计算初始满意度
      const appearanceBonus = player.inventory.reduce((sum, itemId) => {
        const item = configLoader.getItemById(itemId);
        return sum + (item?.effect.appearanceBonus || 0);
      }, 0);

      const initialSatisfaction = calculateInitialSatisfaction(
        npc,
        player.attributes,
        appearanceBonus
      );

      dispatch(modifySatisfaction(initialSatisfaction - 50)); // 调整到初始值
      dispatch(setDialoguePhase(DialoguePhase.OPENING));
      setMessage(`你与 ${npc.name} 的相亲开始了...`);
      setIsInitialized(true);
    }
  }, [npc, isInitialized, dispatch, player.inventory, player.attributes]);

  // 进入战斗阶段后选择话题
  useEffect(() => {
    if (!npc || currentDate.dialoguePhase !== DialoguePhase.COMBAT || currentTopic) return;
    // isProcessing 为 true 时说明还在处理上一轮，等待它主动 setIsProcessing(false)
    if (isProcessing) return;

    const prng = createPRNG(game.randomSeed + currentDate.currentRound * 100);
    const topic = selectNextTopic(prng, npc, currentDate.discussedTopics);

    if (topic) {
      setCurrentTopicState(topic);
      dispatch(setCurrentTopic(topic.topicId));
      const options = filterAvailableOptions(topic, player.inventory, player.usedItems);

      // 最后一轮且用过假道具，允许坦白
      if (currentDate.currentRound === currentDate.maxRounds) {
        const hasUsedFakeItem = player.usedItems.some(itemId => {
          const item = configLoader.getItemById(itemId);
          return item?.category === ItemCategory.FAKE_PACKAGE;
        });
        if (hasUsedFakeItem) {
          options.push({
            type: DialogueOptionType.CONFESS,
            text: '其实...我之前说的一些话，用的一些东西，都是假的。对不起。',
            effect: { satisfaction: -20, trust: 30 },
            riskCheck: false,
          });
        }
      }

      setAvailableOptions(options);
      setMessage(`她问道："${topic.question}"`);
    } else {
      // 话题已全部讨论完，进入结算
      dispatch(setDialoguePhase(DialoguePhase.SETTLEMENT));
    }
  }, [
    npc,
    currentDate.dialoguePhase,
    currentDate.currentRound,
    currentDate.discussedTopics,
    currentDate.maxRounds,
    currentTopic,
    isProcessing,
    game.randomSeed,
    player.inventory,
    player.usedItems,
    dispatch,
  ]);

  const handleStartCombat = () => {
    dispatch(setDialoguePhase(DialoguePhase.COMBAT));
    dispatch(nextRound());
  };

  const handleSelectOption = async (option: DialogueOption) => {
    if (isProcessing || !npc) return;
    setIsProcessing(true);
    setExposureMessage(null);

    // 转移话题需要消耗金币
    if (option.type === DialogueOptionType.DEFLECT) {
      const cost = getDeflectCost();
      if (player.gold < cost) {
        setMessage('金币不足，无法转移话题！');
        setIsProcessing(false);
        return;
      }
      dispatch(modifyGold(-cost));
    }

    // 获取道具信息
    const item = option.itemRequired
      ? configLoader.getItemById(option.itemRequired)
      : undefined;

    // 计算效果
    const effect = calculateOptionEffect(
      option,
      npc,
      player.attributes.stressResistance,
      currentDate.currentRound,
      item
    );

    // 应用效果
    dispatch(modifySatisfaction(effect.satisfactionChange));
    dispatch(modifyTrust(effect.trustChange));

    if (effect.vanityIncrease > 0) {
      dispatch(incrementVanity());
    }

    if (option.type === DialogueOptionType.CONFESS) {
      dispatch({ type: 'game/setConfessed' });
    }

    if (effect.itemUsed) {
      dispatch(markItemAsUsed(effect.itemUsed));
    }

    // 添加穿帮风险
    if (effect.shouldAddExposureRisk && effect.exposureRisk) {
      dispatch(addExposureRisk(effect.exposureRisk));
    }

    // 显示玩家回答
    setMessage(`你说："${option.text}"`);

    // 等待一下再进行穿帮判定
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 穿帮判定
    let wasExposed = false;
    let exposureSatisfactionPenalty = 0;
    let exposureTrustPenalty = 0;
    if (effect.shouldAddExposureRisk && effect.exposureRisk) {
      const prng = createPRNG(game.randomSeed + currentDate.currentRound * 1000);
      const result = performExposureCheck(
        prng,
        effect.exposureRisk,
        npc,
        player.attributes.stressResistance
      );

      if (result.exposed) {
        wasExposed = true;
        const consequences = calculateExposureConsequences(effect.exposureRisk);
        exposureSatisfactionPenalty = consequences.satisfactionPenalty;
        exposureTrustPenalty = consequences.trustPenalty;
        dispatch(modifySatisfaction(exposureSatisfactionPenalty));
        dispatch(modifyTrust(exposureTrustPenalty));
        setExposureMessage(result.dialogue);
      }
    }

    // 记录历史
    const historyEntry = createHistoryEntry(
      currentDate.currentRound,
      option.type,
      currentTopic?.topicId,
      effect.itemUsed,
      effect.satisfactionChange,
      effect.trustChange,
      wasExposed
    );
    dispatch(addHistoryEntry(historyEntry));

    // 使用 clamp 计算结算后的真实数值（与 Redux reducer 保持一致）
    const newSatisfaction = clamp(
      currentDate.satisfaction + effect.satisfactionChange + exposureSatisfactionPenalty
    );
    const newTrust = clamp(
      currentDate.trust + effect.trustChange + exposureTrustPenalty
    );

    // 构建包含本轮记录的历史
    const updatedHistory = {
      ...game.history,
      entries: [...game.history.entries, historyEntry],
    };

    // 当前 vanity/hasConfessed 状态（dispatch 后 state 异步更新，本地手动跟踪）
    const currentVanity = currentDate.vanity + (effect.vanityIncrease > 0 ? 1 : 0);
    const currentHasConfessed = currentDate.hasConfessed || option.type === DialogueOptionType.CONFESS;

    // 检查游戏是否结束（满意度/信任度归零，或到达最后一轮）
    const gameEndCheck = checkGameEnd(
      newSatisfaction,
      newTrust,
      currentDate.currentRound,
      currentDate.maxRounds,
      currentDate.dialoguePhase
    );

    if (gameEndCheck.isEnded) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      handleGameEnd(
        gameEndCheck.isVictory!,
        newTrust <= 0,
        newSatisfaction,
        newTrust,
        updatedHistory,
        currentVanity,
        currentHasConfessed,
        player.usedItems
      );
      return;
    }

    // 进入下一回合
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const nextRoundNumber = currentDate.currentRound + 1;

    // 检查是否达到最大回合
    if (nextRoundNumber >= currentDate.maxRounds) {
      dispatch(nextRound());
      dispatch(setDialoguePhase(DialoguePhase.SETTLEMENT));
      handleGameEnd(
        newSatisfaction >= 80,
        false,
        newSatisfaction,
        newTrust,
        updatedHistory,
        currentVanity,
        currentHasConfessed,
        player.usedItems
      );
      return;
    }

    dispatch(nextRound());
    setCurrentTopicState(null);
    setIsProcessing(false);
  };

  const handleGameEnd = (
    isVictory: boolean,
    trustZero: boolean,
    finalSatisfaction: number,
    finalTrust: number,
    history: any,
    vanity: number,
    hasConfessed: boolean,
    usedItems: string[]
  ) => {
    const stats = calculateGameStats(
      history,
      finalSatisfaction,
      finalTrust,
      vanity,
      hasConfessed,
      usedItems
    );

    const endingType = determineEndingType(isVictory, stats, trustZero);
    dispatch(setEnding({ type: endingType, stats }));
  };

  if (!npc) {
    return (
      <div className="date-screen">
        <div className="loading">正在匹配相亲对象...</div>
      </div>
    );
  }

  return (
    <div className="date-screen">
      <div className="date-header">
        <div className="round-info">
          回合 {currentDate.currentRound} / {currentDate.maxRounds}
        </div>
        <h1>相亲进行中</h1>
      </div>

      <div className="date-main">
        {/* 左侧：NPC信息 */}
        <div className="npc-panel card">
          <div className="npc-avatar">💁‍♀️</div>
          <h2>{npc.name}</h2>
          <span className="npc-type">{getNPCArchetypeName(npc.archetype)}</span>
          <p className="npc-desc">{npc.description}</p>
          
          <div className="npc-stats">
            <div className="stat">
              <span>观察力</span>
              <div className="stat-bar">
                <div 
                  className="stat-fill"
                  style={{ width: `${npc.stats.observation}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* 中间：对话区 */}
        <div className="dialogue-panel card">
          <div className="status-bars">
            <div className="status-bar">
              <span>💕 满意度</span>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill satisfaction"
                  style={{ width: `${currentDate.satisfaction}%` }}
                ></div>
              </div>
              <span>{currentDate.satisfaction}%</span>
            </div>
            <div className="status-bar">
              <span>🤝 信任度</span>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill trust"
                  style={{ width: `${currentDate.trust}%` }}
                ></div>
              </div>
              <span>{currentDate.trust}%</span>
            </div>
          </div>

          <div className="dialogue-content">
            <div className="message-box">
              <p className="message">{message}</p>
              {exposureMessage && (
                <p className="exposure-message shake">⚠️ {exposureMessage}</p>
              )}
            </div>

            {currentDate.dialoguePhase === DialoguePhase.OPENING && (
              <div className="opening-section">
                <button
                  className="btn btn-primary"
                  onClick={handleStartCombat}
                >
                  开始对话
                </button>
              </div>
            )}

            {currentDate.dialoguePhase === DialoguePhase.COMBAT && currentTopic && (
              <div className="options-section">
                <h4>选择你的回答：</h4>
                <div className="options-list">
                  {availableOptions.map((option, index) => (
                    <button
                      key={index}
                      className={`option-btn ${getOptionTypeColor(option.type)}`}
                      onClick={() => handleSelectOption(option)}
                      disabled={isProcessing}
                    >
                      <span className="option-type">[{getOptionTypeLabel(option.type)}]</span>
                      <span className="option-text">{option.text}</span>
                      {option.type === DialogueOptionType.DEFLECT && (
                        <span className="option-cost">💵 -{getDeflectCost()}</span>
                      )}
                      {option.riskCheck && (
                        <span className="option-risk">⚠️ 有风险</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右侧：玩家信息 */}
        <div className="player-panel card">
          <h3>你的状态</h3>
          <div className="gold-display">💵 {player.gold}</div>
          <div className="vanity-display">
            <span>虚荣值:</span>
            <span>{currentDate.vanity}</span>
          </div>
          <div className="inventory-mini">
            <h4>背包</h4>
            {player.inventory.length === 0 ? (
              <p className="empty">空</p>
            ) : (
              <ul>
                {player.inventory.map((itemId) => {
                  const item = configLoader.getItemById(itemId);
                  const used = player.usedItems.includes(itemId);
                  return (
                    <li key={itemId} className={used ? 'used' : ''}>
                      {item?.name} {used && '(已用)'}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DateScreen;