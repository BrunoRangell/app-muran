import { useState } from "react";
import { CostCategory } from "@/types/cost";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CategorySelector } from "./CategorySelector";
import { COST_CATEGORIES } from "@/components/costs/constants/categories";

interface BulkCategoryEditorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCostIds: number[];
  selectedCosts: Array<{ id: number; name: string; categories?: CostCategory[] }>;
  onApply: (params: { costIds: number[]; categories: string[]; operation: 'add' | 'remove' | 'replace' }) => Promise<void>;
  isLoading: boolean;
}

export function BulkCategoryEditor({
  isOpen,
  onClose,
  selectedCostIds,
  selectedCosts,
  onApply,
  isLoading
}: BulkCategoryEditorProps) {
  const [operation, setOperation] = useState<'add' | 'remove' | 'replace'>('add');
  const [selectedCategory, setSelectedCategory] = useState<CostCategory>();

  const handleApply = async () => {
    if (!selectedCategory) return;

    try {
      await onApply({
        costIds: selectedCostIds,
        categories: [selectedCategory],
        operation
      });

      onClose();
      setSelectedCategory(undefined);
    } catch (error) {
      // onApply já trata o erro, apenas não fechamos o modal em caso de erro
      console.error("Erro na aplicação em massa:", error);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedCategory(undefined);
  };

  const getCategoryName = (categoryId: string): string => {
    const category = COST_CATEGORIES.find(cat => cat.id === categoryId);
    return category?.name || categoryId;
  };

  const getOperationDescription = () => {
    const count = selectedCostIds.length;
    const itemText = count === 1 ? 'item' : 'itens';
    
    switch (operation) {
      case 'add':
        return `Adicionar categoria aos ${count} ${itemText} selecionados`;
      case 'remove':
        return `Remover categoria dos ${count} ${itemText} selecionados`;
      case 'replace':
        return `Substituir todas as categorias dos ${count} ${itemText} selecionados`;
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Categorias em Massa</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview dos custos selecionados */}
          <div>
            <Label className="text-sm font-medium">Custos selecionados ({selectedCosts.length}):</Label>
            <div className="mt-2 max-h-24 overflow-y-auto space-y-1 p-2 bg-muted rounded-md">
              {selectedCosts.map((cost) => (
                <div key={cost.id} className="text-sm">
                  <span className="font-medium">{cost.name}</span>
                  {cost.categories && cost.categories.length > 0 && (
                    <div className="ml-2 flex gap-1 flex-wrap mt-1">
                      {cost.categories.map((cat) => (
                        <Badge key={cat} variant="outline" className="text-xs">
                          {getCategoryName(cat)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tipo de operação */}
          <div>
            <Label className="text-sm font-medium">Tipo de operação:</Label>
            <RadioGroup value={operation} onValueChange={(value: any) => setOperation(value)} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="add" id="add" />
                <Label htmlFor="add">Adicionar categoria</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="remove" id="remove" />
                <Label htmlFor="remove">Remover categoria</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="replace" id="replace" />
                <Label htmlFor="replace">Substituir todas as categorias</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Seleção de categoria */}
          <div>
            <Label className="text-sm font-medium">Categoria:</Label>
            <div className="mt-2">
              <CategorySelector
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                placeholder="Selecione uma categoria"
              />
            </div>
          </div>

          {/* Descrição da operação */}
          {selectedCategory && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                {getOperationDescription()}: <span className="font-medium">{getCategoryName(selectedCategory)}</span>
              </p>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button 
              onClick={handleApply} 
              disabled={!selectedCategory || isLoading}
            >
              {isLoading ? "Aplicando..." : "Aplicar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}