
import React, { createContext, useContext, useReducer } from 'react';

// Define os tipos
interface ReviewsState {
  filters: {
    meta: {
      searchQuery: string;
      showOnlyAdjustments: boolean;
    };
    google: {
      searchQuery: string;
      showOnlyAdjustments: boolean;
    };
  };
  processingClients: string[];
  processingAccounts: Record<string, boolean>;
  lastRefresh: Date | null;
}

type ReviewsAction =
  | { type: 'SET_META_SEARCH_QUERY'; payload: string }
  | { type: 'SET_META_SHOW_ONLY_ADJUSTMENTS'; payload: boolean }
  | { type: 'SET_GOOGLE_SEARCH_QUERY'; payload: string }
  | { type: 'SET_GOOGLE_SHOW_ONLY_ADJUSTMENTS'; payload: boolean }
  | { type: 'SET_PROCESSING_CLIENT'; payload: { clientId: string; isProcessing: boolean } }
  | { type: 'SET_PROCESSING_ACCOUNT'; payload: { accountKey: string; isProcessing: boolean } }
  | { type: 'SET_LAST_REFRESH'; payload: Date };

// Estado inicial
const initialState: ReviewsState = {
  filters: {
    meta: {
      searchQuery: '',
      showOnlyAdjustments: false,
    },
    google: {
      searchQuery: '',
      showOnlyAdjustments: false,
    },
  },
  processingClients: [],
  processingAccounts: {},
  lastRefresh: null,
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

    default:
      return state;
  }
};

// Tipo para o contexto
interface ReviewsContextProps {
  state: ReviewsState;
  dispatch: React.Dispatch<ReviewsAction>;
}

// Criar o contexto
const ReviewsContext = createContext<ReviewsContextProps | undefined>(undefined);

// Provider
interface ReviewsProviderProps {
  children: React.ReactNode;
}

export const ReviewsProvider: React.FC<ReviewsProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(reviewsReducer, initialState);

  return (
    <ReviewsContext.Provider value={{ state, dispatch }}>
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
