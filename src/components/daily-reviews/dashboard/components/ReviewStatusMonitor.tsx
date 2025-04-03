
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

export function ReviewStatusMonitor() {
  const [lastExecution, setLastExecution] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState<any>(null);
  const { toast } = useToast();

  const loadReviewStatus = async () => {
    try {
      setIsLoading(true);
      
      // Fetch last execution log
      const { data: executions, error: execError } = await supabase
        .from('cron_execution_logs')
        .select('*')
        .eq('job_name', 'daily-meta-review-job')
        .order('execution_time', { ascending: false })
        .limit(1)
        .single();
      
      if (execError) throw execError;
      setLastExecution(executions);

      // Get batch progress
      const { data: batchInfo } = await supabase
        .from("system_configs")
        .select("value")
        .eq("key", "batch_review_progress")
        .single();

      if (batchInfo?.value) {
        setBatchProgress(batchInfo.value);
      } else {
        setBatchProgress(null);
      }
      
    } catch (error) {
      console.error("Erro ao carregar status da revisão:", error);
      toast({
        title: "Erro ao carregar status",
        description: "Não foi possível obter informações da revisão.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerManualReview = async () => {
    try {
      setIsLoading(true);
      
      await supabase.functions.invoke("daily-meta-review", {
        body: {
          executeReview: true,
          manual: true,
          timestamp: new Date().toISOString()
        }
      });
      
      toast({
        title: "Revisão iniciada",
        description: "A revisão automática foi iniciada manualmente.",
      });
      
      setTimeout(loadReviewStatus, 2000);
      
    } catch (error) {
      console.error("Erro ao iniciar revisão manual:", error);
      toast({
        title: "Erro ao iniciar revisão",
        description: "Não foi possível iniciar a revisão automática.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviewStatus();
    
    const interval = setInterval(loadReviewStatus, 30000); // Atualiza a cada 30 segundos
    
    return () => clearInterval(interval);
  }, []);

  const isBatchInProgress = batchProgress && 
                            batchProgress.status === 'running' &&
                            (new Date().getTime() - new Date(batchProgress.startTime).getTime()) < 15 * 60 * 1000;

  const progressPercentage = isBatchInProgress && batchProgress.totalClients
    ? Math.min(Math.round((batchProgress.processedClients / batchProgress.totalClients) * 100), 100)
    : 0;

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-gray-700">Status da Revisão</h3>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={loadReviewStatus} 
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {lastExecution && (
        <div className="text-xs text-gray-600 mb-2">
          Última execução: {new Date(lastExecution.execution_time).toLocaleString()}
        </div>
      )}

      {isBatchInProgress && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium">Progresso da análise</span>
            <span className="text-xs text-gray-500">
              {batchProgress.processedClients || 0} de {batchProgress.totalClients} ({progressPercentage}%)
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2" 
            indicatorClassName="bg-[#ff6e00]" 
          />
        </div>
      )}

      <Button 
        onClick={triggerManualReview} 
        disabled={isLoading || isBatchInProgress}
        className="w-full mt-4 bg-[#ff6e00] hover:bg-[#e66300]"
      >
        {isLoading ? "Processando..." : "Iniciar Revisão Manual"}
      </Button>

      {lastExecution?.status === 'error' && (
        <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-3">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-xs text-red-700">
              Última revisão encontrou um erro
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
