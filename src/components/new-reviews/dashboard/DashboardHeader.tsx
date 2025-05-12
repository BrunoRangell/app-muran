
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RefreshCw } from "lucide-react";

interface DashboardHeaderProps {
  lastReviewTime?: Date;
  onRefresh: () => void;
  platform: "meta" | "google";
}

export function DashboardHeader({
  lastReviewTime,
  onRefresh,
  platform
}: DashboardHeaderProps) {
  const platformLabel = platform === "meta" ? "Meta Ads" : "Google Ads";
  
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-[#321e32]">
          Revisão de {platformLabel}
        </h2>
        {lastReviewTime && (
          <p className="text-sm text-gray-500">
            Última atualização: {formatDistanceToNow(lastReviewTime, { 
              addSuffix: true,
              locale: ptBR 
            })}
          </p>
        )}
      </div>
      <Button 
        onClick={onRefresh}
        variant="outline" 
        className="flex items-center gap-2"
      >
        <RefreshCw size={16} />
        Atualizar Dados
      </Button>
    </div>
  );
}
