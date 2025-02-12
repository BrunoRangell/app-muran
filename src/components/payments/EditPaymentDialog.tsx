
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { EditPaymentDialogProps } from "./types";
import { formatCurrency, parseCurrencyToNumber } from "@/utils/formatters";

export function EditPaymentDialog({ 
  payment,
  isOpen,
  onOpenChange,
  onSuccess,
  clientName,
}: EditPaymentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    amount: "",
    notes: ""
  });

  // Atualiza o formulário quando o pagamento muda
  useEffect(() => {
    if (payment) {
      setFormData({
        amount: formatCurrency(payment.amount),
        notes: payment.notes || ""
      });
    }
  }, [payment]);

  const handleAmountChange = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numericValue = value.replace(/\D/g, '');
    // Converte para número e divide por 100 para considerar os centavos
    const amount = numericValue ? parseFloat(numericValue) / 100 : 0;
    setFormData(prev => ({ ...prev, amount: formatCurrency(amount) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          amount: parseCurrencyToNumber(formData.amount),
          notes: formData.notes || null
        })
        .eq('id', payment.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Pagamento atualizado com sucesso.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o pagamento.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!payment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Pagamento - {clientName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor do Pagamento</Label>
            <Input
              id="amount"
              type="text"
              value={formData.amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="R$ 0,00"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observações sobre o pagamento..."
              className="min-h-[100px]"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
