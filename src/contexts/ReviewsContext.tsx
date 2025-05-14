
import React, { createContext, useContext, useState, useReducer, useCallback } from 'react';

type FilterState = {
  searchQuery: string;
  viewMode: 'cards' | 'table' | 'list';
  showOnlyAdjustments: boolean;
};

type ReviewsState = {
  filters: {
    meta: FilterState;
    google: FilterState;
  };
  lastRefresh: {
    meta: Date | null;
    google: Date | null;
    budgets: Date | null;
  };
  processingClients: string[];
  processingAccounts: Record<string, boolean>;
  isBatchProcessing: boolean;
};

type ReviewsAction =
  | { type: 'SET_FILTER'; platform: 'meta' | 'google'; filter: Partial<FilterState> }
  | { type: 'SET_LAST_REFRESH'; platform: 'meta' | 'google' | 'budgets'; time: Date }
  | { type: 'ADD_PROCESSING_CLIENT'; clientId: string }
  | { type: 'REMOVE_PROCESSING_CLIENT'; clientId: string }
  | { type: 'SET_PROCESSING_ACCOUNT'; accountKey: string; isProcessing: boolean }
  | { type: 'CLEAR_PROCESSING_STATES' }
  | { type: 'SET_BATCH_PROCESSING'; isProcessing: boolean };

const initialState: ReviewsState = {
  filters: {
    meta: {
      searchQuery: '',
      viewMode: 'cards',
      showOnlyAdjustments: false
    },
    google: {
      searchQuery: '',
      viewMode: 'cards',
      showOnlyAdjustments: false
    }
  },
  lastRefresh: {
    meta: null,
    google: null,
    budgets: null
  },
  processingClients: [],
  processingAccounts: {},
  isBatchProcessing: false
};

function reviewsReducer(state: ReviewsState, action: ReviewsAction): ReviewsState {
  switch (action.type) {
    case 'SET_FILTER':
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.platform]: {
            ...state.filters[action.platform],
            ...action.filter
          }
        }
      };
    
    case 'SET_LAST_REFRESH':
      return {
        ...state,
        lastRefresh: {
          ...state.lastRefresh,
          [action.platform]: action.time
        }
      };
    
    case 'ADD_PROCESSING_CLIENT':
      return {
        ...state,
        processingClients: [...state.processingClients, action.clientId]
      };
    
    case 'REMOVE_PROCESSING_CLIENT':
      return {
        ...state,
        processingClients: state.processingClients.filter(id => id !== action.clientId)
      };
    
    case 'SET_PROCESSING_ACCOUNT':
      return {
        ...state,
        processingAccounts: {
          ...state.processingAccounts,
          [action.accountKey]: action.isProcessing
        }
      };
    
    case 'CLEAR_PROCESSING_STATES':
      return {
        ...state,
        processingClients: [],
        processingAccounts: {},
        isBatchProcessing: false
      };
    
    case 'SET_BATCH_PROCESSING':
      return {
        ...state,
        isBatchProcessing: action.isProcessing
      };
    
    default:
      return state;
  }
}

type ReviewsContextType = {
  state: ReviewsState;
  setFilter: (platform: 'meta' | 'google', filter: Partial<FilterState>) => void;
  setLastRefresh: (platform: 'meta' | 'google' | 'budgets', time?: Date) => void;
  markClientProcessing: (clientId: string) => void;
  unmarkClientProcessing: (clientId: string) => void;
  markAccountProcessing: (accountKey: string) => void;
  unmarkAccountProcessing: (accountKey: string) => void;
  clearProcessingStates: () => void;
  setBatchProcessing: (isProcessing: boolean) => void;
  isClientProcessing: (clientId: string) => boolean;
  isAccountProcessing: (accountKey: string) => boolean;
};

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

export const ReviewsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reviewsReducer, initialState);

  const setFilter = useCallback((platform: 'meta' | 'google', filter: Partial<FilterState>) => {
    dispatch({ type: 'SET_FILTER', platform, filter });
  }, []);

  const setLastRefresh = useCallback((platform: 'meta' | 'google' | 'budgets', time: Date = new Date()) => {
    dispatch({ type: 'SET_LAST_REFRESH', platform, time });
  }, []);

  const markClientProcessing = useCallback((clientId: string) => {
    dispatch({ type: 'ADD_PROCESSING_CLIENT', clientId });
  }, []);

  const unmarkClientProcessing = useCallback((clientId: string) => {
    dispatch({ type: 'REMOVE_PROCESSING_CLIENT', clientId });
  }, []);

  const markAccountProcessing = useCallback((accountKey: string) => {
    dispatch({ type: 'SET_PROCESSING_ACCOUNT', accountKey, isProcessing: true });
  }, []);

  const unmarkAccountProcessing = useCallback((accountKey: string) => {
    dispatch({ type: 'SET_PROCESSING_ACCOUNT', accountKey, isProcessing: false });
  }, []);

  const clearProcessingStates = useCallback(() => {
    dispatch({ type: 'CLEAR_PROCESSING_STATES' });
  }, []);

  const setBatchProcessing = useCallback((isProcessing: boolean) => {
    dispatch({ type: 'SET_BATCH_PROCESSING', isProcessing });
  }, []);

  const isClientProcessing = useCallback((clientId: string) => {
    return state.processingClients.includes(clientId);
  }, [state.processingClients]);

  const isAccountProcessing = useCallback((accountKey: string) => {
    return Boolean(state.processingAccounts[accountKey]);
  }, [state.processingAccounts]);

  const value = {
    state,
    setFilter,
    setLastRefresh,
    markClientProcessing,
    unmarkClientProcessing,
    markAccountProcessing,
    unmarkAccountProcessing,
    clearProcessingStates,
    setBatchProcessing,
    isClientProcessing,
    isAccountProcessing
  };

  return (
    <ReviewsContext.Provider value={value}>
      {children}
    </ReviewsContext.Provider>
  );
};

export const useReviewsContext = (): ReviewsContextType => {
  const context = useContext(ReviewsContext);
  
  if (!context) {
    throw new Error('useReviewsContext must be used within a ReviewsProvider');
  }
  
  return context;
};
