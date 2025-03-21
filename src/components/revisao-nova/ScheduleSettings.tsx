
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';

export const ScheduleSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
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
          throw error;
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
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-4">
        <Button 
          variant="outline" 
          onClick={handleRunNow}
          disabled={isTesting || isSaving}
        >
          {isTesting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
          Executar Agora
        </Button>
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
