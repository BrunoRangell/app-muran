import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Handshake } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { isDateToday, isDateTomorrow } from "@/utils/dateHelpers";
import { UnifiedClient } from "@/hooks/useUnifiedData";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ClientDate {
  client?: UnifiedClient;
  date: Date;
  type: 'partnership_anniversary' | 'custom';
  daysUntil: number;
  yearsComplete?: number;
  originalDate: string;
  title?: string;
  customId?: string;
}

interface AllClientDatesDialogProps {
  dates: ClientDate[];
  totalCount: number;
}

export const AllClientDatesDialog = ({ dates, totalCount }: AllClientDatesDialogProps) => {
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
            <Handshake className="text-muran-primary" size={20} />
            Todas as Datas dos Clientes ({totalCount})
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(80vh-120px)] pr-4">
          <div className="space-y-3">
            {dates.map((date, index) => {
              const isToday = isDateToday(date.date);
              const isTomorrow = isDateTomorrow(date.date);
              
              return (
                <div
                  key={`${date.client?.id || date.customId}-${date.type}-${index}`}
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
                    <Handshake size={20} className={isToday ? 'text-white' : isTomorrow ? 'text-blue-600' : 'text-muran-primary'} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h4 className={`font-bold text-base leading-tight ${isToday ? 'text-white' : isTomorrow ? 'text-blue-900' : 'text-gray-900'}`}>
                        {isToday && '🎉 '}{isTomorrow && '🎂 '}
                        {date.type === 'custom' ? date.title : date.client?.company_name}
                      </h4>
                      {date.type === 'partnership_anniversary' && date.yearsComplete && (
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
                          {date.yearsComplete} {date.yearsComplete === 1 ? 'ano' : 'anos'} de parceria
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className={`flex items-center gap-1.5 ${
                        isToday ? 'text-white/90' : isTomorrow ? 'text-blue-700' : 'text-gray-600'
                      }`}>
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(date.originalDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
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
