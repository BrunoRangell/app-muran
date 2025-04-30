
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MetaDashboardCard } from "@/components/daily-reviews/dashboard/MetaDashboardCard";
import { useToast } from "@/hooks/use-toast";

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

  const handleManualReviewSorrifacil = async () => {
    // Função para testar manualmente a análise da segunda conta da Sorrifacil
    // Aqui você poderia invocar diretamente a função de análise
    toast({
      title: "Análise manual iniciada",
      description: "Verificando contas da Sorrifacil...",
    });
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-[#321e32]">
        Revisão de Orçamentos Meta Ads
      </h1>

      <div className="grid grid-cols-1 gap-6">
        <MetaDashboardCard onViewClientDetails={handleViewClientDetails} />
      </div>

      <div className="text-xs text-gray-500 mt-4">
        <p>Se não estiver visualizando todas as contas Meta ativas, clique no botão "Analisar Todos" para forçar uma atualização.</p>
      </div>
    </div>
  );
}
