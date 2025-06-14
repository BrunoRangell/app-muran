
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receipt, Search, DollarSign, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { useToast } from "@/hooks/use-toast";
import { RegistroPagamentoDialog } from "@/components/recebimentos-nova/RegistroPagamentoDialog";
import { HistoricoPagamentosDialog } from "@/components/recebimentos-nova/HistoricoPagamentosDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useUnifiedPaymentsData } from "@/hooks/common/useUnifiedPaymentsData";
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

  const { 
    clientsWithPayments, 
    isLoadingClients, 
    refetchClients 
  } = useUnifiedPaymentsData();

  // Filtrar clientes pela busca
  const clientesFiltrados = clientsWithPayments?.filter(cliente => 
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
    totalRecebido: acc.totalRecebido + Number(cliente.total_received || 0)
  }), { valorContratual: 0, totalRecebido: 0 });

  // Após sucesso no registro de pagamento
  const handlePagamentoRegistrado = () => {
    setDialogoRegistroAberto(false);
    refetchClients();
    toast({
      title: "Sucesso",
      description: "Pagamento registrado com sucesso",
    });
  };

  if (isLoadingClients) {
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
                      className={cliente.status === 'active' && !cliente.hasCurrentMonthPayment 
                        ? "bg-orange-50 hover:bg-orange-100" 
                        : undefined}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {cliente.status === 'active' && !cliente.hasCurrentMonthPayment && (
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
                          <span>{formatCurrency(cliente.total_received || 0)}</span>
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
          onPagamentoAtualizado={refetchClients}
        />
      )}
    </div>
  );
}
