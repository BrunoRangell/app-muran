
import { useMemo } from "react";
import { ClientWithReview } from "../types/reviewTypes";
import { CustomBudgetState } from "./types";

export const useCustomBudgetData = (client: ClientWithReview): CustomBudgetState => {
  // Verificar se o cliente tem uma revisão
  const hasReview = !!client.lastReview;
  
  // Verificar se está usando orçamento personalizado
  const usingCustomBudget = useMemo(() => {
    return hasReview && client.lastReview?.using_custom_budget === true;
  }, [hasReview, client.lastReview]);
  
  // Informações de orçamento personalizado
  const customBudgetAmount = useMemo(() => {
    return usingCustomBudget ? client.lastReview?.custom_budget_amount : null;
  }, [usingCustomBudget, client.lastReview]);
  
  const customBudgetStartDate = useMemo(() => {
    return usingCustomBudget ? client.lastReview?.custom_budget_start_date : null;
  }, [usingCustomBudget, client.lastReview]);
  
  const customBudgetEndDate = useMemo(() => {
    return usingCustomBudget ? client.lastReview?.custom_budget_end_date : null;
  }, [usingCustomBudget, client.lastReview]);
  
  return {
    usingCustomBudget,
    customBudgetAmount,
    customBudgetStartDate,
    customBudgetEndDate
  };
};
