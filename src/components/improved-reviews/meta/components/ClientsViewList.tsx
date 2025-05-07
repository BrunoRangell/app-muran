
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClientWithReview } from "../../../daily-reviews/hooks/types/reviewTypes";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, AlertCircle, Archive } from "lucide-react";
import { ClientCardList } from "./ClientCardList";

interface ClientsViewListProps {
  clientsWithMetaId: ClientWithReview[];
  clientsWithoutMetaId: ClientWithReview[];
  isProcessingClient: (clientId: string) => boolean;
  onReviewClient: (clientId: string) => Promise<void>;
}

export const ClientsViewList = ({
  clientsWithMetaId,
  clientsWithoutMetaId,
  isProcessingClient,
  onReviewClient
}: ClientsViewListProps) => {
  return (
    <ScrollArea className="h-[calc(100vh-400px)]">
      <div className="space-y-6">
        <div className="space-y-3">
          {clientsWithMetaId.length === 0 ? (
            <Card className="p-8 text-center">
              <CardContent className="flex flex-col items-center justify-center space-y-2">
                <Archive className="h-8 w-8 text-gray-400" />
                <p className="text-gray-600">Nenhum cliente com Meta Ads encontrado</p>
              </CardContent>
            </Card>
          ) : (
            clientsWithMetaId.map((client) => (
              <ClientCardList
                key={client.id}
                client={client}
                isProcessing={isProcessingClient(client.id)}
                onReviewClient={onReviewClient}
              />
            ))
          )}
        </div>

        {clientsWithoutMetaId.length > 0 && (
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-medium text-gray-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Clientes sem Meta Ads configurado ({clientsWithoutMetaId.length})
            </h3>

            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {clientsWithoutMetaId.map((client) => (
                    <div key={client.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <p className="font-medium">{client.company_name}</p>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      </div>
                      <p className="text-sm text-amber-600 mt-1">Meta Ads não configurado</p>
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
