
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MetaDashboardCard } from "@/components/daily-reviews/dashboard/MetaDashboardCard";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function RevisaoMeta() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountId');
  const { toast } = useToast();

  // Log para diagnóstico
  useEffect(() => {
    console.log("Renderizando página RevisaoMeta", accountId ? `com accountId: ${accountId}` : 'sem accountId');
  }, [accountId]);

  const handleViewClientDetails = (clientId: string) => {
    setSelectedClientId(clientId);
    console.log(`Visualizando detalhes do cliente: ${clientId}${accountId ? `, conta: ${accountId}` : ''}`);
  };

  const triggerManualRefresh = () => {
    // Atualizar a página para forçar uma nova carga dos dados
    window.location.reload();
    
    toast({
      title: "Atualizando dados",
      description: "A página está sendo recarregada para buscar dados atualizados.",
    });
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-[#321e32]">
          Revisão de Orçamentos Meta Ads
        </h1>
        
        <Button 
          variant="outline" 
          onClick={triggerManualRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Atualizar Dados
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <MetaDashboardCard onViewClientDetails={handleViewClientDetails} />
      </div>

      <div className="text-xs text-gray-500 mt-4">
        <p>Se não estiver visualizando todas as contas Meta ativas, clique no botão "Analisar Todos" para forçar uma atualização.</p>
        <p className="mt-1">Para cada cliente com múltiplas contas Meta, todas as contas serão mostradas separadamente.</p>
      </div>
    </div>
  );
}
