
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, AlertTriangle } from "lucide-react";

export function NextReviewCountdown() {
  // Estado simples apenas para renderização, sem funcionalidade real
  const [isDisabled] = useState(true);

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between bg-gray-50 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#ff6e00]" />
          <span>Próxima Revisão Automática</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <AlertTriangle className="h-10 w-10 text-amber-500 mb-2" />
          <h3 className="font-medium text-gray-800">Contador Desativado</h3>
          <p className="text-sm text-gray-500 mt-1">
            Este contador foi substituído por uma nova implementação. 
            Por favor, utilize o novo sistema de análise automática.
          </p>
        </div>
        
        <div className="pt-3 mt-3 border-t text-xs text-gray-500">
          <p>
            A revisão automática agora utiliza o novo sistema unificado que mostra o progresso em tempo real.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
