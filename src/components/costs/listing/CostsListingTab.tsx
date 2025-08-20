import { Cost, CostFilters } from "@/types/cost";
import { EnhancedCostsTable } from "@/components/costs/enhanced/EnhancedCostsTable";

interface CostsListingTabProps {
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
  updateMultipleCostCategories?: {
    mutateAsync: (params: { costIds: number[]; categories: string[]; operation: 'add' | 'remove' | 'replace' }) => Promise<{ costIds: number[]; categories: string[]; operation: 'add' | 'remove' | 'replace' }>;
    isPending: boolean;
  };
}

export function CostsListingTab({ 
  costs, 
  isLoading, 
  onEditClick, 
  deleteCost, 
  deleteCosts, 
  updateCostCategory,
  updateMultipleCostCategories
}: CostsListingTabProps) {
  return (
    <div>
      <EnhancedCostsTable 
        costs={costs} 
        isLoading={isLoading} 
        onEditClick={onEditClick}
        deleteCost={deleteCost}
        deleteCosts={deleteCosts}
        updateCostCategory={updateCostCategory}
        updateMultipleCostCategories={updateMultipleCostCategories}
      />
    </div>
  );
}