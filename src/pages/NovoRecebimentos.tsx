
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Search, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatters";
import { NovoRegistrarPagamentoDialog } from "@/components/payments/novo/NovoRegistrarPagamentoDialog";
import { NovoHistoricoPagamentos } from "@/components/payments/novo/NovoHistoricoPagamentos";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

export default function NovoRecebimentos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Buscar dados de clientes e pagamentos
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["novo-recebimentos"],
    queryFn: async () => {
      try {
        console.log("Buscando dados para a nova página de recebimentos");

        // Busca clientes
        const { data: clientes, error: clientesError } = await supabase
          .from("clients")
          .select("*")
          .order("company_name");

        if (clientesError) throw clientesError;

        // Busca pagamentos
        const { data: pagamentos, error: pagamentosError } = await supabase
          .from("payments")
          .select("*");

        if (pagamentosError) throw pagamentosError;

        // Organiza pagamentos por cliente
        const pagamentosPorCliente: Record<string, any[]> = {};
        pagamentos.forEach((pagamento) => {
          if (!pagamento.client_id) return;
          
          const clientId = pagamento.client_id;
          if (!pagamentosPorCliente[clientId]) {
            pagamentosPorCliente[clientId] = [];
          }
          pagamentosPorCliente[clientId].push(pagamento);
        });

        // Calcula totais e verifica pagamentos do mês atual
        const dataAtual = new Date();
        const mesAtual = dataAtual.getMonth();
        const anoAtual = dataAtual.getFullYear();

        const clientesProcessados = clientes.map((cliente) => {
          const pagamentosCliente = pagamentosPorCliente[cliente.id] || [];
          
          // Calcula total recebido
          const totalRecebido = pagamentosCliente.reduce((total, pagamento) => {
            return total + Number(pagamento.amount || 0);
          }, 0);
          
          // Verifica se há pagamento do mês atual
          const temPagamentoMesAtual = pagamentosCliente.some((pagamento) => {
            if (!pagamento.reference_month) return false;
            
            const dataPagamento = new Date(pagamento.reference_month);
            return (
              dataPagamento.getMonth() === mesAtual && 
              dataPagamento.getFullYear() === anoAtual
            );
          });
          
          return {
            ...cliente,
            pagamentos: pagamentosCliente,
            totalRecebido,
            temPagamentoMesAtual
          };
        });

        return clientesProcessados;
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os clientes e pagamentos.",
          variant: "destructive"
        });
        throw error;
      }
    },
    refetchOnWindowFocus: false,
  });

  // Filtra clientes pelo termo de busca
  const clientesFiltrados = data?.filter((cliente) => 
    cliente.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Abre o diálogo de registro de pagamento
  const handleRegistrarPagamento = (clienteId: string) => {
    setClienteSelecionado(clienteId);
    setIsDialogOpen(true);
  };

  // Após registrar um pagamento com sucesso
  const handlePagamentoRegistrado = () => {
    setIsDialogOpen(false);
    setClienteSelecionado(null);
    refetch();
    toast({
      title: "Pagamento registrado",
      description: "O pagamento foi registrado com sucesso.",
    });
  };

  // Calcula o total dos valores contratuais e recebidos
  const totais = clientesFiltrados.reduce(
    (acc, cliente) => ({
      valorContratual: acc.valorContratual + Number(cliente.contract_value || 0),
      valorRecebido: acc.valorRecebido + Number(cliente.totalRecebido || 0),
    }),
    { valorContratual: 0, valorRecebido: 0 }
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <h1 className="text-2xl font-bold">Recebimentos</h1>
        <Card className="p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-gray-400" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="overflow-hidden border rounded-lg">
            <div className="p-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="py-2">
                  <Skeleton className="h-16 w-full rounded" />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const clienteAtual = data?.find(cliente => cliente.id === clienteSelecionado);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Recebimentos</h1>
      <Card className="p-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor Mensal</TableHead>
                <TableHead>Total Recebido</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientesFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                clientesFiltrados.map((cliente) => (
                  <TableRow key={cliente.id} className={
                    cliente.status === 'active' && !cliente.temPagamentoMesAtual
                      ? "bg-orange-50 hover:bg-orange-100"
                      : ""
                  }>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {cliente.status === 'active' && !cliente.temPagamentoMesAtual && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertCircle className="h-4 w-4 text-orange-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Pagamento pendente</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {cliente.company_name}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(cliente.contract_value || 0)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{formatCurrency(cliente.totalRecebido || 0)}</span>
                        <NovoHistoricoPagamentos
                          clienteId={cliente.id}
                          clienteNome={cliente.company_name}
                          pagamentos={cliente.pagamentos}
                          onPagamentoAtualizado={refetch}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={cliente.status === 'active' ? 'default' : 'destructive'}
                        className={cliente.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}
                      >
                        {cliente.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRegistrarPagamento(cliente.id)}
                        className="flex items-center gap-1"
                      >
                        <DollarSign className="h-4 w-4" />
                        <span>Registrar Pagamento</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {clientesFiltrados.length > 0 && (
          <div className="flex justify-between border-t pt-4 text-sm">
            <div>
              <span className="font-semibold">Total Mensal: </span>
              <span>{formatCurrency(totais.valorContratual)}</span>
            </div>
            <div>
              <span className="font-semibold">Total Recebido: </span>
              <span>{formatCurrency(totais.valorRecebido)}</span>
            </div>
          </div>
        )}
      </Card>

      <NovoRegistrarPagamentoDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        clienteId={clienteSelecionado}
        clienteNome={clienteAtual?.company_name}
        valorContrato={clienteAtual?.contract_value}
        onSuccess={handlePagamentoRegistrado}
      />
    </div>
  );
}
