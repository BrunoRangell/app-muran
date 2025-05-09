
import React, { useMemo } from "react";
import { ClientCard } from "./ClientCard";
import { ClientRow } from "./ClientRow";
import { ClientsTable } from "./ClientsTable";
import { EmptyState } from "./EmptyState";
import { PlatformType, ViewMode } from "./types";

interface ClientsListProps {
  data: any[] | undefined;
  viewMode: ViewMode;
  searchQuery: string;
  showOnlyAdjustments: boolean;
  platform?: PlatformType;
}

export function ClientsList({
  data,
  viewMode,
  searchQuery,
  showOnlyAdjustments,
  platform = "meta"
}: ClientsListProps) {
  // Filtrar os dados com base na pesquisa e nos filtros
  const filteredData = useMemo(() => {
    if (!data) return [];
    
    return data.filter(client => {
      // Filtro de texto
      const searchFields = [
        client.company_name,
        client[`${platform}_account_name`],
        client[`${platform}_account_id`]
      ].filter(Boolean);
      
      const matchesSearch = 
        searchQuery === "" || 
        searchFields.some(field => 
          field?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      
      // Filtro de apenas ajustes necessários
      const matchesAdjustment = !showOnlyAdjustments || client.needsAdjustment;
      
      return matchesSearch && matchesAdjustment;
    });
  }, [data, searchQuery, showOnlyAdjustments, platform]);
  
  // Ordenar clientes (prioridade para os que precisam de ajuste)
  const sortedClients = useMemo(() => {
    if (!filteredData) return [];
    
    return [...filteredData].sort((a, b) => {
      // Primeiro critério: necessidade de ajuste (os que precisam ficam primeiro)
      if (a.needsAdjustment !== b.needsAdjustment) {
        return a.needsAdjustment ? -1 : 1;
      }
      // Segundo critério: ordem alfabética
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
          <ClientRow 
            key={`${client.id}-${client[`${platform}_account_id`] || 'default'}`} 
            client={client} 
            platform={platform} 
          />
        ))}
      </div>
    );
  }
  
  // Modo padrão: cards
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {sortedClients.map((client) => (
        <ClientCard 
          key={`${client.id}-${client[`${platform}_account_id`] || 'default'}`} 
          client={client} 
          platform={platform} 
        />
      ))}
    </div>
  );
}
