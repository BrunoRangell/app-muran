
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw, Settings, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardHeaderProps {
  lastReviewTime?: Date;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function DashboardHeader({
  lastReviewTime,
  onRefresh,
  isLoading = false
}: DashboardHeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshClick = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    
    if (onRefresh) {
      onRefresh();
    }
    
    // Simular um tempo mínimo para feedback visual
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-[#ebebf0]/50 to-white">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold text-[#321e32]">
            Dashboard de Revisão
          </h2>
          <p className="text-sm text-muted-foreground">
            {lastReviewTime ? (
              <>
                Última atualização: {format(lastReviewTime, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </>
            ) : (
              "Nenhuma revisão recente"
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshClick}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Atualizando..." : "Atualizar dados"}
          </Button>
          
          <Button variant="ghost" size="sm">
            <AlertCircle className="h-4 w-4 mr-2" />
            Ajuda
          </Button>
        </div>
      </div>
    </Card>
  );
}
