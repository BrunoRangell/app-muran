
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Filter, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { ClientForm } from "@/components/admin/ClientForm";
import { useToast } from "@/hooks/use-toast";
import { ClientsTable } from "./table/ClientsTable";
import { ColumnToggle } from "./table/ColumnToggle";
import { FilterPopover } from "./table/FilterPopover";
import { Client, Column, SortConfig } from "./types";
import { RankingMetrics } from "./rankings/RankingMetrics";
import { calculateRetention } from "./table/utils";

interface ClientsListProps {
  onPaymentClick?: (clientId: string) => void;
  viewMode?: 'default' | 'payments';
  rankingMetric?: 'revenue' | 'retention';
}

export const ClientsList = ({ onPaymentClick, viewMode = 'default', rankingMetric = 'revenue' }: ClientsListProps) => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [sortConfig, setSortConfig] = useState<SortConfig>({ 
    key: rankingMetric === 'revenue' ? 'contract_value' : 'retention',
    direction: 'desc' 
  });
  const [filters, setFilters] = useState({
    status: 'active',
    acquisition_channel: '',
    payment_type: ''
  });
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'retention'>(rankingMetric);

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
    queryKey: ["clients"],
    queryFn: async () => {
      console.log("Buscando lista de clientes...");
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("company_name");

      if (error) {
        console.error("Erro ao buscar clientes:", error);
        throw error;
      }

      console.log("Clientes carregados com sucesso:", data);
      return data as Client[];
    },
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
    retry: 2, // Tentar no máximo 2 vezes em caso de erro
    refetchOnWindowFocus: false // Não recarregar ao mudar de aba
  });

  useEffect(() => {
    if (error) {
      console.error("Erro na query de clientes:", error);
      toast({
        title: "Erro ao carregar clientes",
        description: "Não foi possível carregar a lista de clientes. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

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

  const handleMetricChange = (metric: 'revenue' | 'retention') => {
    setSelectedMetric(metric);
    setSortConfig({
      key: metric === 'revenue' ? 'contract_value' : 'retention',
      direction: 'desc'
    });
  };

  const filteredAndSortedClients = clients?.filter(client => {
    return (
      (!filters.status || client.status === filters.status) &&
      (!filters.acquisition_channel || client.acquisition_channel === filters.acquisition_channel) &&
      (!filters.payment_type || client.payment_type === filters.payment_type)
    );
  }).sort((a, b) => {
    const direction = sortConfig.direction === 'asc' ? 1 : -1;
    if (sortConfig.key === 'retention') {
      return (calculateRetention(b) - calculateRetention(a)) * direction;
    }
    return ((b[sortConfig.key as keyof Client] as number) - (a[sortConfig.key as keyof Client] as number)) * direction;
  });

  const hasActiveFilters = Object.values(filters).some(value => value !== "");

  const clearFilters = () => {
    setFilters({
      status: '',
      acquisition_channel: '',
      payment_type: ''
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        {viewMode === 'default' && (
          <>
            <div className="flex-1">
              <RankingMetrics
                clients={clients || []}
                onMetricChange={handleMetricChange}
                selectedMetric={selectedMetric}
              />
            </div>
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
          <p className="text-gray-600">Carregando clientes...</p>
        ) : (
          <div className="overflow-x-auto">
            <ClientsTable 
              clients={filteredAndSortedClients || []} 
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
