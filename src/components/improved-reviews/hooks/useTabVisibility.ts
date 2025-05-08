
import { useEffect } from 'react';

interface TabVisibilityProps {
  isActive: boolean;
  onBecomeVisible?: () => void;
  onBecomeHidden?: () => void;
  prefetchOnHover?: boolean;
}

export function useTabVisibility({
  isActive,
  onBecomeVisible,
  onBecomeHidden,
  prefetchOnHover = false
}: TabVisibilityProps) {
  
  // Executar callbacks quando a visibilidade da aba mudar
  useEffect(() => {
    if (isActive && onBecomeVisible) {
      console.log('Tab se tornou visível');
      onBecomeVisible();
    } else if (!isActive && onBecomeHidden) {
      console.log('Tab se tornou invisível');
      onBecomeHidden();
    }
  }, [isActive, onBecomeVisible, onBecomeHidden]);

  return {
    isActive,
  };
}
