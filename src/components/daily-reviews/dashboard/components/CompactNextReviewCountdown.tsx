
import { useState, useEffect, useRef } from "react";
import { Loader, RefreshCw, AlertTriangle, Info, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useMetaReviewService } from "@/components/revisao-nova/hooks/useMetaReviewService";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter
} from "@/components/ui/dialog";

interface CompactNextReviewCountdownProps {
  onAnalyzeAll: () => Promise<void>;
}

export function CompactNextReviewCountdown({ onAnalyzeAll }: CompactNextReviewCountdownProps) {
  const [secondsToNext, setSecondsToNext] = useState<number>(180); // 3 minutos
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [lastRunTime, setLastRunTime] = useState<Date | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { 
    executeAutomaticReview, 
    isLoading, 
    lastConnectionStatus,
    lastErrorMessage,
    lastErrorDetails,
    resetConnectionStatus
  } = useMetaReviewService();

  // Função para atualizar o contador
  const updateCountdown = () => {
    setSecondsToNext(prev => {
      if (prev <= 1) {
        // Quando o contador chegar a zero, executar a revisão automaticamente
        runAutomaticReview();
        return 180; // Reinicia para 3 minutos
      }
      return prev - 1;
    });
  };

  // Função para executar a revisão automaticamente
  const runAutomaticReview = async () => {
    if (isRunning) return;
    
    try {
      console.log("[AutoReview] Executando revisão automática programada");
      setIsRunning(true);
      setErrorDetails(null);
      
      // Usar o serviço dedicado para Meta Review
      const result = await executeAutomaticReview();
      
      if (!result.success) {
        console.error("[AutoReview] Falha na execução automática:", result.error);
        setErrorDetails(String(result.error));
        
        toast({
          title: "Erro na execução automática",
          description: String(result.error),
          variant: "destructive",
        });
        
        // Como falhou, tentar o método alternativo
        try {
          await onAnalyzeAll();
          console.log("[AutoReview] Execução via método alternativo concluída");
          toast({
            title: "Execução alternativa concluída",
            description: "A revisão foi iniciada através do método alternativo.",
          });
        } catch (altError) {
          console.error("[AutoReview] Ambos os métodos falharam:", altError);
          toast({
            title: "Falha em ambos os métodos",
            description: "Não foi possível iniciar a revisão através de nenhum método.",
            variant: "destructive",
          });
        }
      } else {
        console.log("[AutoReview] Execução automática iniciada com sucesso");
        setErrorDetails(null);
        
        toast({
          title: "Revisão automática iniciada",
          description: "A revisão automática foi iniciada com sucesso pelo serviço dedicado.",
        });
      }
      
      // Registrar o horário da última execução
      const now = new Date();
      setLastRunTime(now);
      
      // Forçar atualização dos dados após a conclusão
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
        queryClient.invalidateQueries({ queryKey: ["last-batch-review-info"] });
      }, 5000); // Esperar 5 segundos para garantir que o processamento em segundo plano tenha avançado
      
    } catch (error) {
      console.error("[AutoReview] Erro ao executar revisão automática:", error);
      setErrorDetails(error instanceof Error ? error.message : String(error));
      
      toast({
        title: "Erro na revisão automática",
        description: "Ocorreu um erro ao iniciar a revisão automática.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Executar manualmente a revisão
  const handleManualRun = async () => {
    if (isRunning) return;
    
    try {
      console.log("[AutoReview] Executando revisão manual");
      setIsRunning(true);
      setErrorDetails(null);
      
      // Executar a mesma função que é chamada quando o contador chega a zero
      await onAnalyzeAll();
      
      // Registrar o horário da última execução
      const now = new Date();
      setLastRunTime(now);
      
      // Reiniciar o contador
      setSecondsToNext(180);
      
      // Forçar atualização dos dados após a conclusão
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
        queryClient.invalidateQueries({ queryKey: ["last-batch-review-info"] });
      }, 5000); // Esperar 5 segundos para garantir que o processamento em segundo plano tenha avançado
      
      toast({
        title: "Revisão iniciada",
        description: "A revisão foi iniciada com sucesso.",
      });
    } catch (error) {
      console.error("[AutoReview] Erro ao executar revisão manual:", error);
      setErrorDetails(error instanceof Error ? error.message : String(error));
      
      toast({
        title: "Erro na revisão",
        description: "Ocorreu um erro ao iniciar a revisão.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Resetar status de conexão quando necessário
  const handleResetConnectionStatus = () => {
    resetConnectionStatus();
    setErrorDetails(null);
    toast({
      title: "Status de conexão resetado",
      description: "O status de conexão foi resetado. Tente executar novamente.",
    });
  };

  // Abrir diálogo de detalhes do erro
  const handleOpenErrorDetails = () => {
    setIsErrorDialogOpen(true);
  };

  // Configurar o intervalo quando o componente é montado
  useEffect(() => {
    console.log("[AutoReview] Inicializando contador de revisão automática");
    
    // Limpar qualquer intervalo existente
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Configurar novo intervalo
    intervalRef.current = setInterval(updateCountdown, 1000);
    
    // Limpar o intervalo quando o componente for desmontado
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Formatar o tempo para exibição
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="text-sm">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 justify-between">
          <span className="text-xs text-gray-500">Próxima revisão:</span>
          <span className="font-mono text-xs font-medium">{formatTime(secondsToNext)}</span>
        </div>
        
        <button 
          onClick={handleManualRun} 
          disabled={isRunning || isLoading}
          className="flex items-center justify-center gap-1 text-xs py-1 px-2 rounded bg-[#ff6e00] hover:bg-[#e66300] text-white disabled:opacity-50"
        >
          {isRunning || isLoading ? (
            <Loader className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          Executar Agora
        </button>
        
        {lastConnectionStatus === "error" && (
          <div className="text-[10px] text-red-500 flex items-center mt-1 gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center cursor-help">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Problema de conexão detectado</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[250px] text-xs">
                  <p className="font-semibold">Erro:</p>
                  <p className="text-[10px]">{lastErrorMessage || "Erro na conexão com a função Edge"}</p>
                  <p className="mt-1 text-[10px]">Clique no botão abaixo para resetar o status.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <button 
              onClick={handleOpenErrorDetails}
              className="text-[10px] text-blue-500 hover:text-blue-700 underline ml-auto"
            >
              Detalhes
            </button>
            
            <button 
              onClick={handleResetConnectionStatus}
              className="text-[10px] text-blue-500 hover:text-blue-700 underline"
            >
              Resetar
            </button>
          </div>
        )}
        
        {errorDetails && (
          <div className="text-[10px] bg-red-50 border border-red-200 p-1 rounded mt-1">
            <div className="flex items-center">
              <Info className="h-3 w-3 text-red-500 mr-1" />
              <span className="font-semibold text-red-600">Detalhes do erro:</span>
            </div>
            <p className="text-red-600 mt-0.5 break-all">{errorDetails}</p>
          </div>
        )}
        
        {lastRunTime && (
          <div className="text-[10px] text-gray-500 mt-1">
            Última execução: {lastRunTime.toLocaleTimeString()}
          </div>
        )}
      </div>

      <Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Problema de conexão detectado
            </DialogTitle>
            <DialogDescription>
              Detalhes do erro para ajudar na solução do problema
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-2">
            <div className="bg-red-50 p-3 rounded border border-red-200">
              <h4 className="font-medium text-red-800 mb-1">Mensagem de erro:</h4>
              <p className="text-sm text-red-700">{lastErrorMessage || "Erro na conexão com a função Edge"}</p>
            </div>
            
            {lastErrorDetails && (
              <div className="space-y-2">
                {lastErrorDetails.type && (
                  <div>
                    <h4 className="font-medium text-gray-700">Tipo de erro:</h4>
                    <p className="text-sm">{lastErrorDetails.type}</p>
                  </div>
                )}
                
                {lastErrorDetails.message && (
                  <div>
                    <h4 className="font-medium text-gray-700">Detalhes:</h4>
                    <p className="text-sm">{lastErrorDetails.message}</p>
                  </div>
                )}
                
                {lastErrorDetails.suggestions && (
                  <div>
                    <h4 className="font-medium text-gray-700">Sugestões:</h4>
                    <ul className="text-sm list-disc pl-5 space-y-1">
                      {lastErrorDetails.suggestions.map((suggestion: string, index: number) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-1">Solução para "Unexpected end of JSON input":</h4>
              <ul className="text-sm text-blue-700 list-disc pl-5 space-y-1">
                <li>Verifique se a função Edge está publicada corretamente</li>
                <li>Tente republicar a função Edge no console do Supabase</li>
                <li>Verifique os logs da função Edge para identificar o erro exato</li>
                <li>Verifique se os parâmetros enviados estão corretos</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter className="flex sm:justify-between">
            <Button 
              variant="outline" 
              onClick={handleResetConnectionStatus}
              className="mt-2 sm:mt-0"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Resetar Status
            </Button>
            
            <DialogClose asChild>
              <Button className="bg-[#ff6e00] hover:bg-[#e66300] text-white">
                Fechar
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
