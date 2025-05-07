
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Edit, Trash2, Power, PowerOff, RefreshCw } from "lucide-react";
import { CustomBudget } from "../hooks/useCustomBudgets";
import { formatCurrency } from "@/utils/formatters";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface CustomBudgetCardProps {
  budget: CustomBudget;
  onEdit: (budget: CustomBudget) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
  isDeleting?: boolean;
  isToggling?: boolean;
}

export function CustomBudgetCard({
  budget,
  onEdit,
  onDelete,
  onToggleStatus,
  isDeleting,
  isToggling,
}: CustomBudgetCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Carregar informações do cliente e da conta específica (se houver)
  const { data: clientData, isLoading: isLoadingClient } = useQuery({
    queryKey: ['client-for-budget', budget.clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('company_name')
        .eq('id', budget.clientId)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  });
  
  // Se o orçamento estiver associado a uma conta específica, buscar os detalhes da conta
  const { data: accountData, isLoading: isLoadingAccount } = useQuery({
    queryKey: ['account-for-budget', budget.accountId, budget.platform],
    queryFn: async () => {
      if (!budget.accountId) return null;
      
      const tableName = budget.platform === 'meta' 
        ? 'client_meta_accounts' 
        : 'client_google_accounts';
      
      const { data, error } = await supabase
        .from(tableName)
        .select('account_name')
        .eq('account_id', budget.accountId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!budget.accountId
  });

  // Função para calcular o número de dias no período do orçamento
  const getDaysInPeriod = () => {
    const startDate = new Date(budget.startDate);
    const endDate = new Date(budget.endDate);
    
    // +1 para incluir o dia inicial e final na contagem
    return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  // Função para calcular o orçamento diário
  const getDailyBudget = () => {
    const days = getDaysInPeriod();
    return days > 0 ? budget.budgetAmount / days : 0;
  };

  // Função para verificar se o orçamento está ativo hoje
  const isActivePeriod = () => {
    const today = new Date().toISOString().split('T')[0];
    return (
      budget.startDate <= today && 
      budget.endDate >= today
    );
  };

  // Função para formatar a exibição de datas
  const formatDateRange = () => {
    const startDate = new Date(budget.startDate);
    const endDate = new Date(budget.endDate);
    
    return `${format(startDate, "dd/MM/yyyy", { locale: ptBR })} - ${format(endDate, "dd/MM/yyyy", { locale: ptBR })}`;
  };

  // Determinar a cor do badge da plataforma
  const getPlatformBadgeColor = () => {
    return budget.platform === 'meta' ? 'bg-blue-500' : 'bg-red-500';
  };

  // Obter informações da conta
  const getAccountInfo = () => {
    if (isLoadingAccount || !budget.accountId) return null;
    
    return accountData?.account_name || 'Conta Específica';
  };

  // Renderizar o badge de recorrência se aplicável
  const renderRecurrenceBadge = () => {
    if (!budget.isRecurring) return null;
    
    const getRecurrenceLabel = () => {
      switch (budget.recurrencePattern) {
        case 'weekly': return 'Semanal';
        case 'biweekly': return 'Quinzenal';
        case 'monthly': return 'Mensal';
        case 'custom': return 'Personalizado';
        default: return 'Recorrente';
      }
    };
    
    return (
      <Badge variant="outline" className="ml-2 border-purple-300 text-purple-700 flex items-center gap-1">
        <RefreshCw className="h-3 w-3" />
        {getRecurrenceLabel()}
      </Badge>
    );
  };

  return (
    <>
      <Card className={`shadow-sm hover:shadow-md transition-shadow ${!budget.isActive && 'opacity-60'}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-semibold">
                {formatCurrency(budget.budgetAmount)}
                {budget.isRecurring && renderRecurrenceBadge()}
              </CardTitle>
              <CardDescription className="flex items-center mt-1">
                <Badge className={`mr-2 ${getPlatformBadgeColor()}`}>
                  {budget.platform === 'meta' ? 'Meta' : 'Google'}
                </Badge>
                {isLoadingClient ? (
                  <span className="text-sm italic">Carregando...</span>
                ) : (
                  <span className="text-sm font-medium">{clientData?.company_name}</span>
                )}
              </CardDescription>
              
              {/* Exibir informações da conta específica se houver */}
              {budget.accountId && (
                <div className="mt-1 text-sm text-muted-foreground">
                  <span className="font-medium">Conta: </span>
                  {isLoadingAccount ? (
                    <span className="italic">Carregando...</span>
                  ) : (
                    <span>{getAccountInfo()}</span>
                  )}
                </div>
              )}
            </div>
            
            <Badge 
              variant={budget.isActive ? (isActivePeriod() ? "default" : "outline") : "secondary"}
              className={`font-medium ${isActivePeriod() && budget.isActive ? "bg-green-500" : ""}`}
            >
              {budget.isActive 
                ? (isActivePeriod() ? "Ativo" : "Agendado") 
                : "Inativo"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
              <span>{formatDateRange()}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Período:</span>
              <span className="font-medium">{getDaysInPeriod()} dias</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Orçamento diário:</span>
              <span className="font-medium">{formatCurrency(getDailyBudget())}</span>
            </div>
            
            {budget.description && (
              <div className="pt-2 border-t mt-2">
                <p className="text-sm text-gray-600">{budget.description}</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-0 gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onEdit(budget)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
          
          <Button
            size="sm"
            variant={budget.isActive ? "secondary" : "default"}
            className={`flex-1 ${budget.isActive ? "" : "bg-green-600 hover:bg-green-700"}`}
            onClick={() => onToggleStatus(budget.id, !budget.isActive)}
            disabled={isToggling}
          >
            {isToggling ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : budget.isActive ? (
              <PowerOff className="h-4 w-4 mr-1" />
            ) : (
              <Power className="h-4 w-4 mr-1" />
            )}
            {budget.isActive ? "Desativar" : "Ativar"}
          </Button>
          
          <Button
            size="sm"
            variant="destructive"
            className="flex-1"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Trash2 className="h-4 w-4 mr-1" />
            )}
            Excluir
          </Button>
        </CardFooter>
      </Card>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir orçamento personalizado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Este orçamento será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                onDelete(budget.id);
                setShowDeleteDialog(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
