import { useState, useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { selectPlayer, selectCurrentDate, selectGame } from '../store';
import {
  setGamePhase,
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
import { GamePhase, DialoguePhase, NPC, DialogueOption, DialogueOptionType } from '../types';
import { configLoader } from '../utils/configLoader';
import { createPRNG } from '../utils/prng';
import {
  selectNextTopic,
  filterAvailableOptions,
  calculateInitialSatisfaction,
  selectRandomNPC,
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

function DateScreen() {
  const dispatch = useAppDispatch();
  const player = useAppSelector(selectPlayer);
  const currentDate = useAppSelector(selectCurrentDate);
  const game = useAppSelector(selectGame);

  const [npc, setNpc] = useState<NPC | null>(null);
  const [currentTopic, setCurrentTopicState] = useState<any>(null);
  const [availableOptions, setAvailableOptions] = useState<DialogueOption[]>([]);
  const [message, setMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [exposureMessage, setExposureMessage] = useState<string | null>(null);

  // 初始化相亲
  useEffect(() => {
    if (!npc) {
      const prng = createPRNG(game.randomSeed + 1000);
      const selectedNpc = selectRandomNPC(prng);
      setNpc(selectedNpc);

      // 计算初始满意度
      const appearanceBonus = player.inventory.reduce((sum, itemId) => {
        const item = configLoader.getItemById(itemId);
        return sum + (item?.effect.appearanceBonus || 0);
      }, 0);

      const initialSatisfaction = calculateInitialSatisfaction(
        selectedNpc,
        player.attributes,
        appearanceBonus
      );

      dispatch(modifySatisfaction(initialSatisfaction - 50)); // 调整到初始值
      dispatch(setDialoguePhase(DialoguePhase.OPENING));
      setMessage(`你与 ${selectedNpc.name} 的相亲开始了...`);
    }
  }, []);

  // 进入战斗阶段后选择话题
  useEffect(() => {
    if (npc && currentDate.dialoguePhase === DialoguePhase.COMBAT && !currentTopic) {
      selectNewTopic();
    }
  }, [npc, currentDate.dialoguePhase, currentTopic]);

  const selectNewTopic = useCallback(() => {
    if (!npc) return;

    const prng = createPRNG(game.randomSeed + currentDate.currentRound * 100);
    const topic = selectNextTopic(prng, npc, currentDate.discussedTopics);

    if (topic) {
      setCurrentTopicState(topic);
      dispatch(setCurrentTopic(topic.topicId));
      const options = filterAvailableOptions(topic, player.inventory, player.usedItems);
      setAvailableOptions(options);
      setMessage(`她问道："${topic.question}"`);
    } else {
      // 没有更多话题，进入结算
      dispatch(setDialoguePhase(DialoguePhase.SETTLEMENT));
    }
  }, [npc, game.randomSeed, currentDate.currentRound, currentDate.discussedTopics, player.inventory, player.usedItems]);

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
        dispatch(modifySatisfaction(consequences.satisfactionPenalty));
        dispatch(modifyTrust(consequences.trustPenalty));
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

    // 检查游戏是否结束
    const newSatisfaction = currentDate.satisfaction + effect.satisfactionChange +
      (wasExposed ? calculateExposureConsequences(effect.exposureRisk!).satisfactionPenalty : 0);
    const newTrust = currentDate.trust + effect.trustChange +
      (wasExposed ? calculateExposureConsequences(effect.exposureRisk!).trustPenalty : 0);

    const gameEndCheck = checkGameEnd(
      newSatisfaction,
      newTrust,
      currentDate.currentRound,
      currentDate.maxRounds,
      currentDate.dialoguePhase
    );

    if (gameEndCheck.isEnded) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      handleGameEnd(gameEndCheck.isVictory!, newTrust <= 0);
      return;
    }

    // 进入下一回合
    await new Promise((resolve) => setTimeout(resolve, 1500));
    dispatch(nextRound());
    setCurrentTopicState(null);
    
    // 检查是否达到最大回合
    if (currentDate.currentRound + 1 >= currentDate.maxRounds) {
      dispatch(setDialoguePhase(DialoguePhase.SETTLEMENT));
      handleGameEnd(newSatisfaction >= 80, false);
    }

    setIsProcessing(false);
  };

  const handleGameEnd = (isVictory: boolean, trustZero: boolean) => {
    const stats = calculateGameStats(
      game.history,
      currentDate.satisfaction,
      currentDate.trust,
      currentDate.vanity,
      currentDate.hasConfessed,
      player.usedItems
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
          <div className="npc-avatar">�</div>
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