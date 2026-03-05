import { useState } from 'react';
import { useAppDispatch } from '../store/hooks';
import { initGame, setGamePhase, setPlayerAttributes, setPlayerArchetype, setPlayerGold } from '../store/gameSlice';
import { PlayerArchetype, GamePhase } from '../types';
import { createPRNG } from '../utils/prng';
import { generatePlayerState, getArchetypeName, getArchetypeDescription } from '../systems/characterGeneration';
import './MainMenu.css';

function MainMenu() {
  const dispatch = useAppDispatch();
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);
  const [customSeed, setCustomSeed] = useState('');

  const handleStartGame = () => {
    setShowCharacterSelect(true);
  };

  const handleSelectArchetype = (archetype: PlayerArchetype) => {
    // 生成种子
    const seed = customSeed ? parseInt(customSeed, 10) : Math.floor(Math.random() * 2147483647);
    
    // 初始化游戏
    dispatch(initGame({ seed }));
    
    // 生成玩家状态
    const prng = createPRNG(seed);
    const playerState = generatePlayerState(prng, archetype);
    
    // 设置玩家数据
    dispatch(setPlayerAttributes(playerState.attributes));
    dispatch(setPlayerArchetype(archetype));
    dispatch(setPlayerGold(playerState.gold));
    
    // 进入准备阶段
    dispatch(setGamePhase(GamePhase.PREP));
  };

  const archetypes = [
    PlayerArchetype.RANDOM,
    PlayerArchetype.RICH_KID,
    PlayerArchetype.PHOENIX_MAN,
    PlayerArchetype.AVERAGE_JOE,
    PlayerArchetype.HARD_MODE,
  ];

  if (showCharacterSelect) {
    return (
      <div className="main-menu character-select">
        <h2>选择你的出身</h2>
        <p className="subtitle">出身不决定终点，但决定了你起跑时的姿势</p>
        
        <div className="archetype-grid">
          {archetypes.map((archetype) => (
            <button
              key={archetype}
              className="archetype-card card"
              onClick={() => handleSelectArchetype(archetype)}
            >
              <h3>{getArchetypeName(archetype)}</h3>
              <p>{getArchetypeDescription(archetype)}</p>
            </button>
          ))}
        </div>

        <div className="seed-input">
          <label>自定义种子 (可选):</label>
          <input
            type="text"
            value={customSeed}
            onChange={(e) => setCustomSeed(e.target.value)}
            placeholder="留空则随机生成"
          />
        </div>

        <button className="btn btn-secondary" onClick={() => setShowCharacterSelect(false)}>
          返回
        </button>
      </div>
    );
  }

  return (
    <div className="main-menu">
      <div className="title-section">
        <h1 className="game-title">相亲模拟器</h1>
        <h2 className="game-subtitle">面子与里子</h2>
        <p className="slogan">"真诚是必杀技，但如果你没有，那就靠演技。"</p>
      </div>

      <div className="menu-buttons">
        <button className="btn btn-primary pulse" onClick={handleStartGame}>
          开始游戏
        </button>
        <button className="btn btn-secondary" disabled>
          继续游戏
        </button>
        <button className="btn btn-secondary" disabled>
          游戏设置
        </button>
      </div>

      <div className="footer">
        <p>The Blind Date: Face & Fate</p>
        <p className="version">v1.0.0</p>
      </div>
    </div>
  );
}

export default MainMenu;
