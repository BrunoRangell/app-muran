
import { Loader } from "lucide-react";
import { ClientCard } from "./ClientCard";
import { ClientRow } from "./ClientRow";
import { ClientWithReview } from "../types/clientTypes";

interface ClientsListProps {
  clients: ClientWithReview[];
  isLoading: boolean;
  processingIds: string[];
  onReviewClient: (clientId: string) => void;
  onViewDetails: (clientId: string) => void;
  viewMode: "grid" | "list";
  platform: "meta" | "google";
}

export function ClientsList({
  clients,
  isLoading,
  processingIds,
  onReviewClient,
  onViewDetails,
  viewMode,
  platform
}: ClientsListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader className="animate-spin h-8 w-8 text-[#ff6e00]" />
      </div>
    );
  }
  
  if (clients.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
        <p className="text-gray-500">
          Nenhum cliente corresponde aos filtros selecionados.
        </p>
      </div>
    );
  }
  
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            isProcessing={processingIds.includes(client.id)}
            platform={platform}
            onReviewClient={onReviewClient}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cliente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Orçamento
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Gasto Total
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Diário Atual
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Diário Ideal
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Recomendação
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {clients.map((client) => (
            <ClientRow
              key={client.id}
              client={client}
              isProcessing={processingIds.includes(client.id)}
              platform={platform}
              onReviewClient={onReviewClient}
              onViewDetails={onViewDetails}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
