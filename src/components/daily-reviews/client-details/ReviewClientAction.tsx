
import { Button } from "@/components/ui/button";
import { Loader, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

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
  const [isError, setIsError] = useState(false);

  const handleReviewClick = async () => {
    setIsError(false);
    try {
      await onReviewClient(clientId);
    } catch (error) {
      setIsError(true);
      toast({
        title: "Erro ao analisar cliente",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      className={`${isError ? "bg-red-500 hover:bg-red-600" : "bg-[#ff6e00] hover:bg-[#e66300]"} text-white`}
      onClick={handleReviewClick}
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
