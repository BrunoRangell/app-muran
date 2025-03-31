
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { formatDateInBrasiliaTz } from "../../summary/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowClockwise, Calendar, Check, RefreshCcw } from "lucide-react";

export function AutoReviewSettings() {
  const [lastAutoRun, setLastAutoRun] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  // Buscar a última execução automática
  const fetchLastAutoRun = async () => {
    try {
      const { data, error } = await supabase
        .from("system_configs")
        .select("value")
        .eq("key", "last_batch_review_time")
        .maybeSingle();
        
      if (!error && data?.value) {
        setLastAutoRun(new Date(data.value));
      }
    } catch (error) {
      console.error("Erro ao buscar última execução automática:", error);
    }
  };

  // Executar revisão manual
  const runManualReview = async () => {
    setIsRunning(true);
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("daily-meta-review", {
        body: { manual: true }
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Revisão em massa iniciada",
        description: "O processo de revisão foi iniciado com sucesso. Isso pode levar alguns minutos.",
      });
      
      setTimeout(() => {
        fetchLastAutoRun();
      }, 5000);
      
    } catch (error) {
      console.error("Erro ao iniciar revisão manual:", error);
      toast({
        title: "Erro ao iniciar revisão",
        description: error instanceof Error ? error.message : "Não foi possível iniciar a revisão em massa.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRunning(false);
    }
  };

  useEffect(() => {
    fetchLastAutoRun();
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Revisão Automática</CardTitle>
        <CardDescription>
          As revisões de orçamento são executadas automaticamente todos os dias às 06:00.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={16} />
            <span>Última execução automática:</span>
            {lastAutoRun ? (
              <span className="font-medium text-gray-900">
                {formatDateInBrasiliaTz(lastAutoRun, "dd 'de' MMMM 'às' HH:mm")}
              </span>
            ) : (
              <span className="italic text-gray-500">Nenhuma execução registrada</span>
            )}
          </div>
          
          <Button 
            onClick={runManualReview} 
            disabled={isLoading || isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <ArrowClockwise className="mr-2 h-4 w-4 animate-spin" />
                Executando revisão...
              </>
            ) : isLoading ? (
              <>
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Executar revisão agora
              </>
            )}
          </Button>
          
          <p className="text-xs text-gray-500 mt-2">
            Esta operação irá executar uma revisão completa de todos os clientes com Meta Ads configurado.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
