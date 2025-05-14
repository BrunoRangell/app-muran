
import React, { createContext, useContext, useReducer } from 'react';

// Define os tipos
interface ReviewsState {
  filters: {
    meta: {
      searchQuery: string;
      showOnlyAdjustments: boolean;
      viewMode: 'cards' | 'table' | 'list';
    };
    google: {
      searchQuery: string;
      showOnlyAdjustments: boolean;
      viewMode: 'cards' | 'table' | 'list';
    };
  };
  processingClients: string[];
  processingAccounts: Record<string, boolean>;
  lastRefresh: Date | null;
  isBatchProcessing: boolean;
}

type FilterPlatform = 'meta' | 'google';

interface FilterUpdate {
  searchQuery?: string;
  showOnlyAdjustments?: boolean;
  viewMode?: 'cards' | 'table' | 'list';
}

type ReviewsAction =
  | { type: 'SET_META_SEARCH_QUERY'; payload: string }
  | { type: 'SET_META_SHOW_ONLY_ADJUSTMENTS'; payload: boolean }
  | { type: 'SET_META_VIEW_MODE'; payload: 'cards' | 'table' | 'list' }
  | { type: 'SET_GOOGLE_SEARCH_QUERY'; payload: string }
  | { type: 'SET_GOOGLE_SHOW_ONLY_ADJUSTMENTS'; payload: boolean }
  | { type: 'SET_GOOGLE_VIEW_MODE'; payload: 'cards' | 'table' | 'list' }
  | { type: 'SET_PROCESSING_CLIENT'; payload: { clientId: string; isProcessing: boolean } }
  | { type: 'SET_PROCESSING_ACCOUNT'; payload: { accountKey: string; isProcessing: boolean } }
  | { type: 'SET_LAST_REFRESH'; payload: Date }
  | { type: 'SET_BATCH_PROCESSING'; payload: boolean }
  | { type: 'CLEAR_PROCESSING_STATES' };

// Estado inicial
const initialState: ReviewsState = {
  filters: {
    meta: {
      searchQuery: '',
      showOnlyAdjustments: false,
      viewMode: 'cards',
    },
    google: {
      searchQuery: '',
      showOnlyAdjustments: false,
      viewMode: 'cards',
    },
  },
  processingClients: [],
  processingAccounts: {},
  lastRefresh: null,
  isBatchProcessing: false,
};

// Reducer para gerenciar as atualizações de estado
const reviewsReducer = (state: ReviewsState, action: ReviewsAction): ReviewsState => {
  switch (action.type) {
    case 'SET_META_SEARCH_QUERY':
      return {
        ...state,
        filters: {
          ...state.filters,
          meta: {
            ...state.filters.meta,
            searchQuery: action.payload,
          },
        },
      };

    case 'SET_META_SHOW_ONLY_ADJUSTMENTS':
      return {
        ...state,
        filters: {
          ...state.filters,
          meta: {
            ...state.filters.meta,
            showOnlyAdjustments: action.payload,
          },
        },
      };
      
    case 'SET_META_VIEW_MODE':
      return {
        ...state,
        filters: {
          ...state.filters,
          meta: {
            ...state.filters.meta,
            viewMode: action.payload,
          },
        },
      };

    case 'SET_GOOGLE_SEARCH_QUERY':
      return {
        ...state,
        filters: {
          ...state.filters,
          google: {
            ...state.filters.google,
            searchQuery: action.payload,
          },
        },
      };

    case 'SET_GOOGLE_SHOW_ONLY_ADJUSTMENTS':
      return {
        ...state,
        filters: {
          ...state.filters,
          google: {
            ...state.filters.google,
            showOnlyAdjustments: action.payload,
          },
        },
      };
      
    case 'SET_GOOGLE_VIEW_MODE':
      return {
        ...state,
        filters: {
          ...state.filters,
          google: {
            ...state.filters.google,
            viewMode: action.payload,
          },
        },
      };

    case 'SET_PROCESSING_CLIENT':
      return {
        ...state,
        processingClients: action.payload.isProcessing
          ? [...state.processingClients, action.payload.clientId]
          : state.processingClients.filter(id => id !== action.payload.clientId),
      };

    case 'SET_PROCESSING_ACCOUNT':
      return {
        ...state,
        processingAccounts: {
          ...state.processingAccounts,
          [action.payload.accountKey]: action.payload.isProcessing,
        },
      };

    case 'SET_LAST_REFRESH':
      return {
        ...state,
        lastRefresh: action.payload,
      };
      
    case 'SET_BATCH_PROCESSING':
      return {
        ...state,
        isBatchProcessing: action.payload,
      };
      
    case 'CLEAR_PROCESSING_STATES':
      return {
        ...state,
        processingClients: [],
        processingAccounts: {},
      };

    default:
      return state;
  }
};

