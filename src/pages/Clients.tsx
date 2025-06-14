
import { Card } from "@/components/ui/card";
import { ClientsList } from "@/components/clients/ClientsList";
import { ClientsRanking } from "@/components/clients/rankings/ClientsRanking";
import { useUnifiedClientData } from "@/hooks/common/useUnifiedClientData";
import { AlertCircle } from "lucide-react";
import { ClientsLoadingState } from "@/components/loading-states/ClientsLoadingState";
import { logger } from "@/utils/logger";

const Clients = () => {
  const { clients, isLoading, error } = useUnifiedClientData({ includeInactive: true });

  if (error) {
    logger.error('CLIENT', 'Failed to load clients page', error);
    return (
      <div className="flex flex-col items-center justify-center p-8 text-red-500 gap-4">
        <AlertCircle className="h-12 w-12" />
        <h2 className="text-xl font-semibold">Erro ao carregar dados</h2>
        <p className="text-center text-gray-600">
          Não foi possível carregar a lista de clientes.
          <br />
          Por favor, tente novamente mais tarde.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <ClientsLoadingState />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-muran-dark">
          Lista de Clientes
        </h1>
      </div>

      <Card className="p-2 md:p-6">
        <ClientsList />
      </Card>

      <ClientsRanking clients={clients || []} />
    </div>
  );
};

export default Clients;
