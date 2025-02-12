
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
import { useQueryClient } from "@tanstack/react-query";

export function EditPaymentDialog({ 
  payment,
  isOpen,
  onOpenChange,
  onSuccess,
  clientName,
}: EditPaymentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    amount: "",
    notes: ""
  });

  useEffect(() => {
    if (payment) {
      setFormData({
        amount: formatCurrency(payment.amount),
        notes: payment.notes || ""
      });
    }
  }, [payment]);

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    const amount = numericValue ? parseFloat(numericValue) / 100 : 0;
    setFormData(prev => ({ ...prev, amount: formatCurrency(amount) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment?.id) return;

    setIsLoading(true);
    console.log('Iniciando atualização do pagamento:', payment.id);

    try {
      const updateData = {
        amount: parseCurrencyToNumber(formData.amount),
        notes: formData.notes || null
      };

      console.log('Dados a serem atualizados:', updateData);

      const { data, error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', payment.id)
        .select();

      if (error) {
        console.error('Erro na atualização:', error);
        throw error;
      }

      console.log('Pagamento atualizado com sucesso:', data);

      // Invalida as queries relacionadas
      await queryClient.invalidateQueries({ queryKey: ["payments-clients"] });

      toast({
        title: "Sucesso!",
        description: "Pagamento atualizado com sucesso.",
      });

      // Limpa o formulário e fecha o diálogo
      setFormData({ amount: "", notes: "" });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao atualizar pagamento:', error);
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Não foi possível atualizar o pagamento.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!payment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isLoading) {
        onOpenChange(open);
      }
    }}>
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
