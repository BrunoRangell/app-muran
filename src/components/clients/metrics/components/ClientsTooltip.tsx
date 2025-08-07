import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClientDetail } from "../utils/calculateMonthlyMetrics";

interface ClientsTooltipProps {
  clientDetails: ClientDetail[];
  totalClients: number;
}

export const ClientsTooltip = ({ clientDetails, totalClients }: ClientsTooltipProps) => {
  const formatLastPayment = (dateStr: string | null) => {
    if (!dateStr) return "Nunca";
    try {
      const date = new Date(dateStr);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  return (
    <div className="space-y-2">
      <div className="font-semibold text-sm">
        Total de clientes: {totalClients}
      </div>
      <div className="max-h-32 overflow-y-auto space-y-1">
        {clientDetails.map((client, index) => (
          <div key={index} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
            <div className="flex-1 truncate font-medium">
              {client.company_name}
            </div>
            <div className="text-gray-600 text-xs">
              Último: {formatLastPayment(client.last_payment_date)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};