import { useState, useEffect } from "react";
import { CostCategory } from "@/types/cost";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { COST_CATEGORIES } from "@/components/costs/constants/categories";
import { cn } from "@/lib/utils";

interface BulkCategoryEditorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCostIds: number[];
  selectedCosts: Array<{ id: number; name: string; categories?: CostCategory[] }>;
  onApply: (params: { costIds: number[]; categories: string[]; operation: 'add' | 'remove' | 'replace' }) => Promise<void>;
  isLoading: boolean;
}

type CategoryState = 'none' | 'some' | 'all';

export function BulkCategoryEditor({
  isOpen,
  onClose,
  selectedCostIds,
  selectedCosts,
  onApply,
  isLoading
}: BulkCategoryEditorProps) {
  const [selectedCategories, setSelectedCategories] = useState<Set<CostCategory>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  // Calcular estado de cada categoria
  const getCategoryState = (categoryId: CostCategory): CategoryState => {
    const costsWithCategory = selectedCosts.filter(cost => 
      cost.categories?.includes(categoryId)
    ).length;
    
    if (costsWithCategory === 0) return 'none';
    if (costsWithCategory === selectedCosts.length) return 'all';
    return 'some';
  };

  // Calcular mudanças que serão aplicadas
  const getChangesToApply = () => {
    const changes: { add: CostCategory[], remove: CostCategory[] } = { add: [], remove: [] };
    
    COST_CATEGORIES.forEach(category => {
      const currentState = getCategoryState(category.id);
      const isSelected = selectedCategories.has(category.id);
      
      if (isSelected && currentState !== 'all') {
        changes.add.push(category.id);
      } else if (!isSelected && currentState !== 'none') {
        changes.remove.push(category.id);
      }
    });
    
    return changes;
  };

  const toggleCategory = (categoryId: CostCategory) => {
    const newSelected = new Set(selectedCategories);
    
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId);
    } else {
      newSelected.add(categoryId);
    }
    
    setSelectedCategories(newSelected);
    setHasChanges(true);
  };

  const clearAllCategories = () => {
    setSelectedCategories(new Set());
    setHasChanges(true);
  };

  const selectAllCategories = () => {
    setSelectedCategories(new Set(COST_CATEGORIES.map(cat => cat.id)));
    setHasChanges(true);
  };

  const handleApply = async () => {
    if (!hasChanges) return;

    const changes = getChangesToApply();
    
    try {
      // Aplicar remoções primeiro
      if (changes.remove.length > 0) {
        await onApply({
          costIds: selectedCostIds,
          categories: changes.remove,
          operation: 'remove'
        });
      }
      
      // Depois aplicar adições
      if (changes.add.length > 0) {
        await onApply({
          costIds: selectedCostIds,
          categories: changes.add,
          operation: 'add'
        });
      }
      
      onClose();
      setSelectedCategories(new Set());
      setHasChanges(false);
    } catch (error) {
      console.error("Erro na aplicação em massa:", error);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedCategories(new Set());
    setHasChanges(false);
  };

  // useEffect para inicializar as categorias quando o modal abrir
  useEffect(() => {
    if (isOpen && selectedCosts.length > 0) {
      const initialSelected = new Set<CostCategory>();
      COST_CATEGORIES.forEach(category => {
        const state = getCategoryState(category.id);
        if (state === 'all') {
          initialSelected.add(category.id);
        }
      });
      setSelectedCategories(initialSelected);
      setHasChanges(false);
    }
  }, [isOpen, selectedCosts]);

  const changes = getChangesToApply();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Categorias em Massa</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview dos custos selecionados */}
          <div>
            <Label className="text-sm font-medium">Custos selecionados ({selectedCosts.length}):</Label>
            <div className="mt-2 max-h-20 overflow-y-auto space-y-1 p-2 bg-muted rounded-md">
              {selectedCosts.slice(0, 3).map((cost) => (
                <div key={cost.id} className="text-sm">
                  <span className="font-medium">{cost.name}</span>
                </div>
              ))}
              {selectedCosts.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{selectedCosts.length - 3} outros custos...
                </div>
              )}
            </div>
          </div>

          {/* Interface de categorias com checkboxes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">Categorias:</Label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearAllCategories}
                  disabled={isLoading}
                >
                  Limpar Todas
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={selectAllCategories}
                  disabled={isLoading}
                >
                  Selecionar Todas
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {COST_CATEGORIES.map((category) => {
                const state = getCategoryState(category.id);
                const isSelected = selectedCategories.has(category.id);
                
                return (
                  <div 
                    key={category.id}
                    className={cn(
                      "flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      state === 'all' && !isSelected ? "border-red-200 bg-red-50" : "",
                      state === 'none' && isSelected ? "border-green-200 bg-green-50" : "",
                      state === 'some' ? "border-orange-200 bg-orange-50" : "",
                      isSelected && state === 'all' ? "border-green-200 bg-green-50" : "",
                      !isSelected && state === 'none' ? "border-border bg-background" : ""
                    )}
                    onClick={() => !isLoading && toggleCategory(category.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => toggleCategory(category.id)}
                      disabled={isLoading}
                      className="mt-0.5"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium cursor-pointer">
                          {category.name}
                        </Label>
                        
                        {/* Indicador de estado atual */}
                        {state === 'all' && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            Todos têm
                          </Badge>
                        )}
                        {state === 'some' && (
                          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                            Alguns têm
                          </Badge>
                        )}
                        {state === 'none' && (
                          <Badge variant="outline" className="text-xs">
                            Nenhum tem
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-1">
                        {category.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview das mudanças */}
          {hasChanges && (changes.add.length > 0 || changes.remove.length > 0) && (
            <div className="p-3 bg-muted rounded-md space-y-2">
              <Label className="text-sm font-medium">Mudanças a serem aplicadas:</Label>
              
              {changes.add.length > 0 && (
                <div className="text-sm">
                  <span className="text-green-600 font-medium">Adicionar:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {changes.add.map(catId => {
                      const cat = COST_CATEGORIES.find(c => c.id === catId);
                      return (
                        <Badge key={catId} variant="secondary" className="text-xs bg-green-100 text-green-800">
                          {cat?.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {changes.remove.length > 0 && (
                <div className="text-sm">
                  <span className="text-red-600 font-medium">Remover:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {changes.remove.map(catId => {
                      const cat = COST_CATEGORIES.find(c => c.id === catId);
                      return (
                        <Badge key={catId} variant="secondary" className="text-xs bg-red-100 text-red-800">
                          {cat?.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button 
              onClick={handleApply} 
              disabled={!hasChanges || isLoading}
            >
              {isLoading ? "Aplicando..." : `Aplicar Mudanças`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}