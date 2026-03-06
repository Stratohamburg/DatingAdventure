import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  GameState,
  GamePhase,
  DialoguePhase,
  createInitialGameState,
  PlayerArchetype,
  PlayerAttributes,
  ExposureRisk,
  HistoryEntry,
  EndingType,
  GameStats,
} from '../types';

const initialState: GameState = createInitialGameState();

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    // 初始化新游戏
    initGame: (state, action: PayloadAction<{ seed?: number }>) => {
      const newState = createInitialGameState(action.payload.seed);
      return newState;
    },

    // 设置玩家属性
    setPlayerAttributes: (state, action: PayloadAction<PlayerAttributes>) => {
      state.player.attributes = action.payload;
    },

    // 设置玩家原型
    setPlayerArchetype: (state, action: PayloadAction<PlayerArchetype>) => {
      state.player.archetype = action.payload;
    },

    // 设置初始金币
    setPlayerGold: (state, action: PayloadAction<number>) => {
      state.player.gold = action.payload;
    },

    // 修改金币
    modifyGold: (state, action: PayloadAction<number>) => {
      state.player.gold = Math.max(0, state.player.gold + action.payload);
    },

    // 添加道具到背包
    addItemToInventory: (state, action: PayloadAction<string>) => {
      state.player.inventory.push(action.payload);
    },

    // 从背包移除道具
    removeItemFromInventory: (state, action: PayloadAction<string>) => {
      const index = state.player.inventory.indexOf(action.payload);
      if (index > -1) {
        state.player.inventory.splice(index, 1);
      }
    },

    // 标记道具为已使用
    markItemAsUsed: (state, action: PayloadAction<string>) => {
      if (!state.player.usedItems.includes(action.payload)) {
        state.player.usedItems.push(action.payload);
      }
    },

    // 切换游戏阶段
    setGamePhase: (state, action: PayloadAction<GamePhase>) => {
      state.gamePhase = action.payload;
    },

    // 设置当前 NPC，并根据 NPC 的话题数量动态设置最大回合数
    setCurrentNPC: (state, action: PayloadAction<any>) => {
      state.currentDate.npc = action.payload;
      const topicCount = Object.keys(action.payload?.dialogueTree ?? {}).length;
      state.currentDate.maxRounds = topicCount > 0 ? topicCount : 5;
    },

    // 更新满意度（带边界检查）
    modifySatisfaction: (state, action: PayloadAction<number>) => {
      const newValue = state.currentDate.satisfaction + action.payload;
      state.currentDate.satisfaction = Math.max(0, Math.min(100, newValue));
    },

    // 更新信任度（带边界检查）
    modifyTrust: (state, action: PayloadAction<number>) => {
      const newValue = state.currentDate.trust + action.payload;
      state.currentDate.trust = Math.max(0, Math.min(100, newValue));
    },

    // 增加虚荣值
    incrementVanity: (state) => {
      state.currentDate.vanity += 1;
    },

    // 设置对话阶段
    setDialoguePhase: (state, action: PayloadAction<DialoguePhase>) => {
      state.currentDate.dialoguePhase = action.payload;
    },

    // 进入下一回合
    nextRound: (state) => {
      state.currentDate.currentRound += 1;
    },

    // 设置当前话题
    setCurrentTopic: (state, action: PayloadAction<string | null>) => {
      state.currentDate.currentTopicId = action.payload;
      if (action.payload) {
        state.currentDate.discussedTopics.push(action.payload);
      }
    },

    // 添加穿帮风险
    addExposureRisk: (state, action: PayloadAction<ExposureRisk>) => {
      state.currentDate.exposureRisks.push(action.payload);
    },

    // 更新穿帮风险判定结果
    updateExposureRisk: (
      state,
      action: PayloadAction<{ index: number; exposed: boolean }>
    ) => {
      const risk = state.currentDate.exposureRisks[action.payload.index];
      if (risk) {
        risk.checked = true;
        risk.exposed = action.payload.exposed;
      }
    },

    // 添加历史记录
    addHistoryEntry: (state, action: PayloadAction<HistoryEntry>) => {
      state.history.entries.push(action.payload);
    },

    // 设置坦白状态
    setConfessed: (state) => {
      state.currentDate.hasConfessed = true;
    },

    // 标记事件为已触发
    markEventTriggered: (state, action: PayloadAction<string>) => {
      state.currentDate.triggeredEvents.push(action.payload);
    },

    // 更新随机数状态
    updateRngState: (state, action: PayloadAction<number>) => {
      state.rngState = action.payload;
    },

    // 设置结局
    setEnding: (
      state,
      action: PayloadAction<{ type: EndingType; stats: GameStats }>
    ) => {
      state.endingType = action.payload.type;
      state.stats = action.payload.stats;
      state.gamePhase = GamePhase.RESULT;
    },
  },
});

export const {
  initGame,
  setPlayerAttributes,
  setPlayerArchetype,
  setPlayerGold,
  modifyGold,
  addItemToInventory,
  removeItemFromInventory,
  markItemAsUsed,
  setGamePhase,
  setCurrentNPC,
  modifySatisfaction,
  modifyTrust,
  incrementVanity,
  setDialoguePhase,
  nextRound,
  setCurrentTopic,
  addExposureRisk,
  updateExposureRisk,
  addHistoryEntry,
  setConfessed,
  markEventTriggered,
  updateRngState,
  setEnding,
} = gameSlice.actions;

export default gameSlice.reducer;
