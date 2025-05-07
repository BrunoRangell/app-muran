import { ClientCard } from "./ClientCard";
import { ClientTableRow } from "./ClientTableRow";
import { ClientListItem } from "./ClientListItem";

interface ClientsListProps {
  data: any[];
  viewMode: "cards" | "table" | "list";
  searchQuery: string;
  showOnlyAdjustments: boolean;
  platform: "meta" | "google";
}

export function ClientsList({ 
  data, 
  viewMode, 
  searchQuery, 
  showOnlyAdjustments,
  platform
}: ClientsListProps) {
  // Filtrar clientes por texto de pesquisa
  const filteredData = data?.filter(client => {
    const matchesSearch = client.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (client.meta_account_name && client.meta_account_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (client.google_account_name && client.google_account_name.toLowerCase().includes(searchQuery.toLowerCase()));
                         
    const matchesAdjustment = showOnlyAdjustments ? client.needsAdjustment : true;
    
    return matchesSearch && matchesAdjustment;
  }) || [];

  if (!data || data.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-gray-50">
        <p className="text-lg text-gray-500">Nenhum cliente disponível para revisão.</p>
      </div>
    );
  }

  if (filteredData.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-gray-50">
        <p className="text-lg text-gray-500">
          Nenhum cliente corresponde aos critérios de filtro.
        </p>
      </div>
    );
  }

  const renderCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredData.map((client) => (
        <ClientCard 
          key={`${client.id}-${client[`${platform}_account_id`]}-card`} 
          client={client} 
          platform={platform}
        />
      ))}
    </div>
  );

  const renderTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-gray-500 text-sm font-medium">Cliente</th>
            <th className="px-4 py-2 text-left text-gray-500 text-sm font-medium">Orçamento</th>
            <th className="px-4 py-2 text-left text-gray-500 text-sm font-medium">Gasto</th>
            <th className="px-4 py-2 text-left text-gray-500 text-sm font-medium">Ajuste</th>
            <th className="px-4 py-2 text-left text-gray-500 text-sm font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((client) => (
            <ClientTableRow 
              key={`${client.id}-${client[`${platform}_account_id`]}-row`} 
              client={client}
              platform={platform}
            />
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderList = () => (
    <div className="space-y-2">
      {filteredData.map((client) => (
        <ClientListItem 
          key={`${client.id}-${client[`${platform}_account_id`]}-list`} 
          client={client}
          platform={platform}
        />
      ))}
    </div>
  );

  return (
    <div>
      {viewMode === "cards" && renderCards()}
      {viewMode === "table" && renderTable()}
      {viewMode === "list" && renderList()}
    </div>
  );
}
