
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader, UploadCloud, Database, Zap } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export function CronDiagnostics() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState("logs");
  const { toast } = useToast();

  // Função para executar diagnóstico detalhado dos jobs cron
  const runDiagnostics = async () => {
    try {
      setIsLoading(true);
      
      // Buscar status atual dos jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('cron.job')
        .select('jobid, jobname, schedule, active')
        .in('jobname', ['daily-meta-review-job', 'daily-meta-review-test-job']);
      
      // Buscar logs recentes do sistema
      const { data: logsData, error: logsError } = await supabase
        .from('system_logs')
        .select('*')
        .eq('event_type', 'cron_job')
        .order('created_at', { ascending: false })
        .limit(10);
      
      // Buscar logs de execução recentes
      const { data: execData, error: execError } = await supabase
        .from('cron_execution_logs')
        .select('*')
        .in('job_name', ['daily-meta-review-job', 'daily-meta-review-test-job'])
        .order('execution_time', { ascending: false })
        .limit(10);
      
      // Verificar se há erros nas consultas
      if (jobsError) throw jobsError;
      if (logsError) throw logsError;
      if (execError) throw execError;
      
      // Montar resultado do diagnóstico
      const diagnosticResult = {
        jobs: jobsData || [],
        logs: logsData || [],
        executions: execData || [],
        timestamp: new Date().toISOString()
      };
      
      setResult(diagnosticResult);
      
      toast({
        title: "Diagnóstico completo",
        description: `Foram encontrados ${diagnosticResult.jobs.length} jobs e ${diagnosticResult.logs.length} logs recentes.`,
      });
    } catch (error) {
      console.error("Erro no diagnóstico:", error);
      toast({
        title: "Erro no diagnóstico",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Diagnóstico do Cron</CardTitle>
        <CardDescription>
          Ferramentas avançadas para diagnóstico dos jobs do cron
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={isLoading}
          className="w-full bg-muran-primary hover:bg-muran-primary/90 text-white"
        >
          {isLoading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Executando diagnóstico...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Executar Diagnóstico Completo
            </>
          )}
        </Button>
        
        {result && (
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="w-full">
              <TabsTrigger value="jobs">Jobs ({result.jobs.length})</TabsTrigger>
              <TabsTrigger value="logs">Logs ({result.logs.length})</TabsTrigger>
              <TabsTrigger value="executions">Execuções ({result.executions.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="jobs" className="mt-4">
              <div className="space-y-3 max-h-60 overflow-auto">
                {result.jobs.map((job: any) => (
                  <div key={job.jobid} className="border p-3 rounded-md">
                    <div className="flex justify-between">
                      <div className="font-medium">{job.jobname}</div>
                      <Badge variant={job.active ? "default" : "destructive"}>
                        {job.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="text-sm mt-1 text-gray-600">
                      <p>Schedule: <code>{job.schedule}</code></p>
                    </div>
                  </div>
                ))}
                {result.jobs.length === 0 && (
                  <Alert variant="destructive">
                    <AlertTitle>Nenhum job encontrado!</AlertTitle>
                    <AlertDescription>
                      Os jobs de cron não foram encontrados na tabela cron.job.
                      Isso pode indicar que a extensão pg_cron não está ativa ou os jobs não foram registrados corretamente.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="logs" className="mt-4">
              <div className="space-y-3 max-h-60 overflow-auto">
                {result.logs.map((log: any) => (
                  <div key={log.id} className="border p-3 rounded-md text-xs">
                    <div className="font-medium">{log.message}</div>
                    <div className="text-gray-500 mt-1">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                    {log.details && (
                      <div className="mt-2 pt-2 border-t text-gray-600">
                        <pre className="whitespace-pre-wrap text-xs">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
                {result.logs.length === 0 && (
                  <Alert>
                    <AlertTitle>Nenhum log encontrado</AlertTitle>
                    <AlertDescription>
                      Não foram encontrados logs recentes relacionados ao cron.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="executions" className="mt-4">
              <div className="space-y-3 max-h-60 overflow-auto">
                {result.executions.map((exec: any) => (
                  <div key={exec.id} className="border p-3 rounded-md text-xs">
                    <div className="flex justify-between">
                      <div className="font-medium">{exec.job_name}</div>
                      <Badge variant={
                        exec.status === 'completed' || exec.status === 'success' ? "default" : 
                        exec.status === 'error' ? "destructive" : 
                        "default"
                      }>
                        {exec.status}
                      </Badge>
                    </div>
                    <div className="text-gray-500 mt-1">
                      {new Date(exec.execution_time).toLocaleString()}
                    </div>
                    {exec.details && (
                      <div className="mt-2 pt-2 border-t text-gray-600">
                        <pre className="whitespace-pre-wrap text-xs">
                          {JSON.stringify(exec.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
                {result.executions.length === 0 && (
                  <Alert>
                    <AlertTitle>Nenhuma execução encontrada</AlertTitle>
                    <AlertDescription>
                      Não foram encontrados registros de execução para os jobs de cron.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
