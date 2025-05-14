
import { Button } from "@/components/ui/button";
import { Loader, RefreshCw } from "lucide-react";

interface ReviewClientActionProps {
  clientId: string;
  onReviewClient: (clientId: string) => void;
  isReviewing: boolean;
}

export const ReviewClientAction = ({
  clientId,
  onReviewClient,
  isReviewing,
}: ReviewClientActionProps) => {
  return (
    <Button
      className="bg-[#ff6e00] hover:bg-[#e66300] text-white"
      onClick={() => onReviewClient(clientId)}
      disabled={isReviewing}
    >
      {isReviewing ? (
        <>
          <Loader className="mr-2 h-4 w-4 animate-spin" />
          Analisando...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Analisar Agora
        </>
      )}
    </Button>
  );
};
