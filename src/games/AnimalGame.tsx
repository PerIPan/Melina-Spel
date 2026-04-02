import { useEffect } from 'react';
import OriginalAnimalApp from '../AnimalApp';

interface AnimalGameProps {
  onBack: () => void;
}

export function AnimalGame({ onBack }: AnimalGameProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  return (
    <div className="animal-game-wrapper">
      <button className="animal-back-btn" onClick={onBack}>
        🎮 Melina Spel
      </button>
      <OriginalAnimalApp />
    </div>
  );
}
