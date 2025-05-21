
import { useMemo } from "react";

interface IdealBudgetParams {
  remainingBudget: number;
  remainingDaysValue: number;
}

export const useIdealBudgetCalculation = ({
  remainingBudget,
  remainingDaysValue
}: IdealBudgetParams): number => {
  return useMemo(() => {
    return remainingDaysValue > 0 ? remainingBudget / remainingDaysValue : 0;
  }, [remainingBudget, remainingDaysValue]);
};
