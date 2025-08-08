
import { Card } from "@/components/ui/card";
import { CostFilters } from "@/types/cost";
import { FinancialMetrics } from "@/components/clients/FinancialMetrics";
import { BarChart3 } from "lucide-react";

interface InteractiveChartsProps {
  filters: CostFilters;
}

export const InteractiveCharts = ({ filters }: InteractiveChartsProps) => {
  return (
    <FinancialMetrics />
  );
};
