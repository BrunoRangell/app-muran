
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Filter, X, Loader } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { ClientForm } from "@/components/admin/ClientForm";
import { useToast } from "@/hooks/use-toast";
import { ClientsTable } from "./table/ClientsTable";
import { ColumnToggle } from "./table/ColumnToggle";
import { FilterPopover } from "./table/FilterPopover";
import { Client, Column, SortConfig } from "./types";

interface ClientsListProps {
  onPaymentClick?: (clientId: string) => void;
  viewMode?: 'default' | 'payments';
}

export const ClientsList = ({ onPaymentClick, viewMode = 'default' }: ClientsListProps) => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'company_name', direction: 'asc' });
  const [filters, setFilters] = useState({
    status: 'active',
    acquisition_channel: '',
    payment_type: ''
  });

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

  const { data: clients, isLoading, error, refetch } = useQuery({
    queryKey: ["clients", filters], // Adiciona filters como dependência
    queryFn: async () => {
      console.log("Buscando lista de clientes com filtros:", filters);
      let query = supabase
        .from("clients")
        .select("*");

      // Aplica filtros dinâmicos
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.acquisition_channel) {
        query = query.eq('acquisition_channel', filters.acquisition_channel);
      }
      if (filters.payment_type) {
        query = query.eq('payment_type', filters.payment_type);
      }

      const { data, error } = await query.order("company_name");

      if (error) {
        console.error("Erro ao buscar clientes:", error);
        throw error;
      }

      console.log("Clientes carregados com sucesso:", data);
      return data as Client[];
    },
    meta: {
      onError: (error: Error) => {
        console.error("Erro na query de clientes:", error);
        toast({
          title: "Erro ao carregar clientes",
          description: "Não foi possível carregar a lista de clientes. Por favor, tente novamente.",
          variant: "destructive",
        });
      }
    },
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
    refetchOnWindowFocus: false // Não recarrega ao mudar de aba
  });

  const handleEditClick = (client: Client) => {
    setSelectedClient(client);
    setIsDialogOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedClient(null);
    setIsDialogOpen(true);
  };

  const handleFormSuccess = () => {
    setIsDialogOpen(false);
    refetch();
    toast({
      title: "Sucesso!",
      description: selectedClient 
        ? "Cliente atualizado com sucesso!" 
        : "Cliente cadastrado com sucesso!",
    });
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

  const hasActiveFilters = Object.values(filters).some(value => value !== "");

  const clearFilters = () => {
    setFilters({
      status: '',
      acquisition_channel: '',
      payment_type: ''
    });
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-red-500 gap-4 animate-fade-in">
        <div className="p-4 bg-red-50 rounded-full">
          <X className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold">Erro ao carregar dados</h2>
        <p className="text-center text-gray-600">
          Não foi possível carregar a lista de clientes.
          <br />
          Por favor, tente novamente mais tarde.
        </p>
        <Button 
          variant="outline" 
          onClick={() => refetch()}
          className="mt-4"
        >
          Tentar novamente
        </Button>
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
              <FilterPopover filters={filters} onFilterChange={setFilters} />
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
