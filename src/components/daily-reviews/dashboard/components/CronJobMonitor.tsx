import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { PlayCircle, PauseCircle, RefreshCw, Clock, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface CronJob {
  jobid: number;
  jobname: string;
  schedule: string;
  active: boolean;
}

interface ExecutionLog {
  id: string;
  job_name: string;
  status: string;
  execution_time: string;
  details?: any;
}

export const CronJobMonitor = () => {
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const fetchCronJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('cron_jobs')
        .select('*')
        .order('jobid', { ascending: true });

      if (error) throw error;

      setCronJobs(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: `Erro ao buscar jobs: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const fetchExecutionLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('cron_execution_logs')
        .select('*')
        .order('execution_time', { ascending: false });

      if (error) throw error;

      setExecutionLogs(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: `Erro ao buscar logs: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const updateJobStatus = async (jobName: string, enable: boolean) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase.rpc('update_cron_job_status', {
        job_name: jobName,
        enabled: enable
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Job ${enable ? 'ativado' : 'desativado'} com sucesso`,
      });

      await fetchCronJobs();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: `Erro ao ${enable ? 'ativar' : 'desativar'} job: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const triggerJob = async (jobName: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase.rpc('trigger_cron_job', {
        job_name: jobName
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Job executado com sucesso",
      });

      await fetchExecutionLogs();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: `Erro ao executar job: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await fetchCronJobs();
      await fetchExecutionLogs();
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const handleJobToggle = async (job: CronJob) => {
    await updateJobStatus(job.jobname, !job.active);
  };

  const handleJobTrigger = async (job: CronJob) => {
    await triggerJob(job.jobname);
  };

  const formatSchedule = (schedule: string) => {
    // Conversão básica de cron para português
    const scheduleMap: Record<string, string> = {
      '0 9 * * *': 'Diariamente às 9:00',
      '*/5 * * * *': 'A cada 5 minutos',
      '0 */2 * * *': 'A cada 2 horas',
      '0 0 * * 0': 'Semanalmente aos domingos',
      '0 0 1 * *': 'Mensalmente no dia 1'
    };
    
    return scheduleMap[schedule] || schedule;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monitor de Jobs Automáticos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Carregando informações dos jobs...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Monitor de Jobs Automáticos</CardTitle>
          <Button 
            variant="outline" 
            onClick={() => {
              fetchCronJobs();
              fetchExecutionLogs();
            }}
            disabled={isUpdating}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          {cronJobs.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhum job automático configurado no sistema.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {cronJobs.map((job) => (
                <div key={job.jobid} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{job.jobname}</h4>
                        <Badge variant={job.active ? "default" : "secondary"}>
                          {job.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {formatSchedule(job.schedule)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleJobTrigger(job)}
                        disabled={isUpdating}
                      >
                        <PlayCircle className="h-4 w-4 mr-1" />
                        Executar
                      </Button>
                      <Button
                        variant={job.active ? "destructive" : "default"}
                        size="sm"
                        onClick={() => handleJobToggle(job)}
                        disabled={isUpdating}
                      >
                        {job.active ? (
                          <>
                            <PauseCircle className="h-4 w-4 mr-1" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <PlayCircle className="h-4 w-4 mr-1" />
                            Ativar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Execuções</CardTitle>
        </CardHeader>
        <CardContent>
          {executionLogs.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhuma execução registrada ainda.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {executionLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(log.status)}
                    <div>
                      <p className="font-medium">{log.job_name}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(log.execution_time).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(log.status)}>
                    {log.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
