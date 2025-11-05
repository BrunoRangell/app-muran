import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, Gift, Handshake } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TeamMember } from "@/types/team";
import { UnifiedClient } from "@/hooks/useUnifiedData";
import { 
  isValidDate, 
  getNextOccurrence, 
  getDaysUntil, 
  getYearsToComplete,
  isDateToday,
  isDateTomorrow 
} from "@/utils/dateHelpers";
import { useImportantDates } from "@/hooks/useImportantDates";
import { AddDateDialog } from "@/components/dates/AddDateDialog";

interface UnifiedDatesTimelineProps {
  teamMembers: TeamMember[];
  clients: UnifiedClient[];
}

interface UnifiedDate {
  id: string;
  entity?: TeamMember | UnifiedClient;
  entityType: 'team' | 'client' | 'custom';
  date: Date;
  type: 'birthday' | 'work_anniversary' | 'partnership_anniversary' | 'custom';
  daysUntil: number;
  yearsComplete?: number;
  originalDate?: string;
  title?: string;
}

export const UnifiedDatesTimeline = ({ 
  teamMembers, 
  clients 
}: UnifiedDatesTimelineProps) => {
  const { dates: customTeamDates } = useImportantDates('team');
  const { dates: customClientDates } = useImportantDates('client');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAllDates = (): UnifiedDate[] => {
    const allDates: UnifiedDate[] = [];
    
    // Team dates
    teamMembers.forEach(member => {
      if (isValidDate(member.birthday)) {
        const nextBirthday = getNextOccurrence(member.birthday);
        allDates.push({
          id: `team-birthday-${member.id}`,
          entity: member,
          entityType: 'team',
          date: nextBirthday,
          type: 'birthday',
          daysUntil: getDaysUntil(nextBirthday)
        });
      }
      
      if (isValidDate(member.start_date)) {
        const nextWorkAnniversary = getNextOccurrence(member.start_date);
        const yearsComplete = getYearsToComplete(member.start_date, nextWorkAnniversary);
        allDates.push({
          id: `team-work-${member.id}`,
          entity: member,
          entityType: 'team',
          date: nextWorkAnniversary,
          type: 'work_anniversary',
          daysUntil: getDaysUntil(nextWorkAnniversary),
          yearsComplete,
          originalDate: member.start_date
        });
      }
    });
    
    // Client dates
    clients
      .filter(client => client.status === 'active')
      .forEach(client => {
        if (isValidDate(client.first_payment_date)) {
          const nextAnniversary = getNextOccurrence(client.first_payment_date);
          const yearsComplete = getYearsToComplete(client.first_payment_date, nextAnniversary);
          allDates.push({
            id: `client-partnership-${client.id}`,
            entity: client,
            entityType: 'client',
            date: nextAnniversary,
            type: 'partnership_anniversary',
            daysUntil: getDaysUntil(nextAnniversary),
            yearsComplete,
            originalDate: client.first_payment_date
          });
        }
      });
    
    // Custom dates
    [...customTeamDates, ...customClientDates].forEach(customDate => {
      const dateObj = new Date(customDate.date);
      const nextOccurrence = customDate.is_recurring ? getNextOccurrence(customDate.date) : dateObj;
      
      allDates.push({
        id: `custom-${customDate.id}`,
        entityType: 'custom',
        date: nextOccurrence,
        type: 'custom',
        daysUntil: getDaysUntil(nextOccurrence),
        originalDate: customDate.date,
        title: customDate.title
      });
    });
    
    return allDates.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 7);
  };

  const dates = getAllDates();

  const getDateIcon = (type: string) => {
    if (type === 'birthday') return Gift;
    if (type === 'partnership_anniversary') return Handshake;
    return Calendar;
  };

  const getDateLabel = (date: UnifiedDate) => {
    if (date.type === 'custom') return date.title;
    if (date.type === 'birthday') return 'Aniversário';
    if (date.type === 'work_anniversary') 
      return `${date.yearsComplete} ${date.yearsComplete === 1 ? 'ano' : 'anos'} de Muran`;
    if (date.type === 'partnership_anniversary') 
      return `${date.yearsComplete} ${date.yearsComplete === 1 ? 'ano' : 'anos'} de parceria`;
    return 'Data Especial';
  };

  const getEntityName = (date: UnifiedDate) => {
    if (date.type === 'custom') return date.title;
    if ('name' in (date.entity || {})) return (date.entity as TeamMember).name;
    if ('company_name' in (date.entity || {})) return (date.entity as UnifiedClient).company_name;
    return 'Evento Especial';
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <Calendar className="text-muran-primary h-5 w-5" />
          Próximas Datas Importantes
        </CardTitle>
        <div className="flex gap-2">
          <AddDateDialog entityType="team" />
          <AddDateDialog entityType="client" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dates.map((date) => {
            const isToday = isDateToday(date.date);
            const isTomorrow = isDateTomorrow(date.date);
            const Icon = getDateIcon(date.type);
            const isTeamMember = date.entityType === 'team' && 'name' in (date.entity || {});
            
            return (
              <div
                key={date.id}
                className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ${
                  isToday 
                    ? 'bg-muran-primary text-white shadow-lg' 
                    : isTomorrow 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'bg-muted/50 hover:bg-muted transition-colors'
                }`}
              >
                {isTeamMember ? (
                  <Avatar className={`h-10 w-10 shrink-0 ${
                    isToday ? 'ring-2 ring-white/40' : 'ring-1 ring-border'
                  }`}>
                    {(date.entity as TeamMember)?.photo_url ? (
                      <AvatarImage
                        src={(date.entity as TeamMember).photo_url}
                        alt={getEntityName(date)}
                      />
                    ) : (
                      <AvatarFallback className={
                        isToday ? 'bg-white/20 text-white' : 'bg-muran-primary text-white'
                      }>
                        {getInitials(getEntityName(date))}
                      </AvatarFallback>
                    )}
                  </Avatar>
                ) : (
                  <div className={`flex items-center justify-center h-10 w-10 rounded-full shrink-0 ${
                    isToday 
                      ? 'bg-white/20' 
                      : isTomorrow 
                      ? 'bg-blue-100' 
                      : 'bg-muran-primary/10'
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      isToday ? 'text-white' : isTomorrow ? 'text-blue-600' : 'text-muran-primary'
                    }`} />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className={`font-semibold text-sm leading-tight ${
                      isToday ? 'text-white' : isTomorrow ? 'text-blue-900' : 'text-foreground'
                    }`}>
                      {isToday && '🎉 '}{isTomorrow && '🎂 '}
                      {getEntityName(date)}
                    </h4>
                    <Badge 
                      variant={isToday ? "default" : "outline"}
                      className={`shrink-0 text-xs ${
                        isToday 
                          ? 'bg-white/20 text-white border-white/30' 
                          : isTomorrow 
                          ? 'bg-blue-100 text-blue-700 border-blue-300'
                          : ''
                      }`}
                    >
                      {getDateLabel(date)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs">
                    <span className={`flex items-center gap-1 ${
                      isToday ? 'text-white/90' : isTomorrow ? 'text-blue-700' : 'text-muted-foreground'
                    }`}>
                      <Calendar className="h-3 w-3" />
                      {format(date.date, "dd 'de' MMM", { locale: ptBR })}
                    </span>
                    {!isToday && (
                      <span className={`flex items-center gap-1 font-medium ${
                        isTomorrow ? 'text-blue-700' : 'text-muran-primary'
                      }`}>
                        <Clock className="h-3 w-3" />
                        {date.daysUntil === 0 ? 'Hoje' : `${date.daysUntil}d`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {dates.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">
              Nenhuma data próxima encontrada
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
