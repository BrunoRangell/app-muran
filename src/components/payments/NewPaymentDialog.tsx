
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomDateRangeDialog } from "@/components/clients/metrics/CustomDateRangeDialog";

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
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const { toast } = useToast();
  const [selectedMonths, setSelectedMonths] = useState<Date[]>([new Date()]);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date()
  });

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

  const form = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: client?.contract_value.toString() || '',
      months: [format(new Date(), 'yyyy-MM')],
      notes: '',
    }
  });

  const handleDateRangeChange = (range: { start: Date; end: Date }) => {
    setDateRange(range);
    const months: Date[] = [];
    let current = range.start;
    
    while (current <= range.end) {
      months.push(new Date(current));
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }
    
    setSelectedMonths(months);
    form.setValue('months', months.map(date => format(date, 'yyyy-MM')));
  };

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
                onCheckedChange={(checked) => {
                  setMultipleMonths(checked);
                  if (!checked) {
                    const lastSelected = selectedMonths[selectedMonths.length - 1];
                    setSelectedMonths([lastSelected]);
                    form.setValue('months', [format(lastSelected, 'yyyy-MM')]);
                  }
                }}
              />
              <Label htmlFor="multiple-months">Registrar em múltiplos meses</Label>
            </div>

            <FormField
              control={form.control}
              name="months"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Período de Referência</FormLabel>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                      onClick={() => setIsCustomDateOpen(true)}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedMonths.length > 0 ? (
                        selectedMonths.length === 1 ? (
                          format(selectedMonths[0], "MMMM'/'yyyy", { locale: ptBR })
                        ) : (
                          `${format(dateRange.start, "MM'/'yyyy")} - ${format(dateRange.end, "MM'/'yyyy")}`
                        )
                      ) : (
                        "Selecione o período"
                      )}
                    </Button>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CustomDateRangeDialog
              isOpen={isCustomDateOpen}
              onOpenChange={setIsCustomDateOpen}
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
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
