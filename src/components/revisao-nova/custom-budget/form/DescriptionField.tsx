
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "./BudgetFormSchema";

interface DescriptionFieldProps {
  form: UseFormReturn<FormData>;
  isSubmitting: boolean;
}

export function DescriptionField({ form, isSubmitting }: DescriptionFieldProps) {
  return (
    <FormField
      control={form.control}
      name="description"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Descrição (opcional)</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Adicione informações ou observações sobre este orçamento"
              {...field}
              value={field.value || ""}
              disabled={isSubmitting}
              className="resize-none"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
