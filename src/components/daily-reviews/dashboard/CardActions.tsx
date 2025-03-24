
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";

interface CardActionsProps {
  onReviewClick: () => void;
  onViewDetailsClick?: () => void;
  isProcessing: boolean;
}

export const CardActions = ({ 
  onReviewClick, 
  onViewDetailsClick,
  isProcessing 
}: CardActionsProps) => {
  return (
    <div className="p-3 pt-0 flex justify-end gap-2">
      {onViewDetailsClick && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onViewDetailsClick}
          className="flex-1"
        >
          Detalhes
        </Button>
      )}
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onReviewClick}
        disabled={isProcessing}
        className={onViewDetailsClick ? "flex-1" : "w-full"}
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
