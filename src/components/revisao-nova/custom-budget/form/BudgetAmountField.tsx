
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "./BudgetFormSchema";
import { useState } from "react";
import { formatCurrency, parseCurrencyToNumber } from "@/utils/formatters";

interface BudgetAmountFieldProps {
  form: UseFormReturn<FormData>;
  isSubmitting: boolean;
  initialFormattedValue?: string;
}

export function BudgetAmountField({ form, isSubmitting, initialFormattedValue = "" }: BudgetAmountFieldProps) {
  const [formattedBudget, setFormattedBudget] = useState(initialFormattedValue);

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormattedBudget(value);
    
    // Atualizar o valor no formulário apenas se for um número válido
    const numericValue = parseCurrencyToNumber(value);
    if (!isNaN(numericValue)) {
      form.setValue("budget_amount", numericValue);
    }
  };

  const handleBudgetBlur = () => {
    const numericValue = parseCurrencyToNumber(formattedBudget);
    if (!isNaN(numericValue)) {
      setFormattedBudget(formatCurrency(numericValue));
    }
  };

  return (
    <FormField
      control={form.control}
      name="budget_amount"
      render={() => (
        <FormItem>
          <FormLabel>Valor do Orçamento</FormLabel>
          <FormControl>
            <Input
              placeholder="R$ 0,00"
              value={formattedBudget}
              onChange={handleBudgetChange}
              onBlur={handleBudgetBlur}
              disabled={isSubmitting}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
