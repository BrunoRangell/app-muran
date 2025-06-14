
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { LogsTable } from "./auto-review/LogsTable";
import { RealExecutionsTable } from "./auto-review/RealExecutionsTable";
import { TabHeader } from "./auto-review/TabHeader";

export function AutoReviewTest() {
  const [selectedTab, setSelectedTab] = useState("execution-logs");
  const [isLoading, setIsLoading] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  const [realExecutionLogs, setRealExecutionLogs] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
    
    const intervalId = setInterval(() => {
      fetchLogs();
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, [selectedTab]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      
      const { data: execLogs, error: execError } = await supabase
        .from("cron_execution_logs")
        .select("*")
        .eq("job_name", "daily-meta-review-test-job")
        .or("details->test.eq.true")
        .order("execution_time", { ascending: false })
        .limit(20);
      
      if (execError) throw execError;
      setExecutionLogs(execLogs || []);
      
      const { data: realLogs, error: realError } = await supabase
        .from("cron_execution_logs")
        .select("*")
        .eq("job_name", "daily-meta-review-job")
        .or("details->executeReview.eq.true,details->test.eq.false")
        .order("execution_time", { ascending: false })
        .limit(20);
      
      if (realError) throw realError;
      setRealExecutionLogs(realLogs || []);
      
      const { data: sysLogs, error: sysError } = await supabase
        .from("system_logs")
        .select("*")
        .eq("event_type", "cron_job")
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (sysError) throw sysError;
      setSystemLogs(sysLogs || []);
      
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
      toast({
        title: "Erro ao buscar logs",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerManualTest = async () => {
    try {
      setIsLoading(true);
      
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      
      if (!accessToken) {
        throw new Error("Sessão não encontrada. Por favor, faça login novamente");
      }
      
      const { data: logEntry, error: logError } = await supabase
        .from("cron_execution_logs")
        .insert({
          job_name: "daily-meta-review-test-job",
          status: "started",
          details: {
            timestamp: new Date().toISOString(),
            source: "manual_test",
            test: true,
            executeReview: false
          }
        })
        .select()
        .single();
      
      if (logError) throw logError;
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-meta-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          test: true,
          source: "manual_test",
          logId: logEntry.id,
          executeReview: false
        })
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${text}`);
      }
      
      toast({
        title: "Teste iniciado com sucesso",
        description: "O teste da função edge foi iniciado manualmente. Verifique os logs para acompanhar o progresso.",
      });
      
      setTimeout(() => {
        fetchLogs();
      }, 2000);
      
    } catch (error) {
      console.error("Erro ao disparar teste manual:", error);
      toast({
        title: "Erro ao disparar teste",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerManualRealExecution = async () => {
    try {
      setIsLoading(true);
      
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      
      if (!accessToken) {
        throw new Error("Sessão não encontrada. Por favor, faça login novamente");
      }
      
      const { data: logEntry, error: logError } = await supabase
        .from("cron_execution_logs")
        .insert({
          job_name: "daily-meta-review-job",
          status: "started",
          details: {
            timestamp: new Date().toISOString(),
            source: "manual_real_execution",
            test: false,
            executeReview: true,
            forceExecution: true
          }
        })
        .select()
        .single();
      
      if (logError) throw logError;
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-meta-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          test: false,
          executeReview: true,
          source: "manual_real_execution",
          logId: logEntry.id,
          forceExecution: true
        })
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${text}`);
      }
      
      toast({
        title: "Execução real iniciada com sucesso",
        description: "A execução real foi iniciada manualmente. Verifique os logs de execução real para acompanhar o progresso.",
      });
      
      setTimeout(() => {
        fetchLogs();
      }, 2000);
      
    } catch (error) {
      console.error("Erro ao disparar execução real manual:", error);
      toast({
        title: "Erro ao disparar execução real",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Monitoramento de Revisão Automática</CardTitle>
        <CardDescription>
          Acompanhe a execução e status das revisões automáticas do Meta Ads
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="execution-logs">Logs de Execução (Testes)</TabsTrigger>
            <TabsTrigger value="real-executions">Execuções Reais</TabsTrigger>
            <TabsTrigger value="system-logs">Logs do Sistema</TabsTrigger>
          </TabsList>
          
          <TabsContent value="execution-logs">
            <TabHeader
              title="Logs de Execução (Testes)"
              buttonText="Testar Manualmente"
              buttonColor="bg-amber-600 hover:bg-amber-700"
              isLoading={isLoading}
              lastRefreshed={lastRefreshed}
              onRefresh={fetchLogs}
              onAction={triggerManualTest}
            />
            
            <LogsTable
              logs={executionLogs}
              emptyMessage="Nenhum log de teste encontrado"
            />
          </TabsContent>
          
          <TabsContent value="real-executions">
            <TabHeader
              title="Execuções Reais"
              buttonText="Executar Revisão Real"
              buttonColor="bg-muran-primary hover:bg-muran-primary/90"
              isLoading={isLoading}
              lastRefreshed={lastRefreshed}
              onRefresh={fetchLogs}
              onAction={triggerManualRealExecution}
            />
            
            <Alert className="bg-blue-50 border-blue-200 mb-4">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <AlertTitle>Sobre as Execuções Reais</AlertTitle>
              <AlertDescription className="text-xs">
                As execuções reais são agendadas para ocorrer a cada 3 minutos, processando todos os clientes ativos com Meta Ads configurado.
                Essas execuções atualizam os dados no painel principal.
              </AlertDescription>
            </Alert>
            
            <RealExecutionsTable logs={realExecutionLogs} />
          </TabsContent>
          
          <TabsContent value="system-logs">
            <TabHeader
              title="Logs do Sistema"
              buttonText=""
              buttonColor=""
              isLoading={isLoading}
              lastRefreshed={lastRefreshed}
              onRefresh={fetchLogs}
              onAction={() => {}}
            />
            
            <LogsTable
              logs={systemLogs}
              emptyMessage="Nenhum log do sistema encontrado"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
