
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { FormData, RECURRENCE_PATTERNS } from "./BudgetFormSchema";
import { RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RecurrenceSectionProps {
  form: UseFormReturn<FormData>;
  isSubmitting: boolean;
  showRecurrenceOptions: boolean;
}

export function RecurrenceSection({ form, isSubmitting, showRecurrenceOptions }: RecurrenceSectionProps) {
  return (
    <Card className="shadow-none border">
      <CardContent className="p-4 space-y-4">
        <FormField
          control={form.control}
          name="is_recurring"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Orçamento Recorrente</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Ative para configurar um orçamento que se repete regularmente
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {showRecurrenceOptions && (
          <FormField
            control={form.control}
            name="recurrence_pattern"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Padrão de Recorrência</FormLabel>
                <Select
                  disabled={isSubmitting}
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o padrão de recorrência" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {RECURRENCE_PATTERNS.map((pattern) => (
                      <SelectItem key={pattern.value} value={pattern.value}>
                        <div className="flex items-center">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          {pattern.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </CardContent>
    </Card>
  );
}
