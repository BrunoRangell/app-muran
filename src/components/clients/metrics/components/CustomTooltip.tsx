
import { formatCurrency } from "@/utils/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RevenueTooltip } from "./RevenueTooltip";
import { ClientsTooltip } from "./ClientsTooltip";
import { ChurnTooltip } from "./ChurnTooltip";
import { NewClientsTooltip } from "./NewClientsTooltip";

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
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

    // Pegar os dados do primeiro entry que contém os detalhes
    const dataPoint = payload[0]?.payload;
    
    // Se há apenas uma métrica sendo exibida, mostrar tooltip específico
    if (payload.length === 1) {
      const entry = payload[0];
      const metricKey = entry.dataKey;
      
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg max-w-xs">
          <p className="text-sm font-medium text-gray-600 mb-3">{formatMonthYear(label || '')}</p>
          
          {metricKey === 'mrr' && dataPoint?.paymentDetails && (
            <RevenueTooltip 
              paymentDetails={dataPoint.paymentDetails}
              totalRevenue={entry.value || 0}
            />
          )}
          
          {metricKey === 'clients' && dataPoint?.clientDetails && (
            <ClientsTooltip 
              clientDetails={dataPoint.clientDetails}
              totalClients={entry.value || 0}
            />
          )}
          
          {metricKey === 'churn' && dataPoint?.churnedClients && (
            <ChurnTooltip 
              churnedClients={dataPoint.churnedClients}
              churnCount={entry.value || 0}
              churnRate={dataPoint.churnRate || 0}
            />
          )}
          
          {metricKey === 'newClients' && dataPoint?.newClientNames && (
            <NewClientsTooltip 
              newClientNames={dataPoint.newClientNames}
              newClientsCount={entry.value || 0}
            />
          )}
          
          {metricKey === 'churnRate' && (
            <div className="space-y-2">
              <div className="font-semibold text-sm">
                Taxa de Churn: {(entry.value || 0).toFixed(1)}%
              </div>
              {dataPoint?.churnedClients && dataPoint.churnedClients.length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {dataPoint.churnedClients.map((clientName: string, index: number) => (
                    <div key={index} className="text-xs bg-red-50 p-2 rounded border-l-2 border-red-200">
                      {clientName}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Tooltip padrão para múltiplas métricas
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
