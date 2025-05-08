
import { useEffect, useRef } from 'react';

interface TabVisibilityProps {
  isActive: boolean;
  onBecomeVisible?: () => void;
  onBecomeHidden?: () => void;
  prefetchOnHover?: boolean;
  debounceTime?: number;
}

export function useTabVisibility({
  isActive,
  onBecomeVisible,
  onBecomeHidden,
  prefetchOnHover = false,
  debounceTime = 5000 // 5 segundos de debounce padrão
}: TabVisibilityProps) {
  // Referência para o timer de debounce
  const lastUpdateTimestamp = useRef<number>(0);
  const isFirstRender = useRef<boolean>(true);
  
  // Executar callbacks quando a visibilidade da aba mudar
  useEffect(() => {
    if (isActive && onBecomeVisible) {
      const now = Date.now();
      
      // Verificar se é a primeira renderização (não executar nesse caso)
      if (isFirstRender.current) {
        isFirstRender.current = false;
        console.log('Tab inicializada - pulando a primeira atualização');
        return;
      }
      
      // Verificar se passou tempo suficiente desde a última atualização
      if (now - lastUpdateTimestamp.current > debounceTime) {
        console.log('Tab se tornou visível - executando atualização após debounce');
        lastUpdateTimestamp.current = now;
        onBecomeVisible();
      } else {
        console.log(`Tab se tornou visível, mas última atualização foi há ${now - lastUpdateTimestamp.current}ms - ignorando`);
      }
    } else if (!isActive && onBecomeHidden) {
      console.log('Tab se tornou invisível');
      onBecomeHidden();
    }
  }, [isActive, onBecomeVisible, onBecomeHidden, debounceTime]);

  return {
    isActive,
  };
}
