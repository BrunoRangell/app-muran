
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { MonthSelector } from "./MonthSelector";
import { Client } from "@/components/clients/types";
import { formatCurrency, parseCurrencyToNumber } from "@/utils/formatters";
import { CurrencyInput } from "@/components/common/CurrencyInput";
import { SanitizedTextarea } from "@/components/common/SanitizedInputs";

const paymentFormSchema = z.object({
  amount: z.string().min(1, "Informe o valor"),
  months: z.array(z.string()).nonempty("Selecione pelo menos um mês"),
  notes: z.string().optional(),
});

export type PaymentFormData = z.infer<typeof paymentFormSchema>;

interface PaymentFormProps {
  client: Client | null;
  onSubmit: (data: PaymentFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function PaymentForm({ client, onSubmit, onCancel, isLoading }: PaymentFormProps) {
  const [multipleMonths, setMultipleMonths] = useState(false);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: client?.contract_value ? formatCurrency(client.contract_value) : '',
      months: [new Date().toISOString().slice(0, 7)], // Define o mês atual como valor padrão
      notes: '',
    }
  });

  // Atualiza o valor quando o cliente muda
  useEffect(() => {
    if (client?.contract_value) {
      form.setValue('amount', formatCurrency(client.contract_value));
    }
  }, [client, form]);

  const handleAmountChange = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numericValue = value.replace(/\D/g, '');
    // Converte para número e divide por 100 para considerar os centavos
    const amount = numericValue ? parseFloat(numericValue) / 100 : 0;
    form.setValue('amount', formatCurrency(amount));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor</FormLabel>
              <FormControl>
                <CurrencyInput
                  value={parseCurrencyToNumber(form.watch('amount') || '')}
                  onValueChange={({ formatted }) => form.setValue('amount', formatted)}
                />
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

        <MonthSelector
          control={form.control}
          multipleMonths={multipleMonths}
          setValue={form.setValue}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <SanitizedTextarea {...field} maxLengthLimit={500} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
