
import { Clock, BarChart3, Calendar } from "lucide-react";
import { UnifiedDashboardHeader } from "@/components/common/UnifiedDashboardHeader";
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
    <div className="space-y-4">
      <UnifiedDashboardHeader
        title={`Dashboard de Revisões - ${platformName}`}
        description="Monitoramento e análise dos orçamentos publicitários"
        icon={BarChart3}
        gradient={true}
      />
      
      <div className="bg-gray-50 rounded-lg p-4 flex flex-col md:flex-row gap-4 md:gap-8">
        <div className="flex items-center gap-2">
          <Clock className="text-muran-primary" size={16} />
          <div>
            <span className="text-sm font-medium text-gray-700">Última revisão {platformName} em massa:</span>
            {lastReviewTime ? (
              <p className="text-sm text-muran-dark font-semibold">
                {formatDistanceToNow(lastReviewTime, { addSuffix: true, locale: ptBR })}
              </p>
            ) : (
              <p className="text-sm text-gray-500 italic">Nenhuma revisão {platformName} em massa realizada</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="text-muran-primary" size={16} />
          <div>
            <span className="text-sm font-medium text-gray-700">Dias restantes no mês:</span>
            <p className="text-sm text-muran-dark font-semibold">
              {remainingDays} {remainingDays === 1 ? 'dia' : 'dias'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
