
import { useState } from "react";
import { SortConfig, ClientWithTotalPayments } from "../types";

export function usePaymentsSort(clients: ClientWithTotalPayments[] | undefined) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'company_name',
    direction: 'asc'
  });
  const [searchTerm, setSearchTerm] = useState('');

  const handleSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredAndSortedClients = clients
    ?.filter(client => 
      client.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    ?.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'active' ? -1 : 1;
      }

      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      
      switch (sortConfig.key) {
        case 'company_name':
          return a.company_name.localeCompare(b.company_name) * direction;
        case 'contract_value':
          return (a.contract_value - b.contract_value) * direction;
        case 'total_received':
          return (a.total_received - b.total_received) * direction;
        default:
          return 0;
      }
    });

  return {
    sortConfig,
    searchTerm,
    setSearchTerm,
    handleSort,
    filteredAndSortedClients
  };
}
