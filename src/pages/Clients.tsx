
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ClientsList } from "@/components/clients/ClientsList";
import { ClientsRanking } from "@/components/clients/rankings/ClientsRanking";
import { useClients } from "@/hooks/queries/useClients";
import { useClientFilters } from "@/hooks/useClientFilters";
import { AlertCircle } from "lucide-react";
import { ClientsLoadingState } from "@/components/loading-states/ClientsLoadingState";

const Clients = () => {
  console.log("[Clients] Página Clients renderizada");
  const { filters, updateFilter, clearFilters, hasActiveFilters } = useClientFilters();
  const { clients, isLoading, error } = useClients(filters);

  // Timeout de segurança para evitar loading infinito
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        console.error("[Clients] Loading timeout - forçando saída do estado de loading");
        setLoadingTimeout(true);
      }, 10000);
      
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [isLoading]);

  if (error) {
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

  if (isLoading && !loadingTimeout) {
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
        <ClientsList 
          clients={clients} 
          isLoading={isLoading && !loadingTimeout}
          filters={filters}
          onFilterChange={updateFilter}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </Card>

      <ClientsRanking clients={clients || []} />
    </div>
  );
};

export default Clients;
