
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CompactNextReviewCountdown } from './CompactNextReviewCountdown';
import { useBatchReview } from '../../hooks/useBatchReview';

export function CronScheduleMonitor() {
  const [lastExecution, setLastExecution] = useState<string | null>(null);
  const [nextExecution, setNextExecution] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Usando o hook useBatchReview para acessar a função que inicia a revisão em lote
  const { reviewAllClients } = useBatchReview();
  
  const fetchCronStatus = async () => {
    try {
      console.log("[CronMonitor] Verificando status do agendamento");
      setLoading(true);
      
      const { data: logData, error: logError } = await supabase
        .from('cron_execution_logs')
        .select('created_at, details')
        .eq('job_name', 'daily-meta-review-job')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (logError) {
        console.error("[CronMonitor] Erro ao buscar logs de execução:", logError);
        throw logError;
      }
      
      if (logData && logData.length > 0) {
        console.log("[CronMonitor] Encontrado log de execução:", logData[0]);
        setLastExecution(logData[0].created_at);
      } else {
        console.log("[CronMonitor] Nenhum log de execução encontrado");
      }
      
      // Buscar próxima execução agendada
      const { data: configData, error: configError } = await supabase
        .from('system_configs')
        .select('value')
        .eq('key', 'next_scheduled_review')
        .maybeSingle();
      
      if (configError) {
        console.error("[CronMonitor] Erro ao buscar próxima execução agendada:", configError);
      } else if (configData?.value) {
        console.log("[CronMonitor] Próxima execução agendada:", configData.value);
        setNextExecution(configData.value);
      } else {
        console.log("[CronMonitor] Nenhuma data de próxima execução encontrada");
      }
    } catch (error) {
      console.error("[CronMonitor] Erro ao verificar status do agendamento:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAnalyzeAll = async () => {
    console.log("[CronMonitor] Iniciando análise em lote a partir do CronScheduleMonitor");
    try {
      // Usando a mesma função que o botão "Analisar todos" usa
      await reviewAllClients();
      console.log("[CronMonitor] Análise em lote concluída com sucesso");
      
      // Atualizar informações após execução
      setTimeout(() => {
        console.log("[CronMonitor] Atualizando informações após execução");
        fetchCronStatus();
      }, 5000);
    } catch (error) {
      console.error("[CronMonitor] Erro ao executar análise em lote:", error);
    }
  };
  
  useEffect(() => {
    fetchCronStatus();
    
    // Verificar status periodicamente a cada 5 minutos
    const interval = setInterval(() => {
      console.log("[CronMonitor] Verificação periódica do status do agendamento");
      fetchCronStatus();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
      <div className="flex justify-between items-center">
        <div className="text-sm">
          <h4 className="font-medium mb-1">Revisão automática</h4>
          {loading ? (
            <div className="text-xs text-gray-500">Verificando status...</div>
          ) : (
            <div className="text-xs text-gray-500">
              {lastExecution ? (
                <>Última: {new Date(lastExecution).toLocaleString('pt-BR')}</>
              ) : (
                <>Nenhuma revisão automática registrada</>
              )}
            </div>
          )}
        </div>
        
        <div className="border-l pl-3">
          <CompactNextReviewCountdown onAnalyzeAll={handleAnalyzeAll} />
        </div>
      </div>
    </div>
  );
}
