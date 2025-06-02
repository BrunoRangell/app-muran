
import { Clock, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardHeaderProps {
  lastReviewTime?: Date;
}

export function DashboardHeader({
  lastReviewTime
}: DashboardHeaderProps = {}) {
  return (
    <Card className="p-4 flex justify-between items-center bg-gradient-to-r from-[#321e32] to-[#321e32]/90 text-white rounded-xl shadow-md">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BarChart3 className="text-[#ff6e00]" size={20} />
          Dashboard de Revisões
        </h2>
        
        {lastReviewTime && (
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Clock size={14} />
            <span>
              Última revisão: {formatDistanceToNow(lastReviewTime, { addSuffix: true, locale: ptBR })}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
