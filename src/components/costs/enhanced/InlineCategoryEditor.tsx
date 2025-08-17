import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Check, X } from "lucide-react";
import { Cost, CostCategory } from "@/types/cost";
import { COST_CATEGORIES } from "@/components/costs/schemas/costFormSchema";
import { toast } from "sonner";

interface InlineCategoryEditorProps {
  cost: Cost;
  onCategoryUpdate: (costId: number, categories: CostCategory[]) => void;
  isUpdating: boolean;
}

export function InlineCategoryEditor({ cost, onCategoryUpdate, isUpdating }: InlineCategoryEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CostCategory | "">("");

  const getCategoryName = (categoryId: string): string => {
    const category = COST_CATEGORIES.find(c => c.id === categoryId);
    return category?.name || categoryId;
  };

  const handleBadgeClick = () => {
    setIsEditing(true);
    setSelectedCategory("");
  };

  const handleCategorySelect = async (categoryId: string) => {
    if (!categoryId) return;

    const newCategories = cost.categories || [];
    
    // Verificar se a categoria já existe
    if (newCategories.includes(categoryId as CostCategory)) {
      toast.error("Esta categoria já foi adicionada");
      setIsEditing(false);
      return;
    }

    // Adicionar nova categoria
    const updatedCategories = [...newCategories, categoryId as CostCategory];
    
    try {
      await onCategoryUpdate(cost.id, updatedCategories);
      setIsEditing(false);
      setSelectedCategory("");
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleRemoveCategory = async (categoryToRemove: CostCategory) => {
    const updatedCategories = (cost.categories || []).filter(cat => cat !== categoryToRemove);
    
    try {
      await onCategoryUpdate(cost.id, updatedCategories);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedCategory("");
  };

  const availableCategories = COST_CATEGORIES.filter(
    category => !(cost.categories || []).includes(category.id as CostCategory)
  );

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {/* Mostrar categorias existentes */}
      {cost.categories && cost.categories.length > 0 ? (
        cost.categories.map((categoryId, index) => (
          <Badge 
            key={index} 
            variant="secondary" 
            className="text-xs cursor-pointer hover:bg-secondary/80 group relative"
          >
            {getCategoryName(categoryId)}
            <button
              onClick={() => handleRemoveCategory(categoryId)}
              className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
              disabled={isUpdating}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))
      ) : (
        <Badge 
          variant="outline" 
          className="text-xs cursor-pointer hover:bg-accent"
          onClick={handleBadgeClick}
        >
          Sem categoria
        </Badge>
      )}

      {/* Botão para adicionar nova categoria */}
      {!isEditing && (cost.categories || []).length > 0 && availableCategories.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBadgeClick}
          className="h-6 w-6 p-0 rounded-full"
          disabled={isUpdating}
        >
          <Plus className="h-3 w-3" />
        </Button>
      )}

      {/* Editor inline */}
      {isEditing && (
        <div className="flex items-center gap-1">
          <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as CostCategory | "")}>
            <SelectTrigger className="h-7 w-[180px] text-xs">
              <SelectValue placeholder="Selecionar categoria" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {availableCategories.map((category) => (
                <SelectItem key={category.id} value={category.id} className="text-xs">
                  <div className="flex flex-col">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {category.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCategorySelect(selectedCategory)}
            disabled={!selectedCategory || isUpdating}
            className="h-7 w-7 p-0"
          >
            <Check className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isUpdating}
            className="h-7 w-7 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}