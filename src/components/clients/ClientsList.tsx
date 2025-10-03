
import { useState, useEffect } from "react";
import { useClientsPaginated } from "@/hooks/queries/useClientsPaginated";
import { useClientColumns } from "@/hooks/useClientColumns";
import { useClientFilters } from "@/hooks/useClientFilters";
import { ClientsTable } from "./table/ClientsTable";
import { ClientsHeader } from "./components/ClientsHeader";
import { Client } from "./types";
import { ClientForm } from "@/components/admin/ClientForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export const ClientsList = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { columns, toggleColumn } = useClientColumns({ viewMode: 'default' });
  const { filters, updateFilter, clearFilters, hasActiveFilters } = useClientFilters();
  const { 
    clients, 
    totalCount,
    isLoading, 
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage 
  } = useClientsPaginated(filters);

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

      <div className="space-y-4">
        <div className="text-sm text-muted-foreground px-2">
          Exibindo {clients.length} de {totalCount} clientes
        </div>

        <ClientsTable
          clients={clients || []}
          columns={columns}
          onEditClick={handleEditClick}
          sortConfig={{ key: "", direction: "asc" }}
          onSort={() => {}}
          isLoading={isLoading}
        />

        {hasNextPage && (
          <div className="flex justify-center py-4">
            <Button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              variant="outline"
              className="min-w-[200px]"
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                `Carregar mais clientes`
              )}
            </Button>
          </div>
        )}
      </div>

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
