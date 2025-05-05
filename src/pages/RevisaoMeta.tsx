
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
  const [loadingDiagnostico, setLoadingDiagnostico] = useState(false);
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
    setLoadingDiagnostico(true);
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
        setLoadingDiagnostico(false);
        return;
      }
      
      // Buscar contas Meta da Sorrifácil
      const { data: metaAccounts } = await supabase
        .from('client_meta_accounts')
        .select('*')
        .eq('client_id', clientData.id);
        
      // Buscar revisões atuais
      const today = new Date().toISOString().split('T')[0];
      
      // Buscar revisões para cada conta Meta
      let reviewsData = [];
      if (metaAccounts && metaAccounts.length > 0) {
        for (const account of metaAccounts) {
          const { data: accountReviews } = await supabase
            .from('daily_budget_reviews')
            .select('*')
            .eq('client_id', clientData.id)
            .or(`meta_account_id.eq.${account.account_id},client_account_id.eq.${account.account_id}`)
            .eq('review_date', today);
            
          if (accountReviews && accountReviews.length > 0) {
            reviewsData.push({
              account_id: account.account_id,
              account_name: account.account_name,
              reviews: accountReviews
            });
          } else {
            reviewsData.push({
              account_id: account.account_id,
              account_name: account.account_name,
              reviews: [],
              status: 'Sem revisões'
            });
          }
        }
      } else {
        // Buscar todas as revisões para o cliente
        const { data: allReviews } = await supabase
          .from('daily_budget_reviews')
          .select('*')
          .eq('client_id', clientData.id)
          .eq('review_date', today);
          
        reviewsData = [{
          account_id: 'principal',
          account_name: 'Conta Principal',
          reviews: allReviews || []
        }];
      }
        
      // Criar revisões iniciais faltantes (apenas diagnóstico)
      const contasSemRevisao = [];
      for (const account of metaAccounts || []) {
        const temRevisao = reviewsData.some(r => 
          r.account_id === account.account_id && r.reviews && r.reviews.length > 0
        );
        
        if (!temRevisao) {
          contasSemRevisao.push({
            account_id: account.account_id,
            account_name: account.account_name
          });
        }
      }
      
      // Exibir resultados
      setDiagnosticoInfo({
        cliente: clientData,
        contasMeta: metaAccounts,
        revisoes: reviewsData,
        contasSemRevisao
      });
      
      setDiagnosticoVisible(true);
      
      toast({
        title: "Diagnóstico concluído",
        description: `Cliente: ${clientData.company_name}, Contas Meta: ${metaAccounts?.length || 0}, Revisões por conta: ${reviewsData.length}.`
      });
    } catch (error) {
      console.error("Erro ao executar diagnóstico:", error);
      toast({
        title: "Erro no diagnóstico",
        description: "Erro ao buscar informações de diagnóstico.",
        variant: "destructive"
      });
    } finally {
      setLoadingDiagnostico(false);
    }
  };

  // Função para criar uma revisão inicial para uma conta sem revisão
  const criarRevisaoInicial = async (clientId: string, accountId: string, accountName: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Verificar se já existe uma revisão para esta conta
      const { data: existingReview } = await supabase
        .from('daily_budget_reviews')
        .select('id')
        .eq('client_id', clientId)
        .or(`meta_account_id.eq.${accountId},client_account_id.eq.${accountId}`)
        .eq('review_date', today)
        .maybeSingle();
        
      if (existingReview) {
        toast({
          title: "Revisão já existe",
          description: `Já existe uma revisão para a conta ${accountName}.`
        });
        return;
      }
      
      // Buscar o orçamento da conta
      const { data: accountData } = await supabase
        .from('client_meta_accounts')
        .select('budget_amount')
        .eq('client_id', clientId)
        .eq('account_id', accountId)
        .maybeSingle();
      
      const budgetAmount = accountData?.budget_amount || 0;
      
      // Criar revisão inicial
      const { data, error } = await supabase
        .from('daily_budget_reviews')
        .insert({
          client_id: clientId,
          meta_account_id: accountId,
          client_account_id: accountId,
          meta_account_name: accountName,
          account_display_name: accountName,
          review_date: today,
          meta_daily_budget_current: 0,
          meta_total_spent: 0,
          using_custom_budget: false
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Revisão inicial criada",
        description: `Revisão inicial criada para conta ${accountName}.`
      });
      
      // Atualizar diagnóstico
      await executarDiagnostico();
    } catch (error) {
      console.error("Erro ao criar revisão inicial:", error);
      toast({
        title: "Erro ao criar revisão",
        description: "Não foi possível criar a revisão inicial.",
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
            disabled={loadingDiagnostico}
          >
            {loadingDiagnostico ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <FileSearch size={16} />
                Diagnóstico
              </>
            )}
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
              <h4 className="font-medium text-gray-700 mb-1">Revisões por Conta ({diagnosticoInfo.revisoes?.length || 0})</h4>
              <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(diagnosticoInfo.revisoes, null, 2)}
              </pre>
            </div>
            
            {diagnosticoInfo.contasSemRevisao && diagnosticoInfo.contasSemRevisao.length > 0 && (
              <div className="md:col-span-2">
                <h4 className="font-medium text-gray-700 mb-1">Contas sem Revisão ({diagnosticoInfo.contasSemRevisao.length})</h4>
                <div className="bg-white p-4 rounded border border-amber-200">
                  {diagnosticoInfo.contasSemRevisao.map((conta: any) => (
                    <div key={conta.account_id} className="flex justify-between items-center mb-2 last:mb-0">
                      <div>
                        <span className="font-medium">{conta.account_name}</span> ({conta.account_id})
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => criarRevisaoInicial(
                          diagnosticoInfo.cliente.id,
                          conta.account_id,
                          conta.account_name
                        )}
                        className="bg-[#ff6e00] text-white hover:bg-[#e66300]"
                      >
                        Criar Revisão Inicial
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
