
import { Clock, BarChart3, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardHeaderProps {
  lastReviewTime?: Date;
  platform?: 'meta' | 'google';
}

// Função para calcular dias restantes no mês
function getRemainingDaysInMonth(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // Último dia do mês atual
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  
  // Dia atual
  const currentDay = now.getDate();
  
  // Dias restantes (incluindo o dia atual)
  return lastDayOfMonth - currentDay + 1;
}

export function DashboardHeader({
  lastReviewTime,
  platform = 'meta'
}: DashboardHeaderProps = {}) {
  const remainingDays = getRemainingDaysInMonth();
  const platformName = platform === 'meta' ? 'Meta Ads' : 'Google Ads';

  return (
    <Card className="p-4 bg-gradient-to-r from-[#321e32] to-[#321e32]/90 text-white rounded-xl shadow-md">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-[#ff6e00]" size={20} />
          <h2 className="text-xl font-semibold">Dashboard de Revisões - {platformName}</h2>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 md:gap-8">
          <div className="flex items-center gap-2">
            <Clock className="text-[#ff6e00]" size={16} />
            <div>
              <span className="text-sm font-medium text-white/80">Última revisão {platformName} em massa:</span>
              {lastReviewTime ? (
                <p className="text-sm text-white font-semibold">
                  {formatDistanceToNow(lastReviewTime, { addSuffix: true, locale: ptBR })}
                </p>
              ) : (
                <p className="text-sm text-white/60 italic">Nenhuma revisão {platformName} em massa realizada</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="text-[#ff6e00]" size={16} />
            <div>
              <span className="text-sm font-medium text-white/80">Dias restantes no mês:</span>
              <p className="text-sm text-white font-semibold">
                {remainingDays} {remainingDays === 1 ? 'dia' : 'dias'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
