interface NewClientsTooltipProps {
  newClientNames: string[];
  newClientsCount: number;
}

export const NewClientsTooltip = ({ newClientNames, newClientsCount }: NewClientsTooltipProps) => {
  return (
    <div className="space-y-2">
      <div className="font-semibold text-sm">
        Novos clientes: {newClientsCount}
      </div>
      {newClientNames.length > 0 && (
        <div className="max-h-32 overflow-y-auto space-y-1">
          {newClientNames.map((clientName, index) => (
            <div key={index} className="text-xs bg-green-50 p-2 rounded border-l-2 border-green-200">
              {clientName}
            </div>
          ))}
        </div>
      )}
      {newClientNames.length === 0 && (
        <div className="text-xs text-gray-500">
          Nenhum cliente adquirido neste mês
        </div>
      )}
    </div>
  );
};