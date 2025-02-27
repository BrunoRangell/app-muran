
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { formatCurrency, parseCurrencyToNumber } from "@/utils/formatters";

interface NovoEditarPagamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pagamento: any;
  clienteNome: string;
  onSuccess: () => void;
}

export function NovoEditarPagamentoDialog({
  open,
  onOpenChange,
  pagamento,
  clienteNome,
  onSuccess
}: NovoEditarPagamentoDialogProps) {
  const [valor, setValor] = useState("");
  const [dataReferencia, setDataReferencia] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (pagamento && open) {
      setValor(formatCurrency(pagamento.amount || 0));
      
      try {
        if (pagamento.reference_month) {
          const data = parseISO(pagamento.reference_month);
          setDataReferencia(format(data, "yyyy-MM"));
        }
      } catch (error) {
        console.error("Erro ao formatar data:", error);
        setDataReferencia("");
      }
      
      setObservacoes(pagamento.notes || "");
    }
  }, [pagamento, open]);

  const handleValorChange = (valor: string) => {
    // Remove caracteres não numéricos
    const numerico = valor.replace(/\D/g, "");
    if (numerico === "") {
      setValor("");
      return;
    }
    
    // Converte para número (dividindo por 100 para tratar os centavos)
    const valorNumerico = parseFloat(numerico) / 100;
    setValor(formatCurrency(valorNumerico));
  };

  const handleSubmit = async () => {
    if (!pagamento?.id || isLoading) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from("payments")
        .update({
          amount: parseCurrencyToNumber(valor),
          reference_month: `${dataReferencia}-01`, // Primeiro dia do mês
          notes: observacoes || null
        })
        .eq("id", pagamento.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Pagamento atualizado com sucesso."
      });
      
      onSuccess();
    } catch (error) {
      console.error("Erro ao atualizar pagamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o pagamento.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!isLoading) {
        onOpenChange(newOpen);
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Pagamento - {clienteNome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="valor">Valor</Label>
            <Input
              id="valor"
              value={valor}
              onChange={(e) => handleValorChange(e.target.value)}
              placeholder="R$ 0,00"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data-referencia">Mês de referência</Label>
            <Input
              id="data-referencia"
              type="month"
              value={dataReferencia}
              onChange={(e) => setDataReferencia(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações sobre o pagamento..."
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
