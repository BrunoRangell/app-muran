import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, X, Loader2 } from "lucide-react";
import { Cost, CostCategory } from "@/types/cost";
import { COST_CATEGORIES } from "@/components/costs/schemas/costFormSchema";
import { CategorySelector } from "./CategorySelector";
import { toast } from "sonner";

interface InlineCategoryEditorProps {
  cost: Cost;
  onCategoryUpdate: (costId: number, categories: CostCategory[]) => void;
  isUpdating: boolean;
}

export function InlineCategoryEditor({ cost, onCategoryUpdate, isUpdating }: InlineCategoryEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CostCategory | "">("");
  const [localCategories, setLocalCategories] = useState<CostCategory[]>(cost.categories || []);

  const getCategoryName = (categoryId: string): string => {
    const category = COST_CATEGORIES.find(c => c.id === categoryId);
    return category?.name || categoryId;
  };

  const handleBadgeClick = () => {
    setIsEditing(true);
    setSelectedCategory("");
  };

  const handleCategorySelect = async (categoryId?: CostCategory) => {
    if (!categoryId) return;

    const newCategories = localCategories || [];
    
    // Verificar se a categoria já existe
    if (newCategories.includes(categoryId)) {
      toast.error("Esta categoria já foi adicionada");
      setIsEditing(false);
      return;
    }

    // Adicionar nova categoria - atualização otimística
    const updatedCategories = [...newCategories, categoryId];
    setLocalCategories(updatedCategories);
    setIsEditing(false);
    setSelectedCategory("");
    
    try {
      await onCategoryUpdate(cost.id, updatedCategories);
      toast.success("Categoria adicionada com sucesso");
    } catch (error) {
      // Reverter se houver erro
      setLocalCategories(cost.categories || []);
      toast.error("Erro ao adicionar categoria");
    }
  };

  const handleRemoveCategory = async (categoryToRemove: CostCategory) => {
    const previousCategories = localCategories || [];
    const updatedCategories = previousCategories.filter(cat => cat !== categoryToRemove);
    
    // Atualização otimística
    setLocalCategories(updatedCategories);
    
    try {
      await onCategoryUpdate(cost.id, updatedCategories);
      toast.success("Categoria removida com sucesso");
    } catch (error) {
      // Reverter se houver erro
      setLocalCategories(previousCategories);
      toast.error("Erro ao remover categoria");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedCategory("");
  };

  const availableCategories = COST_CATEGORIES.filter(
    category => !localCategories.includes(category.id as CostCategory)
  );

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {/* Mostrar categorias existentes */}
      {localCategories && localCategories.length > 0 ? (
        localCategories.map((categoryId, index) => (
          <Badge 
            key={index} 
            variant="secondary" 
            className="text-xs cursor-pointer hover:bg-secondary/80 group relative transition-all"
          >
            {getCategoryName(categoryId)}
            <button
              onClick={() => handleRemoveCategory(categoryId)}
              className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </button>
          </Badge>
        ))
      ) : (
        <Badge 
          variant="outline" 
          className="text-xs cursor-pointer hover:bg-accent transition-colors"
          onClick={handleBadgeClick}
        >
          Sem categoria
        </Badge>
      )}

      {/* Botão para adicionar nova categoria */}
      {!isEditing && localCategories.length > 0 && availableCategories.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBadgeClick}
          className="h-6 w-6 p-0 rounded-full hover:bg-muran-primary/10 transition-colors"
          disabled={isUpdating}
        >
          {isUpdating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
        </Button>
      )}

      {/* Editor inline */}
      {isEditing && (
        <div className="flex items-center gap-2">
          <CategorySelector
            value={selectedCategory || undefined}
            onValueChange={(value) => {
              if (value) {
                handleCategorySelect(value);
              }
            }}
            placeholder="Buscar e selecionar categoria"
            excludeCategories={localCategories}
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isUpdating}
            className="h-8 w-8 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}