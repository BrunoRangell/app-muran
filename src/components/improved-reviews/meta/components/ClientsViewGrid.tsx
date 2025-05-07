
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClientWithReview } from "../../../daily-reviews/hooks/types/reviewTypes";
import { ClientCardGrid } from "./ClientCardGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ClientsViewGridProps {
  clientsWithMetaId: ClientWithReview[];
  clientsWithoutMetaId: ClientWithReview[];
  isProcessingClient: (clientId: string) => boolean;
  onReviewClient: (clientId: string) => Promise<void>;
}

export const ClientsViewGrid = ({
  clientsWithMetaId,
  clientsWithoutMetaId,
  isProcessingClient,
  onReviewClient
}: ClientsViewGridProps) => {
  return (
    <ScrollArea className="h-[calc(100vh-400px)]">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {clientsWithMetaId.map((client) => (
            <ClientCardGrid
              key={client.id}
              client={client}
              isProcessing={isProcessingClient(client.id)}
              onReviewClient={onReviewClient}
            />
          ))}
        </div>

        {clientsWithoutMetaId.length > 0 && (
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-medium text-gray-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Clientes sem Meta Ads configurado ({clientsWithoutMetaId.length})
            </h3>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Clientes sem configuração</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {clientsWithoutMetaId.map((client) => (
                    <div key={client.id} className="p-3 bg-gray-50 rounded-md">
                      <p className="font-medium truncate">{client.company_name}</p>
                      <p className="text-xs text-amber-600">Meta Ads não configurado</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