// Tipo para o contexto
interface ReviewsContextProps {
  state: ReviewsState;
  dispatch: React.Dispatch<ReviewsAction>;
  setFilter: (platform: FilterPlatform, update: FilterUpdate) => void;
  markClientProcessing: (clientId: string) => void;
  unmarkClientProcessing: (clientId: string) => void;
  markAccountProcessing: (accountKey: string) => void;
  unmarkAccountProcessing: (accountKey: string) => void;
  clearProcessingStates: () => void;
  setBatchProcessing: (isProcessing: boolean) => void;
}

// Criar o contexto
const ReviewsContext = createContext<ReviewsContextProps | undefined>(undefined);

// Provider
interface ReviewsProviderProps {
  children: React.ReactNode;
}

export const ReviewsProvider: React.FC<ReviewsProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(reviewsReducer, initialState);
  
  // Métodos auxiliares para manipular o estado
  const setFilter = (platform: FilterPlatform, update: FilterUpdate) => {
    if (update.searchQuery !== undefined) {
      dispatch({ 
        type: platform === 'meta' ? 'SET_META_SEARCH_QUERY' : 'SET_GOOGLE_SEARCH_QUERY', 
        payload: update.searchQuery 
      });
    }
    
    if (update.showOnlyAdjustments !== undefined) {
      dispatch({ 
        type: platform === 'meta' ? 'SET_META_SHOW_ONLY_ADJUSTMENTS' : 'SET_GOOGLE_SHOW_ONLY_ADJUSTMENTS', 
        payload: update.showOnlyAdjustments 
      });
    }
    
    if (update.viewMode !== undefined) {
      dispatch({ 
        type: platform === 'meta' ? 'SET_META_VIEW_MODE' : 'SET_GOOGLE_VIEW_MODE', 
        payload: update.viewMode 
      });
    }
  };
  
  const markClientProcessing = (clientId: string) => {
    dispatch({ type: 'SET_PROCESSING_CLIENT', payload: { clientId, isProcessing: true } });
  };
  
  const unmarkClientProcessing = (clientId: string) => {
    dispatch({ type: 'SET_PROCESSING_CLIENT', payload: { clientId, isProcessing: false } });
  };
  
  const markAccountProcessing = (accountKey: string) => {
    dispatch({ type: 'SET_PROCESSING_ACCOUNT', payload: { accountKey, isProcessing: true } });
  };
  
  const unmarkAccountProcessing = (accountKey: string) => {
    dispatch({ type: 'SET_PROCESSING_ACCOUNT', payload: { accountKey, isProcessing: false } });
  };
  
  const clearProcessingStates = () => {
    dispatch({ type: 'CLEAR_PROCESSING_STATES' });
  };
  
  const setBatchProcessing = (isProcessing: boolean) => {
    dispatch({ type: 'SET_BATCH_PROCESSING', payload: isProcessing });
  };

  return (
    <ReviewsContext.Provider 
      value={{ 
        state, 
        dispatch, 
        setFilter,
        markClientProcessing,
        unmarkClientProcessing,
        markAccountProcessing,
        unmarkAccountProcessing,
        clearProcessingStates,
        setBatchProcessing
      }}
    >
      {children}
    </ReviewsContext.Provider>
  );
};

// Hook para acessar o contexto
export const useReviewsContext = (): ReviewsContextProps => {
  const context = useContext(ReviewsContext);
  if (context === undefined) {
    throw new Error('useReviewsContext must be used within a ReviewsProvider');
  }
  return context;
};
