
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface CardFooterActionsProps {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  isProcessing: boolean;
  onReview: () => void;
  needsRefresh?: boolean;
}

export function CardFooterActions({ 
  expanded, 
  setExpanded, 
  isProcessing, 
  onReview,
  needsRefresh = false
}: CardFooterActionsProps) {
  return (
    <div className="w-full">
      <Separator />
      <div className="flex justify-between p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="text-gray-500"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Ver menos
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Ver mais
            </>
          )}
        </Button>
        
        <Button
          variant={needsRefresh ? "default" : "outline"}
          size="sm"
          onClick={onReview}
          disabled={isProcessing}
          className={needsRefresh ? "bg-[#ff6e00] hover:bg-[#e05d00]" : ""}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isProcessing ? 'animate-spin' : ''}`} />
          {needsRefresh ? "Buscar dados" : "Revisar"}
        </Button>
      </div>
    </div>
  );
}
