
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";

interface CardActionsProps {
  onReviewClient: () => void;
  isProcessing: boolean;
}

export const CardActions = ({ 
  onReviewClient, 
  isProcessing 
}: CardActionsProps) => {
  return (
    <div className="p-3 pt-0 flex justify-end">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onReviewClient}
        disabled={isProcessing}
        className="w-full bg-[#ff6e00] text-white hover:bg-[#e06200]"
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
