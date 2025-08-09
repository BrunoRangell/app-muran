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
    <div className="font-semibold text-sm">
      Total de clientes: {totalClients}
    </div>
  );
};