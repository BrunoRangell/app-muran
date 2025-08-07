
import { formatCurrency } from "@/utils/formatters";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  console.log('CustomTooltip called:', { active, payload, label });
  
  if (active && payload && payload.length) {
    // Formatação simples para o mês/ano
    const formatMonthYear = (monthYear: string) => {
      if (!monthYear) return '';
      
      try {
        // Se contém '/', tentar formatar como mês/ano
        if (monthYear.includes('/')) {
          const [month, year] = monthYear.split('/');
          const monthNum = parseInt(month);
          const yearNum = parseInt(year);
          
          if (!isNaN(monthNum) && !isNaN(yearNum) && monthNum >= 1 && monthNum <= 12) {
            const fullYear = yearNum < 50 ? 2000 + yearNum : 1900 + yearNum;
            const date = new Date(fullYear, monthNum - 1, 1);
            return format(date, "MMM'/'yy", { locale: ptBR }).toLowerCase();
          }
        }
        
        return monthYear;
      } catch (error) {
        console.error('Erro ao formatar mês:', error);
        return monthYear;
      }
    };

    return (
      <div className="bg-white p-4 border rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-600 mb-2">{formatMonthYear(label || '')}</p>
        {payload.map((entry: any, index: number) => {
          const value = entry.value;
          const formattedValue = entry.dataKey === 'mrr'
            ? formatCurrency(value || 0)
            : entry.dataKey === 'churnRate'
            ? `${(value || 0).toFixed(1)}%`
            : (value || 0);

          return (
            <p 
              key={index} 
              className="text-sm flex items-center gap-2 py-1"
            >
              <span 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium" style={{ color: entry.color }}>
                {entry.name}:
              </span>
              <span className="text-gray-700">
                {formattedValue}
              </span>
            </p>
          );
        })}
        <p className="text-xs text-gray-500 mt-2">Clique para ver detalhes</p>
      </div>
    );
  }
  return null;
};
