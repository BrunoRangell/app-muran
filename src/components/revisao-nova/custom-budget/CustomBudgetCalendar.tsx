
import React, { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addDays, isSameDay, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader, ChevronLeft, ChevronRight, Edit } from "lucide-react";
import { ClientWithBudgets, CustomBudget } from "../hooks/useCustomBudgets";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CustomBudgetCalendarProps {
  filteredClients?: ClientWithBudgets[];
  isLoading: boolean;
  formatBudget: (value: number) => string;
  onEdit: (budget: CustomBudget) => void;
}

export const CustomBudgetCalendar = ({
  filteredClients,
  isLoading,
  formatBudget,
  onEdit
}: CustomBudgetCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Calcular dias do mês atual
  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });
  
  // Obter todos os orçamentos em formato plano
  const allBudgets = useMemo(() => {
    if (!filteredClients) return [];
    
    return filteredClients.flatMap(client => 
      client.customBudgets.map(budget => ({
        ...budget,
        client_name: client.company_name
      }))
    );
  }, [filteredClients]);

  // Agrupar orçamentos por dia para exibição no calendário
  const budgetsByDay = useMemo(() => {
    const map = new Map();
    
    daysInMonth.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const budgetsForDay = allBudgets.filter(budget => {
        const startDate = new Date(budget.start_date);
        const endDate = new Date(budget.end_date);
        return day >= startDate && day <= endDate && budget.is_active;
      });
      
      map.set(dateStr, budgetsForDay);
    });
    
    return map;
  }, [daysInMonth, allBudgets]);
  
  // Navegar entre meses
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  
  // Orçamentos para o dia selecionado
  const selectedDayBudgets = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return budgetsByDay.get(dateStr) || [];
  }, [selectedDate, budgetsByDay]);
  
  // Renderizar a célula do dia
  const renderDayCell = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const budgets = budgetsByDay.get(dateStr) || [];
    const isToday = isSameDay(day, new Date());
    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
    
    // Determinar as cores de plataforma para a borda
    const hasMeta = budgets.some(b => b.platform === 'meta');
    const hasGoogle = budgets.some(b => b.platform === 'google');
    
    let borderClass = '';
    if (hasMeta && hasGoogle) {
      borderClass = 'border-l-purple-500'; // Roxo para ambos
    } else if (hasMeta) {
      borderClass = 'border-l-blue-500'; // Azul para Meta
    } else if (hasGoogle) {
      borderClass = 'border-l-red-500'; // Vermelho para Google
    }
    
    return (
      <div
        key={dateStr}
        className={`
          h-24 border p-1 overflow-hidden cursor-pointer transition-all
          ${isToday ? 'bg-muran-primary/5' : ''}
          ${isSelected ? 'ring-2 ring-muran-primary ring-offset-1' : ''}
          ${budgets.length > 0 ? `border-l-4 ${borderClass}` : ''}
        `}
        onClick={() => setSelectedDate(day)}
      >
        <div className="flex justify-between items-start">
          <span className={`
            text-sm font-medium p-1 rounded-full h-6 w-6 flex items-center justify-center
            ${isToday ? 'bg-muran-primary text-white' : ''}
          `}>
            {format(day, 'd')}
          </span>
          {budgets.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {budgets.length}
            </Badge>
          )}
        </div>
        
        <div className="mt-1 space-y-1">
          {budgets.slice(0, 2).map((budget, i) => (
            <Tooltip key={budget.id} delayDuration={300}>
              <TooltipTrigger asChild>
                <div 
                  className={`
                    text-xs truncate px-1 py-0.5 rounded
                    ${budget.platform === 'meta' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}
                  `}
                >
                  {budget.client_name}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className="text-xs">
                  <p className="font-bold">{budget.client_name}</p>
                  <p>{formatBudget(budget.budget_amount)}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
          {budgets.length > 2 && (
            <div className="text-xs text-muted-foreground pl-1">
              +{budgets.length - 2} mais
            </div>
          )}
        </div>
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader className="animate-spin h-6 w-6 mr-2 text-muran-primary" />
        <span>Carregando orçamentos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date())}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
          <div key={day} className="bg-gray-100 text-center py-2 font-medium">
            {day}
          </div>
        ))}
        
        {Array(firstDayOfMonth.getDay())
          .fill(null)
          .map((_, index) => (
            <div key={`empty-${index}`} className="bg-white opacity-50" />
          ))}
        
        {daysInMonth.map(day => (
          <div key={day.toISOString()} className="bg-white">
            {renderDayCell(day)}
          </div>
        ))}
      </div>

      {selectedDate && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Orçamentos para {format(selectedDate, 'dd/MM/yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDayBudgets.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum orçamento ativo para este dia.</p>
            ) : (
              <div className="space-y-2">
                {selectedDayBudgets.map(budget => (
                  <div key={budget.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{budget.client_name}</span>
                        <Badge className={budget.platform === 'meta' ? 'bg-blue-500' : 'bg-red-500'}>
                          {budget.platform === 'meta' ? 'Meta' : 'Google'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(budget.start_date), 'dd/MM/yyyy')} - {format(new Date(budget.end_date), 'dd/MM/yyyy')}
                      </div>
                      <div className="text-sm font-medium">{formatBudget(budget.budget_amount)}</div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onEdit(budget)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
