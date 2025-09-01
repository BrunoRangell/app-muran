import { Cost } from "@/types/cost";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Calendar, DollarSign } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface EnhancedCostsTableProps {
  costs: Cost[];
  isLoading: boolean;
  onEditClick: (cost: Cost) => void;
}

export function EnhancedCostsTable({ costs, isLoading, onEditClick }: EnhancedCostsTableProps) {
  const [costToDelete, setCostToDelete] = useState<Cost | null>(null);
  const queryClient = useQueryClient();

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

  const handleDelete = async () => {
    if (!costToDelete) return;

    try {
      const { error } = await supabase
        .from("costs")
        .delete()
        .eq("id", costToDelete.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["costs"] });
      toast.success("Custo excluído com sucesso!");
      setCostToDelete(null);
    } catch (error) {
      console.error("Erro ao excluir custo:", error);
      toast.error("Erro ao excluir custo");
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
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Lista de Custos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
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
                    <TableCell colSpan={6} className="text-center py-8">
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
                        <div className="flex flex-wrap gap-1">
                          {cost.categories && cost.categories.length > 0 ? (
                            cost.categories.map((categoryId, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {getCategoryName(categoryId)}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Sem categoria
                            </Badge>
                          )}
                        </div>
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
              onClick={handleDelete}
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