import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cost } from "@/types/cost";
import { parseMonthString } from "@/utils/monthParser";

interface MonthTab {
  key: string;
  label: string;
  month?: string; // YYYY-MM format
  count: number;
}

interface MonthTabsProps {
  costs: Cost[];
  onMonthChange: (month?: string) => void;
  selectedMonth?: string;
}

export function MonthTabs({ costs, onMonthChange, selectedMonth }: MonthTabsProps) {
  const monthTabs = useMemo(() => {
    // Extrair meses únicos dos custos
    const monthCounts = new Map<string, number>();
    
    costs.forEach(cost => {
      const costDate = new Date(cost.date);
      const monthKey = `${costDate.getFullYear()}-${String(costDate.getMonth() + 1).padStart(2, '0')}`;
      monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1);
    });

    // Converter para array de tabs e ordenar por data (mais recente primeiro)
    const monthTabsArray: MonthTab[] = Array.from(monthCounts.entries())
      .map(([monthKey, count]) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        
        const monthNames = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        
        const monthName = monthNames[date.getMonth()];
        const yearShort = year.slice(-2); // Últimos 2 dígitos do ano
        
        return {
          key: monthKey,
          label: `${monthName}/${yearShort}`,
          month: monthKey,
          count
        };
      })
      .sort((a, b) => {
        // Ordenar por data decrescente (mais recente primeiro)
        const [yearA, monthA] = a.month!.split('-').map(Number);
        const [yearB, monthB] = b.month!.split('-').map(Number);
        
        if (yearA !== yearB) return yearB - yearA;
        return monthB - monthA;
      });

    // Adicionar aba "Todos" no início
    const allTab: MonthTab = {
      key: 'all',
      label: 'Todos',
      count: costs.length
    };

    return [allTab, ...monthTabsArray];
  }, [costs]);

  return (
    <div className="w-full overflow-x-auto">
      <Tabs value={selectedMonth || 'all'} onValueChange={(value) => onMonthChange(value === 'all' ? undefined : value)}>
        <TabsList className="h-auto p-1 bg-muted">
          {monthTabs.map((tab) => (
            <TabsTrigger
              key={tab.key}
              value={tab.key}
              className="flex flex-col items-center gap-1 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <span className="font-medium">{tab.label}</span>
              <span className="text-xs text-muted-foreground">
                {tab.count} {tab.count === 1 ? 'custo' : 'custos'}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}