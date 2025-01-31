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
import { Plus, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

export const ClientsList = () => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Lista de Clientes</h2>
        <Button onClick={handleCreateClick} className="bg-muran-primary hover:bg-muran-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {isLoading ? (
        <p className="text-gray-600">Carregando clientes...</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Valor do Contrato</TableHead>
                <TableHead>Data do 1º Pagamento</TableHead>
                <TableHead>Tipo de Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Canal de Aquisição</TableHead>
                <TableHead>Aniversário</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Data de Cadastro</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients?.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    {client.company_name}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(client.contract_value)}
                  </TableCell>
                  <TableCell>
                    {formatDate(client.first_payment_date)}
                  </TableCell>
                  <TableCell>
                    {client.payment_type === "pre" ? "Pré-pago" : "Pós-pago"}
                  </TableCell>
                  <TableCell>
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
                  <TableCell>{client.acquisition_channel}</TableCell>
                  <TableCell>
                    {client.company_birthday ? formatDate(client.company_birthday) : "-"}
                  </TableCell>
                  <TableCell>{client.contact_name}</TableCell>
                  <TableCell>{client.contact_phone}</TableCell>
                  <TableCell>{formatDate(client.created_at)}</TableCell>
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