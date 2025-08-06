
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { Cost } from "@/types/cost";
import { formatCurrency, formatDate } from "@/utils/formatters";
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
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { useCostCategories } from "./schemas/costFormSchema";

interface CostsTableProps {
  costs: Cost[];
  isLoading: boolean;
  onEditClick: (cost: Cost) => void;
}

export function CostsTable({ costs, isLoading, onEditClick }: CostsTableProps) {
  const [costToDelete, setCostToDelete] = useState<Cost | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const categories = useCostCategories();

  if (isLoading) {
    return <div className="text-center py-4">Carregando custos...</div>;
  }

  if (costs.length === 0) {
    return <div className="text-center py-4">Nenhum custo encontrado.</div>;
  }

  const getCategoryNames = (cost: Cost) => {
    if (!cost.categories) return "-";
    
    return cost.categories
      .map(categoryId => {
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : categoryId;
      })
      .join(", ");
  };

  const totalAmount = costs.reduce((acc, cost) => acc + Number(cost.amount), 0);

  const handleDelete = async () => {
    if (!costToDelete) return;

    console.log('Iniciando exclusão do custo:', costToDelete);

    const { error } = await supabase
      .from('costs')
      .delete()
      .eq('id', costToDelete.id);

    if (error) {
      console.error('Erro ao excluir custo:', error);
      toast({
        title: "Erro ao excluir custo",
        description: "Ocorreu um erro ao tentar excluir o custo. Tente novamente.",
        variant: "destructive",
      });
    } else {
      console.log('Custo excluído com sucesso');
      toast({
        title: "Custo excluído",
        description: "O custo foi excluído com sucesso.",
      });
      
      await queryClient.invalidateQueries({ queryKey: ["costs"] });
      console.log('Cache de custos invalidado');
    }

    setCostToDelete(null);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categorias</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[140px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {costs.map((cost) => (
              <TableRow key={cost.id}>
                <TableCell>{cost.name}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {cost.categories?.map(categoryId => {
                      const category = categories.find(c => c.id === categoryId);
                      return category ? (
                        <Badge key={categoryId} variant="secondary">
                          {category.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </TableCell>
                <TableCell>{formatDate(cost.date)}</TableCell>
                <TableCell>{formatCurrency(cost.amount)}</TableCell>
                <TableCell>{cost.description || "-"}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditClick(cost)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        console.log('Clicou para excluir custo:', cost);
                        setCostToDelete(cost);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="text-right font-medium">
                Total
              </TableCell>
              <TableCell className="font-medium">
                {formatCurrency(totalAmount)}
              </TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <AlertDialog 
        open={!!costToDelete} 
        onOpenChange={(open) => {
          console.log('Dialog onOpenChange:', open);
          if (!open) setCostToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o custo "{costToDelete?.name}"? Esta ação não pode ser desfeita.
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
