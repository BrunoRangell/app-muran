
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { addYears, format, subYears, setMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

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

  // Gerar lista de anos para seleção
  const generateYearOptions = () => {
    const options = [];
    const today = new Date();
    
    // Adiciona os últimos 2 anos e o ano atual
    for (let i = -2; i <= 0; i++) {
      const date = i < 0 ? subYears(today, Math.abs(i)) : addYears(today, i);
      const year = format(date, 'yyyy');
      options.push(year);
    }
    
    return options;
  };

  const years = generateYearOptions();

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

  const handleMonthToggle = (year: string, monthIndex: number) => {
    const monthStr = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}`;
    const currentMonths = form.getValues('months');
    const isSelected = currentMonths.includes(monthStr);

    if (!multipleMonths) {
      form.setValue('months', [monthStr]);
      return;
    }

    if (isSelected) {
      form.setValue('months', currentMonths.filter(m => m !== monthStr));
    } else {
      form.setValue('months', [...currentMonths, monthStr]);
    }
  };

  const isMonthSelected = (year: string, monthIndex: number) => {
    const monthStr = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}`;
    return form.getValues('months').includes(monthStr);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
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
                    <Tabs defaultValue={years[years.length - 1]} className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        {years.map((year) => (
                          <TabsTrigger key={year} value={year}>{year}</TabsTrigger>
                        ))}
                      </TabsList>
                      {years.map((year) => (
                        <TabsContent key={year} value={year}>
                          <div className="grid grid-cols-4 gap-2">
                            {MONTHS.map((month, index) => (
                              <button
                                key={month}
                                type="button"
                                onClick={() => handleMonthToggle(year, index)}
                                className={cn(
                                  "p-2 text-sm rounded-md transition-colors text-center",
                                  isMonthSelected(year, index)
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary hover:bg-secondary/80"
                                )}
                              >
                                {month}
                              </button>
                            ))}
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
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
