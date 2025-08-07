
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { ClientFormData } from "@/types/client";
import { SanitizedInput } from "@/components/common/SanitizedInputs";
import { CurrencyInput } from "@/components/common/CurrencyInput";

interface CompanySectionProps {
  form: UseFormReturn<ClientFormData>;
}


  return (
    <>
      <FormField
        control={form.control}
        name="companyName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome da Empresa</FormLabel>
            <FormControl>
              <SanitizedInput placeholder="Nome da empresa" {...field} maxLengthLimit={255} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="contractValue"
        render={({ field: { name, onBlur: fieldOnBlur, ...restField } }) => (
          <FormItem>
            <FormLabel>Valor do Contrato</FormLabel>
            <FormControl>
              <CurrencyInput 
                placeholder="R$ 0,00"
                value={form.watch('contractValue')}
                onValueChange={({ numeric }) => form.setValue('contractValue', numeric)}
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
