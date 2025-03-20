
import { Search, Edit, Trash2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClientWithBudgets, CustomBudget } from "../hooks/useCustomBudgets";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface CustomBudgetTableProps {
  filteredClients?: ClientWithBudgets[];
  isLoading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  formatDate: (date: string) => string;
  formatBudget: (value: number) => string;
  isCurrentlyActive: (budget: CustomBudget) => boolean;
  isFutureBudget: (budget: CustomBudget) => boolean;
  onEdit: (budget: CustomBudget) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
}

export const CustomBudgetTable = ({
  filteredClients,
  isLoading,
  searchTerm,
  setSearchTerm,
  formatDate,
  formatBudget,
  isCurrentlyActive,
  isFutureBudget,
  onEdit,
  onDelete,
  onToggleStatus,
}: CustomBudgetTableProps) => {
  // Função para obter o status do orçamento
  const getBudgetStatus = (budget: CustomBudget) => {
    if (!budget.is_active) {
      return { label: "Inativo", variant: "outline" as const };
    }
    if (isCurrentlyActive(budget)) {
      return { label: "Ativo", variant: "default" as const }; // Alterado de "success" para "default"
    }
    if (isFutureBudget(budget)) {
      return { label: "Agendado", variant: "secondary" as const }; // Alterado de "warning" para "secondary"
    }
    return { label: "Encerrado", variant: "secondary" as const };
  };

  // Função para calcular a duração do período em dias
  const calculatePeriodDuration = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Cálculo da diferença em dias (incluindo o último dia)
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

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[25%]">Cliente</TableHead>
              <TableHead className="w-[15%]">Valor</TableHead>
              <TableHead className="w-[15%]">Período</TableHead>
              <TableHead className="w-[15%]">Status</TableHead>
              <TableHead className="w-[20%]">Descrição</TableHead>
              <TableHead className="w-[10%] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!filteredClients || filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  {searchTerm
                    ? `Nenhum cliente encontrado com o termo "${searchTerm}"`
                    : "Nenhum orçamento personalizado configurado"}
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                client.customBudgets && client.customBudgets.length > 0 ? (
                  client.customBudgets.map((budget) => (
                    <TableRow key={budget.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {client.company_name}
                      </TableCell>
                      <TableCell>{formatBudget(budget.budget_amount)}</TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                {formatDate(budget.start_date)} - {formatDate(budget.end_date)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                {calculatePeriodDuration(budget.start_date, budget.end_date)} dias
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={budget.is_active}
                            onCheckedChange={(checked) => 
                              onToggleStatus(budget.id, checked)
                            }
                          />
                          <Badge variant={getBudgetStatus(budget).variant}>
                            {getBudgetStatus(budget).label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {budget.description || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(budget)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
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
                      </TableCell>
                    </TableRow>
                  ))
                ) : null
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filteredClients && filteredClients.length > 0 && 
       filteredClients.every(client => client.customBudgets.length === 0) && (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-md">
          <AlertCircle className="h-10 w-10 text-muran-primary mb-2" />
          <h3 className="text-lg font-medium mb-1">Nenhum orçamento configurado</h3>
          <p className="text-gray-500 text-center">
            Os clientes foram encontrados, mas nenhum possui orçamentos personalizados.
          </p>
        </div>
      )}
    </div>
  );
};
