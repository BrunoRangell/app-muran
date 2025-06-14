
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Plus, Search } from "lucide-react";
import { CustomBudgetTable } from "./components/CustomBudgetTable";
import { useCustomBudgets } from "./hooks/useCustomBudgets";
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

interface CustomBudget {
  id: string;
  client_id: string;
  platform: string;
  budget_amount: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  description?: string;
  clients?: {
    company_name: string;
  };
}

export function CustomBudgetTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [budgetToDelete, setBudgetToDelete] = useState<CustomBudget | null>(null);
  const { toast } = useToast();

  const { 
    budgets, 
    isLoading, 
    deleteBudget, 
    toggleStatus,
    isDeleting,
    isToggling
  } = useCustomBudgets(searchQuery);

  const handleCreateCustomBudget = () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A funcionalidade de criação de orçamentos personalizados será implementada em breve.",
    });
  };

  const handleEdit = (budget: CustomBudget) => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A funcionalidade de edição será implementada em breve.",
    });
  };

  const handleDelete = (budget: CustomBudget) => {
    setBudgetToDelete(budget);
  };

  const confirmDelete = () => {
    if (budgetToDelete) {
      deleteBudget(budgetToDelete.id);
      setBudgetToDelete(null);
    }
  };

  const handleToggleStatus = (budget: CustomBudget) => {
    toggleStatus({ budgetId: budget.id, isActive: budget.is_active });
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Orçamentos Personalizados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar clientes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button 
                onClick={handleCreateCustomBudget} 
                className="bg-[#ff6e00] hover:bg-[#e66300]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Orçamento
              </Button>
            </div>
            
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6e00] mx-auto"></div>
                <p className="mt-2 text-gray-500">Carregando orçamentos...</p>
              </div>
            ) : (
              <CustomBudgetTable
                budgets={budgets}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog 
        open={!!budgetToDelete} 
        onOpenChange={(open) => {
          if (!open) setBudgetToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o orçamento personalizado do cliente "{budgetToDelete?.clients?.company_name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
