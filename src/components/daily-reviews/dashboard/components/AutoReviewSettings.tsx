
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AutoReviewTest } from "./AutoReviewTest";
import { DebugTools } from "./DebugTools";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle, InfoIcon, RefreshCw, Activity } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function AutoReviewSettings() {
  const [selectedTab, setSelectedTab] = useState("monitor");
  const [isCheckingJobs, setIsCheckingJobs] = useState(false);
  const [cronJobs, setCronJobs] = useState<any[]>([]);
  const [recentExecutions, setRecentExecutions] = useState<any[]>([]);
  const [isLoadingExecutions, setIsLoadingExecutions] = useState(false);
  const { toast } = useToast();

  // Função para verificar os jobs do cron diretamente na base de dados
  const checkCronJobs = async () => {
    try {
      setIsCheckingJobs(true);
      
      // Usar a função existente para buscar a expressão cron
      const { data: reviewJobData, error: reviewJobError } = await supabase.rpc('get_cron_expression', {
        job_name: 'daily-meta-review-job'
      });
      
      if (reviewJobError) throw reviewJobError;
      
      const { data: testJobData, error: testJobError } = await supabase.rpc('get_cron_expression', {
        job_name: 'daily-meta-review-test-job'
      });
      
      if (testJobError) throw testJobError;
      
      // Formatar os dados
      const jobs = [
        {
          name: 'daily-meta-review-job',
          description: 'Execução real da revisão diária',
          schedule: reviewJobData?.length > 0 ? reviewJobData[0].cron_expression : 'Não encontrado',
          status: reviewJobData?.length > 0 ? 'Ativo' : 'Inativo'
        },
        {
          name: 'daily-meta-review-test-job',
          description: 'Teste da revisão diária',
          schedule: testJobData?.length > 0 ? testJobData[0].cron_expression : 'Não encontrado',
          status: testJobData?.length > 0 ? 'Ativo' : 'Inativo'
        }
      ];
      
      setCronJobs(jobs);
      
      toast({
        title: "Jobs do cron verificados",
        description: `Foram encontrados ${jobs.filter(j => j.status === 'Ativo').length} jobs ativos.`,
      });
    } catch (error) {
      console.error("Erro ao verificar jobs do cron:", error);
      toast({
        title: "Erro ao verificar jobs do cron",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsCheckingJobs(false);
    }
  };

  // Nova função para buscar execuções recentes
  const fetchRecentExecutions = async () => {
    try {
      setIsLoadingExecutions(true);
      
      // Buscar as execuções mais recentes
      const { data, error } = await supabase
        .from('cron_execution_logs')
        .select('*')
        .in('job_name', ['daily-meta-review-job', 'daily-meta-review-test-job'])
        .order('execution_time', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      setRecentExecutions(data || []);
    } catch (error) {
      console.error("Erro ao buscar execuções recentes:", error);
      toast({
        title: "Erro ao buscar execuções",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoadingExecutions(false);
    }
  };

  // Carregar os jobs quando o componente for montado
  useEffect(() => {
    checkCronJobs();
    fetchRecentExecutions();
  }, []);

  // Função para formatar data
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy, HH:mm:ss", { locale: ptBR });
    } catch (error) {
      return "Data inválida";
    }
  };

  // Função para obter a classe de cor com base no status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
      case 'partial_success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'started':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para extrair mensagem dos detalhes
  const getExecutionDetails = (execution: any) => {
    if (!execution.details) return null;
    
    const details = typeof execution.details === 'string' 
      ? JSON.parse(execution.details) 
      : execution.details;
    
    return {
      message: details.message || "",
      source: details.source || "",
      isAutomatic: details.isAutomatic,
      executeReview: details.executeReview,
      test: details.test
    };
  };

  // Função para atualizar manualmente
  const refreshMonitoring = () => {
    checkCronJobs();
    fetchRecentExecutions();
  };

  return (
    <div className="space-y-6">
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="monitor">Monitoramento</TabsTrigger>
          <TabsTrigger value="executions">Execuções Recentes</TabsTrigger>
          <TabsTrigger value="jobs">Jobs Agendados</TabsTrigger>
          <TabsTrigger value="support">Suporte Técnico</TabsTrigger>
        </TabsList>
        
        <TabsContent value="monitor">
          <AutoReviewTest />
        </TabsContent>
        
        <TabsContent value="executions">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle>Monitoramento de Execuções</CardTitle>
                <CardDescription>
                  Lista das execuções mais recentes dos jobs do cron
                </CardDescription>
              </div>
              <Button 
                onClick={refreshMonitoring} 
                variant="outline" 
                size="sm" 
                disabled={isLoadingExecutions}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingExecutions ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4 bg-blue-50 border-blue-200">
                <Activity className="h-4 w-4 text-blue-500" />
                <AlertTitle>Monitoramento de Execuções</AlertTitle>
                <AlertDescription className="text-xs">
                  Esta aba mostra as execuções mais recentes dos jobs do cron. As execuções reais (daily-meta-review-job) devem ocorrer a cada 3 minutos,
                  enquanto os testes (daily-meta-review-test-job) ocorrem a cada 30 minutos.
                </AlertDescription>
              </Alert>
              
              {isLoadingExecutions ? (
                <div className="flex justify-center items-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : recentExecutions.length > 0 ? (
                <div className="space-y-4">
                  {recentExecutions.map((execution) => {
                    const details = getExecutionDetails(execution);
                    const isRealExecution = execution.job_name === 'daily-meta-review-job';
                    const jobType = isRealExecution ? 'Execução Real' : 'Teste';
                    
                    return (
                      <div key={execution.id} className={`border rounded-md p-4 ${
                        isRealExecution ? 'border-l-4 border-l-muran-primary' : ''
                      }`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{execution.job_name}</h3>
                            <p className="text-sm text-gray-500">
                              {jobType} {details?.test === true ? '(Modo Teste)' : ''}
                            </p>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            getStatusColor(execution.status)
                          }`}>
                            {execution.status}
                          </div>
                        </div>
                        <div className="mt-2 text-sm space-y-1">
                          <p><span className="font-medium">Data:</span> {formatDate(execution.execution_time)}</p>
                          {details?.message && (
                            <p><span className="font-medium">Mensagem:</span> {details.message}</p>
                          )}
                          {details?.source && (
                            <p><span className="font-medium">Fonte:</span> {details.source}</p>
                          )}
                          {details !== null && (
                            <div className="mt-2 pt-2 border-t text-xs text-gray-500">
                              <p>Execução {details.isAutomatic ? 'Automática' : 'Manual'} | 
                                 {details.executeReview === true ? ' Execução Real' : ' Sem Execução'} | 
                                 {details.test === true ? ' Modo Teste' : ' Modo Normal'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>Nenhuma execução encontrada. Clique em "Atualizar" para verificar novamente.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="support">
          <DebugTools />
        </TabsContent>
        
        <TabsContent value="jobs">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Jobs Agendados no Cron</CardTitle>
              <CardDescription>
                Status dos jobs agendados para revisão automática no banco de dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4 bg-blue-50 border-blue-200">
                <InfoIcon className="h-4 w-4 text-blue-500" />
                <AlertTitle>Informação sobre os Jobs</AlertTitle>
                <AlertDescription className="text-xs">
                  O job <code>daily-meta-review-job</code> é responsável pelas execuções reais e deve estar configurado para rodar a cada 3 minutos.
                  O job <code>daily-meta-review-test-job</code> é usado apenas para testes e deve estar configurado para rodar a cada 30 minutos.
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-end mb-4">
                <Button 
                  onClick={checkCronJobs}
                  disabled={isCheckingJobs}
                  size="sm"
                  variant="outline"
                >
                  <Clock className={`mr-2 h-4 w-4 ${isCheckingJobs ? 'animate-spin' : ''}`} />
                  Verificar Jobs
                </Button>
              </div>
              
              {cronJobs.length > 0 ? (
                <div className="space-y-4">
                  {cronJobs.map((job) => (
                    <div key={job.name} className="border rounded-md p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{job.name}</h3>
                          <p className="text-sm text-gray-500">{job.description}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          job.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {job.status}
                        </div>
                      </div>
                      <div className="mt-2 text-sm">
                        <p><span className="font-medium">Agenda:</span> {job.schedule}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>Nenhum job do cron verificado. Clique em "Verificar Jobs" para ver os detalhes.</p>
                </div>
              )}
              
              <Alert className="mt-4 bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertTitle>Troubleshooting</AlertTitle>
                <AlertDescription className="text-xs">
                  Se os jobs não estiverem sendo executados corretamente, verifique:
                  <ul className="list-disc pl-4 mt-1">
                    <li>Se a extensão pg_cron está ativa no banco de dados</li>
                    <li>Se os jobs foram registrados corretamente no arquivo cron.sql</li>
                    <li>Se os parâmetros passados para a função Edge incluem executeReview=true e test=false</li>
                    <li>Se há logs de erros na execução do cron na tabela system_logs</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
