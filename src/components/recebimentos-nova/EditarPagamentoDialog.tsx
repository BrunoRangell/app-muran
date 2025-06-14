
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/utils/formatters";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

interface EditarPagamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pagamento: any;
  onSuccess: () => void;
}

export const EditarPagamentoDialog = ({
  open,
  onOpenChange,
  pagamento,
  onSuccess
}: EditarPagamentoDialogProps) => {
  const [valor, setValor] = useState(pagamento?.amount?.toString() || "");
  const [mesReferencia, setMesReferencia] = useState(pagamento?.reference_month || "");
  const [observacoes, setObservacoes] = useState(pagamento?.notes || "");
  const [salvando, setSalvando] = useState(false);
  const { toast } = useToast();

  const handleSalvar = async () => {
    if (!valor || !mesReferencia) {
      toast({
        title: "Erro",
        description: "Valor e mês de referência são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setSalvando(true);
    
    try {
      logger.info("EDIT_PAYMENT", "Atualizando pagamento", { 
        id: pagamento.id,
        valor: parseFloat(valor),
        mesReferencia 
      });
      
      // Aqui você implementaria a lógica de atualização
      // Por exemplo, chamando uma mutation ou service
      
      toast({
        title: "Sucesso",
        description: "Pagamento atualizado com sucesso",
      });
      
      onSuccess();
      onOpenChange(false);
      
    } catch (error) {
      logger.error("EDIT_PAYMENT", "Erro ao atualizar pagamento", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o pagamento",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  if (!pagamento) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Pagamento</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="valor">Valor</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
            />
          </div>
          
          <div>
            <Label htmlFor="mes-referencia">Mês de Referência</Label>
            <Input
              id="mes-referencia"
              type="month"
              value={mesReferencia}
              onChange={(e) => setMesReferencia(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSalvar}
            disabled={salvando}
            className="bg-muran-primary hover:bg-muran-primary/90"
          >
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
