
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader } from "lucide-react";

interface CardActionsProps {
  onReviewClient: () => void;
  onViewDetails: () => void;
  isProcessing: boolean;
}

export const CardActions = ({ 
  onReviewClient, 
  onViewDetails, 
  isProcessing 
}: CardActionsProps) => {
  return (
    <div className="p-3 pt-0 flex justify-between">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onReviewClient}
        disabled={isProcessing}
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
      <Button 
        variant="default" 
        size="sm" 
        onClick={onViewDetails}
        className="ml-2"
        style={{ backgroundColor: "#ff6e00", color: "white" }}
      >
        Ver detalhes
        <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
};
