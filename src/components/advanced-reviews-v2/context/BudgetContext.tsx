
import { createContext, useContext, useReducer, ReactNode } from "react";
import { BudgetState, BudgetAction } from "./types";

// Estado inicial
const initialState: BudgetState = {
  customBudgets: {},
  regularBudgets: {},
  processing: false,
  error: null,
};

// Reducer para gerenciar o estado
const budgetReducer = (state: BudgetState, action: BudgetAction): BudgetState => {
  switch (action.type) {
    case "SET_CUSTOM_BUDGETS":
      return {
        ...state,
        customBudgets: action.payload,
      };
    case "SET_REGULAR_BUDGETS":
      return {
        ...state,
        regularBudgets: action.payload,
      };
    case "ADD_CUSTOM_BUDGET":
      return {
        ...state,
        customBudgets: {
          ...state.customBudgets,
          [action.payload.clientId]: [
            ...(state.customBudgets[action.payload.clientId] || []),
            action.payload,
          ],
        },
      };
    case "UPDATE_CUSTOM_BUDGET": {
      const clientId = action.payload.clientId;
      const updatedBudgets = state.customBudgets[clientId]?.map((budget) =>
        budget.id === action.payload.id ? action.payload : budget
      ) || [];

      return {
        ...state,
        customBudgets: {
          ...state.customBudgets,
          [clientId]: updatedBudgets,
        },
      };
    }
    case "DELETE_CUSTOM_BUDGET": {
      // Encontra o cliente que contém o orçamento a ser excluído
      const clientIdToUpdate = Object.keys(state.customBudgets).find(
        (clientId) =>
          state.customBudgets[clientId]?.some(
            (budget) => budget.id === action.payload.id
          )
      );

      if (!clientIdToUpdate) return state;

      const updatedBudgets = state.customBudgets[clientIdToUpdate].filter(
        (budget) => budget.id !== action.payload.id
      );

      return {
        ...state,
        customBudgets: {
          ...state.customBudgets,
          [clientIdToUpdate]: updatedBudgets,
        },
      };
    }
    case "SET_PROCESSING":
      return {
        ...state,
        processing: action.payload,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
};

// Criação do contexto
type BudgetContextType = {
  state: BudgetState;
  dispatch: React.Dispatch<BudgetAction>;
};

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

// Provider component
export const BudgetProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(budgetReducer, initialState);

  return (
    <BudgetContext.Provider value={{ state, dispatch }}>
      {children}
    </BudgetContext.Provider>
  );
};

// Hook customizado para usar o contexto
export const useBudgets = () => {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error("useBudgets deve ser usado dentro de um BudgetProvider");
  }
  return context;
};
