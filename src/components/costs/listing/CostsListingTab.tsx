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
}

export function CostsListingTab({ 
  costs, 
  isLoading, 
  onEditClick, 
  deleteCost, 
  deleteCosts, 
  updateCostCategory 
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
      />
    </div>
  );
}