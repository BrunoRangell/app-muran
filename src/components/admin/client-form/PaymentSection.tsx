import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { ClientFormData } from "@/types/client";

interface PaymentSectionProps {
  form: UseFormReturn<ClientFormData>;
  showLastPaymentDate?: boolean;
}

export const PaymentSection = ({ form, showLastPaymentDate }: PaymentSectionProps) => {
  return (
    <>
      <FormField
        control={form.control}
        name="firstPaymentDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Início da Parceria</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="paymentType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo de Pagamento</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de pagamento" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="pre">Pré-pago</SelectItem>
                <SelectItem value="post">Pós-pago</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {showLastPaymentDate && (
        <FormField
          control={form.control}
          name="lastPaymentDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Último Pagamento</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
};