
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receipt, Search, DollarSign, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { RegistroPagamentoDialog } from "@/components/recebimentos-nova/RegistroPagamentoDialog";
import { HistoricoPagamentosDialog } from "@/components/recebimentos-nova/HistoricoPagamentosDialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function RecebimentosNova() {
  const [busca, setBusca] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null);
  const [dialogoRegistroAberto, setDialogoRegistroAberto] = useState(false);
  const [dialogoHistoricoAberto, setDialogoHistoricoAberto] = useState(false);
  const { toast } = useToast();

  // Consulta para buscar clientes e pagamentos
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["recebimentos-nova"],
    queryFn: async () => {
      try {
        // Buscar clientes
        const { data: clientes, error: erroClientes } = await supabase
          .from("clients")
          .select("*");

        if (erroClientes) throw erroClientes;

        // Buscar pagamentos
        const { data: pagamentos, error: erroPagamentos } = await supabase
          .from("payments")
          .select("*");

        if (erroPagamentos) throw erroPagamentos;

        // Processar dados
        const dataAtual = new Date();
        const mesAtualInicio = startOfMonth(dataAtual);
        const mesAtualFim = endOfMonth(dataAtual);

        // Agrupar pagamentos por cliente
        const pagamentosPorCliente: Record<string, any[]> = {};
        pagamentos?.forEach(pagamento => {
          if (pagamento.client_id) {
            if (!pagamentosPorCliente[pagamento.client_id]) {
              pagamentosPorCliente[pagamento.client_id] = [];
            }
            pagamentosPorCliente[pagamento.client_id].push(pagamento);
          }
        });

        // Adicionar informações aos clientes
        const clientesProcessados = clientes.map(cliente => {
          const pagamentosCliente = pagamentosPorCliente[cliente.id] || [];
          
          // Total recebido
          const totalRecebido = pagamentosCliente.reduce((acc, pagamento) => {
            return acc + Number(pagamento.amount || 0);
          }, 0);
          
          // Verificar se tem pagamento no mês atual usando intervalo de datas
          const temPagamentoNoMesAtual = pagamentosCliente.some(pagamento => {
            if (!pagamento.reference_month) return false;
            
            try {
              const dataPagamento = parseISO(pagamento.reference_month);
              return isWithinInterval(dataPagamento, {
                start: mesAtualInicio,
                end: mesAtualFim
              });
            } catch (error) {
              console.error("Erro ao verificar data:", error);
              return false;
            }
          });
          
          return {
            ...cliente,
            pagamentos: pagamentosCliente,
            totalRecebido,
            temPagamentoNoMesAtual
          };
        });

        // Ordenar por status (ativos primeiro) e depois por nome
        clientesProcessados.sort((a, b) => {
          // Primeiro critério: status (ativos primeiro)
          if (a.status !== b.status) {
            return a.status === 'active' ? -1 : 1;
          }
          
          // Segundo critério: ordem alfabética por nome
          return a.company_name.localeCompare(b.company_name);
        });

        return clientesProcessados;
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados de recebimentos",
          variant: "destructive"
        });
        return [];
      }
    }
  });

  // Filtrar clientes pela busca
  const clientesFiltrados = data?.filter(cliente => 
    cliente.company_name?.toLowerCase().includes(busca.toLowerCase())
  ) || [];

  // Abrir diálogo de registro de pagamento
  const handleRegistrarPagamento = (cliente: any) => {
    setClienteSelecionado(cliente);
    setDialogoRegistroAberto(true);
  };

  // Abrir diálogo de histórico
  const handleVerHistorico = (cliente: any) => {
    setClienteSelecionado(cliente);
    setDialogoHistoricoAberto(true);
  };

  // Calcular totais
  const totais = clientesFiltrados.reduce((acc, cliente) => ({
    valorContratual: acc.valorContratual + Number(cliente.contract_value || 0),
    totalRecebido: acc.totalRecebido + Number(cliente.totalRecebido || 0)
  }), { valorContratual: 0, totalRecebido: 0 });

  // Após sucesso no registro de pagamento
  const handlePagamentoRegistrado = () => {
    setDialogoRegistroAberto(false);
    refetch();
    toast({
      title: "Sucesso",
      description: "Pagamento registrado com sucesso",
    });
  };

  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Recebimentos</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento de Recebimentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Skeleton className="h-10 w-full" />
            </div>
            
            <div className="border rounded-md">
              <div className="p-2">
                {Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full my-2" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recebimentos</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Recebimentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="border rounded-md">
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
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      Nenhum cliente encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  clientesFiltrados.map(cliente => (
                    <TableRow 
                      key={cliente.id}
                      className={cliente.status === 'active' && !cliente.temPagamentoNoMesAtual 
                        ? "bg-orange-50 hover:bg-orange-100" 
                        : undefined}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {cliente.status === 'active' && !cliente.temPagamentoNoMesAtual && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertCircle className="h-4 w-4 text-orange-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Pagamento do mês atual pendente</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <span className="font-medium">{cliente.company_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(cliente.contract_value || 0)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{formatCurrency(cliente.totalRecebido || 0)}</span>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleVerHistorico(cliente)}
                            className="h-8 w-8"
                          >
                            <Receipt className="h-4 w-4" />
                          </Button>
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
                          className="gap-1"
                          onClick={() => handleRegistrarPagamento(cliente)}
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
            <div className="flex justify-between pt-4 border-t text-sm">
              <div>
                <span className="font-medium">Total Mensal: </span>
                <span>{formatCurrency(totais.valorContratual)}</span>
              </div>
              <div>
                <span className="font-medium">Total Recebido: </span>
                <span>{formatCurrency(totais.totalRecebido)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de Registro de Pagamento */}
      {clienteSelecionado && (
        <RegistroPagamentoDialog
          open={dialogoRegistroAberto}
          onOpenChange={setDialogoRegistroAberto}
          cliente={clienteSelecionado}
          onSuccess={handlePagamentoRegistrado}
        />
      )}

      {/* Diálogo de Histórico de Pagamentos */}
      {clienteSelecionado && (
        <HistoricoPagamentosDialog
          open={dialogoHistoricoAberto}
          onOpenChange={setDialogoHistoricoAberto}
          cliente={clienteSelecionado}
          onPagamentoAtualizado={refetch}
        />
      )}
    </div>
  );
}
