import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader, X, Activity } from "lucide-react";
import { useEffect, useState } from "react";

interface HealthProgressBarProps {
  isRefreshing: boolean;
  progress?: number;
  total?: number;
  onCancel?: () => void;
}

export function HealthProgressBar({
  isRefreshing,
  progress = 0,
  total = 100,
  onCancel
}: HealthProgressBarProps) {
  const [internalProgress, setInternalProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("Iniciando...");
  
  // Simular progresso e etapas quando não temos progresso real
  useEffect(() => {
    if (!isRefreshing) {
      setInternalProgress(0);
      setCurrentStep("Iniciando...");
      return;
    }
    
    const steps = [
      "Iniciando atualização...",
      "Conectando com APIs das plataformas...", 
      "Coletando dados do Meta Ads...",
      "Coletando dados do Google Ads...",
      "Processando métricas de campanhas...",
      "Analisando performance...",
      "Finalizando atualização..."
    ];
    
    let currentStepIndex = 0;
    let currentProgress = 0;
    
    const interval = setInterval(() => {
      if (currentProgress >= 95) {
        clearInterval(interval);
        return;
      }
      
      currentProgress += Math.random() * 15;
      if (currentProgress > 95) currentProgress = 95;
      
      const stepIndex = Math.floor((currentProgress / 100) * steps.length);
      if (stepIndex !== currentStepIndex && stepIndex < steps.length) {
        currentStepIndex = stepIndex;
        setCurrentStep(steps[stepIndex]);
      }
      
      setInternalProgress(currentProgress);
    }, 800);
    
    return () => clearInterval(interval);
  }, [isRefreshing]);
  
  if (!isRefreshing) return null;
  
  const displayProgress = progress > 0 ? (progress / total) * 100 : internalProgress;
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#ff6e00] animate-pulse" />
          <span className="text-sm font-medium text-gray-700">
            Atualizando Saúde das Campanhas
          </span>
        </div>
        {onCancel && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCancel}
            className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs text-gray-600">
          <span>{currentStep}</span>
          <span>{Math.round(displayProgress)}%</span>
        </div>
        <Progress 
          value={displayProgress} 
          className="h-2" 
          indicatorClassName="bg-gradient-to-r from-[#ff6e00] to-[#ff8533]"
        />
        <p className="text-xs text-gray-500 text-center">
          Buscando dados em tempo real das plataformas Meta Ads e Google Ads
        </p>
      </div>
    </div>
  );
}