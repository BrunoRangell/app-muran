
import { Button } from "@/components/ui/button";
import { Loader, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface ActionButtonsProps {
  isUsingCustomBudgetInReview: boolean;
  customBudget: any | null;
  onReviewClient: () => void;
  isProcessing: boolean;
}

export const ActionButtons = ({ 
  isUsingCustomBudgetInReview,
  customBudget, 
  onReviewClient, 
  isProcessing 
}: ActionButtonsProps) => {
  return (
    <div className="flex gap-2">
      {customBudget && isUsingCustomBudgetInReview && (
        <Link to="/revisao-meta?tab=custom-budgets">
          <Button 
            variant="outline" 
            size="sm"
            className="border-[#ff6e00] text-[#ff6e00] hover:bg-[#ff6e00]/10"
          >
            <ExternalLink size={14} className="mr-1" />
            Orçamentos
          </Button>
        </Link>
      )}
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onReviewClient}
        disabled={isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader className="animate-spin mr-2" size={14} />
            Analisando...
          </>
        ) : (
          "Analisar"
        )}
      </Button>
    </div>
  );
};
