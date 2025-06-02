
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";

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
  const [startTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;
  const platformName = platform === "meta" ? "Meta Ads" : "Google Ads";
  
  // Timer para atualizar tempo decorrido a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [startTime]);
  
  // Calcular tempo estimado baseado na velocidade atual
  const avgTimePerClient = progress > 0 ? elapsedSeconds / progress : 2;
  const remainingClients = total - progress;
  const estimatedRemainingSeconds = Math.ceil(remainingClients * avgTimePerClient);
  
  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `~${seconds} segundos`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `~${minutes}m ${remainingSeconds}s` : `~${minutes} minutos`;
    }
  };

  return (
    <div className="space-y-4 p-6 bg-gradient-to-br from-[#ebebf0] to-white rounded-xl border border-gray-200 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-[#ff6e00] animate-spin" />
          <span className="text-base font-semibold text-[#321e32]">
            Processando Revisão {platformName}
          </span>
        </div>
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-600 transition-colors rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#321e32] font-medium">
            {progress} de {total} clientes processados
          </span>
          <span className="font-bold text-[#ff6e00] text-lg">
            {percentage}%
          </span>
        </div>
        
        <div className="relative">
          <Progress 
            value={percentage} 
            className="h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner"
            indicatorClassName="bg-gradient-to-r from-[#ff6e00] to-[#ff8f39] transition-all duration-500 ease-out rounded-full relative overflow-hidden"
          />
          {/* Efeito de brilho na barra */}
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full animate-pulse"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {currentClientName && (
        <div className="flex items-center gap-2 text-sm bg-white/50 rounded-lg p-3 border-l-4 border-[#ff6e00]">
          <div className="w-2 h-2 bg-[#ff6e00] rounded-full animate-pulse"></div>
          <div>
            <span className="font-medium text-[#321e32]">Processando agora:</span>
            <span className="ml-2 text-[#321e32]/80 font-medium">{currentClientName}</span>
          </div>
        </div>
      )}

      {remainingClients > 0 && (
        <div className="flex items-center justify-between text-sm text-[#321e32]/70 bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
            <span className="font-medium">Tempo estimado restante:</span>
          </div>
          <span className="font-semibold text-blue-600">
            {formatTime(estimatedRemainingSeconds)}
          </span>
        </div>
      )}
    </div>
  );
}
