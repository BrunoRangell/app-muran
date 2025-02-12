
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
import { useState } from "react";
import { MonthSelector } from "./MonthSelector";
import { Client } from "@/types/client";

const paymentFormSchema = z.object({
  amount: z.string().min(1, "Informe o valor"),
  months: z.array(z.string()).min(1, "Selecione pelo menos um mês"),
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
      amount: client?.contract_value.toString() || '',
      months: [],
      notes: '',
    }
  });

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
