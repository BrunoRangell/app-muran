import { useState } from "react";
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

  // Novo: estado para ordenação
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "",
    direction: "asc",
  });

  const { columns, toggleColumn } = useClientColumns({ viewMode: "default" });
  const { filters, updateFilter, clearFilters, hasActiveFilters } = useClientFilters();
  const { clients, totalCount, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useClientsPaginated(filters);

  const handleEditClick = (client: Client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedClient(null);
    setIsFormOpen(true);
  };

  // Handler para alternar a ordenação
  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        // Alterna asc/desc
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  // Ordenação aplicada localmente aos clientes já carregados
  const sortedClients = [...(clients || [])].sort((a, b) => {
    const { key, direction } = sortConfig;
    if (!key) return 0;

    const aValue = (a as any)[key];
    const bValue = (b as any)[key];

    if (aValue == null || bValue == null) return 0;

    // Comparação numérica ou textual
    if (typeof aValue === "number" && typeof bValue === "number") {
      return direction === "asc" ? aValue - bValue : bValue - aValue;
    }
    const comparison = String(aValue).localeCompare(String(bValue), "pt-BR", { numeric: true });
    return direction === "asc" ? comparison : -comparison;
  });

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
          clients={sortedClients}
          columns={columns}
          onEditClick={handleEditClick}
          sortConfig={sortConfig}
          onSort={handleSort}
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
          <ClientForm initialData={selectedClient} onSuccess={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};
