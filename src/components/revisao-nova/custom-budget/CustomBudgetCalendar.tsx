
import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader } from "lucide-react";
import { ClientWithBudgets, CustomBudget } from "../hooks/useCustomBudgets";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CustomBudgetCalendarProps {
  filteredClients?: ClientWithBudgets[];
  isLoading: boolean;
  formatBudget: (value: number) => string;
  onEdit: (budget: CustomBudget) => void;
}

interface CalendarBudgetEvent {
  id: string;
  clientName: string;
  budget: CustomBudget;
  type: "start" | "end" | "active";
}

export const CustomBudgetCalendar = ({
  filteredClients,
  isLoading,
  formatBudget,
  onEdit,
}: CustomBudgetCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState<Record<string, CalendarBudgetEvent[]>>({});
  
  // Navegar entre meses
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  
  // Preparar os dias do mês atual
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Organizar orçamentos por dia
  useEffect(() => {
    if (!filteredClients) return;
    
    const events: Record<string, CalendarBudgetEvent[]> = {};
    
    // Inicializar todos os dias do mês
    daysInMonth.forEach(day => {
      const dateKey = format(day, "yyyy-MM-dd");
      events[dateKey] = [];
    });

    // Adicionar orçamentos aos dias apropriados
    filteredClients.forEach(client => {
      if (client.customBudgets && client.customBudgets.length > 0) {
        client.customBudgets.forEach(budget => {
          if (!budget.is_active) return;
          
          const startDate = new Date(`${budget.start_date}T12:00:00`);
          const endDate = new Date(`${budget.end_date}T12:00:00`);
          
          // Verificar se o orçamento está ativo no mês atual
          const hasOverlap = 
            (startDate <= monthEnd && endDate >= monthStart) ||
            (startDate >= monthStart && startDate <= monthEnd) ||
            (endDate >= monthStart && endDate <= monthEnd);
            
          if (hasOverlap) {
            // Adicionar evento de início do orçamento
            const startDateKey = format(startDate, "yyyy-MM-dd");
            if (events[startDateKey]) {
              events[startDateKey].push({
                id: `start-${budget.id}`,
                clientName: client.company_name,
                budget,
                type: "start"
              });
            }
            
            // Adicionar evento de término do orçamento
            const endDateKey = format(endDate, "yyyy-MM-dd");
            if (events[endDateKey]) {
              events[endDateKey].push({
                id: `end-${budget.id}`,
                clientName: client.company_name,
                budget,
                type: "end"
              });
            }
            
            // Adicionar dias ativos entre início e fim
            daysInMonth.forEach(day => {
              const dateKey = format(day, "yyyy-MM-dd");
              if (events[dateKey] && 
                  day >= startDate && 
                  day <= endDate && 
                  !isSameDay(day, startDate) && 
                  !isSameDay(day, endDate)) {
                events[dateKey].push({
                  id: `active-${budget.id}-${dateKey}`,
                  clientName: client.company_name,
                  budget,
                  type: "active"
                });
              }
            });
          }
        });
      }
    });
    
    setCalendarEvents(events);
  }, [filteredClients, daysInMonth, monthStart, monthEnd]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader className="animate-spin h-6 w-6 mr-2 text-muran-primary" />
        <span>Carregando orçamentos...</span>
      </div>
    );
  }

  // Renderizar evento de orçamento
  const renderBudgetEvent = (event: CalendarBudgetEvent) => {
    const eventClasses = {
      start: "bg-green-100 text-green-800 border-l-4 border-green-500",
      end: "bg-orange-100 text-orange-800 border-l-4 border-orange-500",
      active: "bg-blue-50 text-blue-800"
    };

    const eventLabels = {
      start: "Início",
      end: "Término",
      active: "Ativo"
    };

    return (
      <div 
        key={event.id}
        className={`p-1 my-1 text-xs rounded cursor-pointer hover:opacity-80 ${eventClasses[event.type]}`}
        onClick={() => onEdit(event.budget)}
      >
        <div className="font-medium truncate">{event.clientName}</div>
        <div className="flex justify-between">
          <span>{eventLabels[event.type]}</span>
          <span>{formatBudget(event.budget.budget_amount)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">
          {format(currentDate, "MMMM yyyy", { locale: ptBR })}
        </h3>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date())}>
            <CalendarIcon className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
          <div 
            key={day} 
            className="text-center font-medium p-2 bg-gray-100 rounded"
          >
            {day}
          </div>
        ))}
        
        {/* Espaços vazios para o início do mês */}
        {Array.from({ length: monthStart.getDay() }).map((_, index) => (
          <div key={`empty-start-${index}`} className="bg-gray-50 rounded min-h-[120px]" />
        ))}
        
        {/* Dias do mês */}
        {daysInMonth.map(day => {
          const dateKey = format(day, "yyyy-MM-dd");
          const isToday = isSameDay(day, new Date());
          const events = calendarEvents[dateKey] || [];
          
          return (
            <Card 
              key={dateKey} 
              className={`min-h-[120px] ${isToday ? "border-2 border-muran-primary" : ""}`}
            >
              <CardContent className="p-1">
                <div className="flex justify-between items-center mb-1 p-1">
                  <span className={`text-sm font-medium ${isToday ? "text-muran-primary" : ""}`}>
                    {format(day, "d")}
                  </span>
                  {events.length > 0 && (
                    <span className="text-xs bg-gray-200 rounded-full px-2 py-0.5">
                      {events.length}
                    </span>
                  )}
                </div>
                <div className="max-h-[90px] overflow-y-auto">
                  {events.map(renderBudgetEvent)}
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {/* Espaços vazios para o final do mês */}
        {Array.from({ length: 6 - monthEnd.getDay() }).map((_, index) => (
          <div key={`empty-end-${index}`} className="bg-gray-50 rounded min-h-[120px]" />
        ))}
      </div>
    </div>
  );
};
