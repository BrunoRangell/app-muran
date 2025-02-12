
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomDateRangeDialog } from "@/components/clients/metrics/CustomDateRangeDialog";
import { Control } from "react-hook-form";
import { PaymentFormData } from "./PaymentForm";

interface MonthSelectorProps {
  control: Control<PaymentFormData>;
  multipleMonths: boolean;
  setValue: (name: "months", value: string[]) => void;
}

export function MonthSelector({ control, multipleMonths, setValue }: MonthSelectorProps) {
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<Date[]>([new Date()]);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date()
  });

  const handleDateRangeChange = (range: { start: Date; end: Date }) => {
    setDateRange(range);
    const months: Date[] = [];
    let current = range.start;
    
    while (current <= range.end) {
      months.push(new Date(current));
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }
    
    setSelectedMonths(months);
    setValue('months', months.map(date => format(date, 'yyyy-MM')));
  };

  return (
    <>
      <FormField
        control={control}
        name="months"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Período de Referência</FormLabel>
            <FormControl>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !field.value && "text-muted-foreground"
                )}
                onClick={() => setIsCustomDateOpen(true)}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedMonths.length > 0 ? (
                  selectedMonths.length === 1 ? (
                    format(selectedMonths[0], "MMMM'/'yyyy", { locale: ptBR })
                  ) : (
                    `${format(dateRange.start, "MM'/'yyyy")} - ${format(dateRange.end, "MM'/'yyyy")}`
                  )
                ) : (
                  "Selecione o período"
                )}
              </Button>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <CustomDateRangeDialog
        isOpen={isCustomDateOpen}
        onOpenChange={setIsCustomDateOpen}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
      />
    </>
  );
}
