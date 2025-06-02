
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { X, Clock } from "lucide-react";

interface BatchProgressBarProps {
  progress: number;
  total: number;
  currentClientName?: string;
  platform: "meta" | "google";
  onCancel?: () => void;
}

export function BatchProgressBar({
  progress,
  total,
  currentClientName,
  platform,
  onCancel
}: BatchProgressBarProps) {
  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;
  const platformName = platform === "meta" ? "Meta Ads" : "Google Ads";
  
  // Estimativa de tempo restante (baseado em 2 segundos por cliente)
  const remainingClients = total - progress;
  const estimatedTimeMinutes = Math.ceil((remainingClients * 2) / 60);

  return (
    <div className="space-y-3 p-4 bg-[#ebebf0] rounded-lg border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#ff6e00]" />
          <span className="text-sm font-medium text-[#321e32]">
            Processando Revisão {platformName}
          </span>
        </div>
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0 hover:bg-white/50"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#321e32]">
            {progress} de {total} clientes processados
          </span>
          <span className="font-semibold text-[#ff6e00]">
            {percentage}%
          </span>
        </div>
        
        <Progress 
          value={percentage} 
          className="h-3"
          indicatorClassName="bg-[#ff6e00] transition-all duration-500 ease-out"
        />
      </div>

      {currentClientName && (
        <div className="text-xs text-[#321e32]/70">
          <span className="font-medium">Processando agora:</span> {currentClientName}
        </div>
      )}

      {remainingClients > 0 && (
        <div className="text-xs text-[#321e32]/70">
          <span className="font-medium">Tempo estimado:</span>{" "}
          {estimatedTimeMinutes === 1 ? "menos de 1 minuto" : `~${estimatedTimeMinutes} minutos`}
        </div>
      )}
    </div>
  );
}
