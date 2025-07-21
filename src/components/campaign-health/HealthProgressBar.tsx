
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";

interface HealthProgressBarProps {
  isRefreshing: boolean;
  progress: {
    current: number;
    total: number;
    currentAccount: string;
    platform: string;
    percentage: number;
    estimatedTime: number;
  };
  onCancel?: () => void;
}

export function HealthProgressBar({
  isRefreshing,
  progress,
  onCancel
}: HealthProgressBarProps) {
  
  if (!isRefreshing) return null;
  
  const formatTime = (minutes: number) => {
    if (minutes < 1) {
      return "< 1 minuto";
    } else if (minutes < 60) {
      return `~${Math.ceil(minutes)} minutos`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `~${hours}h ${Math.ceil(remainingMinutes)}m` : `~${hours} horas`;
    }
  };
  
  const getCurrentStep = () => {
    if (progress.percentage >= 100) {
      return "✅ Atualização concluída!";
    } else if (progress.percentage >= 85) {
      return "🔄 Finalizando e salvando dados...";
    } else if (progress.percentage >= 20) {
      return `🔍 Processando: ${progress.currentAccount}`;
    } else if (progress.percentage >= 5) {
      return `🚀 Iniciando processamento das contas...`;
    } else {
      return "🔗 Conectando às plataformas de anúncios...";
    }
  };
  
  return (
    <div className="space-y-4 p-6 bg-gradient-to-br from-[#ebebf0] to-white rounded-xl border border-gray-200 shadow-lg mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-[#ff6e00] animate-spin" />
          <span className="text-base font-semibold text-[#321e32]">
            Atualizando Saúde das Campanhas
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
            {progress.total > 0 ? `${progress.current} de ${progress.total} contas processadas` : 'Conectando...'}
          </span>
          <span className="font-bold text-[#ff6e00] text-lg">
            {progress.percentage}%
          </span>
        </div>
        
        <div className="relative">
          <Progress 
            value={progress.percentage} 
            className="h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner"
            indicatorClassName="bg-gradient-to-r from-[#ff6e00] to-[#ff8f39] transition-all duration-300 ease-out rounded-full relative overflow-hidden"
          />
          {/* Efeito de brilho na barra */}
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full animate-pulse"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        
        <div className="text-sm text-gray-700 text-center font-medium">
          {getCurrentStep()}
        </div>
      </div>

      {progress.currentAccount && progress.platform && progress.percentage > 5 && progress.percentage < 85 && (
        <div className="flex items-center gap-2 text-sm bg-white/50 rounded-lg p-3 border-l-4 border-[#ff6e00]">
          <div className="w-2 h-2 bg-[#ff6e00] rounded-full animate-pulse"></div>
          <div>
            <span className="font-medium text-[#321e32]">Processando:</span>
            <span className="ml-2 text-[#321e32]/80 font-medium">{progress.currentAccount}</span>
          </div>
        </div>
      )}

      {progress.estimatedTime > 0 && progress.percentage < 100 && progress.percentage > 0 && (
        <div className="flex items-center justify-between text-sm text-[#321e32]/70 bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
            <span className="font-medium">Tempo estimado restante:</span>
          </div>
          <span className="font-semibold text-blue-600">
            {formatTime(progress.estimatedTime)}
          </span>
        </div>
      )}
    </div>
  );
}
