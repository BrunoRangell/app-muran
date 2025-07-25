
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClientsList } from "@/components/clients/ClientsList";
import { ClientsRanking } from "@/components/clients/rankings/ClientsRanking";
import { useClients } from "@/hooks/queries/useClients";
import { AlertCircle, RefreshCw } from "lucide-react";
import { LoadingView } from "@/components/daily-reviews/dashboard/components/LoadingView";

const Clients = () => {
  const [forceRefreshKey, setForceRefreshKey] = useState(0);
  
  console.log("🔍 [Clients.tsx] Renderizando página Clients");
  console.log("🔍 [Clients.tsx] ForceRefreshKey:", forceRefreshKey);
  
  // Usar hook sem filtros para evitar conflitos
  const { clients, isLoading, error, forceRefresh } = useClients();
  
  console.log("📊 [Clients.tsx] Estado atual:", {
    isLoading,
    clientsCount: clients?.length || 0,
    hasError: !!error,
    errorMessage: error?.message,
    timestamp: new Date().toISOString()
  });

  // Função para forçar refresh completo
  const handleForceRefresh = async () => {
    console.log("🔄 [Clients.tsx] Botão de refresh pressionado");
    setForceRefreshKey(prev => prev + 1);
    await forceRefresh();
  };

  // Timeout de segurança - se loading por mais de 10 segundos, mostrar erro
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  React.useEffect(() => {
    if (isLoading) {
      console.log("⏰ [Clients.tsx] Iniciando timeout de 10 segundos");
      const timeout = setTimeout(() => {
        console.warn("⚠️ [Clients.tsx] Timeout de loading atingido");
        setLoadingTimeout(true);
      }, 10000);
      
      return () => {
        clearTimeout(timeout);
        setLoadingTimeout(false);
      };
    }
  }, [isLoading]);

  // Estado de carregamento com timeout
  if (isLoading && !loadingTimeout) {
    console.log("⏳ [Clients.tsx] Mostrando estado de loading");
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-muran-dark">
            Lista de Clientes
          </h1>
          <Button
            onClick={handleForceRefresh}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
        <LoadingView />
      </div>
    );
  }

  // Estado de erro ou timeout
  if (error || loadingTimeout) {
    console.error("❌ [Clients.tsx] Erro na página:", error);
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-muran-dark">
            Lista de Clientes
          </h1>
          <Button
            onClick={handleForceRefresh}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar Novamente
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center p-8 text-red-500 gap-4">
          <AlertCircle className="h-12 w-12" />
          <h2 className="text-xl font-semibold">
            {loadingTimeout ? "Timeout ao carregar dados" : "Erro ao carregar dados"}
          </h2>
          <p className="text-center text-gray-600">
            {loadingTimeout 
              ? "A página demorou muito para carregar. Tente novamente."
              : "Não foi possível carregar a lista de clientes."
            }
            <br />
            Por favor, tente novamente mais tarde.
          </p>
          {error && (
            <p className="text-sm text-gray-500">
              Erro: {error.message}
            </p>
          )}
          <Button 
            onClick={handleForceRefresh}
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
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
          <Button
            onClick={handleForceRefresh}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
        <Card className="p-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Nenhum cliente encontrado
            </h3>
            <p className="text-gray-500 mb-4">
              Comece adicionando seu primeiro cliente.
            </p>
            <Button 
              onClick={handleForceRefresh}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar Lista
            </Button>
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
        <Button
          onClick={handleForceRefresh}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <Card className="p-2 md:p-6">
        <ClientsList clients={clients} />
      </Card>

      <ClientsRanking clients={clients} />
    </div>
  );
};

export default Clients;
