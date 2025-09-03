
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader, Play, AlertCircle, FileText, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export function DebugTools() {
  const [isLoading, setIsLoading] = useState(false);
  const [isRealLoading, setIsRealLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [realResult, setRealResult] = useState<any>(null);
  const { toast } = useToast();

  // Função para verificar diretamente a Edge Function (teste)
  const testEdgeDirectly = async () => {
    setIsLoading(true);
    try {
      // Obter sessão para autenticação
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      
      if (!accessToken) {
        throw new Error("Sessão não encontrada. Por favor, faça login novamente");
      }
      
      // Chamada direta via fetch para testar
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unified-meta-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          clientIds: ['test-client-id'],
          reviewDate: new Date().toISOString().split('T')[0],
          source: "debug_test"
        })
      });
      
      let data;
      try {
        data = await response.json();
      } catch (err) {
        const text = await response.text();
        throw new Error(`Erro ao parsear resposta: ${text}`);
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${JSON.stringify(data)}`);
      }
      
      setResult({
        status: response.status,
        data,
        headers: Object.fromEntries([...response.headers.entries()])
      });
      
      toast({
        title: "Teste direto bem-sucedido",
        description: "A função Edge respondeu corretamente.",
      });
    } catch (error) {
      console.error("Erro ao testar função Edge diretamente:", error);
      setResult({ error: error instanceof Error ? error.message : String(error) });
      
      toast({
        title: "Falha no teste direto",
        description: error instanceof Error ? error.message : "Não foi possível testar a função Edge diretamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Nova função para executar uma revisão real diretamente
  const executeRealReviewDirectly = async () => {
    setIsRealLoading(true);
    try {
      // Obter sessão para autenticação
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      
      if (!accessToken) {
        throw new Error("Sessão não encontrada. Por favor, faça login novamente");
      }
      
      // Criar um registro de log para a execução
      const { data: logEntry, error: logError } = await supabase
        .from("cron_execution_logs")
        .insert({
          job_name: "daily-meta-review-job",
          status: "started",
          details: { 
            timestamp: new Date().toISOString(),
            source: "manual_support_tool",
            isAutomatic: false,
            executeReview: true
          }
        })
        .select()
        .single();
      
      if (logError) {
        throw new Error(`Erro ao criar log de execução: ${logError.message}`);
      }
      
      // Chamada direta via fetch para execução real
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unified-meta-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          clientIds: 'all',
          reviewDate: new Date().toISOString().split('T')[0],
          source: "manual_support_tool"
        })
      });
      
      let data;
      try {
        data = await response.json();
      } catch (err) {
        const text = await response.text();
        throw new Error(`Erro ao parsear resposta: ${text}`);
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${JSON.stringify(data)}`);
      }
      
      setRealResult({
        status: response.status,
        data,
        logId: logEntry.id,
        headers: Object.fromEntries([...response.headers.entries()])
      });
      
      toast({
        title: "Execução real iniciada",
        description: "A função Edge iniciou uma execução real. Verifique a aba 'Execuções Reais' para acompanhar o progresso.",
      });
    } catch (error) {
      console.error("Erro ao iniciar execução real:", error);
      setRealResult({ error: error instanceof Error ? error.message : String(error) });
      
      toast({
        title: "Falha ao iniciar execução real",
        description: error instanceof Error ? error.message : "Não foi possível iniciar uma execução real.",
        variant: "destructive",
      });
    } finally {
      setIsRealLoading(false);
    }
  };

  // Função para verificar status atual do cron
  const checkCronConfig = async () => {
    try {
      // Verificar configuração do cron job
      const { data, error } = await supabase.rpc('get_cron_expression', {
        job_name: 'daily-meta-review-job'
      });
      
      if (error) {
        throw new Error(`Erro ao verificar configuração do cron: ${error.message}`);
      }
      
      // Exibir informações sobre o cron job
      toast({
        title: "Configuração de cron encontrada",
        description: `Expressão cron: ${data && data.length > 0 ? data[0].cron_expression : 'Não encontrada'}`,
      });
      
      return data;
    } catch (error) {
      console.error("Erro ao verificar configuração do cron:", error);
      
      toast({
        title: "Erro ao verificar cron",
        description: error instanceof Error ? error.message : "Não foi possível verificar a configuração do cron job.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Ferramentas de Diagnóstico Avançado</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertTitle>Ferramentas para Suporte Técnico</AlertTitle>
          <AlertDescription className="text-xs">
            Use estas ferramentas apenas quando orientado pela equipe de suporte para diagnosticar problemas de conectividade.
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button 
            onClick={testEdgeDirectly} 
            disabled={isLoading}
            className="w-full bg-muran-complementary hover:bg-muran-complementary/90 text-white"
          >
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Testando diretamente...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Teste da Edge Function
              </>
            )}
          </Button>
          
          <Button 
            onClick={executeRealReviewDirectly} 
            disabled={isRealLoading}
            className="w-full bg-muran-primary hover:bg-muran-primary/90 text-white"
          >
            {isRealLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Iniciando execução real...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Iniciar Execução Real
              </>
            )}
          </Button>
        </div>
        
        <Button 
          onClick={checkCronConfig} 
          disabled={isLoading || isRealLoading}
          variant="outline"
          className="w-full"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Verificar Configuração do Cron
        </Button>
        
        {result && (
          <div className="mt-2">
            <h3 className="text-sm font-semibold mb-1">Resposta do Teste:</h3>
            <div className="text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-auto max-h-60">
              <Badge className="mb-2">Status: {result.status}</Badge>
              <pre className="whitespace-pre-wrap">{JSON.stringify(result.data, null, 2)}</pre>
            </div>
          </div>
        )}
        
        {realResult && (
          <div className="mt-2">
            <h3 className="text-sm font-semibold mb-1">Resposta da Execução Real:</h3>
            <div className="text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-auto max-h-60">
              <Badge className="mb-2 bg-muran-primary text-white">Status: {realResult.status}</Badge>
              <p className="text-xs mb-1">Log ID: {realResult.logId}</p>
              <pre className="whitespace-pre-wrap">{JSON.stringify(realResult.data, null, 2)}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
