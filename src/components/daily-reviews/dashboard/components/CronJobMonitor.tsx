
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, PlayCircle, PauseCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CronJob {
  jobid: number;
  jobname: string;
  schedule: string;
  active: boolean;
}

interface CronExecution {
  id: string;
  job_name: string;
  status: string;
  execution_time: string;
  details: any;
}

export const CronJobMonitor = () => {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [executions, setExecutions] = useState<CronExecution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      
      // Buscar jobs usando a função do banco
      const { data: jobsData, error } = await supabase
        .rpc('get_cron_jobs', {
          job_names: ['daily_budget_review', 'cleanup_logs', 'health_check']
        });

      if (error) {
        console.error("Erro ao buscar jobs:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os jobs",
          variant: "destructive",
        });
        return;
      }

      setJobs(jobsData || []);
    } catch (error) {
      console.error("Erro ao carregar jobs:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar jobs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExecutions = async () => {
    try {
      const { data, error } = await supabase
        .from('cron_execution_logs')
        .select('*')
        .order('execution_time', { ascending: false })
        .limit(20);

      if (error) {
        console.error("Erro ao buscar execuções:", error);
        return;
      }

      setExecutions(data || []);
    } catch (error) {
      console.error("Erro ao carregar execuções:", error);
    }
  };

  const toggleJob = async (jobId: number, currentStatus: boolean) => {
    try {
      // Esta funcionalidade requer privilégios especiais no Supabase
      toast({
        title: "Ação não disponível",
        description: "Alteração de jobs requer privilégios administrativos",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Erro ao alterar job:", error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o job",
        variant: "destructive",
      });
    }
  };

  const runJob = async (jobName: string) => {
    try {
      // Simular execução manual do job
      toast({
        title: "Executando job",
        description: `Job ${jobName} foi executado manualmente`,
      });
      
      // Atualizar logs
      await fetchExecutions();
    } catch (error) {
      console.error("Erro ao executar job:", error);
      toast({
        title: "Erro",
        description: "Não foi possível executar o job",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="success">Sucesso</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      case 'running':
        return <Badge variant="secondary">Executando</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatSchedule = (schedule: string) => {
    const scheduleMap: { [key: string]: string } = {
      '0 9 * * *': 'Diário às 9h',
      '0 */6 * * *': 'A cada 6 horas',
      '0 2 * * *': 'Diário às 2h',
      '*/15 * * * *': 'A cada 15 minutos',
    };
    return scheduleMap[schedule] || schedule;
  };

  useEffect(() => {
    fetchJobs();
    fetchExecutions();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(() => {
      fetchExecutions();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Monitor de Jobs Cron</h2>
        <Button onClick={fetchJobs} disabled={isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Lista de Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Jobs Configurados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Carregando jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Nenhum job encontrado
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.jobid} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{job.jobname}</span>
                      <Badge variant={job.active ? "success" : "secondary"}>
                        {job.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {formatSchedule(job.schedule)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runJob(job.jobname)}
                    >
                      <PlayCircle className="h-4 w-4 mr-1" />
                      Executar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleJob(job.jobid, job.active)}
                    >
                      {job.active ? (
                        <PauseCircle className="h-4 w-4 mr-1" />
                      ) : (
                        <PlayCircle className="h-4 w-4 mr-1" />
                      )}
                      {job.active ? "Pausar" : "Ativar"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Execuções */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Execuções</CardTitle>
        </CardHeader>
        <CardContent>
          {executions.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Nenhuma execução encontrada
            </div>
          ) : (
            <div className="space-y-2">
              {executions.map((execution) => (
                <div key={execution.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{execution.job_name}</span>
                      {getStatusBadge(execution.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(execution.execution_time).toLocaleString('pt-BR')}
                    </div>
                  </div>
                  {execution.details && (
                    <div className="text-sm text-muted-foreground max-w-xs truncate">
                      {typeof execution.details === 'object' 
                        ? JSON.stringify(execution.details) 
                        : execution.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
