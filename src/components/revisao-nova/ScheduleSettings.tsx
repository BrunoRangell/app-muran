
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader, Calendar, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';

export const ScheduleSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const { toast } = useToast();

  // Carregar configurações atuais
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("scheduled_tasks")
          .select("*")
          .eq("task_name", "daily_budget_review")
          .single();

        if (error) {
          console.error("Erro ao buscar configurações:", error);
          // Se o erro for 'não encontrado', é porque ainda não temos configuração
          if (error.code === 'PGRST116') {
            // Criar configuração padrão
            const { error: insertError } = await supabase
              .from("scheduled_tasks")
              .insert({
                task_name: "daily_budget_review",
                schedule: "0 9 * * *", // 6h horário de Brasília (9h UTC)
                is_active: true,
                config: {
                  timezone: "UTC",
                  localTime: "06:00 America/Sao_Paulo"
                }
              });

            if (insertError) {
              throw insertError;
            }

            setIsActive(true);
            return;
          } else {
            throw error;
          }
        }

        setIsActive(data.is_active);
        setLastRun(data.last_run ? new Date(data.last_run) : null);
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
        toast({
          title: "Erro ao carregar configurações",
          description: "Não foi possível carregar as configurações de agendamento.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);

  // Salvar configurações
  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from("scheduled_tasks")
        .update({ is_active: isActive })
        .eq("task_name", "daily_budget_review");

      if (error) {
        throw error;
      }

      toast({
        title: "Configurações salvas",
        description: isActive 
          ? "Revisões automáticas ativadas com sucesso." 
          : "Revisões automáticas desativadas.",
      });
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast({
        title: "Erro ao salvar configurações",
        description: "Não foi possível salvar as configurações de agendamento.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Verificar status do agendamento
  const handleCheckStatus = async () => {
    try {
      setIsTesting(true);
      
      toast({
        title: "Verificando status",
        description: "Verificando o status do agendamento...",
      });

      const { data, error } = await supabase.functions.invoke("scheduled-reviews", {
        body: { method: "check" }
      });

      if (error) {
        throw error;
      }

      console.log("Resultado da verificação:", data);
      setTestResult(data);
      
      toast({
        title: "Verificação concluída",
        description: data.message || "Verificação concluída com sucesso",
      });
    } catch (error) {
      console.error("Erro ao verificar status:", error);
      toast({
        title: "Erro na verificação",
        description: "Não foi possível verificar o status do agendamento.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Executar revisão agora
  const handleRunNow = async () => {
    try {
      setIsTesting(true);
      
      toast({
        title: "Iniciando revisão automática",
        description: "A revisão em massa está sendo executada em segundo plano.",
      });

      const { data, error } = await supabase.functions.invoke("scheduled-reviews", {
        body: { method: "force-run" }
      });

      if (error) {
        throw error;
      }

      console.log("Resultado da revisão:", data);
      
      // Atualizar o último horário de execução
      const now = new Date();
      setLastRun(now);

      toast({
        title: "Revisão concluída",
        description: data.message || "A revisão em massa foi executada com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao executar revisão:", error);
      toast({
        title: "Erro na revisão",
        description: "Não foi possível executar a revisão em massa.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Nunca executado";
    return format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muran-primary" />
            Configurações de Agendamento
          </CardTitle>
          <CardDescription>
            Configure as revisões automáticas diárias
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex justify-center py-4">
            <Loader className="h-6 w-6 animate-spin text-muran-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muran-primary" />
          Configurações de Agendamento
        </CardTitle>
        <CardDescription>
          Configure as revisões automáticas diárias
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Agendamento Diário</div>
              <div className="text-xs text-gray-500">Executar revisões automáticas todos os dias às 6h da manhã (horário de Brasília)</div>
            </div>
            <Switch 
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isSaving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Status</div>
              <div className="text-xs text-gray-500">Estado atual do agendamento</div>
            </div>
            <Badge variant={isActive ? "default" : "outline"}>
              {isActive ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Última Execução</div>
              <div className="text-xs text-gray-500">Data e hora da última revisão automática</div>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Clock size={14} className="text-gray-500" />
              {formatDate(lastRun)}
            </div>
          </div>
          
          {testResult && (
            <div className="bg-gray-50 p-3 rounded-md border border-gray-100 mt-4">
              <div className="text-sm font-medium mb-1 flex items-center gap-1">
                <AlertCircle size={16} className="text-muran-primary" />
                Resultado da verificação:
              </div>
              <div className="text-xs text-gray-600">
                <div><span className="font-medium">Status:</span> {testResult.shouldRun ? "Executaria agora" : "Não executaria agora"}</div>
                <div><span className="font-medium">Mensagem:</span> {testResult.message}</div>
                <div><span className="font-medium">Timestamp:</span> {new Date(testResult.timestamp).toLocaleString('pt-BR')}</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-4">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRunNow}
            disabled={isTesting || isSaving}
          >
            {isTesting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            Executar Agora
          </Button>
          <Button 
            variant="outline" 
            onClick={handleCheckStatus}
            disabled={isTesting || isSaving}
          >
            {isTesting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            Verificar Status
          </Button>
        </div>
        <Button 
          onClick={handleSaveSettings}
          disabled={isSaving || isTesting}
        >
          {isSaving && <Loader className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Configurações
        </Button>
      </CardFooter>
    </Card>
  );
};
