
import { Button } from "@/components/ui/button";
import { Play, RefreshCw, Clock } from "lucide-react";

interface TabHeaderProps {
  title: string;
  buttonText: string;
  buttonColor: string;
  isLoading: boolean;
  lastRefreshed: Date;
  onRefresh: () => void;
  onAction: () => void;
}

export const TabHeader = ({
  title,
  buttonText,
  buttonColor,
  isLoading,
  lastRefreshed,
  onRefresh,
  onAction
}: TabHeaderProps) => {
  const formatDateTime = (date: Date) => {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          Atualizado em: {formatDateTime(lastRefreshed)}
        </p>
        
        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-8"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">{title}</h3>
        
        <Button
          size="sm"
          onClick={onAction}
          disabled={isLoading}
          className={`h-8 ${buttonColor} text-white`}
        >
          <Play className="h-3 w-3 mr-1" />
          {buttonText}
        </Button>
      </div>
    </div>
  );
};
