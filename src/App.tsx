import { useAppSelector } from './store/hooks';
import { selectGamePhase } from './store';
import { GamePhase } from './types';
import MainMenu from './components/MainMenu';
import ShopScreen from './components/ShopScreen';
import DateScreen from './components/DateScreen';
import ResultScreen from './components/ResultScreen';

function App() {
  const gamePhase = useAppSelector(selectGamePhase);

  const renderScreen = () => {
    switch (gamePhase) {
      case GamePhase.INIT:
        return <MainMenu />;
      case GamePhase.PREP:
        return <ShopScreen />;
      case GamePhase.DATE:
        return <DateScreen />;
      case GamePhase.RESULT:
        return <ResultScreen />;
      default:
        return <MainMenu />;
    }
  };

  return (
    <div className="app">
      {renderScreen()}
    </div>
  );
}

export default App;
