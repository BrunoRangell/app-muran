
import { useState } from "react";
import { useClientColumns } from "@/hooks/useClientColumns";
import { useClientFilters } from "@/hooks/useClientFilters";
import { useUnifiedClientData } from "@/hooks/common/useUnifiedClientData";
import { ClientsTable } from "./table/ClientsTable";
import { ClientsHeader } from "./components/ClientsHeader";
import { ClientsDialog } from "./components/ClientsDialog";
import { Client } from "./types";

export const ClientsList = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { columns, toggleColumn } = useClientColumns({ viewMode: 'default' });
  const { filters, updateFilter, clearFilters, hasActiveFilters } = useClientFilters();
  const { clients, isLoading } = useUnifiedClientData({ filters });

  const handleEditClick = (client: Client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedClient(null);
    setIsFormOpen(true);
  };

  // Converter dados do Supabase para o tipo Client esperado
  const processedClients = clients?.map(client => ({
    ...client,
    payment_type: client.payment_type as "pre" | "post",
    status: client.status as "active" | "inactive"
  })) || [];

  return (
    <>
      <ClientsHeader
        columns={columns}
        filters={filters}
        hasActiveFilters={hasActiveFilters}
        onToggleColumn={toggleColumn}
        onFilterChange={updateFilter}
        onClearFilters={clearFilters}
        onCreateClick={handleCreateClick}
      />

      <ClientsTable
        clients={processedClients}
        columns={columns}
        onEditClick={handleEditClick}
        sortConfig={{ key: "", direction: "asc" }}
        onSort={() => {}}
        isLoading={isLoading}
      />

      <ClientsDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        selectedClient={selectedClient}
      />
    </>
  );
};
