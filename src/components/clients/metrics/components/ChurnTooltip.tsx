interface ChurnTooltipProps {
  churnedClients: string[];
  churnCount: number;
  churnRate: number;
}

export const ChurnTooltip = ({ churnedClients, churnCount, churnRate }: ChurnTooltipProps) => {
  return (
    <div className="space-y-2">
      <div className="font-semibold text-sm">
        Churn: {churnCount} clientes ({churnRate.toFixed(1)}%)
      </div>
      {churnedClients.length > 0 && (
        <div className="max-h-32 overflow-y-auto space-y-1">
          {churnedClients.map((clientName, index) => (
            <div key={index} className="text-xs bg-red-50 p-2 rounded border-l-2 border-red-200">
              {clientName}
            </div>
          ))}
        </div>
      )}
      {churnedClients.length === 0 && (
        <div className="text-xs text-gray-500">
          Nenhum cliente cancelado neste mês
        </div>
      )}
    </div>
  );
};