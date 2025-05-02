
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MetaDashboardCard } from "@/components/daily-reviews/dashboard/MetaDashboardCard";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { RefreshCw, FileSearch } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function RevisaoMeta() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [diagnosticoVisible, setDiagnosticoVisible] = useState(false);
  const [diagnosticoInfo, setDiagnosticoInfo] = useState<any>(null);
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

  const executarDiagnostico = async () => {
    // Buscar informações de diagnóstico sobre a Sorrifácil
    try {
      // Buscar o cliente Sorrifácil
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .ilike('company_name', '%sorrifacil%')
        .maybeSingle();
        
      if (!clientData) {
        toast({
          title: "Cliente não encontrado",
          description: "Não foi possível encontrar o cliente 'Sorrifácil'.",
          variant: "destructive"
        });
        return;
      }
      
      // Buscar contas Meta da Sorrifácil
      const { data: metaAccounts } = await supabase
        .from('client_meta_accounts')
        .select('*')
        .eq('client_id', clientData.id);
        
      // Buscar revisões atuais
      const today = new Date().toISOString().split('T')[0];
      const { data: reviewsData } = await supabase
        .from('daily_budget_reviews')
        .select('*')
        .eq('client_id', clientData.id)
        .eq('review_date', today);
        
      // Exibir resultados
      setDiagnosticoInfo({
        cliente: clientData,
        contasMeta: metaAccounts,
        revisoes: reviewsData
      });
      
      setDiagnosticoVisible(true);
      
      toast({
        title: "Diagnóstico concluído",
        description: `Cliente: ${clientData.company_name}, Contas Meta: ${metaAccounts?.length || 0}, Revisões: ${reviewsData?.length || 0}.`
      });
    } catch (error) {
      console.error("Erro ao executar diagnóstico:", error);
      toast({
        title: "Erro no diagnóstico",
        description: "Erro ao buscar informações de diagnóstico.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-[#321e32]">
          Revisão de Orçamentos Meta Ads
        </h1>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={executarDiagnostico}
            className="flex items-center gap-2"
            title="Diagnóstico Sorrifácil"
          >
            <FileSearch size={16} />
            Diagnóstico
          </Button>
          
          <Button 
            variant="outline" 
            onClick={triggerManualRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Atualizar Dados
          </Button>
        </div>
      </div>

      {diagnosticoVisible && diagnosticoInfo && (
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold mb-2">Diagnóstico - Sorrifácil</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Cliente</h4>
              <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(diagnosticoInfo.cliente, null, 2)}
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Contas Meta ({diagnosticoInfo.contasMeta?.length || 0})</h4>
              <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(diagnosticoInfo.contasMeta, null, 2)}
              </pre>
            </div>
            
            <div className="md:col-span-2">
              <h4 className="font-medium text-gray-700 mb-1">Revisões Hoje ({diagnosticoInfo.revisoes?.length || 0})</h4>
              <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(diagnosticoInfo.revisoes, null, 2)}
              </pre>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setDiagnosticoVisible(false)}
            className="mt-2"
          >
            Fechar Diagnóstico
          </Button>
        </div>
      )}

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
