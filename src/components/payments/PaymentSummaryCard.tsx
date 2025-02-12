
import { PaymentSummary } from "@/types/payment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

interface PaymentSummaryCardProps {
  data: PaymentSummary;
  onDateChange?: (dates: { start: Date; end: Date } | null) => void;
}

export function PaymentSummaryCard({ data, onDateChange }: PaymentSummaryCardProps) {
  const [date, setDate] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  const handleSelect = (selectedDate: { from: Date; to: Date }) => {
    setDate(selectedDate);
    if (selectedDate.from && selectedDate.to && onDateChange) {
      onDateChange({ start: selectedDate.from, end: selectedDate.to });
    }
  };

  return (
    <Card className="flex-1 max-w-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {data.title}
        </CardTitle>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal",
                !date.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date.from ? (
                date.to ? (
                  <>
                    {format(date.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                    {format(date.to, "dd/MM/yy", { locale: ptBR })}
                  </>
                ) : (
                  format(date.from, "dd/MM/yy", { locale: ptBR })
                )
              ) : (
                <span>Selecione o período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date.from}
              selected={date}
              onSelect={handleSelect}
              numberOfMonths={2}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" style={{ color: data.color }}>
          {formatCurrency(data.grossAmount)}
        </div>
      </CardContent>
    </Card>
  );
}
