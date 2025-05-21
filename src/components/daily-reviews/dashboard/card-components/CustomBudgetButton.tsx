
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BadgeDollarSign } from "lucide-react";

interface CustomBudgetButtonProps {
  hasCustomBudget: boolean;
}

export const CustomBudgetButton = ({ hasCustomBudget }: CustomBudgetButtonProps) => {
  if (!hasCustomBudget) {
    return null;
  }
  
  return (
    <div className="mt-2 flex justify-end">
      <Link to="/revisao-meta?tab=custom-budgets">
        <Button 
          size="sm" 
          variant="ghost"
          className="text-[#ff6e00] hover:bg-[#ff6e00]/10 h-8"
        >
          <BadgeDollarSign size={14} className="mr-1" />
          <span className="text-xs">Orçamento Personalizado</span>
        </Button>
      </Link>
    </div>
  );
};
