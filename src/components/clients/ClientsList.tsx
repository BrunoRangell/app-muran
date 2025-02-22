
import { useState } from "react";
import { useClients } from "@/hooks/queries/useClients";
import { useClientColumns } from "@/hooks/useClientColumns";
import { useClientFilters } from "@/hooks/useClientFilters";
import { ClientsTable } from "./table/ClientsTable";
import { ClientsHeader } from "./components/ClientsHeader";
import { Client } from "./types";
import { ClientForm } from "@/components/admin/ClientForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export const ClientsList = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { columns, toggleColumn } = useClientColumns({ viewMode: 'default' }); // Corrigido para passar o objeto correto
  const { filters, updateFilter, clearFilters, hasActiveFilters } = useClientFilters();
  const { clients, isLoading } = useClients(filters);

  const handleEditClick = (client: Client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedClient(null);
    setIsFormOpen(true);
  };

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
        clients={clients || []}
        columns={columns}
        onEditClick={handleEditClick}
        sortConfig={{ key: "", direction: "asc" }}
        onSort={() => {}}
        isLoading={isLoading}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <ClientForm
            initialData={selectedClient}
            onSuccess={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
