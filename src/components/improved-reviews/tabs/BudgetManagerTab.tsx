
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { DollarSign, RefreshCw, AlertTriangle } from "lucide-react";
import { BudgetSetupForm } from "@/components/daily-reviews/BudgetSetupForm";

interface ClientBudgetData {
  id: string;
  company_name: string;
  hasMetaAccount: boolean;
  hasGoogleAccount: boolean;
  metaBudget: number;
  googleBudget: number;
  totalBudget: number;
}

const fetchClientsWithBudgets = async (): Promise<ClientBudgetData[]> => {
  console.log("💰 Buscando dados de orçamentos dos clientes...");
  
  try {
    // Buscar todos os clientes ativos
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, company_name')
      .eq('status', 'active');

    if (clientsError) {
      console.error("❌ Erro ao buscar clientes:", clientsError);
      throw clientsError;
    }

    if (!clients || clients.length === 0) {
      console.warn("⚠️ Nenhum cliente ativo encontrado");
      return [];
    }

    const result: ClientBudgetData[] = [];

    for (const client of clients) {
      console.log(`💼 Processando orçamentos do cliente: ${client.company_name}`);

      // Buscar contas Meta Ads
      const { data: metaAccounts } = await supabase
        .from('client_accounts')
        .select('budget_amount')
        .eq('client_id', client.id)
        .eq('platform', 'meta')
        .eq('status', 'active');

      // Buscar contas Google Ads
      const { data: googleAccounts } = await supabase
        .from('client_accounts')
        .select('budget_amount')
        .eq('client_id', client.id)
        .eq('platform', 'google')
        .eq('status', 'active');

      const metaBudget = metaAccounts?.reduce((sum, acc) => sum + (acc.budget_amount || 0), 0) || 0;
      const googleBudget = googleAccounts?.reduce((sum, acc) => sum + (acc.budget_amount || 0), 0) || 0;

      const clientData: ClientBudgetData = {
        id: client.id,
        company_name: client.company_name,
        hasMetaAccount: (metaAccounts?.length || 0) > 0,
        hasGoogleAccount: (googleAccounts?.length || 0) > 0,
        metaBudget,
        googleBudget,
        totalBudget: metaBudget + googleBudget
      };

      result.push(clientData);
      console.log(`✅ Orçamentos processados para ${client.company_name}:`, {
        meta: metaBudget,
        google: googleBudget,
        total: clientData.totalBudget
      });
    }

    console.log(`🎉 Processamento de orçamentos concluído. Total: ${result.length} clientes`);
    return result;

  } catch (error) {
    console.error("❌ Erro fatal ao buscar orçamentos:", error);
    throw error;
  }
};

export function BudgetManagerTab() {
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['budget-manager-data'],
    queryFn: fetchClientsWithBudgets,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      console.log("✅ Dados de orçamentos atualizados");
    } catch (error) {
      console.error("❌ Erro ao atualizar orçamentos:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Log para debug
  useEffect(() => {
    console.log("💰 BudgetManagerTab - Estado atual:", {
      dataLength: data?.length || 0,
      isLoading,
      error: error?.message,
      timestamp: new Date().toISOString()
    });
  }, [data, isLoading, error]);

  const totalBudget = data?.reduce((sum, client) => sum + client.totalBudget, 0) || 0;
  const clientsWithBudget = data?.filter(client => client.totalBudget > 0).length || 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Erro ao carregar dados de orçamentos: {error.message}</span>
          </div>
          <Button onClick={handleRefresh} className="mt-4" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Clientes ativos no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Orçamento</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientsWithBudget}</div>
            <p className="text-xs text-muted-foreground">
              Clientes com orçamentos configurados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalBudget.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Soma total dos orçamentos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Botão de Atualizar */}
      <div className="flex justify-end">
        <Button 
          onClick={handleRefresh} 
          disabled={isLoading || refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar Dados
        </Button>
      </div>

      {/* Lista de Clientes com Orçamentos */}
      {data && data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Orçamentos por Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.map((client) => (
                <div key={client.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <h3 className="font-medium">{client.company_name}</h3>
                    <div className="text-sm text-muted-foreground">
                      {client.hasMetaAccount && "Meta Ads"} 
                      {client.hasMetaAccount && client.hasGoogleAccount && " • "}
                      {client.hasGoogleAccount && "Google Ads"}
                      {!client.hasMetaAccount && !client.hasGoogleAccount && "Sem contas configuradas"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {client.totalBudget.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </div>
                    {(client.metaBudget > 0 || client.googleBudget > 0) && (
                      <div className="text-xs text-muted-foreground">
                        {client.metaBudget > 0 && `Meta: R$ ${client.metaBudget.toFixed(2)}`}
                        {client.metaBudget > 0 && client.googleBudget > 0 && " • "}
                        {client.googleBudget > 0 && `Google: R$ ${client.googleBudget.toFixed(2)}`}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário de Configuração de Orçamentos */}
      <BudgetSetupForm />
    </div>
  );
}
