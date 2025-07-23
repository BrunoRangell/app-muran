
import { useState } from "react";
import { useClientColumns } from "@/hooks/useClientColumns";
import { useClientFilters } from "@/hooks/useClientFilters";
import { ClientsTable } from "./table/ClientsTable";
import { ClientsHeader } from "./components/ClientsHeader";
import { Client } from "./types";
import { ClientForm } from "@/components/admin/ClientForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ClientsListProps {
  clients: Client[];
}

export const ClientsList = ({ clients }: ClientsListProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { columns, toggleColumn } = useClientColumns({ viewMode: 'default' });
  const { filters, updateFilter, clearFilters, hasActiveFilters } = useClientFilters();

  // Filtrar clientes localmente
  const filteredClients = clients.filter(client => {
    if (filters.status && client.status !== filters.status) return false;
    if (filters.acquisition_channel && client.acquisition_channel !== filters.acquisition_channel) return false;
    if (filters.payment_type && client.payment_type !== filters.payment_type) return false;
    return true;
  });

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
        clients={filteredClients}
        columns={columns}
        onEditClick={handleEditClick}
        sortConfig={{ key: "", direction: "asc" }}
        onSort={() => {}}
        isLoading={false}
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
