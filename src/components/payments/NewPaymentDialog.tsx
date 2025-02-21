
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { parseCurrencyToNumber } from "@/utils/formatters";
import { useToast } from "@/hooks/use-toast";
import { PaymentForm, PaymentFormData } from "./payment-form/PaymentForm";

interface NewPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  clientId: string | null;
}

export function NewPaymentDialog({ 
  open, 
  onOpenChange,
  onSuccess,
  clientId
}: NewPaymentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!clientId
  });

  async function handleSubmit(data: PaymentFormData) {
    if (!clientId || isLoading) {
      console.log("Submissão bloqueada:", !clientId ? "Sem clientId" : "Já está carregando");
      return;
    }
    
    try {
      setIsLoading(true);
      console.log("Iniciando salvamento de pagamento(s)");

      // Cria um array de pagamentos com datas formatadas corretamente
      const payments = data.months.map(month => {
        const [year, monthStr] = month.split('-');
        const dateStr = `${year}-${monthStr}-01`;
        const amount = parseCurrencyToNumber(data.amount);
        
        console.log('Processando pagamento:', {
          month: dateStr,
          amount: amount,
          parsed: typeof amount
        });
        
        return {
          client_id: clientId,
          amount: amount,
          reference_month: dateStr,
          notes: data.notes || null
        };
      });

      console.log('Dados do(s) pagamento(s) a serem salvos:', payments);

      const { error } = await supabase
        .from('payments')
        .insert(payments);

      if (error) {
        console.error('Erro detalhado:', error);
        throw error;
      }
      
      toast({
        title: "Sucesso!",
        description: payments.length > 1 
          ? `${payments.length} pagamentos registrados com sucesso.`
          : "Pagamento registrado com sucesso.",
      });
      
      // Aguarda um momento antes de chamar onSuccess para garantir que os dados foram atualizados
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        setIsLoading(false);
      }, 500);
      
    } catch (error: any) {
      console.error('Erro ao registrar pagamento:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível registrar o pagamento.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (isLoading) return; // Impede fechamento durante o carregamento
      onOpenChange(newOpen);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Pagamento - {client?.company_name}</DialogTitle>
        </DialogHeader>

        <PaymentForm
          client={client}
          onSubmit={handleSubmit}
          onCancel={() => !isLoading && onOpenChange(false)}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
