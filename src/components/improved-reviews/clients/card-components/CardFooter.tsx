
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface CardFooterProps {
  expanded: boolean; 
  setExpanded: (expanded: boolean) => void;
  isProcessing: boolean;
  onReview: () => void;
}

export function CardFooterActions({
  expanded,
  setExpanded,
  isProcessing,
  onReview
}: CardFooterProps) {
  return (
    <div className="p-4 pt-0 flex justify-between">
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => setExpanded(!expanded)}
        className="text-xs"
      >
        {expanded ? "Menos detalhes" : "Mais detalhes"}
      </Button>
      
      <Button 
        variant="default"
        size="sm"
        className="bg-[#ff6e00] hover:bg-[#ff6e00]/90"
        onClick={onReview}
        disabled={isProcessing}
      >
        {isProcessing ? "Processando..." : "Revisar"}
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
