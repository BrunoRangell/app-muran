interface NewClientsTooltipProps {
  newClientNames: string[];
  newClientsCount: number;
}

export const NewClientsTooltip = ({ newClientNames, newClientsCount }: NewClientsTooltipProps) => {
  return (
    <div className="font-semibold text-sm">
      {newClientsCount > 0 
        ? `Novos clientes: ${newClientsCount}`
        : "Nenhum cliente adquirido neste mês"
      }
    </div>
  );
};