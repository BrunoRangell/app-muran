
import { Card } from "@/components/ui/card";
import { ClientsList } from "@/components/clients/ClientsList";
import { ClientsRanking } from "@/components/clients/rankings/ClientsRanking";
import { useClients } from "@/hooks/queries/useClients";
import { AlertCircle } from "lucide-react";
import { LoadingView } from "@/components/daily-reviews/dashboard/components/LoadingView";

const Clients = () => {
  console.log("🔍 [Clients.tsx] Renderizando página Clients");
  
  // Usar apenas um hook useClients SEM filtros para evitar conflitos
  const { clients, isLoading, error } = useClients();
  
  console.log("📊 [Clients.tsx] Estado atual:", {
    isLoading,
    clientsCount: clients?.length || 0,
    hasError: !!error,
    errorMessage: error?.message
  });

  // Estado de carregamento
  if (isLoading) {
    console.log("⏳ [Clients.tsx] Mostrando estado de loading");
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-muran-dark">
            Lista de Clientes
          </h1>
        </div>
        <LoadingView />
      </div>
    );
  }

  // Estado de erro
  if (error) {
    console.error("❌ [Clients.tsx] Erro na página:", error);
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-muran-dark">
            Lista de Clientes
          </h1>
        </div>
        <div className="flex flex-col items-center justify-center p-8 text-red-500 gap-4">
          <AlertCircle className="h-12 w-12" />
          <h2 className="text-xl font-semibold">Erro ao carregar dados</h2>
          <p className="text-center text-gray-600">
            Não foi possível carregar a lista de clientes.
            <br />
            Por favor, tente novamente mais tarde.
          </p>
          <p className="text-sm text-gray-500">
            Erro: {error.message}
          </p>
        </div>
      </div>
    );
  }

  // Verificar se temos dados
  if (!clients || clients.length === 0) {
    console.log("⚠️ [Clients.tsx] Nenhum cliente encontrado");
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-muran-dark">
            Lista de Clientes
          </h1>
        </div>
        <Card className="p-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Nenhum cliente encontrado
            </h3>
            <p className="text-gray-500">
              Comece adicionando seu primeiro cliente.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  console.log("✅ [Clients.tsx] Renderizando página com dados:", clients.length, "clientes");

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-muran-dark">
          Lista de Clientes
        </h1>
      </div>

      <Card className="p-2 md:p-6">
        <ClientsList clients={clients} />
      </Card>

      <ClientsRanking clients={clients} />
    </div>
  );
};

export default Clients;
