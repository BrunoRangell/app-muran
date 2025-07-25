
import { useState } from "react";
import { useClients } from "@/hooks/queries/useClients";
import { useClientColumns } from "@/hooks/useClientColumns";
import { useClientFilters } from "@/hooks/useClientFilters";
import { ClientsTable } from "./table/ClientsTable";
import { ClientsHeader } from "./components/ClientsHeader";
import { Client } from "./types";
import { ClientForm } from "@/components/admin/ClientForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LoadingView } from "@/components/daily-reviews/dashboard/components/LoadingView";

export const ClientsList = () => {
  console.log("🔍 Renderizando ClientsList");
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { columns, toggleColumn } = useClientColumns({ viewMode: 'default' });
  const { filters, updateFilter, clearFilters, hasActiveFilters } = useClientFilters();
  
  // Usar o hook useClients com os filtros aplicados
  const { clients, isLoading, error } = useClients(filters);

  console.log("📊 Estado ClientsList:", {
    isLoading,
    clientsCount: clients?.length || 0,
    hasError: !!error,
    activeFilters: hasActiveFilters
  });

  const handleEditClick = (client: Client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedClient(null);
    setIsFormOpen(true);
  };

  // Se ainda está carregando, mostrar loading
  if (isLoading) {
    console.log("⏳ ClientsList - Mostrando loading");
    return <LoadingView />;
  }

  // Se há erro, mostrar na table mesmo assim (o erro será tratado na página pai)
  if (error) {
    console.error("❌ Erro no ClientsList:", error);
  }

  console.log("✅ ClientsList renderizando tabela com", clients?.length || 0, "clientes");

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
