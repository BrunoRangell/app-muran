import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { ClientForm } from "@/components/admin/ClientForm";
import { useToast } from "@/components/ui/use-toast";
import { ClientsTable } from "./table/ClientsTable";
import { ColumnToggle } from "./table/ColumnToggle";
import { Client, Column } from "./types";

export const ClientsList = () => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [columns, setColumns] = useState<Column[]>([
    { id: 'company_name', label: 'Empresa', show: true },
    { id: 'contract_value', label: 'Valor do Contrato', show: true },
    { id: 'first_payment_date', label: 'Início da Parceria', show: true },
    { id: 'payment_type', label: 'Tipo de Pagamento', show: true },
    { id: 'status', label: 'Status', show: true },
    { id: 'acquisition_channel', label: 'Canal de Aquisição', show: true },
    { id: 'company_birthday', label: 'Aniversário da Empresa', show: true },
    { id: 'contact_name', label: 'Responsável', show: true },
    { id: 'contact_phone', label: 'Contato', show: true }
  ]);

  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      console.log("Fetching clients...");
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("company_name");

      if (error) {
        console.error("Error fetching clients:", error);
        throw error;
      }

      console.log("Clients fetched successfully:", data);
      return data as Client[];
    },
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
      col.id === columnId ? { ...col, show: !col.show } : col
    ));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Lista de Clientes</h2>
        <div className="flex gap-2">
          <ColumnToggle columns={columns} onToggleColumn={toggleColumn} />
          <Button onClick={handleCreateClick} className="bg-muran-primary hover:bg-muran-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-gray-600">Carregando clientes...</p>
      ) : (
        <ClientsTable 
          clients={clients} 
          columns={columns} 
          onEditClick={handleEditClick}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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