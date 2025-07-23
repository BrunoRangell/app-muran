
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CostFilters } from "@/types/cost";
import { UnifiedDashboard } from "@/components/financial-dashboard/UnifiedDashboard";
import { DetailedAnalytics } from "@/components/financial-dashboard/DetailedAnalytics";
import { AlertCircle } from "lucide-react";
import { TeamMemberCheck } from "@/components/auth/TeamMemberCheck";
import { useFinancialData } from "@/hooks/useFinancialData";

export default function FinancialReport() {
  const [filters, setFilters] = useState<CostFilters>({});
  const { data: financialData, isLoading, error } = useFinancialData();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-muran-primary"></div>
          <span className="ml-3">Carregando relatório financeiro...</span>
        </div>
      </div>
    );
  }

  if (error || !financialData) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
        <div className="flex flex-col items-center justify-center p-8 text-red-500 gap-4">
          <AlertCircle className="h-12 w-12" />
          <h2 className="text-xl font-semibold">Erro ao carregar relatório</h2>
          <p className="text-center text-gray-600">
            Não foi possível carregar os dados financeiros.
            <br />
            Por favor, tente novamente mais tarde.
          </p>
        </div>
      </div>
    );
  }

  return (
    <TeamMemberCheck>
      <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-muran-dark">
              Relatório Financeiro
            </h1>
            <p className="text-gray-600">
              Visão completa da saúde financeira da agência
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="analytics">Análise Detalhada</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <UnifiedDashboard filters={filters} financialData={financialData} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <DetailedAnalytics filters={filters} financialData={financialData} />
          </TabsContent>
        </Tabs>
      </div>
    </TeamMemberCheck>
  );
}
