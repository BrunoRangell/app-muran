
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewsDashboardCard } from "@/components/daily-reviews/dashboard/ReviewsDashboardCard";
import { BudgetManager } from "@/components/revisao-nova/BudgetManager";
import { CustomBudgetManager } from "@/components/revisao-nova/CustomBudgetManager";
import { LoggingControls } from "@/components/revisao-nova/LoggingControls";
import { useSearchParams } from "react-router-dom";
import { configureLogging } from "@/lib/logger";

export default function RevisaoNova() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [selectedTab, setSelectedTab] = useState<string>("dashboard");
  const [showLogs, setShowLogs] = useState<boolean>(false);
  
  // Configurar logs para exibir apenas erros por padrão em produção
  // e manter informações em desenvolvimento
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      // Em produção, mostrar apenas erros por padrão
      configureLogging({ minLevel: "error" });
    } else {
      // Em desenvolvimento, mostrar informações e erros
      configureLogging({ minLevel: "info" });
    }
  }, []);
  
  // Atualizar a tab selecionada com base no parâmetro da URL
  useEffect(() => {
    if (tabParam && ["dashboard", "budgets", "custom-budgets"].includes(tabParam)) {
      setSelectedTab(tabParam);
    }
  }, [tabParam]);
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-[#321e32]">
          Revisão de Orçamentos Meta Ads
        </h1>
        
        <button 
          onClick={() => setShowLogs(!showLogs)}
          className="text-xs bg-[#ebebf0] px-3 py-1.5 rounded text-[#321e32] hover:bg-[#ff6e00] hover:text-white transition-colors"
        >
          {showLogs ? "Ocultar" : "Mostrar"} configurações de logs
        </button>
      </div>
      
      {showLogs && <LoggingControls />}

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-4 bg-[#ebebf0]">
          <TabsTrigger 
            value="dashboard" 
            className="data-[state=active]:bg-[#ff6e00] data-[state=active]:text-white"
          >
            Dashboard
          </TabsTrigger>
          <TabsTrigger 
            value="budgets"
            className="data-[state=active]:bg-[#ff6e00] data-[state=active]:text-white"
          >
            Gerenciar Orçamentos
          </TabsTrigger>
          <TabsTrigger 
            value="custom-budgets"
            className="data-[state=active]:bg-[#ff6e00] data-[state=active]:text-white"
          >
            Orçamentos Personalizados
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <ReviewsDashboardCard onViewClientDetails={() => {}} />
        </TabsContent>
        
        <TabsContent value="budgets">
          <BudgetManager />
        </TabsContent>
        
        <TabsContent value="custom-budgets">
          <CustomBudgetManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
