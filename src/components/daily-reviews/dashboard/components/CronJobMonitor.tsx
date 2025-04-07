
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayIcon, RefreshCw, AlertCircle, Clock, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CronJobMonitor() {
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState("jobs");
  const { toast } = useToast();

  useEffect(() => {
    fetchCronData();
    
    // Atualizar a cada 10 segundos
    const intervalId = setInterval(() => {
      fetchCronData();
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, []);

  async function fetchCronData() {
    try {
      setIsLoading(true);
      
      // Buscar jobs usando consulta direta à tabela cron.job
      // Modificamos este trecho para não depender da função RPC que estava falhando
      const { data: jobsData, error: jobsError } = await supabase
        .from('cron_execution_logs')
        .select('job_name, status, execution_time, details')
        .in('job_name', ['daily-meta-review-job', 'daily-meta-review-test-job', 'cron-health-check', 'google-ads-token-check-job'])
        .order('execution_time', { ascending: false })
        .limit(1);
        
      if (jobsError) {
        console.error("Erro ao buscar jobs a partir das execuções:", jobsError);
        
        // Usar dados simulados como último recurso
        setJobs([
          {
            jobid: 1,
            jobname: 'daily-meta-review-job',
            schedule: '*/6 * * * *',
            active: true
          },
          {
            jobid: 2,
            jobname: 'daily-meta-review-test-job',
            schedule: '*/30 * * * *',
            active: true
          },
          {
            jobid: 3,
            jobname: 'cron-health-check',
            schedule: '*/30 * * * *',
            active: true
          },
          {
            jobid: 4,
            jobname: 'google-ads-token-check-job',
            schedule: '0 */2 * * *',
            active: true
          }
        ]);
      } else {
        console.log("Dados das últimas execuções:", jobsData);
        
        // Converter dados de execuções em estrutura de jobs
        const processedJobs = [
          {
            jobid: 1,
            jobname: 'daily-meta-review-job',
            schedule: '*/6 * * * * (a cada 6 minutos)',
            active: jobsData?.some(j => j.job_name === 'daily-meta-review-job') || true,
            lastExecutionTime: jobsData?.find(j => j.job_name === 'daily-meta-review-job')?.execution_time
          },
          {
            jobid: 2,
            jobname: 'daily-meta-review-test-job',
            schedule: '*/30 * * * * (a cada 30 minutos)',
            active: jobsData?.some(j => j.job_name === 'daily-meta-review-test-job') || true,
            lastExecutionTime: jobsData?.find(j => j.job_name === 'daily-meta-review-test-job')?.execution_time
          },
          {
            jobid: 3,
            jobname: 'cron-health-check',
            schedule: '*/30 * * * * (a cada 30 minutos)',
            active: jobsData?.some(j => j.job_name === 'cron-health-check') || true,
            lastExecutionTime: jobsData?.find(j => j.job_name === 'cron-health-check')?.execution_time
          },
          {
            jobid: 4,
            jobname: 'google-ads-token-check-job',
            schedule: '0 */2 * * * (a cada 2 horas)',
            active: jobsData?.some(j => j.job_name === 'google-ads-token-check-job') || true,
            lastExecutionTime: jobsData?.find(j => j.job_name === 'google-ads-token-check-job')?.execution_time
          },
          {
            jobid: 5,
            jobname: 'cron-status-keeper',
            schedule: '0 * * * * (a cada hora)',
            active: true,
            lastExecutionTime: null
          }
        ];
        
        setJobs(processedJobs || []);
      }
      
      // Buscar últimas execuções
      const { data: execData, error: execError } = await supabase
        .from('cron_execution_logs')
        .select('*')
        .order('execution_time', { ascending: false })
        .limit(30);
      
      if (execError) throw execError;
      console.log("Execuções encontradas:", execData?.length || 0);
      setExecutions(execData || []);
      
      // Buscar logs do sistema relacionados ao cron
      const { data: logsData, error: logsError } = await supabase
        .from('system_logs')
        .select('*')
        .eq('event_type', 'cron_job')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (logsError) throw logsError;
      console.log("Logs do sistema encontrados:", logsData?.length || 0);
      setSystemLogs(logsData || []);
      
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

  // Função para obter cor da badge de status
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
      case 'test_success':
      case 'active':
        return "default";
      case 'error':
        return "destructive";
      case 'started':
      case 'in_progress':
        return "secondary";
      default:
        return "secondary";
    }
  };

  // Função para exibir detalhes da execução como tooltip ou em um formato legível
  const formatExecutionDetails = (details: any) => {
    if (!details) return "Sem detalhes";
    
    const keyInfo = [];
    
    if (details.executeReview === true) keyInfo.push("Executa Revisão: Sim");
    if (details.executeReview === false) keyInfo.push("Executa Revisão: Não");
    if (details.test === true) keyInfo.push("Modo Teste: Sim");
    if (details.test === false) keyInfo.push("Modo Teste: Não");
    if (details.forceExecution === true) keyInfo.push("Forçar Execução: Sim");
    if (details.source) keyInfo.push(`Origem: ${details.source}`);
    if (details.isAutomatic === true) keyInfo.push("Automático: Sim");
    if (details.isAutomatic === false) keyInfo.push("Automático: Não");
    if (details.http_success === true) keyInfo.push("HTTP: Sucesso");
    if (details.http_success === false) keyInfo.push("HTTP: Falha");
    if (details.response_status) keyInfo.push(`HTTP Status: ${details.response_status}`);
    if (details.auto_closed) keyInfo.push("Fechado automaticamente");
    if (details.auto_recreated) keyInfo.push("Recriado automaticamente");
    
    return keyInfo.join(" | ");
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
            test: jobName === "daily-meta-review-test-job",
            forceExecution: true
          }
        })
        .select()
        .single();
      
      if (logError) throw logError;
      
      // Obter sessão para autenticação
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      
      if (!accessToken) {
        throw new Error("Sessão não encontrada. Por favor, faça login novamente");
      }
      
      // Adicionar log do sistema para diagnóstico
      await supabase
        .from("system_logs")
        .insert({
          event_type: "cron_job",
          message: `Execução manual iniciada para ${jobName}`,
          details: {
            timestamp: new Date().toISOString(),
            source: "manual_trigger_ui",
            logId: logEntry.id
          }
        });
      
      // Determinar URL e payload com base no tipo de job
      let functionUrl = "";
      let payload: any = {};
      
      if (jobName === "daily-meta-review-job" || jobName === "daily-meta-review-test-job") {
        functionUrl = `https://socrnutfpqtcjmetskta.supabase.co/functions/v1/daily-meta-review`;
        payload = {
          test: jobName === "daily-meta-review-test-job",
          executeReview: jobName === "daily-meta-review-job",
          source: "manual_trigger",
          logId: logEntry.id,
          forceExecution: true
        };
      } else if (jobName === "google-ads-token-check-job") {
        functionUrl = `https://socrnutfpqtcjmetskta.supabase.co/functions/v1/google-ads-token-check`;
        payload = {
          source: "manual_trigger",
          logId: logEntry.id
        };
      } else if (jobName === "cron-health-check") {
        // Este é um job especial que roda diretamente no banco
        await supabase
          .from("system_logs")
          .insert({
            event_type: "cron_job",
            message: "Verificação manual de saúde do cron",
            details: {
              timestamp: new Date().toISOString(),
              source: "manual_trigger_ui",
              executeCheck: true
            }
          });
          
        // Atualizar status de execuções pendentes
        const { data: updateResult, error: updateError } = await supabase.rpc('get_cron_jobs', {
          job_names: ['daily-meta-review-job', 'daily-meta-review-test-job']
        });
        
        if (updateError) {
          console.log("Verificação manual de jobs:", updateError);
        } else {
          console.log("Status atual dos jobs:", updateResult);
        }
        
        toast({
          title: "Verificação de saúde iniciada",
          description: "A verificação de saúde do cron foi iniciada manualmente.",
        });
        
        // Atualizar logs após a execução
        setTimeout(() => fetchCronData(), 2000);
        
        return;
      } else {
        throw new Error(`Job não suportado para execução manual: ${jobName}`);
      }
      
      console.log("Chamando função Edge:", functionUrl, "com payload:", payload);
      
      // Chamar a função edge
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });
      
      // Log da resposta HTTP bruta
      let responseText = "";
      try {
        responseText = await response.text();
      } catch (e) {
        console.error("Erro ao ler texto da resposta:", e);
      }
      
      // Registrar resposta no log do sistema
      await supabase
        .from("system_logs")
        .insert({
          event_type: "cron_job",
          message: `Resposta da função Edge para execução manual`,
          details: {
            timestamp: new Date().toISOString(),
            statusCode: response.status,
            responseText: responseText,
            jobName: jobName,
            logId: logEntry.id
          }
        });
      
      // Atualizar status do log de execução baseado na resposta
      if (response.ok) {
        // Tentar fazer parse da resposta JSON
        let responseData = {};
        try {
          responseData = JSON.parse(responseText);
        } catch (e) {
          console.error("Erro ao parsear resposta JSON:", e);
        }
        
        await supabase
          .from("cron_execution_logs")
          .update({
            status: "in_progress",
            details: {
              ...logEntry.details,
              http_success: true,
              response_status: response.status,
              response_data: responseData,
              updated_at: new Date().toISOString()
            }
          })
          .eq("id", logEntry.id);
      } else {
        await supabase
          .from("cron_execution_logs")
          .update({
            status: "error",
            details: {
              ...logEntry.details,
              http_success: false,
              response_status: response.status,
              error: responseText,
              updated_at: new Date().toISOString()
            }
          })
          .eq("id", logEntry.id);
      }
      
      let toastMessage = "";
      if (response.ok) {
        toastMessage = response.status === 202
          ? "O job foi iniciado em background. Aguarde alguns segundos e verifique as execuções."
          : "O job foi executado com sucesso. Verifique as execuções.";
      } else {
        toastMessage = `Erro HTTP ${response.status}. Verifique os logs do sistema para mais detalhes.`;
      }
      
      toast({
        title: response.ok ? "Execução iniciada" : "Erro na execução",
        description: toastMessage,
        variant: response.ok ? "default" : "destructive",
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

  // Função para mostrar há quanto tempo ocorreu o evento
  const getTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      
      const seconds = Math.floor(diffMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      
      if (seconds < 60) return `${seconds} segundos atrás`;
      if (minutes < 60) return `${minutes} minutos atrás`;
      if (hours < 24) return `${hours} horas atrás`;
      
      return formatDateTime(dateStr);
    } catch (error) {
      return dateStr;
    }
  };

  // Função para testar manualmente a conexão com a função Edge
  const testEdgeFunction = async () => {
    try {
      setIsLoading(true);
      
      // Obter sessão para autenticação
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      
      if (!accessToken) {
        throw new Error("Sessão não encontrada. Por favor, faça login novamente");
      }
      
      // Chamar a função edge com um payload de ping
      const functionUrl = `https://socrnutfpqtcjmetskta.supabase.co/functions/v1/daily-meta-review`;
      const payload = {
        method: "ping",
        timestamp: new Date().toISOString()
      };
      
      console.log("Testando conectividade com função Edge:", functionUrl);
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });
      
      let responseText = "";
      try {
        responseText = await response.text();
      } catch (e) {
        console.error("Erro ao ler texto da resposta:", e);
      }
      
      // Registrar log do sistema
      await supabase
        .from("system_logs")
        .insert({
          event_type: "cron_job",
          message: "Teste de conectividade com função Edge realizado",
          details: {
            timestamp: new Date().toISOString(),
            response: responseText,
            status: response.status
          }
        });
      
      toast({
        title: "Teste de conectividade realizado",
        description: response.ok 
          ? `A função Edge respondeu com sucesso. Status: ${response.status}`
          : `Erro ao conectar. Status: ${response.status}`,
        variant: response.ok ? "default" : "destructive",
      });
      
      // Atualizar dados após o teste
      fetchCronData();
      
    } catch (error) {
      console.error("Erro no teste de conectividade:", error);
      toast({
        title: "Erro no teste de conectividade",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para forçar a recriação dos jobs cron
  const forceRecreateJobs = async () => {
    try {
      setIsLoading(true);
      
      // Obter sessão para autenticação
      const { data: sessionData } = await supabase.auth.getSession();
      
      // Inserir log para forçar recriação de jobs
      const { data, error } = await supabase
        .from("system_logs")
        .insert({
          event_type: "cron_job",
          message: "Solicitação manual de recriação de jobs cron",
          details: {
            timestamp: new Date().toISOString(),
            recreate_jobs: true,
            force: true,
            source: "manual_ui_trigger",
            user_id: sessionData.session?.user?.id || 'anonymous'
          }
        })
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Solicitação enviada",
        description: "A solicitação de recriação de jobs foi enviada. Aguarde alguns minutos para verificar os resultados.",
      });
      
      // Executar a mesma SQL do cron via RPC (não implementado, requer função SQL)
      
      // Atualizar dados após alguns segundos
      setTimeout(() => fetchCronData(), 3000);
      
    } catch (error) {
      console.error("Erro ao recriar jobs:", error);
      toast({
        title: "Erro ao recriar jobs",
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
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={testEdgeFunction}
            disabled={isLoading}
          >
            <Zap className="h-4 w-4 mr-1" />
            Testar Conexão
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={forceRecreateJobs}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Recriar Jobs
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchCronData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="jobs">Jobs Agendados</TabsTrigger>
            <TabsTrigger value="executions">Execuções Recentes</TabsTrigger>
            <TabsTrigger value="logs">Logs do Sistema</TabsTrigger>
          </TabsList>
          
          <TabsContent value="jobs" className="space-y-4">
            <div className="bg-amber-50 text-amber-800 p-4 rounded-md mb-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Informação importante</p>
                  <p className="text-sm">
                    Os jobs de revisão (daily-meta-review-job) são executados a cada 6 minutos (alterado de 3 para 6). 
                    A execução começa com o status "started", depois passa para "in_progress" e 
                    finalmente "success" quando concluída. Se o status ficar preso em "started" 
                    ou "in_progress" por mais de 30 minutos, o health check irá marcá-lo como erro.
                  </p>
                </div>
              </div>
            </div>
            
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
                    <TableCell>
                      <code className="text-xs bg-gray-100 p-1 rounded">{job.schedule}</code>
                      {job.lastExecutionTime && (
                        <div className="text-xs text-gray-500 mt-1">
                          Última execução: {formatDateTime(job.lastExecutionTime)}
                        </div>
                      )}
                    </TableCell>
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
          </TabsContent>
          
          <TabsContent value="executions">
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions.map((exec) => (
                    <TableRow key={exec.id}>
                      <TableCell className="font-medium">{exec.job_name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{formatDateTime(exec.execution_time)}</span>
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {getTimeAgo(exec.execution_time)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(exec.status)}>
                          {exec.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-sm truncate">
                        <div className="text-xs">
                          {formatExecutionDetails(exec.details)}
                        </div>
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
          </TabsContent>
          
          <TabsContent value="logs">
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mensagem</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.message}</TableCell>
                      <TableCell>{formatDateTime(log.created_at)}</TableCell>
                      <TableCell className="max-w-sm truncate">
                        <div className="text-xs">
                          {log.details && JSON.stringify(log.details).substring(0, 100)}
                          {log.details && JSON.stringify(log.details).length > 100 ? '...' : ''}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {systemLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                        Nenhum log encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
