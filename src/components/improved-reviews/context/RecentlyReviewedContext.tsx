
import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from "react";

interface RecentlyReviewedContextType {
  recentlyReviewedIds: Set<string>;
  markAsReviewed: (id: string) => void;
  isRecentlyReviewed: (id: string) => boolean;
}

const RecentlyReviewedContext = createContext<RecentlyReviewedContextType | null>(null);

const LOCK_DURATION_MS = 5000; // 5 segundos de lock de posição

export function RecentlyReviewedProvider({ children }: { children: ReactNode }) {
  const [recentlyReviewedIds, setRecentlyReviewedIds] = useState<Set<string>>(new Set());
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const markAsReviewed = useCallback((id: string) => {
    console.log(`🔒 Marcando cliente ${id} como recém-revisado (lock de posição por ${LOCK_DURATION_MS / 1000}s)`);
    
    // Limpar timeout existente se houver
    const existingTimeout = timeoutsRef.current.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Adicionar ao set
    setRecentlyReviewedIds(prev => new Set([...prev, id]));

    // Agendar remoção após timeout
    const timeout = setTimeout(() => {
      console.log(`🔓 Removendo lock de posição do cliente ${id}`);
      setRecentlyReviewedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      timeoutsRef.current.delete(id);
    }, LOCK_DURATION_MS);

    timeoutsRef.current.set(id, timeout);
  }, []);

  const isRecentlyReviewed = useCallback((id: string) => {
    return recentlyReviewedIds.has(id);
  }, [recentlyReviewedIds]);

  // Limpar timeouts ao desmontar
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  return (
    <RecentlyReviewedContext.Provider value={{ recentlyReviewedIds, markAsReviewed, isRecentlyReviewed }}>
      {children}
    </RecentlyReviewedContext.Provider>
  );
}

export function useRecentlyReviewed() {
  const context = useContext(RecentlyReviewedContext);
  if (!context) {
    // Retornar valores padrão se não houver provider (para evitar quebrar componentes)
    return {
      recentlyReviewedIds: new Set<string>(),
      markAsReviewed: () => {},
      isRecentlyReviewed: () => false,
    };
  }
  return context;
}
