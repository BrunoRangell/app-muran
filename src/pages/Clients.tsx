import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";

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
}

const Clients = () => {
  const { data: clients, isLoading } = useQuery({
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
    // Convert from cents to real currency value
    const realValue = value / 100;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(realValue);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-muran-dark">Clientes</h1>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Lista de Clientes</h2>
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
                  <TableHead>Responsável</TableHead>
                  <TableHead>Contato</TableHead>
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
                    <TableCell>{client.contact_name}</TableCell>
                    <TableCell>{client.contact_phone}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Clients;