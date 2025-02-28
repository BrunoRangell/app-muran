
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EditarPagamentoDialog } from "./EditarPagamentoDialog";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

interface HistoricoPagamentosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: any;
  onPagamentoAtualizado: () => void;
}

export function HistoricoPagamentosDialog({
  open,
  onOpenChange,
  cliente,
  onPagamentoAtualizado
}: HistoricoPagamentosDialogProps) {
  const [pagamentoSelecionado, setPagamentoSelecionado] = useState<any>(null);
  const [editarDialogAberto, setEditarDialogAberto] = useState(false);
  const [excluindoPagamento, setExcluindoPagamento] = useState(false);
  const { toast } = useToast();

  // Formata a data de referência do pagamento
  const formatarData = (data: string) => {
    try {
      if (!data) return "";
      return format(parseISO(data), "MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return data;
    }
  };

  // Abre o diálogo de edição de pagamento
  const handleEditarPagamento = (pagamento: any) => {
    setPagamentoSelecionado(pagamento);
    setEditarDialogAberto(true);
  };

  // Exclui um pagamento
  const handleExcluirPagamento = async (pagamento: any) => {
    if (!pagamento || excluindoPagamento) return;
    
    try {
      setExcluindoPagamento(true);
      
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", pagamento.id);
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Pagamento excluído com sucesso"
      });
      
      onPagamentoAtualizado();
    } catch (error) {
      console.error("Erro ao excluir pagamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o pagamento",
        variant: "destructive"
      });
    } finally {
      setExcluindoPagamento(false);
    }
  };

  // Organiza os pagamentos por data (mais recentes primeiro)
  const pagamentosOrdenados = [...(cliente?.pagamentos || [])].sort((a, b) => {
    const dataA = a.reference_month ? new Date(a.reference_month) : new Date(0);
    const dataB = b.reference_month ? new Date(b.reference_month) : new Date(0);
    return dataB.getTime() - dataA.getTime();
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Histórico de Pagamentos - {cliente?.company_name}</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[400px] pr-4">
            {pagamentosOrdenados.length > 0 ? (
              <div className="space-y-4">
                {pagamentosOrdenados.map((pagamento) => (
                  <div key={pagamento.id} className="border-b pb-3 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{formatarData(pagamento.reference_month)}</p>
                        <p className="text-gray-600">{formatCurrency(pagamento.amount)}</p>
                        {pagamento.notes && (
                          <p className="text-sm text-gray-500 mt-1">{pagamento.notes}</p>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditarPagamento(pagamento)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir este pagamento de {formatCurrency(pagamento.amount)} 
                                referente a {formatarData(pagamento.reference_month)}?
                                <br /><br />
                                <span className="text-red-500 font-medium flex items-center gap-1">
                                  <AlertCircle className="h-4 w-4" />
                                  Esta ação não pode ser desfeita.
                                </span>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleExcluirPagamento(pagamento)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                {excluindoPagamento ? "Excluindo..." : "Excluir"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">
                Nenhum pagamento registrado
              </p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar pagamento */}
      {pagamentoSelecionado && (
        <EditarPagamentoDialog
          open={editarDialogAberto}
          onOpenChange={setEditarDialogAberto}
          pagamento={pagamentoSelecionado}
          nomeCliente={cliente?.company_name}
          onSuccess={() => {
            setEditarDialogAberto(false);
            onPagamentoAtualizado();
          }}
        />
      )}
    </>
  );
}
