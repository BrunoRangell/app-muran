
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGoogleAdsData } from "../hooks/useGoogleAdsData";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, Database, RefreshCw } from "lucide-react";

export function DataDebugPanel() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isTestingDb, setIsTestingDb] = useState(false);
  const { data: googleData, isLoading, error, refreshData } = useGoogleAdsData();

  const testDatabaseConnection = async () => {
    setIsTestingDb(true);
    const results: any = {};

    try {
      // Teste 1: Verificar conexão básica
      const { data: authTest } = await supabase.auth.getSession();
      results.auth = {
        connected: !!authTest.session,
        userId: authTest.session?.user?.id || null
      };

      // Teste 2: Contar clientes
      const { count: clientsCount, error: clientsError } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      results.clients = {
        count: clientsCount,
        error: clientsError?.message
      };

      // Teste 3: Contar contas Google
      const { count: googleAccountsCount, error: googleError } = await supabase
        .from('client_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('platform', 'google')
        .eq('status', 'active');
      
      results.googleAccounts = {
        count: googleAccountsCount,
        error: googleError?.message
      };

      // Teste 4: Contar revisões
      const { count: reviewsCount, error: reviewsError } = await supabase
        .from('budget_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('platform', 'google');
      
      results.reviews = {
        count: reviewsCount,
        error: reviewsError?.message
      };

      console.log("🔍 Resultados dos testes de banco:", results);
      setTestResults(results);

    } catch (error) {
      console.error("❌ Erro nos testes de banco:", error);
      results.error = error instanceof Error ? error.message : 'Erro desconhecido';
      setTestResults(results);
    } finally {
      setIsTestingDb(false);
    }
  };

  return (
    <Card className="mb-4 border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Database className="h-4 w-4" />
          Debug Panel - Status dos Dados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status do Hook */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Hook Google Ads:</strong>
            <div className="text-xs text-muted-foreground">
              • Carregando: {isLoading ? "Sim" : "Não"}<br/>
              • Dados: {googleData?.length || 0} clientes<br/>
              • Erro: {error ? "Sim" : "Não"}
            </div>
          </div>
          <div>
            <strong>Detalhes:</strong>
            <div className="text-xs text-muted-foreground">
              • Com conta: {googleData?.filter(c => c.hasAccount).length || 0}<br/>
              • Sem conta: {googleData?.filter(c => !c.hasAccount).length || 0}<br/>
              • Precisam ajuste: {googleData?.filter(c => c.needsAdjustment).length || 0}
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={refreshData}
            disabled={isLoading}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Atualizar Dados
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={testDatabaseConnection}
            disabled={isTestingDb}
          >
            <Database className="h-3 w-3 mr-1" />
            Testar BD
          </Button>
        </div>

        {/* Resultados dos Testes */}
        {testResults && (
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
            <strong>Resultados dos Testes:</strong>
            <pre className="mt-2 whitespace-pre-wrap">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}

        {/* Erros */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Erro: {error.message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
