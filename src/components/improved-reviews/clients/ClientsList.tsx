
import { ClientCard } from "./ClientCard";
import { EmptyState } from "../common/EmptyState";
import { useMemo } from "react";

interface ClientsListProps {
  data: any[] | undefined;
  searchQuery: string;
  activeFilter?: string;
  showWithoutAccount: boolean;
  budgetCalculationMode?: "weighted" | "current";
  platform?: "meta" | "google";
}

export function ClientsList({
  data,
  searchQuery,
  activeFilter = "",
  showWithoutAccount,
  budgetCalculationMode,
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
      
      // Filtro de activeFilter (seleção exclusiva)
      let matchesActiveFilter = true;
      if (activeFilter === "adjustments") {
        matchesActiveFilter = client.needsAdjustment;
      } else if (activeFilter === "campaigns") {
        matchesActiveFilter = client.veiculationStatus && 
          (client.veiculationStatus.status === "none_running" || 
           client.veiculationStatus.status === "no_campaigns" ||
           client.veiculationStatus.status === "partial_running");
      } else if (activeFilter === "balance") {
        // Mostrar TODAS as contas pré-pagas, sem exceção
        const isPrepaid = client.balance_info?.billing_model === "pre";
        matchesActiveFilter = isPrepaid;
      } else if (activeFilter === "without-account") {
        matchesActiveFilter = !client.hasAccount;
      }
      
      // O filtro de conta agora está integrado no activeFilter
      
      return matchesSearch && matchesActiveFilter;
    });
  }, [data, searchQuery, activeFilter, showWithoutAccount, platform]);
  
  // Ordenar clientes com nova lógica de saldo
  const sortedClients = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      // VALIDAÇÃO: verificar se ambos os clientes têm company_name
      const aName = a?.company_name || '';
      const bName = b?.company_name || '';
      
      // Se activeFilter "balance" está ativo, ordenar por dias restantes (menor primeiro)
      if (activeFilter === "balance" && platform === "meta") {
        const calculateDaysRemaining = (client: any) => {
          const balance = client.balance_info?.balance_value || 0;
          const dailyBudget = client.meta_daily_budget || 0;
          
          if (balance <= 0) return -1; // Saldo esgotado vai primeiro
          if (dailyBudget <= 0) return Infinity; // Sem limite vai por último
          return balance / dailyBudget;
        };
        
        const aDays = calculateDaysRemaining(a);
        const bDays = calculateDaysRemaining(b);
        
        return aDays - bDays; // Menos dias primeiro
      }
      
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
  }, [filteredData, activeFilter, platform]);

  // Debug log para verificar a lista final
  console.log(`🔍 DEBUG - Lista final de clientes (${platform}):`, {
    totalClients: data?.length || 0,
    filteredClients: filteredData.length,
    sortedClients: sortedClients.length,
    activeFilter,
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

  // Renderizar apenas em formato de cards
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {sortedClients.map((client) => (
        <ClientCard key={`${client.id}-${client[`${platform}_account_id`] || 'default'}`} client={client} platform={platform} budgetCalculationMode={budgetCalculationMode} />
      ))}
    </div>
  );
}
