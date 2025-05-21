
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";

interface ReviewButtonProps {
  onReviewClient: () => void;
  isProcessing: boolean;
  inactive: boolean;
}

export const ReviewButton = ({
  onReviewClient,
  isProcessing,
  inactive
}: ReviewButtonProps) => {
  return (
    <Button 
      variant={inactive ? "outline" : "default"}
      size="sm" 
      onClick={onReviewClient}
      disabled={isProcessing || inactive}
      className={`w-full ${inactive ? "bg-gray-100" : ""}`}
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
  );
};
