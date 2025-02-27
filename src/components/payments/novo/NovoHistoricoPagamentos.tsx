
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { History, Pencil } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { NovoEditarPagamentoDialog } from "./NovoEditarPagamentoDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NovoHistoricoPagamentosProps {
  clienteId: string;
  clienteNome: string;
  pagamentos: any[];
  onPagamentoAtualizado: () => void;
}

export function NovoHistoricoPagamentos({
  clienteId,
  clienteNome,
  pagamentos,
  onPagamentoAtualizado
}: NovoHistoricoPagamentosProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pagamentoSelecionado, setPagamentoSelecionado] = useState<any>(null);
  const [isEditarDialogOpen, setIsEditarDialogOpen] = useState(false);

  const formatarData = (dataString: string) => {
    try {
      if (!dataString) return "";
      return format(parseISO(dataString), "MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return dataString;
    }
  };

  const handleEditarClick = (pagamento: any) => {
    setPagamentoSelecionado(pagamento);
    setIsEditarDialogOpen(true);
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-8 w-8 p-0"
              onClick={() => setIsOpen(true)}
            >
              <History className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ver histórico de pagamentos</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Histórico de Pagamentos - {clienteNome}</DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[400px] pr-4">
            {pagamentos && pagamentos.length > 0 ? (
              <div className="space-y-4">
                {pagamentos.map((pagamento) => (
                  <div key={pagamento.id} className="border-b pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{formatarData(pagamento.reference_month)}</p>
                        <p className="text-gray-600">{formatCurrency(pagamento.amount)}</p>
                        {pagamento.notes && (
                          <p className="text-sm text-gray-500 mt-1">{pagamento.notes}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleEditarClick(pagamento)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">Nenhum pagamento registrado</p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <NovoEditarPagamentoDialog
        open={isEditarDialogOpen}
        onOpenChange={setIsEditarDialogOpen}
        pagamento={pagamentoSelecionado}
        clienteNome={clienteNome}
        onSuccess={() => {
          onPagamentoAtualizado();
          setIsEditarDialogOpen(false);
        }}
      />
    </>
  );
}
