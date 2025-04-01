
import { useState } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientsList } from "@/components/daily-reviews/ClientsList";
import { RecentReviews } from "@/components/daily-reviews/RecentReviews";
import { ClientReviewDetails } from "@/components/daily-reviews/ClientReviewDetails";
import { DailyReviewsSummary } from "@/components/daily-reviews/DailyReviewsSummary";
import { BudgetSetupForm } from "@/components/daily-reviews/BudgetSetupForm";
import { TokensSetupForm } from "@/components/daily-reviews/TokensSetupForm";
import { useClientAnalysis } from "@/components/daily-reviews/hooks/useClientAnalysis";
import { ReviewsDashboard } from "@/components/daily-reviews/dashboard/ReviewsDashboard";

const DailyReviews = () => {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const { analyzeMutation } = useClientAnalysis((data) => {
    // Se há dados do cliente no retorno, selecione-o
    if (data.clientId) {
      setSelectedClient(data.clientId);
      setActiveTab("client-details");
    } else if (selectedClient) {
      // Caso contrário, mantém o cliente atual selecionado
      setActiveTab("client-details");
    }
  });

  const handleAnalyzeClient = (clientId: string) => {
    console.log("Solicitando análise para cliente:", clientId);
    analyzeMutation.mutate(clientId);
  };

  const handleConfigureBudgetsClick = (clientId: string) => {
    console.log("Configurando orçamentos para cliente:", clientId);
    setSelectedClient(clientId);
    setActiveTab("setup");
  };

  const handleViewClientDetails = (clientId: string) => {
    setSelectedClient(clientId);
    setActiveTab("client-details");
  };

  // Se um cliente for selecionado e estivermos na tab de lista, mude para detalhes
  if (selectedClient && activeTab === "clients-list") {
    setActiveTab("client-details");
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-muran-dark flex items-center gap-2">
            <Calendar className="h-8 w-8 text-muran-primary" />
            Revisões Diárias
          </h1>
          <p className="text-gray-600">
            Acompanhe e gerencie os orçamentos diários de campanhas
          </p>
        </div>

        <div className="flex gap-2">
          <TokensSetupForm />
          <Select
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione a visualização" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dashboard">Dashboard</SelectItem>
              <SelectItem value="clients-list">Lista de Clientes</SelectItem>
              {selectedClient && (
                <SelectItem value="client-details">Detalhes do Cliente</SelectItem>
              )}
              <SelectItem value="summary">Resumo</SelectItem>
              <SelectItem value="setup">Configuração</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="clients-list">Lista de Clientes</TabsTrigger>
          <TabsTrigger value="client-details" disabled={!selectedClient}>
            Detalhes do Cliente
          </TabsTrigger>
          <TabsTrigger value="summary">Resumo</TabsTrigger>
          <TabsTrigger value="setup">Configuração</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <ReviewsDashboard onViewClientDetails={handleViewClientDetails} />
        </TabsContent>

        <TabsContent value="clients-list" className="space-y-4 mt-4">
          <ClientsList 
            onAnalyzeClient={handleAnalyzeClient}
            onConfigureBudget={handleConfigureBudgetsClick}
            analyzingClientId={analyzeMutation.isPending ? analyzeMutation.variables as string : null}
          />
          <RecentReviews onSelectClient={setSelectedClient} />
        </TabsContent>

        <TabsContent value="client-details" className="mt-4">
          {selectedClient && (
            <ClientReviewDetails 
              clientId={selectedClient} 
              onBack={() => setActiveTab("dashboard")} 
            />
          )}
        </TabsContent>

        <TabsContent value="summary" className="mt-4">
          <DailyReviewsSummary />
        </TabsContent>

        <TabsContent value="setup" className="mt-4">
          <BudgetSetupForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DailyReviews;
