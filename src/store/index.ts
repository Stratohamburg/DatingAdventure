import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './gameSlice';

export const store = configureStore({
  reducer: {
    game: gameReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 忽略 NPC 对象中的复杂结构
        ignoredPaths: ['game.currentDate.npc'],
      },
    }),
});

// 类型定义
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 导出选择器
export const selectGame = (state: RootState) => state.game;
export const selectPlayer = (state: RootState) => state.game.player;
export const selectCurrentDate = (state: RootState) => state.game.currentDate;
export const selectGamePhase = (state: RootState) => state.game.gamePhase;
export const selectSatisfaction = (state: RootState) =>
  state.game.currentDate.satisfaction;
export const selectTrust = (state: RootState) => state.game.currentDate.trust;
