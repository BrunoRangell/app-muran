
import { formatCurrency } from "@/utils/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    // Formatar o mês/ano para português
    const formatMonthYear = (monthYear: string) => {
      try {
        const [month, year] = monthYear.split('/');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        // Usando 'LLL' para obter a abreviação correta em português
        return format(date, "LLL'/'yy", { locale: ptBR }).toLowerCase();
      } catch (error) {
        console.error('Erro ao formatar mês:', error, monthYear);
        return monthYear;
      }
    };

    return (
      <div className="bg-white p-4 border rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-600 mb-2">{formatMonthYear(label || '')}</p>
        {payload.map((entry: any, index: number) => {
          const value = entry.payload[entry.dataKey];
          const formattedValue = entry.dataKey === 'mrr'
            ? formatCurrency(value)
            : entry.dataKey === 'churnRate'
            ? `${value.toFixed(1)}%`
            : value;

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
