
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BadgeDollarSign, AlertTriangle, Loader } from "lucide-react";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface CompactActionButtonsProps {
  clientId: string;
  hasCustomBudget: boolean;
  onReviewClient: () => void;
  isProcessing: boolean;
  inactive: boolean;
}

export const CompactActionButtons = ({
  clientId,
  hasCustomBudget,
  onReviewClient,
  isProcessing,
  inactive
}: CompactActionButtonsProps) => {
  return (
    <div className="p-3 border-l flex gap-2">
      {hasCustomBudget && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/revisao-meta?tab=custom-budgets">
                <Button 
                  size="icon" 
                  variant="ghost"
                  className="text-[#ff6e00] hover:bg-[#ff6e00]/10 h-8 w-8 p-0"
                >
                  <BadgeDollarSign size={16} />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ver orçamentos personalizados</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      <Button 
        size="sm" 
        onClick={onReviewClient}
        disabled={isProcessing || inactive}
        variant={inactive ? "outline" : "default"}
        className={inactive ? "bg-gray-100" : ""}
      >
        {isProcessing ? (
          <Loader className="animate-spin" size={14} />
        ) : inactive ? (
          <AlertTriangle size={14} />
        ) : (
          "Analisar"
        )}
      </Button>
    </div>
  );
};
