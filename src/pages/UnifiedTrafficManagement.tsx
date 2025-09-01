import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CriticalAlertsSection } from "@/components/unified-traffic/CriticalAlertsSection";
import { FinancialControlPanel } from "@/components/unified-traffic/FinancialControlPanel";
import { DailyOptimizationPanel } from "@/components/unified-traffic/DailyOptimizationPanel";
import { RealTimeMonitoring } from "@/components/unified-traffic/RealTimeMonitoring";
import { SmartFilters, FilterState } from "@/components/unified-traffic/SmartFilters";
import { AlertTriangle, DollarSign, TrendingUp, Activity } from "lucide-react";

export default function UnifiedTrafficManagement() {
  const [filters, setFilters] = useState<FilterState>({
    urgency: "all",
    platform: "all",
    problemType: "all",
    clientSearch: ""
  });

  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header da Página */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-muran-dark bg-gradient-to-r from-muran-primary to-muran-complementary bg-clip-text text-transparent">
            Central de Gestão de Tráfego Pago
          </h1>
          <p className="text-muran-dark/70">
            Controle total das suas campanhas, saldos e otimizações em um só lugar
          </p>
        </div>

        {/* Filtros Inteligentes */}
        <SmartFilters filters={filters} onFiltersChange={setFilters} />

        {/* Seção de Alertas Críticos - Sempre visível */}
        <CriticalAlertsSection filters={filters} />

        {/* Navegação por Abas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Controle Financeiro
            </TabsTrigger>
            <TabsTrigger value="optimization" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Otimização Diária
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Monitoramento
            </TabsTrigger>
          </TabsList>

          <TabsContent value="financial" className="space-y-6 mt-6">
            <FinancialControlPanel filters={filters} />
          </TabsContent>

          <TabsContent value="optimization" className="space-y-6 mt-6">
            <DailyOptimizationPanel filters={filters} />
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6 mt-6">
            <RealTimeMonitoring filters={filters} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}