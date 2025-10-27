import { useState } from "react";
import { CalendarIcon, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRangeFilter } from "@/types/traffic-report";
import { useUnifiedData } from "@/hooks/useUnifiedData";
import { cn } from "@/lib/utils";

interface TrafficReportHeaderProps {
  selectedClient: string;
  onClientChange: (clientId: string) => void;
  dateRange: DateRangeFilter;
  onDateRangeChange: (range: DateRangeFilter) => void;
  onRefresh: () => void;
}

export const TrafficReportHeader = ({
  selectedClient,
  onClientChange,
  dateRange,
  onDateRangeChange,
  onRefresh,
}: TrafficReportHeaderProps) => {
  const { data: clients } = useUnifiedData();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleQuickRange = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    onDateRangeChange({
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
    });
  };

  const activeClients = clients?.filter(c => c.status === 'active') || [];

  return (
    <div className="bg-card rounded-lg shadow-sm border p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-muran-primary/10 rounded-lg">
          <TrendingUp className="h-5 w-5 text-muran-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muran-dark">Relatórios de Tráfego</h1>
          <p className="text-sm text-muted-foreground">Análise detalhada de campanhas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Seletor de Cliente */}
        <div className="md:col-span-2">
          <label className="text-sm font-medium mb-2 block">Cliente</label>
          <Select value={selectedClient} onValueChange={onClientChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              {activeClients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.company_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtros rápidos de período */}
        <div>
          <label className="text-sm font-medium mb-2 block">Período rápido</label>
          <Select onValueChange={(value) => handleQuickRange(Number(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="15">Últimos 15 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Seletor de datas customizado */}
        <div>
          <label className="text-sm font-medium mb-2 block">Período customizado</label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.startDate ? (
                  <>
                    {format(new Date(dateRange.startDate), "dd/MM/yy", { locale: ptBR })} -{" "}
                    {format(new Date(dateRange.endDate), "dd/MM/yy", { locale: ptBR })}
                  </>
                ) : (
                  <span>Selecionar datas</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{
                  from: dateRange.startDate ? new Date(dateRange.startDate) : undefined,
                  to: dateRange.endDate ? new Date(dateRange.endDate) : undefined,
                }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    onDateRangeChange({
                      startDate: format(range.from, 'yyyy-MM-dd'),
                      endDate: format(range.to, 'yyyy-MM-dd'),
                    });
                    setCalendarOpen(false);
                  }
                }}
                locale={ptBR}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Período atual exibido */}
      {dateRange.startDate && (
        <div className="text-center py-2 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Período:{" "}
            <span className="font-semibold text-foreground">
              {format(new Date(dateRange.startDate), "dd 'de' MMM 'de' yyyy", { locale: ptBR })} -{" "}
              {format(new Date(dateRange.endDate), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
            </span>
          </p>
        </div>
      )}

      <Button onClick={onRefresh} className="w-full md:w-auto">
        Atualizar Relatório
      </Button>
    </div>
  );
};
