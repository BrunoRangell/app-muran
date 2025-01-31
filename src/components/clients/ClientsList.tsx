import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Settings2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import { ClientForm } from "@/components/admin/ClientForm";
import { useToast } from "@/components/ui/use-toast";

interface Client {
  id: string;
  company_name: string;
  contract_value: number;
  first_payment_date: string;
  payment_type: "pre" | "post";
  status: "active" | "inactive";
  acquisition_channel: string;
  company_birthday: string;
  contact_name: string;
  contact_phone: string;
  created_at: string;
}

interface Column {
  id: keyof Client;
  label: string;
  show: boolean;
}

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

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
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Colunas visíveis</h4>
                <div className="space-y-2">
                  {columns.map(column => (
                    <div key={column.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={column.id} 
                        checked={column.show}
                        onCheckedChange={() => toggleColumn(column.id)}
                      />
                      <label 
                        htmlFor={column.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {column.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button onClick={handleCreateClick} className="bg-muran-primary hover:bg-muran-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-gray-600">Carregando clientes...</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.filter(col => col.show).map(column => (
                  <TableHead key={column.id}>{column.label}</TableHead>
                ))}
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients?.map((client) => (
                <TableRow key={client.id}>
                  {columns.filter(col => col.show).map(column => {
                    let content = client[column.id];
                    
                    if (column.id === 'contract_value') {
                      content = formatCurrency(client.contract_value);
                    } else if (column.id === 'first_payment_date' || column.id === 'company_birthday') {
                      content = formatDate(content as string);
                    } else if (column.id === 'payment_type') {
                      content = content === 'pre' ? 'Pré-pago' : 'Pós-pago';
                    } else if (column.id === 'status') {
                      return (
                        <TableCell key={column.id}>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              client.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {client.status === "active" ? "Ativo" : "Inativo"}
                          </span>
                        </TableCell>
                      );
                    }

                    return (
                      <TableCell key={column.id}>{content}</TableCell>
                    );
                  })}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditClick(client)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
