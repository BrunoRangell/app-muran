
import { useState } from "react";
import { PaymentFilters, PaymentStatus } from "@/types/payment";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

interface DateRange {
  from: Date;
  to?: Date;
}

interface PaymentFiltersBarProps {
  filters: PaymentFilters;
  onFiltersChange: (filters: PaymentFilters) => void;
}

export function PaymentFiltersBar({ 
  filters, 
  onFiltersChange 
}: PaymentFiltersBarProps) {
  const [date, setDate] = useState<DateRange | undefined>();

  const handleDateSelect = (range: DateRange | undefined) => {
    setDate(range);
    if (range?.from) {
      onFiltersChange({
        ...filters,
        startDate: format(range.from, 'yyyy-MM-dd'),
        endDate: range.to ? format(range.to, 'yyyy-MM-dd') : undefined
      });
    } else {
      const { startDate, endDate, ...restFilters } = filters;
      onFiltersChange(restFilters);
    }
  };

  return (
    <div className="flex gap-4 items-center">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="justify-start text-left font-normal min-w-[240px]"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                  {format(date.to, "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : (
                format(date.from, "dd/MM/yyyy", { locale: ptBR })
              )
            ) : (
              <span>Selecione um período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateSelect}
            numberOfMonths={2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>

      <Select
        value={filters.status}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, status: value as PaymentStatus })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="RECEIVED">Recebido</SelectItem>
          <SelectItem value="CONFIRMED">Confirmado</SelectItem>
          <SelectItem value="PENDING">Aguardando</SelectItem>
          <SelectItem value="OVERDUE">Atrasado</SelectItem>
          <SelectItem value="REFUNDED">Reembolsado</SelectItem>
          <SelectItem value="CANCELLED">Cancelado</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        onClick={() => {
          setDate(undefined);
          onFiltersChange({});
        }}
      >
        Limpar Filtros
      </Button>
    </div>
  );
}
