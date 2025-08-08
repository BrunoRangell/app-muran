interface ChurnTooltipProps {
  churnedClients: string[];
  churnCount: number;
  churnRate: number;
}

export const ChurnTooltip = ({ churnedClients, churnCount, churnRate }: ChurnTooltipProps) => {
  return (
    <div className="font-semibold text-sm">
      {churnCount > 0 
        ? `Churn: ${churnCount} clientes (${churnRate.toFixed(1)}%)`
        : "Nenhum cliente cancelado neste mês"
      }
    </div>
  );
};