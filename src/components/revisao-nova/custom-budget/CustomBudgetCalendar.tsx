
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatters";
import { ClientWithBudgets, CustomBudget } from "../hooks/useCustomBudgets";

interface CustomBudgetCalendarProps {
  clientsWithBudgets: ClientWithBudgets[];
  onSelectBudget: (budget: CustomBudget) => void;
}

export function CustomBudgetCalendar({ clientsWithBudgets, onSelectBudget }: CustomBudgetCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // Extrair todos os orçamentos
  const allBudgets = clientsWithBudgets.flatMap(c => c.budgets);
  
  // Função para mapear orçamentos para datas na interface do calendário
  const getBudgetForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    
    return allBudgets.filter(budget => {
      const start = new Date(budget.start_date);
      const end = new Date(budget.end_date);
      const current = new Date(date);
      
      // Ajustar para comparar apenas datas (sem horas)
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      current.setHours(0, 0, 0, 0);
      
      // Verificar se a data atual está no intervalo do orçamento
      return current >= start && current <= end && budget.isActive;
    });
  };
  
  // Função para renderizar conteúdo de cada dia do calendário
  const renderDay = (date: Date) => {
    const budgetsForDay = getBudgetForDate(date);
    const hasActiveBudgets = budgetsForDay.length > 0;
    
    return (
      <div className="relative w-full h-full">
        <div className="flex justify-center items-center h-full">
          {date.getDate()}
        </div>
        {hasActiveBudgets && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-center">
            <Badge
              variant="outline"
              className="text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (budgetsForDay.length === 1) {
                  onSelectBudget(budgetsForDay[0]);
                } else {
                  // Lógica para quando houver múltiplos orçamentos
                  // Por ora, seleciona o primeiro
                  onSelectBudget(budgetsForDay[0]);
                }
              }}
            >
              {budgetsForDay.length}
            </Badge>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold">Calendário de Orçamentos</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          className="rounded-md border"
          components={{
            Day: ({ date }) => renderDay(date),
          }}
        />
        
        <div className="mt-4 text-sm text-gray-500">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">1</Badge>
            <span>Dia com orçamentos personalizados ativos</span>
          </div>
          <p>Clique em um dia destacado para ver detalhes dos orçamentos ativos.</p>
        </div>
      </CardContent>
    </Card>
  );
}
