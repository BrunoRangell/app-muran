import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Gift } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { isDateToday, isDateTomorrow } from "@/utils/dateHelpers";
import { TeamMember } from "@/types/team";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TeamDate {
  member?: TeamMember;
  date: Date;
  type: 'birthday' | 'work_anniversary' | 'custom';
  daysUntil: number;
  yearsComplete?: number;
  originalDate?: string;
  title?: string;
  customId?: string;
}

interface AllTeamDatesDialogProps {
  dates: TeamDate[];
  totalCount: number;
  getInitials: (name: string) => string;
}

export const AllTeamDatesDialog = ({ dates, totalCount, getInitials }: AllTeamDatesDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Ver Todas as Datas ({totalCount})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="text-muran-primary" size={20} />
            Todas as Datas da Equipe ({totalCount})
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(80vh-120px)] pr-4">
          <div className="space-y-3">
            {dates.map((date, index) => {
              const isToday = isDateToday(date.date);
              const isTomorrow = isDateTomorrow(date.date);
              
              return (
                <div
                  key={`${date.member?.id || date.customId}-${date.type}-${index}`}
                  className={`group relative flex items-start gap-3 p-3.5 rounded-lg transition-all duration-300 ${
                    isToday 
                      ? 'bg-muran-primary text-white shadow-xl' 
                      : isTomorrow 
                      ? 'bg-blue-50 border border-blue-200 shadow-lg' 
                      : 'bg-white border border-gray-200/50 hover:border-muran-primary/30 hover:shadow-md hover:scale-[1.02]'
                  }`}
                >
                  <Avatar className={`h-11 w-11 shrink-0 transition-all duration-300 ${
                    isToday 
                      ? 'ring-4 ring-white/40' 
                      : isTomorrow
                      ? 'ring-3 ring-blue-300'
                      : 'ring-1.5 ring-muran-primary/20 group-hover:ring-muran-primary/40'
                  }`}>
                    {date.member?.photo_url ? (
                      <AvatarImage
                        src={date.member.photo_url}
                        alt={date.member.name}
                        className="object-cover"
                      />
                    ) : (
                      <AvatarFallback className={
                        isToday 
                          ? 'bg-white/20 text-white text-base' 
                          : isTomorrow
                          ? 'bg-blue-100 text-blue-700 text-base'
                          : 'bg-muran-primary text-white text-base'
                      }>
                        {date.member ? getInitials(date.member.name) : '📅'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h4 className={`font-bold text-base leading-tight ${isToday ? 'text-white' : isTomorrow ? 'text-blue-900' : 'text-gray-900'}`}>
                        {isToday && '🎉 '}{isTomorrow && '🎂 '}
                        {date.type === 'custom' ? date.title : date.member?.name}
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
                        {date.type === 'birthday' 
                          ? 'Aniversário' 
                          : date.type === 'work_anniversary'
                          ? `${date.yearsComplete} ${date.yearsComplete === 1 ? 'ano' : 'anos'} de Muran`
                          : 'Data Especial'}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className={`flex items-center gap-1.5 ${
                        isToday ? 'text-white/90' : isTomorrow ? 'text-blue-700' : 'text-gray-600'
                      }`}>
                        <Calendar className="h-3.5 w-3.5" />
                        {date.type === 'birthday' 
                          ? format(date.date, "dd 'de' MMMM", { locale: ptBR })
                          : date.originalDate 
                            ? format(new Date(date.originalDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                            : format(date.date, "dd 'de' MMMM", { locale: ptBR })}
                      </span>
                      {!isToday && (
                        <span className={`flex items-center gap-1.5 font-medium ${
                          isTomorrow ? 'text-blue-700' : 'text-muran-primary/70'
                        }`}>
                          <Clock className="h-3.5 w-3.5" />
                          {date.daysUntil} {date.daysUntil === 1 ? 'dia restante' : 'dias restantes'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
