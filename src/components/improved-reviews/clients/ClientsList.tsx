import { ClientCard } from "./ClientCard";
import { ClientRow } from "./ClientRow";
import { ClientsTable } from "./ClientsTable";
import { EmptyState } from "../common/EmptyState";
import { useMemo } from "react";

interface ClientsListProps {
  data: any[] | undefined;
  viewMode: string;
  searchQuery: string;
  showOnlyAdjustments: boolean;
  showWithoutAccount: boolean;
  platform?: "meta" | "google";
}

export function ClientsList({
  data,
  viewMode,
  searchQuery,
  showOnlyAdjustments,
  showWithoutAccount,
  platform = "meta"
}: ClientsListProps) {
  // Filtrar os dados com base na pesquisa e nos filtros
  const filteredData = useMemo(() => {
    if (!data) return [];
    
    return data.filter(client => {
      // Filtro de texto
      const matchesSearch = 
        searchQuery === "" || 
        client.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client[`${platform}_account_name`] && 
          client[`${platform}_account_name`].toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Filtro de apenas ajustes necessários
      const matchesAdjustment = !showOnlyAdjustments || client.needsAdjustment;
      
      // Filtro de clientes sem conta cadastrada
      const matchesAccountFilter = !showWithoutAccount || !client.hasAccount;
      
      return matchesSearch && matchesAdjustment && matchesAccountFilter;
    });
  }, [data, searchQuery, showOnlyAdjustments, showWithoutAccount, platform]);
  
  // Ordenar clientes - PRIORIDADE DE CONTA + ORDEM ALFABÉTICA
  const sortedClients = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      // Primeiro critério: clientes COM conta aparecem primeiro
      if (a.hasAccount !== b.hasAccount) {
        return a.hasAccount ? -1 : 1;
      }
      // Segundo critério: ordem alfabética por nome da empresa
      return a.company_name.localeCompare(b.company_name);
    });
  }, [filteredData]);

  if (!sortedClients || sortedClients.length === 0) {
    return (
      <EmptyState
        title="Nenhum cliente encontrado"
        description={searchQuery ? "Tente ajustar sua busca ou filtros" : "Nenhum cliente disponível para revisão"}
      />
    );
  }

  // Renderizar com base no modo de visualização selecionado
  if (viewMode === "table") {
    return <ClientsTable data={sortedClients} platform={platform} />;
  }
  
  if (viewMode === "list") {
    return (
      <div className="space-y-2">
        {sortedClients.map((client) => (
          <ClientRow key={`${client.id}-${client[`${platform}_account_id`] || 'default'}`} client={client} platform={platform} />
        ))}
      </div>
    );
  }
  
  // Modo padrão: cards
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {sortedClients.map((client) => (
        <ClientCard key={`${client.id}-${client[`${platform}_account_id`] || 'default'}`} client={client} platform={platform} />
      ))}
    </div>
  );
}
