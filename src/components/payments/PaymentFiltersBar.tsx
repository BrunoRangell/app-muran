
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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface PaymentFiltersBarProps {
  filters: PaymentFilters;
  onFiltersChange: (filters: PaymentFilters) => void;
}

export function PaymentFiltersBar({ 
  filters, 
  onFiltersChange 
}: PaymentFiltersBarProps) {
  const [date, setDate] = useState<Date>();

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await supabase
        .from('clients')
        .select('id, company_name')
        .order('company_name');
      return data || [];
    }
  });

  return (
    <div className="flex gap-4 items-center">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? (
              format(date, "dd/MM/yyyy", { locale: ptBR })
            ) : (
              <span>Selecione uma data</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(date) => {
              setDate(date);
              if (date) {
                onFiltersChange({
                  ...filters,
                  startDate: format(date, 'yyyy-MM-dd')
                });
              }
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Select
        value={filters.clientId}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, clientId: value })
        }
      >
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Selecione um cliente" />
        </SelectTrigger>
        <SelectContent>
          {clients?.map((client) => (
            <SelectItem key={client.id} value={client.id.toString()}>
              {client.company_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
