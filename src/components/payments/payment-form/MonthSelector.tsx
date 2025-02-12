
import { useState } from "react";
import { format } from "date-fns";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import { PaymentFormData } from "./PaymentForm";

interface MonthSelectorProps {
  control: Control<PaymentFormData>;
  multipleMonths: boolean;
  setValue: (name: "months", value: string[]) => void;
}

export function MonthSelector({ control, multipleMonths, setValue }: MonthSelectorProps) {
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date()
  });

  const formatDateForInput = (date: Date) => {
    try {
      return format(date, 'yyyy-MM');
    } catch (error) {
      console.error('Erro ao formatar data:', error, date);
      return format(new Date(), 'yyyy-MM');
    }
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    try {
      // Adiciona o dia 1 para garantir uma data válida no mês selecionado
      const newDate = new Date(`${value}-01`);
      
      const newDateRange = multipleMonths 
        ? {
            ...dateRange,
            [type]: newDate
          }
        : {
            start: newDate,
            end: newDate
          };
      
      setDateRange(newDateRange);

      // Calcula os meses selecionados
      const months: Date[] = [];
      let current = newDateRange.start;
      
      if (multipleMonths) {
        while (current <= newDateRange.end) {
          months.push(new Date(current));
          current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
        }
      } else {
        months.push(newDateRange.start);
      }
      
      setValue('months', months.map(date => format(date, 'yyyy-MM')));
    } catch (error) {
      console.error('Erro ao processar data:', error);
    }
  };

  return (
    <FormField
      control={control}
      name="months"
      render={({ field }) => (
        <FormItem className="space-y-4">
          <FormLabel>Período de Referência</FormLabel>
          <div className="space-y-4">
            {multipleMonths ? (
              <>
                <div className="space-y-2">
                  <FormLabel className="text-sm text-muted-foreground">Mês inicial</FormLabel>
                  <FormControl>
                    <Input
                      type="month"
                      value={formatDateForInput(dateRange.start)}
                      onChange={(e) => handleDateChange('start', e.target.value)}
                      className="w-full"
                    />
                  </FormControl>
                </div>
                <div className="space-y-2">
                  <FormLabel className="text-sm text-muted-foreground">Mês final</FormLabel>
                  <FormControl>
                    <Input
                      type="month"
                      value={formatDateForInput(dateRange.end)}
                      onChange={(e) => handleDateChange('end', e.target.value)}
                      className="w-full"
                    />
                  </FormControl>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <FormControl>
                  <Input
                    type="month"
                    value={formatDateForInput(dateRange.start)}
                    onChange={(e) => handleDateChange('start', e.target.value)}
                    className="w-full"
                  />
                </FormControl>
              </div>
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
