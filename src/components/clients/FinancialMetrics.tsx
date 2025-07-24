
import { useFinancialData } from "@/hooks/useFinancialData";
import { FinancialMetricsContainer } from "./FinancialMetricsContainer";

export const FinancialMetrics = () => {
  const { data: financialData, isLoading } = useFinancialData();

  return (
    <FinancialMetricsContainer 
      clients={financialData?.clients || []}
      isLoading={isLoading}
    />
  );
};
