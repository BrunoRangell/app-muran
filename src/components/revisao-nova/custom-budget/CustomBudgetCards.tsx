
import { Search, Edit, Trash2, Plus, Copy, Calendar, ToggleLeft, ToggleRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ClientWithBudgets, CustomBudget } from "../hooks/useCustomBudgets";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CustomBudgetCardsProps {
  filteredClients?: ClientWithBudgets[];
  isLoading: boolean;
  formatDate: (date: string) => string;
  formatBudget: (value: number) => string;
  isCurrentlyActive: (budget: CustomBudget) => boolean;
  isFutureBudget: (budget: CustomBudget) => boolean;
  onEdit: (budget: CustomBudget) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
  onDuplicate: (budget: CustomBudget) => void;
}

export const CustomBudgetCards = ({
  filteredClients,
  isLoading,
  formatDate,
  formatBudget,
  isCurrentlyActive,
  isFutureBudget,
  onEdit,
  onDelete,
  onToggleStatus,
  onDuplicate,
}: CustomBudgetCardsProps) => {
  // Função para obter o status do orçamento
  const getBudgetStatus = (budget: CustomBudget) => {
    if (!budget.is_active) {
      return { label: "Inativo", variant: "outline" as const };
    }
    if (isCurrentlyActive(budget)) {
      return { label: "Ativo", variant: "default" as const };
    }
    if (isFutureBudget(budget)) {
      return { label: "Agendado", variant: "secondary" as const };
    }
    return { label: "Encerrado", variant: "secondary" as const };
  };

  // Função para obter a cor de acordo com a plataforma
  const getPlatformColor = (platform: string) => {
    return platform === 'meta' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800';
  };

  // Função para calcular a duração do período em dias
  const calculatePeriodDuration = (startDate: string, endDate: string): number => {
    const start = new Date(`${startDate}T12:00:00`);
    const end = new Date(`${endDate}T12:00:00`);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader className="animate-spin h-6 w-6 mr-2 text-muran-primary" />
        <span>Carregando orçamentos...</span>
      </div>
    );
  }

  // Se não há clientes ou orçamentos para mostrar
  if (!filteredClients || filteredClients.length === 0 ||
      filteredClients.every(client => client.customBudgets.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-md">
        <Calendar className="h-10 w-10 text-muran-primary mb-2" />
        <h3 className="text-lg font-medium mb-1">Nenhum orçamento encontrado</h3>
        <p className="text-gray-500 text-center mb-4">
          Não há orçamentos personalizados para mostrar.
        </p>
        <Button 
          className="bg-muran-primary hover:bg-muran-primary/90"
          onClick={() => onEdit({} as CustomBudget)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Criar Orçamento
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => (
          client.customBudgets && client.customBudgets.length > 0 ? (
            client.customBudgets.map((budget) => (
              <Card 
                key={budget.id} 
                className={`overflow-hidden hover:shadow-md transition-shadow duration-200 border-l-4 ${
                  budget.platform === 'meta' ? 'border-l-blue-500' : 'border-l-red-500'
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-medium">
                          {client.company_name}
                        </CardTitle>
                        <Badge className={getPlatformColor(budget.platform)}>
                          {budget.platform === 'meta' ? 'Meta' : 'Google'}
                        </Badge>
                        {budget.is_recurring && (
                          <Badge variant="outline" className="border-purple-500 text-purple-700">
                            Recorrente
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs mt-1 flex items-center">
                        {formatDate(budget.start_date)} - {formatDate(budget.end_date)}
                        <span className="ml-2 text-xs text-gray-500">
                          ({calculatePeriodDuration(budget.start_date, budget.end_date)} dias)
                        </span>
                      </CardDescription>
                    </div>
                    <Badge variant={getBudgetStatus(budget).variant}>
                      {getBudgetStatus(budget).label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex flex-col space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Orçamento:</span>
                      <span className="text-lg font-semibold">{formatBudget(budget.budget_amount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Diário (aprox.):</span>
                      <span className="text-sm">
                        {formatBudget(budget.budget_amount / calculatePeriodDuration(budget.start_date, budget.end_date))}
                      </span>
                    </div>
                    {budget.is_recurring && budget.recurrence_pattern && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-500">Recorrência:</span>
                        <span className="text-sm">
                          {budget.recurrence_pattern === 'weekly' ? 'Semanal' : 
                           budget.recurrence_pattern === 'biweekly' ? 'Quinzenal' : 
                           budget.recurrence_pattern === 'monthly' ? 'Mensal' : 'Personalizado'}
                        </span>
                      </div>
                    )}
                  </div>
                  {budget.description && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                      {budget.description}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-2 flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-xs mr-2">Ativo</span>
                    <Switch
                      checked={budget.is_active}
                      onCheckedChange={(checked) => onToggleStatus(budget.id, checked)}
                    />
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDuplicate(budget)}
                      title="Duplicar"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(budget)}
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" title="Excluir">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Excluir orçamento
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir este orçamento? Esta
                            ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(budget.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardFooter>
              </Card>
            ))
          ) : null
        ))}
      </div>
    </div>
  );
};
