import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Handshake, Cake } from "lucide-react";
import { UnifiedClient } from "@/hooks/useUnifiedData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { isValidDate, getNextOccurrence, getDaysUntil, getYearsSince, isDateToday, isDateTomorrow } from "@/utils/dateHelpers";

interface ClientDatesCardProps {
  clients: UnifiedClient[];
}

interface ClientDate {
  client: UnifiedClient;
  date: Date;
  type: 'partnership_anniversary' | 'company_birthday';
  daysUntil: number;
  yearsComplete: number;
  originalDate: string;
}

export const ClientDatesCard = ({ clients }: ClientDatesCardProps) => {
  const getAllClientDates = (): ClientDate[] => {
    const allDates: ClientDate[] = [];
    
    clients
      .filter(client => client.status === 'active')
      .forEach(client => {
        // Aniversário de parceria
        if (isValidDate(client.first_payment_date)) {
          const nextAnniversary = getNextOccurrence(client.first_payment_date);
          const yearsComplete = getYearsSince(client.first_payment_date);
          allDates.push({
            client,
            date: nextAnniversary,
            type: 'partnership_anniversary',
            daysUntil: getDaysUntil(nextAnniversary),
            yearsComplete,
            originalDate: client.first_payment_date
          });
        }
        
        // Aniversário da empresa
        if (isValidDate(client.company_birthday)) {
          const nextCompanyBirthday = getNextOccurrence(client.company_birthday);
          const yearsComplete = getYearsSince(client.company_birthday);
          allDates.push({
            client,
            date: nextCompanyBirthday,
            type: 'company_birthday',
            daysUntil: getDaysUntil(nextCompanyBirthday),
            yearsComplete,
            originalDate: client.company_birthday
          });
        }
      });
    
    // Ordenar por proximidade e pegar os 5 próximos
    return allDates
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 5);
  };

  const clientDates = getAllClientDates();

  return (
    <Card className="border-0 shadow-sm hover:scale-105 transition-transform duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-800">
          <Building2 className="text-muran-primary" size={20} />
          Datas dos Clientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {clientDates.map((date, index) => {
            const isToday = isDateToday(date.date);
            const isTomorrow = isDateTomorrow(date.date);
            
            return (
              <div
                key={`${date.client.id}-${date.type}-${index}`}
                className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-200 ${
                  isToday ? 'bg-muran-primary text-white' : 
                  isTomorrow ? 'bg-blue-200 text-blue-800' : 'bg-gray-50 text-gray-900'
                } ${isToday || isTomorrow ? 'shadow-xl' : 'shadow-sm'}`}
              >
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-white/20">
                  {date.type === 'partnership_anniversary' ? (
                    <Handshake size={24} className={isToday ? 'text-white' : 'text-muran-primary'} />
                  ) : (
                    <Cake size={24} className={isToday ? 'text-white' : 'text-muran-primary'} />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <p className={`font-semibold text-base truncate ${isToday ? 'text-white' : 'text-gray-900'}`}>
                      {isToday ? `🎉 ${date.client.company_name}` : 
                       isTomorrow ? `🎂 ${date.client.company_name}` : 
                       date.client.company_name}
                    </p>
                    <span className={`text-[10px] uppercase tracking-wider font-medium whitespace-nowrap ${
                      isToday ? 'text-white/90' : 'text-muran-primary/70'
                    }`}>
                      {date.type === 'partnership_anniversary' 
                        ? `${date.yearsComplete} ${date.yearsComplete === 1 ? 'ano' : 'anos'} de parceria` 
                        : `${date.yearsComplete} ${date.yearsComplete === 1 ? 'ano' : 'anos'} da empresa`}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <span className={isToday ? 'text-white/90' : 'text-gray-600'}>
                      {format(new Date(date.originalDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                    {!isToday && (
                      <span className={`text-xs ${
                        isTomorrow ? 'text-blue-700' : 'text-gray-500'
                      }`}>
                        • {date.daysUntil} {date.daysUntil === 1 ? 'dia restante' : 'dias restantes'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {clientDates.length === 0 && (
            <p className="text-center text-gray-600 font-medium">
              Nenhuma data próxima encontrada
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
