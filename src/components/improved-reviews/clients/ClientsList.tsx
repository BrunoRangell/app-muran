
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
      // VALIDAÇÃO: verificar se client e company_name existem
      if (!client || typeof client.company_name !== 'string') {
        console.warn('⚠️ Cliente inválido ou sem company_name:', client);
        return false; // Filtrar clientes inválidos
      }
      
      // Filtro de texto
      const matchesSearch = 
        searchQuery === "" || 
        client.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client[`${platform}_account_name`] && 
          client[`${platform}_account_name`].toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Filtro de apenas ajustes necessários
      const matchesAdjustment = !showOnlyAdjustments || client.needsAdjustment;
      
      // Debug log para verificar o filtro de ajustes
      if (showOnlyAdjustments) {
        console.log(`🔍 DEBUG - Filtro "necessitam ajustes" para ${client.company_name}:`, {
          needsAdjustment: client.needsAdjustment,
          budgetDifference: client.budgetCalculation?.budgetDifference,
          needsBudgetAdjustment: client.budgetCalculation?.needsBudgetAdjustment,
          needsAdjustmentBasedOnAverage: client.budgetCalculation?.needsAdjustmentBasedOnAverage,
          passedFilter: matchesAdjustment
        });
      }
      
      // Filtro de clientes sem conta cadastrada
      const matchesAccountFilter = !showWithoutAccount || !client.hasAccount;
      
      return matchesSearch && matchesAdjustment && matchesAccountFilter;
    });
  }, [data, searchQuery, showOnlyAdjustments, showWithoutAccount, platform]);
  
  // Ordenar clientes - PRIORIDADE DE CONTA + ORDEM ALFABÉTICA com validação
  const sortedClients = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      // VALIDAÇÃO: verificar se ambos os clientes têm company_name
      const aName = a?.company_name || '';
      const bName = b?.company_name || '';
      
      // Primeiro critério: clientes COM conta aparecem primeiro
      if (a.hasAccount !== b.hasAccount) {
        return a.hasAccount ? -1 : 1;
      }
      
      // Segundo critério: ordem alfabética por nome da empresa (com validação)
      try {
        return aName.localeCompare(bName);
      } catch (error) {
        console.error('❌ Erro no sort localeCompare:', error, { a: aName, b: bName });
        // Fallback para sort básico se localeCompare falhar
        return aName < bName ? -1 : aName > bName ? 1 : 0;
      }
    });
  }, [filteredData]);

  // Debug log para verificar a lista final
  console.log(`🔍 DEBUG - Lista final de clientes (${platform}):`, {
    totalClients: data?.length || 0,
    filteredClients: filteredData.length,
    sortedClients: sortedClients.length,
    showOnlyAdjustments,
    clientsNeedingAdjustment: data?.filter(c => c.needsAdjustment).length || 0
  });

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
