import { useAppDispatch, useAppSelector } from '../store/hooks';
import { initGame } from '../store/gameSlice';
import { selectGame } from '../store';
import { configLoader } from '../utils/configLoader';
import { getEndingData, calculateEndingScore, getEndingStars } from '../systems/endingSystem';
import './ResultScreen.css';

function ResultScreen() {
  const dispatch = useAppDispatch();
  const game = useAppSelector(selectGame);
  
  const ending = game.endingType ? getEndingData(game.endingType) : configLoader.getEndings()[0];
  const stats = game.stats;
  const score = stats && game.endingType ? calculateEndingScore(stats, game.endingType) : 0;
  const stars = getEndingStars(score);

  const handlePlayAgain = () => {
    dispatch(initGame({}));
  };

  const handleBackToMenu = () => {
    dispatch(initGame({}));
  };

  return (
    <div className="result-screen">
      <div className="result-content">
        <div className="ending-header">
          <div className="stars">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className={i <= stars ? 'star filled' : 'star'}>★</span>
            ))}
          </div>
          <h1 className="ending-title">{ending?.name || '游戏结束'}</h1>
          {ending?.isHidden && <span className="hidden-badge">🏆 隐藏结局</span>}
        </div>
        
        <div className="ending-description card">
          <p>{ending?.description}</p>
        </div>

        <div className="ending-narrative card">
          <h3>📖 故事</h3>
          <p>{ending?.narrative}</p>
        </div>

        {ending?.tags && (
          <div className="ending-tags">
            {ending.tags.map((tag, index) => (
              <div key={index} className="ending-tag">
                <span className="tag-label">{tag.label}</span>
                <span className="tag-desc">{tag.description}</span>
              </div>
            ))}
          </div>
        )}

        {stats && (
          <div className="game-stats card">
            <h3>📊 游戏统计</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">总回合数</span>
                <span className="stat-value">{stats.totalRounds}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">诚实率</span>
                <span className="stat-value">{stats.honestyRate}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">诚实回答</span>
                <span className="stat-value truth">{stats.truthCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">撒谎次数</span>
                <span className="stat-value lie">{stats.lieCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">转移话题</span>
                <span className="stat-value">{stats.deflectCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">使用假道具</span>
                <span className="stat-value">{stats.fakeItemUsedCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">穿帮次数</span>
                <span className="stat-value danger">{stats.exposureCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">虚荣值</span>
                <span className="stat-value">{stats.vanityValue}</span>
              </div>
              <div className="stat-item wide">
                <span className="stat-label">最终满意度</span>
                <div className="progress-bar">
                  <div 
                    className="progress-bar-fill satisfaction" 
                    style={{ width: `${stats.finalSatisfaction}%` }}
                  ></div>
                </div>
                <span className="stat-value">{stats.finalSatisfaction}%</span>
              </div>
              <div className="stat-item wide">
                <span className="stat-label">最终信任度</span>
                <div className="progress-bar">
                  <div 
                    className="progress-bar-fill trust" 
                    style={{ width: `${stats.finalTrust}%` }}
                  ></div>
                </div>
                <span className="stat-value">{stats.finalTrust}%</span>
              </div>
            </div>
            <div className="final-score">
              <span>最终得分</span>
              <span className="score-value">{score}</span>
            </div>
          </div>
        )}

        <div className="result-actions">
          <button className="btn btn-primary" onClick={handlePlayAgain}>
            🔄 再来一局
          </button>
          <button className="btn btn-secondary" onClick={handleBackToMenu}>
            🏠 返回主菜单
          </button>
        </div>

        <div className="seed-info">
          <span>游戏种子: {game.randomSeed}</span>
        </div>
      </div>
    </div>
  );
}

export default ResultScreen;