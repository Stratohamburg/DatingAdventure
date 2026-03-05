import { useAppSelector, useAppDispatch } from '../store/hooks';
import { selectPlayer, selectGame } from '../store';
import { modifyGold, addItemToInventory, setGamePhase } from '../store/gameSlice';
import { GamePhase, ItemCategory } from '../types';
import { configLoader } from '../utils/configLoader';
import { getStressResistanceDescription } from '../types/player';
import { getIncomeTierDescription } from '../systems/characterGeneration';
import './ShopScreen.css';

function ShopScreen() {
  const dispatch = useAppDispatch();
  const player = useAppSelector(selectPlayer);
  const game = useAppSelector(selectGame);
  const items = configLoader.getItems();

  const handleBuyItem = (itemId: string, price: number) => {
    if (player.gold >= price && !player.inventory.includes(itemId)) {
      dispatch(modifyGold(-price));
      dispatch(addItemToInventory(itemId));
    }
  };

  const handleStartDate = () => {
    dispatch(setGamePhase(GamePhase.DATE));
  };

  const getCategoryTag = (category: ItemCategory) => {
    switch (category) {
      case ItemCategory.REAL_ASSET:
        return <span className="tag tag-real">真实资产</span>;
      case ItemCategory.FAKE_PACKAGE:
        return <span className="tag tag-fake">虚假包装</span>;
      case ItemCategory.SPECIAL:
        return <span className="tag tag-special">特殊道具</span>;
      default:
        return null;
    }
  };

  return (
    <div className="shop-screen">
      <div className="shop-header">
        <h1>准备阶段 - 商店</h1>
        <p className="subtitle">购买道具武装自己，真的假的，你自己选</p>
      </div>

      <div className="shop-content">
        {/* 玩家状态面板 */}
        <div className="player-panel card">
          <h3>你的属性</h3>
          <div className="attributes">
            <div className="attr-row">
              <span>💰 财富值:</span>
              <span>{player.attributes.wealth}</span>
            </div>
            <div className="attr-row">
              <span>✨ 颜值:</span>
              <span>{player.attributes.appearance}</span>
            </div>
            <div className="attr-row">
              <span>👨‍👩‍👧 家庭:</span>
              <span>{player.attributes.family}</span>
            </div>
            <div className="attr-row">
              <span>💼 工作:</span>
              <span>{player.attributes.career} ({getIncomeTierDescription(player.attributes.career)})</span>
            </div>
            <div className="attr-row">
              <span>🧠 心理:</span>
              <span>{getStressResistanceDescription(player.attributes.stressResistance)}</span>
            </div>
          </div>
          <div className="gold-section">
            <span className="gold-display">💵 {player.gold} 金币</span>
          </div>
          <div className="inventory-section">
            <h4>背包 ({player.inventory.length})</h4>
            <div className="inventory-items">
              {player.inventory.length === 0 ? (
                <p className="empty">空空如也</p>
              ) : (
                player.inventory.map((itemId) => {
                  const item = configLoader.getItemById(itemId);
                  return item ? <span key={itemId} className="inv-item">{item.name}</span> : null;
                })
              )}
            </div>
          </div>
        </div>

        {/* 商店物品列表 */}
        <div className="shop-items">
          <h3>可购买道具</h3>
          <div className="items-grid">
            {items.map((item) => {
              const owned = player.inventory.includes(item.itemId);
              const canAfford = player.gold >= item.price;
              
              return (
                <div 
                  key={item.itemId} 
                  className={`item-card card ${owned ? 'owned' : ''} ${!canAfford && !owned ? 'expensive' : ''}`}
                >
                  <div className="item-header">
                    <h4>{item.name}</h4>
                    {getCategoryTag(item.category)}
                  </div>
                  <p className="item-desc">{item.description}</p>
                  <div className="item-stats">
                    {item.effect.satisfaction && (
                      <span className="effect">满意度 +{item.effect.satisfaction}</span>
                    )}
                    {item.effect.appearanceBonus && (
                      <span className="effect">颜值 +{item.effect.appearanceBonus}</span>
                    )}
                    {item.exposureRate > 0 && (
                      <span className="risk">穿帮率 {item.exposureRate}%</span>
                    )}
                  </div>
                  <div className="item-footer">
                    <span className="price gold-display">💵 {item.price}</span>
                    <button
                      className="btn btn-primary"
                      disabled={owned || !canAfford}
                      onClick={() => handleBuyItem(item.itemId, item.price)}
                    >
                      {owned ? '已购买' : canAfford ? '购买' : '买不起'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="shop-footer">
        <button className="btn btn-primary" onClick={handleStartDate}>
          准备完毕，开始相亲 →
        </button>
      </div>
    </div>
  );
}

export default ShopScreen;
