import { Cost, CostCategory } from "@/types/cost";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, Calendar, DollarSign } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { InlineCategoryEditor } from "./InlineCategoryEditor";

interface EnhancedCostsTableProps {
  costs: Cost[];
  isLoading: boolean;
  onEditClick: (cost: Cost) => void;
  deleteCost?: {
    mutateAsync: (id: number) => Promise<void>;
    isPending: boolean;
  };
  deleteCosts?: {
    mutateAsync: (ids: number[]) => Promise<void>;
    isPending: boolean;
  };
  updateCostCategory?: {
    mutateAsync: (params: { costId: number; categories: string[] }) => Promise<{ costId: number; categories: string[] }>;
    isPending: boolean;
  };
}

export function EnhancedCostsTable({ costs, isLoading, onEditClick, deleteCost, deleteCosts, updateCostCategory }: EnhancedCostsTableProps) {
  const [costToDelete, setCostToDelete] = useState<Cost | null>(null);
  const [selectedCosts, setSelectedCosts] = useState<number[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // Buscar informações de categorias diretamente do componente CategoryFilters
  const getCategoryName = (categoryId: string): string => {
    const categoryNames: Record<string, string> = {
      'marketing': 'Marketing',
      'vendas': 'Vendas', 
      'plataformas_ferramentas': 'Plataformas e Ferramentas',
      'despesas_pessoal': 'Despesas de Pessoal',
      'taxas_impostos': 'Taxas e Impostos',
      'servicos_profissionais': 'Serviços Profissionais',
      'eventos_networking': 'Eventos e Networking',
      'acoes_sociais': 'Ações Sociais'
    };
    
    return categoryNames[categoryId] || categoryId;
  };

  const getCategoryNames = (cost: Cost): string => {
    if (!cost.categories || cost.categories.length === 0) {
      return "Sem categoria";
    }
    
    return cost.categories
      .map(categoryId => getCategoryName(categoryId))
      .join(", ");
  };

  const isAllSelected = useMemo(() => {
    return costs.length > 0 && selectedCosts.length === costs.length;
  }, [costs.length, selectedCosts.length]);

  const isIndeterminate = useMemo(() => {
    return selectedCosts.length > 0 && selectedCosts.length < costs.length;
  }, [costs.length, selectedCosts.length]);

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCosts([]);
    } else {
      setSelectedCosts(costs.map(cost => cost.id));
    }
  };

  const handleSelectCost = (costId: number) => {
    setSelectedCosts(prev => 
      prev.includes(costId) 
        ? prev.filter(id => id !== costId)
        : [...prev, costId]
    );
  };

  const handleSingleDelete = async () => {
    if (!costToDelete || !deleteCost) return;
    
    try {
      await deleteCost.mutateAsync(costToDelete.id);
      setCostToDelete(null);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCosts.length === 0 || !deleteCosts) return;
    
    try {
      await deleteCosts.mutateAsync(selectedCosts);
      setSelectedCosts([]);
      setShowBulkDeleteDialog(false);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const clearSelection = () => {
    setSelectedCosts([]);
  };

  const handleCategoryUpdate = async (costId: number, categories: CostCategory[]) => {
    if (!updateCostCategory) return;
    
    try {
      await updateCostCategory.mutateAsync({
        costId,
        categories: categories as string[]
      });
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const totalAmount = costs.reduce((sum, cost) => sum + cost.amount, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Lista de Custos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Lista de Custos
            </div>
            {selectedCosts.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedCosts.length} selecionado{selectedCosts.length > 1 ? 's' : ''}
                </span>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Limpar seleção
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowBulkDeleteDialog(true)}
                  disabled={deleteCosts?.isPending || false}
                >
                  Excluir selecionados
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Selecionar todos"
                      {...(isIndeterminate && { "data-state": "indeterminate" })}
                    />
                  </TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categorias</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Calendar className="h-8 w-8 text-gray-400" />
                        <p className="text-gray-500">Nenhum custo encontrado</p>
                        <p className="text-sm text-gray-400">
                          Tente ajustar os filtros ou adicionar novos custos
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  costs.map((cost) => (
                    <TableRow key={cost.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <Checkbox
                          checked={selectedCosts.includes(cost.id)}
                          onCheckedChange={() => handleSelectCost(cost.id)}
                          aria-label={`Selecionar ${cost.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{cost.name}</span>
                          {cost.name_customized && cost.original_name && (
                            <span className="text-xs text-gray-500">
                              Original: {cost.original_name}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <InlineCategoryEditor
                          cost={cost}
                          onCategoryUpdate={handleCategoryUpdate}
                          isUpdating={updateCostCategory?.isPending || false}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatDate(cost.date)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(cost.amount)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 max-w-xs truncate block">
                          {cost.description || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditClick(cost)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCostToDelete(cost)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={deleteCost?.isPending || false}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {costs.length > 0 && (
            <div className="flex justify-between items-center pt-4 border-t mt-4">
              <div className="text-sm text-gray-600">
                {costs.length} registro{costs.length !== 1 ? 's' : ''}
              </div>
              <div className="text-sm font-medium">
                Total: {formatCurrency(totalAmount)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!costToDelete} onOpenChange={() => setCostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o custo "{costToDelete?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSingleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteCost?.isPending || false}
            >
              {deleteCost?.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão em lote</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedCosts.length} custo{selectedCosts.length > 1 ? 's' : ''} selecionado{selectedCosts.length > 1 ? 's' : ''}? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteCosts?.isPending || false}
            >
              {deleteCosts?.isPending ? "Excluindo..." : "Excluir todos"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}