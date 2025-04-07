
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayIcon, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export function CronJobMonitor() {
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const { toast } = useToast();

  useEffect(() => {
    fetchCronData();
    
    // Atualizar a cada 15 segundos
    const intervalId = setInterval(() => {
      fetchCronData();
    }, 15000);
    
    return () => clearInterval(intervalId);
  }, []);

  async function fetchCronData() {
    try {
      setIsLoading(true);
      
      // Buscar jobs do cron - CORREÇÃO: usando a tabela cron.job sem o prefixo "public"
      const { data: jobsData, error: jobsError } = await supabase.rpc(
        'get_cron_jobs',
        { job_names: ['daily-meta-review-job', 'daily-meta-review-test-job', 'cron-health-check', 'google-ads-token-check-job'] }
      );
      
      if (jobsError) {
        console.error("Erro ao buscar jobs:", jobsError);
        
        // Usar a função RPC alternativa se houver erro
        const { data: jobExpressions, error: expressionError } = await supabase.rpc(
          'get_cron_expression',
          { job_name: 'daily-meta-review-job' }
        );
        
        if (expressionError) {
          console.error("Erro ao buscar expressão do cron:", expressionError);
          // Criar dados simulados para mostrar algo ao usuário
          setJobs([
            {
              jobid: 1,
              jobname: 'daily-meta-review-job',
              schedule: '*/3 * * * *',
              active: true
            },
            {
              jobid: 2,
              jobname: 'daily-meta-review-test-job',
              schedule: '*/30 * * * *',
              active: true
            }
          ]);
        } else if (jobExpressions && jobExpressions.length > 0) {
          // Criar dados com base na expressão recuperada
          setJobs([
            {
              jobid: 1,
              jobname: 'daily-meta-review-job',
              schedule: jobExpressions[0].cron_expression,
              active: true
            }
          ]);
        }
      } else {
        setJobs(jobsData || []);
      }
      
      // Buscar últimas execuções
      const { data: execData, error: execError } = await supabase
        .from('cron_execution_logs')
        .select('*')
        .order('execution_time', { ascending: false })
        .limit(10);
      
      if (execError) throw execError;
      setExecutions(execData || []);
      
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Erro ao buscar dados do cron:", error);
      toast({
        title: "Erro ao buscar dados",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Função para formatar data/hora
  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
    } catch (error) {
      return dateStr;
    }
  };

  // Função para disparar execução manual
  const triggerManualExecution = async (jobName: string) => {
    try {
      setIsLoading(true);
      
      // Criar log de execução
      const { data: logEntry, error: logError } = await supabase
        .from("cron_execution_logs")
        .insert({
          job_name: jobName,
          status: "started",
          details: {
            timestamp: new Date().toISOString(),
            source: "manual_trigger",
            isAutomatic: false,
            executeReview: jobName === "daily-meta-review-job",
            test: jobName === "daily-meta-review-test-job"
          }
        })
        .select()
        .single();
      
      if (logError) throw logError;
      
      // Obter sessão para autenticação
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      
      if (!accessToken) {
        throw new Error("Sessão não encontrada. Por favor, faça login novamente");
      }
      
      // Determinar URL e payload com base no tipo de job
      let functionUrl = "";
      let payload: any = {};
      
      if (jobName === "daily-meta-review-job" || jobName === "daily-meta-review-test-job") {
        functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-meta-review`;
        payload = {
          test: jobName === "daily-meta-review-test-job",
          executeReview: jobName === "daily-meta-review-job",
          source: "manual_trigger",
          logId: logEntry.id,
          forceExecution: jobName === "daily-meta-review-job"
        };
      } else if (jobName === "google-ads-token-check-job") {
        functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-ads-token-check`;
        payload = {
          source: "manual_trigger",
          logId: logEntry.id
        };
      } else {
        throw new Error(`Job não suportado para execução manual: ${jobName}`);
      }
      
      // Chamar a função edge
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${text}`);
      }
      
      toast({
        title: "Execução iniciada",
        description: `O job ${jobName} foi iniciado manualmente. Aguarde alguns segundos e verifique as execuções.`,
      });
      
      // Atualizar dados após 2 segundos
      setTimeout(() => fetchCronData(), 2000);
      
    } catch (error) {
      console.error("Erro ao disparar execução manual:", error);
      toast({
        title: "Erro ao disparar execução",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Monitor de Jobs Cron</CardTitle>
          <CardDescription>
            Última atualização: {formatDateTime(lastRefreshed.toISOString())}
          </CardDescription>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchCronData}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-medium mb-2">Jobs Agendados</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Job</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.jobid}>
                    <TableCell className="font-medium">{job.jobname}</TableCell>
                    <TableCell><code>{job.schedule}</code></TableCell>
                    <TableCell>
                      <Badge variant={job.active ? "default" : "destructive"}>
                        {job.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => triggerManualExecution(job.jobname)}
                        disabled={isLoading || !job.active}
                      >
                        <PlayIcon className="h-3 w-3 mr-1" />
                        Executar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {jobs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                      Nenhum job encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Execuções Recentes</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executions.map((exec) => (
                  <TableRow key={exec.id}>
                    <TableCell className="font-medium">{exec.job_name}</TableCell>
                    <TableCell>{formatDateTime(exec.execution_time)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        exec.status === 'completed' || exec.status === 'success' || exec.status === 'test_success' || exec.status === 'active' ? "default" : 
                        exec.status === 'error' ? "destructive" : 
                        "default"
                      }>
                        {exec.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {exec.details?.executeReview === true ? "Execução Real" : 
                       exec.details?.test === true ? "Teste" : 
                       exec.job_name === "cron-health-check" ? "Health Check" :
                       "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
                {executions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                      Nenhuma execução encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
