import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Briefcase } from "lucide-react";
import { TeamMember } from "@/types/team";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { isValidDate, getNextOccurrence, getDaysUntil, getYearsSince, isDateToday, isDateTomorrow } from "@/utils/dateHelpers";

interface TeamDatesCardProps {
  members: TeamMember[];
}

interface TeamDate {
  member: TeamMember;
  date: Date;
  type: 'birthday' | 'work_anniversary';
  daysUntil: number;
  yearsComplete?: number;
  originalDate?: string;
}

export const TeamDatesCard = ({ members }: TeamDatesCardProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const getAllTeamDates = (): TeamDate[] => {
    const allDates: TeamDate[] = [];
    
    members.forEach(member => {
      // Aniversário pessoal
      if (isValidDate(member.birthday)) {
        const nextBirthday = getNextOccurrence(member.birthday);
        allDates.push({
          member,
          date: nextBirthday,
          type: 'birthday',
          daysUntil: getDaysUntil(nextBirthday)
        });
      }
      
      // Aniversário de Muran
      if (isValidDate(member.start_date)) {
        const nextWorkAnniversary = getNextOccurrence(member.start_date);
        const yearsComplete = getYearsSince(member.start_date);
        allDates.push({
          member,
          date: nextWorkAnniversary,
          type: 'work_anniversary',
          daysUntil: getDaysUntil(nextWorkAnniversary),
          yearsComplete,
          originalDate: member.start_date
        });
      }
    });
    
    // Ordenar por proximidade e pegar os 5 próximos
    return allDates
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 5);
  };

  const teamDates = getAllTeamDates();

  return (
    <Card className="border-0 shadow-sm hover:scale-105 transition-transform duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-800">
          <Gift className="text-muran-primary" size={20} />
          Datas da Equipe
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teamDates.map((date, index) => {
            const isToday = isDateToday(date.date);
            const isTomorrow = isDateTomorrow(date.date);
            
            return (
              <div
                key={`${date.member.id}-${date.type}-${index}`}
                className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-200 ${
                  isToday ? 'bg-muran-primary text-white' : 
                  isTomorrow ? 'bg-blue-200 text-blue-800' : 'bg-gray-50 text-gray-900'
                } ${isToday || isTomorrow ? 'shadow-xl' : 'shadow-sm'}`}
              >
                <Avatar className="h-12 w-12 border-2 border-white/20">
                  {date.member.photo_url ? (
                    <AvatarImage
                      src={date.member.photo_url}
                      alt={date.member.name}
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-[#ff6e00] text-white text-xl">
                      {getInitials(date.member.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-base truncate mb-1 ${isToday ? 'text-white' : 'text-gray-900'}`}>
                    {isToday ? `🎉 ${date.member.name}` : 
                     isTomorrow ? `🎂 ${date.member.name}` : 
                     date.member.name}
                  </p>
                  
                  <div className="flex items-center gap-2 mb-2">
                    {date.type === 'birthday' ? (
                      <Gift size={18} className={isToday ? 'text-white' : 'text-muran-primary'} />
                    ) : (
                      <Briefcase size={18} className={isToday ? 'text-white' : 'text-muran-primary'} />
                    )}
                    <p className={`font-bold text-base ${isToday ? 'text-white' : 'text-muran-primary'}`}>
                      {date.type === 'birthday' 
                        ? 'Aniversário' 
                        : `${date.yearsComplete} ${date.yearsComplete === 1 ? 'ano' : 'anos'} de Muran`}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <span className={isToday ? 'text-white/90' : 'text-gray-600'}>
                      {date.type === 'birthday' 
                        ? format(date.date, "dd 'de' MMMM", { locale: ptBR })
                        : date.originalDate 
                          ? format(new Date(date.originalDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                          : format(date.date, "dd 'de' MMMM", { locale: ptBR })}
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
          {teamDates.length === 0 && (
            <p className="text-center text-gray-600 font-medium">
              Nenhuma data próxima encontrada
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
