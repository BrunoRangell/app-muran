
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { ClientFormData } from "@/types/client";
import { formatCurrency } from "@/utils/formatters";

interface CompanySectionProps {
  form: UseFormReturn<ClientFormData>;
}

export const CompanySection = ({ form }: CompanySectionProps) => {
  return (
    <>
      <FormField
        control={form.control}
        name="companyName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome da Empresa</FormLabel>
            <FormControl>
              <Input placeholder="Nome da empresa" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="contractValue"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Valor do Contrato</FormLabel>
            <FormControl>
              <Input 
                placeholder="R$ 0,00"
                {...field}
                onChange={(e) => {
                  const formatted = formatCurrency(e.target.value);
                  e.target.value = formatted;
                  field.onChange(formatted);
                }}
                className="font-mono text-lg"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="companyBirthday"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Aniversário da Empresa</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
