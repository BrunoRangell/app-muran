
import { formatCurrency } from "@/utils/formatters";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    // Função para formatar o mês/ano para português com validação robusta
    const formatMonthYear = (monthYear: string) => {
      try {
        if (!monthYear || typeof monthYear !== 'string') {
          console.warn('Invalid monthYear value:', monthYear);
          return monthYear || '';
        }

        // Verificar se já está no formato correto (ex: "jul/24")
        if (monthYear.includes('/') && monthYear.length <= 6) {
          const parts = monthYear.split('/');
          if (parts.length === 2) {
            const [monthStr, yearStr] = parts;
            
            // Tentar parsear como MMM/yy primeiro
            try {
              const parsedDate = parse(monthYear, 'MMM/yy', new Date());
              if (!isNaN(parsedDate.getTime())) {
                return format(parsedDate, "MMM'/'yy", { locale: ptBR }).toLowerCase();
              }
            } catch (parseError) {
              console.log('Erro no parse MMM/yy, tentando MM/yy:', parseError);
            }

            // Se não conseguir, tentar como MM/yy
            try {
              const month = parseInt(monthStr);
              const year = parseInt(yearStr);
              
              if (!isNaN(month) && !isNaN(year) && month >= 1 && month <= 12) {
                const fullYear = year < 50 ? 2000 + year : 1900 + year;
                const date = new Date(fullYear, month - 1, 1);
                return format(date, "MMM'/'yy", { locale: ptBR }).toLowerCase();
              }
            } catch (numericError) {
              console.log('Erro no parse numérico:', numericError);
            }
          }
        }

        // Fallback: retornar o valor original
        console.warn('Não foi possível formatar a data:', monthYear);
        return monthYear;
      } catch (error) {
        console.error('Erro geral ao formatar mês:', error, monthYear);
        return monthYear || '';
      }
    };

    return (
      <div className="bg-white p-4 border rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-600 mb-2">{formatMonthYear(label || '')}</p>
        {payload.map((entry: any, index: number) => {
          const value = entry.payload[entry.dataKey];
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
