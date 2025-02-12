
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { parseCurrencyToNumber } from "@/utils/formatters";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { addMonths, format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

const paymentFormSchema = z.object({
  amount: z.string().min(1, "Informe o valor"),
  months: z.array(z.string()).min(1, "Selecione pelo menos um mês"),
  notes: z.string().optional(),
});

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
  const [multipleMonths, setMultipleMonths] = useState(false);
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

  // Gerar lista de meses para seleção
  const generateMonthOptions = () => {
    const options = [];
    const today = new Date();
    
    // Adiciona os últimos 6 meses e os próximos 6 meses
    for (let i = -6; i <= 6; i++) {
      const date = i < 0 ? subMonths(today, Math.abs(i)) : addMonths(today, i);
      const value = format(date, 'yyyy-MM');
      const label = format(date, "MMMM'/'yyyy", { locale: ptBR });
      options.push({ value, label });
    }
    
    return options;
  };

  const monthOptions = generateMonthOptions();

  const form = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: client?.contract_value.toString() || '',
      months: [format(new Date(), 'yyyy-MM')],
      notes: '',
    }
  });

  async function onSubmit(data: z.infer<typeof paymentFormSchema>) {
    if (!clientId) return;
    
    setIsLoading(true);
    try {
      const payments = data.months.map(month => ({
        client_id: clientId,
        amount: parseCurrencyToNumber(data.amount),
        reference_month: new Date(month + '-01'), // Primeiro dia do mês
        notes: data.notes || null
      }));

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
      
      onSuccess();
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao registrar pagamento:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível registrar o pagamento.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Pagamento - {client?.company_name}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="R$ 0,00" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center space-x-2 py-2">
              <Switch
                id="multiple-months"
                checked={multipleMonths}
                onCheckedChange={setMultipleMonths}
              />
              <Label htmlFor="multiple-months">Registrar em múltiplos meses</Label>
            </div>

            <FormField
              control={form.control}
              name="months"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mês de Referência</FormLabel>
                  <FormControl>
                    {multipleMonths ? (
                      <ScrollArea className="h-[200px] border rounded-md p-4">
                        <div className="space-y-2">
                          {monthOptions.map(({ value, label }) => (
                            <div key={value} className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value.includes(value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, value]);
                                  } else {
                                    field.onChange(field.value.filter(v => v !== value));
                                  }
                                }}
                              />
                              <Label>{label}</Label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <Select
                        value={field.value[0]}
                        onValueChange={(value) => field.onChange([value])}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o mês" />
                        </SelectTrigger>
                        <SelectContent>
                          {monthOptions.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
