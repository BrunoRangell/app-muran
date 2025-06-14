
import { TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Settings, ExternalLink } from "lucide-react";
import { PlatformHealthData } from "./types";

interface PlatformDataCellProps {
  platformData?: PlatformHealthData;
  platformName: string;
  platformKey: 'meta' | 'google';
  clientId: string;
  onAction: (action: "details" | "review" | "configure", clientId: string, platform: 'meta' | 'google') => void;
}

export function PlatformDataCell({ 
  platformData, 
  platformName, 
  platformKey, 
  clientId, 
  onAction 
}: PlatformDataCellProps) {
  if (!platformData) {
    return (
      <TableCell className="text-center py-4">
        <div className="space-y-2">
          <p className="text-xs text-gray-400">Não configurado</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction('configure', clientId, platformKey)}
            className="h-7 px-2 text-xs"
          >
            <Settings className="w-3 h-3 mr-1" />
            Configurar
          </Button>
        </div>
      </TableCell>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'funcionando': return 'text-green-600';
      case 'sem-veiculacao': return 'text-red-600';
      case 'sem-campanhas': return 'text-yellow-600';
      default: return 'text-gray-500';
    }
  };

  return (
    <TableCell className="text-center py-4">
      <div className="space-y-2">
        {/* Status e campanhas */}
        <div className="flex items-center justify-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            platformData.status === 'funcionando' ? 'bg-green-500' :
            platformData.status === 'sem-veiculacao' ? 'bg-red-500' :
            platformData.status === 'sem-campanhas' ? 'bg-yellow-500' : 'bg-gray-400'
          }`} />
          <span className="text-xs text-gray-600">
            {platformData.activeCampaignsCount} campanhas
          </span>
        </div>
        
        {/* Métricas */}
        <div className="space-y-0.5">
          <div className={`text-xs font-medium ${platformData.costToday > 0 ? 'text-green-600' : 'text-gray-400'}`}>
            R$ {platformData.costToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className={`text-xs ${platformData.impressionsToday > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
            {platformData.impressionsToday.toLocaleString('pt-BR')} imp.
          </div>
        </div>

        {/* Botão de ação */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction('details', clientId, platformKey)}
          className="h-6 px-2 text-xs"
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          Ver
        </Button>
      </div>
    </TableCell>
  );
}
