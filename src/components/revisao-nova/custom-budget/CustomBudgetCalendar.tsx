
import { useEffect, useState } from "react";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ClientWithBudgets, CustomBudget } from "../hooks/useCustomBudgets";
import { ChevronLeft, ChevronRight, Calendar, Edit, Loader } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CustomBudgetCalendarProps {
  filteredClients?: ClientWithBudgets[];
  isLoading: boolean;
  formatBudget: (value: number) => string;
  onEdit: (budget: CustomBudget) => void;
}

export const CustomBudgetCalendar = ({
  filteredClients = [],
  isLoading,
  formatBudget,
  onEdit
}: CustomBudgetCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [budgetsByDate, setBudgetsByDate] = useState<{[key: string]: any[]}>({});
  
  // Processar orçamentos para o calendário
  useEffect(() => {
    const tempBudgets: {[key: string]: any[]} = {};
    
    filteredClients.forEach(client => {
      client.customBudgets.forEach(budget => {
        const startDate = new Date(budget.startDate);
        const endDate = new Date(budget.endDate);
        
        const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
        dateRange.forEach(date => {
          const dateKey = format(date, 'yyyy-MM-dd');
          if (!tempBudgets[dateKey]) {
            tempBudgets[dateKey] = [];
          }
          tempBudgets[dateKey].push({
            ...budget,
            clientName: client.company_name
          });
        });
      });
    });
    
    setBudgetsByDate(tempBudgets);
  }, [filteredClients]);
  
  // Manipuladores de navegação do calendário
  const prevMonth = () => {
    setCurrentMonth(addMonths(currentMonth, -1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={prevMonth}
          className="text-gray-600"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={nextMonth}
          className="text-gray-600"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };
  
  const renderDaysOfWeek = () => {
    const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    return (
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };
  
  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = monthStart;
    const endDate = monthEnd;
    
    const dateFormat = "d";
    const rows = [];
    
    let days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Ajustar o primeiro dia da semana
    const firstDayOfMonth = monthStart.getDay();
    for (let i = 0; i < firstDayOfMonth; i++) {
      days = [new Date(monthStart.getFullYear(), monthStart.getMonth(), -i), ...days];
    }
    
    // Ajustar para completar a última semana
    const lastDayOfGrid = 42 - days.length;
    for (let i = 1; i <= lastDayOfGrid; i++) {
      days = [...days, new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate() + i)];
    }
    
    let cells = days.map((day, idx) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const dayBudgets = budgetsByDate[dateKey] || [];
      const isCurrentMonth = isSameMonth(day, currentMonth);
      const isSelected = isSameDay(day, selectedDate);
      
      return (
        <div
          key={idx}
          className={`
            border rounded-md min-h-[100px] p-1 overflow-auto
            ${isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
            ${isSelected ? 'border-blue-500' : 'border-gray-200'}
          `}
          onClick={() => setSelectedDate(day)}
        >
          <div className="text-right text-xs mb-1 sticky top-0 bg-inherit">
            <span className={`
              inline-block w-5 h-5 rounded-full text-center leading-5
              ${isSelected ? 'bg-blue-500 text-white' : ''}
            `}>
              {format(day, dateFormat)}
            </span>
          </div>
          <div className="space-y-1">
            {dayBudgets.map((budget, budgetIdx) => (
              <div 
                key={`${budget.id}-${budgetIdx}`}
                className={`
                  text-xs p-1 rounded cursor-pointer
                  ${budget.platform === 'meta' ? 'bg-blue-50 text-blue-800' : 'bg-red-50 text-red-800'}
                `}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(budget);
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate">{budget.clientName}</span>
                  <Edit className="h-3 w-3" />
                </div>
                <div>{formatBudget(budget.budgetAmount)}</div>
              </div>
            ))}
          </div>
        </div>
      );
    });
    
    rows.push(
      <div key="calendar-grid" className="grid grid-cols-7 gap-1">
        {cells}
      </div>
    );
    
    return <div className="mt-2">{rows}</div>;
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader className="animate-spin h-6 w-6 mr-2 text-muran-primary" />
        <span>Carregando calendário...</span>
      </div>
    );
  }
  
  if (!filteredClients || filteredClients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-md">
        <Calendar className="h-10 w-10 text-muran-primary mb-2" />
        <h3 className="text-lg font-medium mb-1">Sem orçamentos para visualizar</h3>
        <p className="text-gray-500 text-center">
          Nenhum orçamento personalizado encontrado para visualização no calendário.
        </p>
      </div>
    );
  }
  
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Calendário de Orçamentos</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-500">Meta</Badge>
            <Badge className="bg-red-500">Google</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderHeader()}
        {renderDaysOfWeek()}
        {renderCells()}
      </CardContent>
    </Card>
  );
};
