import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        <div className="space-y-3">
          {clientDates.map((date, index) => {
            const isToday = isDateToday(date.date);
            const isTomorrow = isDateTomorrow(date.date);
            
            return (
              <div
                key={`${date.client.id}-${date.type}-${index}`}
                className={`group relative flex items-start gap-3 p-3.5 rounded-lg transition-all duration-300 ${
                  isToday 
                    ? 'bg-muran-primary text-white shadow-xl' 
                    : isTomorrow 
                    ? 'bg-blue-50 border border-blue-200 shadow-lg' 
                    : 'bg-white border border-gray-200/50 hover:border-muran-primary/30 hover:shadow-md hover:scale-[1.02]'
                }`}
              >
                <div className={`flex items-center justify-center h-11 w-11 rounded-full shrink-0 transition-all duration-300 ${
                  isToday 
                    ? 'bg-white/20 ring-2 ring-white/40' 
                    : isTomorrow
                    ? 'bg-blue-100 ring-3 ring-blue-300'
                    : 'bg-muran-primary/10 ring-1.5 ring-muran-primary/20 group-hover:ring-muran-primary/40'
                }`}>
                  {date.type === 'partnership_anniversary' ? (
                    <Handshake size={20} className={isToday ? 'text-white' : isTomorrow ? 'text-blue-600' : 'text-muran-primary'} />
                  ) : (
                    <Cake size={20} className={isToday ? 'text-white' : isTomorrow ? 'text-blue-600' : 'text-muran-primary'} />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h4 className={`font-bold text-base leading-tight ${isToday ? 'text-white' : isTomorrow ? 'text-blue-900' : 'text-gray-900'}`}>
                      {isToday && '🎉 '}{isTomorrow && '🎂 '}{date.client.company_name}
                    </h4>
                    <Badge 
                      variant={isToday ? "default" : "outline"}
                      className={`shrink-0 ${
                        isToday 
                          ? 'bg-white/20 text-white border-white/30' 
                          : isTomorrow
                          ? 'bg-blue-100 text-blue-700 border-blue-300'
                          : 'bg-muran-primary/10 text-muran-primary border-muran-primary/20'
                      }`}
                    >
                      {date.type === 'partnership_anniversary' ? '✨ ' : '🎂 '}
                      {date.yearsComplete} {date.yearsComplete === 1 ? 'ano' : 'anos'}
                      {date.type === 'partnership_anniversary' ? ' de parceria' : ' da empresa'}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className={
                      isToday ? 'text-white/90' : isTomorrow ? 'text-blue-700' : 'text-gray-600'
                    }>
                      {format(new Date(date.originalDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                    {!isToday && (
                      <span className={`font-medium ${
                        isTomorrow ? 'text-blue-700' : 'text-muran-primary/70'
                      }`}>
                        {date.daysUntil} {date.daysUntil === 1 ? 'dia restante' : 'dias restantes'}
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
