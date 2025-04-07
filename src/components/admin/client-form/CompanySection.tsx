
import { useState } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { ClientFormData } from "@/types/client";
import { formatCurrency, parseCurrencyToNumber } from "@/utils/formatters";

interface CompanySectionProps {
  form: UseFormReturn<ClientFormData>;
}

export const CompanySection = ({ form }: CompanySectionProps) => {
  const [inputValue, setInputValue] = useState<string>(() => {
    const initialValue = form.getValues().contractValue;
    return initialValue ? formatCurrency(initialValue) : '';
  });

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permite apenas números e vírgula
    const sanitizedValue = e.target.value.replace(/[^\d,]/g, '');
    setInputValue(sanitizedValue);
  };

  const handleValueBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Formata o valor quando o campo perde o foco
    const value = e.target.value;
    if (!value) {
      setInputValue('');
      form.setValue('contractValue', 0);
      return;
    }

    const formattedValue = formatCurrency(value);
    setInputValue(formattedValue);
    
    // Converte para número e salva no formulário
    const numericValue = parseCurrencyToNumber(formattedValue);
    form.setValue('contractValue', numericValue);
  };

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
        render={({ field: { name, onBlur: fieldOnBlur, ...restField } }) => (
          <FormItem>
            <FormLabel>Valor do Contrato</FormLabel>
            <FormControl>
              <Input 
                placeholder="R$ 0,00"
                {...restField}
                name={name}
                value={inputValue}
                onChange={handleValueChange}
                onBlur={(e) => {
                  handleValueBlur(e);
                  fieldOnBlur();
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
