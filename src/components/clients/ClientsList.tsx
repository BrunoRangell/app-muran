
import { useState } from "react";
import { useClientColumns } from "@/hooks/useClientColumns";
import { ClientsTable } from "./table/ClientsTable";
import { ClientsHeader } from "./components/ClientsHeader";
import { Client } from "./types";
import { ClientForm } from "@/components/admin/ClientForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ClientFilters {
  status: string;
  acquisition_channel: string;
  payment_type: string;
}

interface ClientsListProps {
  clients?: Client[];
  isLoading?: boolean;
  filters: ClientFilters;
  onFilterChange: (key: keyof ClientFilters, value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export const ClientsList = ({ 
  clients = [], 
  isLoading = false,
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters
}: ClientsListProps) => {
  console.log("[ClientsList] Renderizado com", clients.length, "clientes, loading:", isLoading, "filtros:", filters);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { columns, toggleColumn } = useClientColumns({ viewMode: 'default' });

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
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
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
