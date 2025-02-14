
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Filter, X, Loader } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClientForm } from "@/components/admin/ClientForm";
import { ClientsTable } from "./table/ClientsTable";
import { ColumnToggle } from "./table/ColumnToggle";
import { FilterPopover } from "./table/FilterPopover";
import { Column, SortConfig } from "./types";
import { useClients } from "@/hooks/queries/useClients";
import { useClientFilters } from "@/hooks/useClientFilters";

interface ClientsListProps {
  onPaymentClick?: (clientId: string) => void;
  viewMode?: 'default' | 'payments';
}

export const ClientsList = ({ onPaymentClick, viewMode = 'default' }: ClientsListProps) => {
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'company_name', direction: 'asc' });
  const { filters, hasActiveFilters, clearFilters, updateFilter } = useClientFilters();
  const { clients, isLoading, error, createClient, updateClient } = useClients(filters);

  const [columns, setColumns] = useState<Column[]>([
    { id: 'company_name', label: 'Empresa', show: true, fixed: true },
    { id: 'contract_value', label: 'Valor Mensal', show: viewMode === 'default' || viewMode === 'payments', fixed: viewMode === 'payments' },
    { id: 'status', label: 'Status', show: true, fixed: true },
    { id: 'acquisition_channel', label: 'Canal de Aquisição', show: viewMode === 'default', fixed: false },
    { id: 'first_payment_date', label: 'Início da Parceria', show: viewMode === 'default', fixed: false },
    { id: 'last_payment_date', label: 'Último Pagamento', show: viewMode === 'default', fixed: false },
    { id: 'retention', label: 'Retenção', show: viewMode === 'default', fixed: false },
    { id: 'payment_type', label: 'Tipo de Pagamento', show: viewMode === 'default', fixed: false },
    { id: 'company_birthday', label: 'Aniversário da Empresa', show: viewMode === 'default', fixed: false },
    { id: 'contact_name', label: 'Responsável', show: viewMode === 'default', fixed: false },
    { id: 'contact_phone', label: 'Contato', show: viewMode === 'default', fixed: false }
  ]);

  const handleEditClick = (client: any) => {
    setSelectedClient(client);
    setIsDialogOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedClient(null);
    setIsDialogOpen(true);
  };

  const handleFormSuccess = async (data: any) => {
    try {
      if (selectedClient) {
        await updateClient.mutateAsync({ ...data, id: selectedClient.id });
      } else {
        await createClient.mutateAsync(data);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
    }
  };

  const toggleColumn = (columnId: string) => {
    setColumns(columns.map(col => 
      col.fixed ? col : { ...col, show: col.id === columnId ? !col.show : col.show }
    ));
  };

  const handleSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-red-500 gap-4 animate-fade-in">
        <div className="p-4 bg-red-50 rounded-full">
          <X className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold">Erro ao carregar dados</h2>
        <p className="text-center text-gray-600">
          Você não tem permissão para visualizar os clientes ou ocorreu um erro de conexão.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        {viewMode === 'default' && (
          <>
            <h2 className="text-xl font-bold">Lista de Clientes</h2>
            <div className="flex gap-2 items-center">
              <ColumnToggle columns={columns.filter(col => !col.fixed)} onToggleColumn={toggleColumn} />
              <FilterPopover 
                filters={filters}
                onFilterChange={(key, value) => updateFilter(key as keyof typeof filters, value)}
              />
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="h-9 px-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar filtros
                </Button>
              )}
              <Button onClick={handleCreateClick} className="bg-muran-primary hover:bg-muran-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 gap-4">
            <Loader className="h-8 w-8 animate-spin text-muran-primary" />
            <p className="text-gray-600">Carregando clientes...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <ClientsTable 
              clients={clients || []} 
              columns={columns.filter(col => viewMode === 'payments' ? col.fixed : col.show)} 
              onEditClick={handleEditClick}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedClient ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
          </DialogHeader>
          <ClientForm 
            initialData={selectedClient}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
