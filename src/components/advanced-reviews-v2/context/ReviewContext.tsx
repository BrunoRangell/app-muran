
import { createContext, useContext, useReducer, ReactNode } from "react";
import { ReviewsState, ReviewsAction, MetricsData } from "./types";

// Valores iniciais para métricas
const initialMetricsData: MetricsData = {
  clientsCount: 0,
  clientsWithReviewCount: 0,
  clientsNeedingAdjustment: 0,
  customBudgetsCount: 0,
  totalMonthlyBudget: 0,
  totalSpent: 0,
  averageSpendPercentage: 0,
};

// Estado inicial
const initialState: ReviewsState = {
  clients: {
    meta: [],
    google: [],
  },
  filters: {
    searchQuery: "",
    showOnlyAdjustments: false,
    viewMode: "cards",
    platform: "meta",
  },
  processing: {
    processingClients: {},
    processingAccounts: {},
    batchProcessing: false,
  },
  metrics: {
    meta: {...initialMetricsData},
    google: {...initialMetricsData},
    combined: {...initialMetricsData},
  },
  lastRefresh: null,
};

// Reducer para gerenciar o estado
const reviewsReducer = (state: ReviewsState, action: ReviewsAction): ReviewsState => {
  switch (action.type) {
    case "SET_CLIENTS":
      return {
        ...state,
        clients: {
          ...state.clients,
          [action.payload.platform]: action.payload.clients,
        },
      };
    case "SET_FILTER":
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
      };
    case "SET_METRICS":
      return {
        ...state,
        metrics: {
          ...state.metrics,
          [action.payload.platform]: action.payload.data,
        },
      };
    case "SET_PROCESSING_CLIENT":
      return {
        ...state,
        processing: {
          ...state.processing,
          processingClients: {
            ...state.processing.processingClients,
            [action.payload.clientId]: action.payload.processing,
          },
        },
      };
    case "SET_PROCESSING_ACCOUNT":
      return {
        ...state,
        processing: {
          ...state.processing,
          processingAccounts: {
            ...state.processing.processingAccounts,
            [action.payload.accountId]: action.payload.processing,
          },
        },
      };
    case "SET_BATCH_PROCESSING":
      return {
        ...state,
        processing: {
          ...state.processing,
          batchProcessing: action.payload,
        },
      };
    case "CLEAR_PROCESSING_STATES":
      return {
        ...state,
        processing: {
          processingClients: {},
          processingAccounts: {},
          batchProcessing: false,
        },
      };
    case "SET_LAST_REFRESH":
      return {
        ...state,
        lastRefresh: action.payload,
      };
    default:
      return state;
  }
};

// Criação do contexto
type ReviewsContextType = {
  state: ReviewsState;
  dispatch: React.Dispatch<ReviewsAction>;
};

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

// Provider component
export const ReviewsProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reviewsReducer, initialState);

  return (
    <ReviewsContext.Provider value={{ state, dispatch }}>
      {children}
    </ReviewsContext.Provider>
  );
};

// Hook customizado para usar o contexto
export const useReviews = () => {
  const context = useContext(ReviewsContext);
  if (context === undefined) {
    throw new Error("useReviews deve ser usado dentro de um ReviewsProvider");
  }
  return context;
};
