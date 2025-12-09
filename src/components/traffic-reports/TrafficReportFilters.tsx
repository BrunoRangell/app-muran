import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccountMultiSelect } from "./AccountMultiSelect";

interface TrafficReportFiltersProps {
  clients: Array<{ id: string; company_name: string }>;
  accounts: Array<{ id: string; account_name: string; platform: string; is_primary: boolean }>;
  selectedClient: string;
  selectedAccounts: string[];
  selectedPlatform: 'meta' | 'google' | 'both';
  dateRange: { start: Date; end: Date };
  onClientChange: (clientId: string) => void;
  onAccountsChange: (accountIds: string[]) => void;
  onPlatformChange: (platform: 'meta' | 'google' | 'both') => void;
  onDateRangeChange: (range: { start: Date; end: Date }) => void;
  onRefresh: () => void;
  isLoading?: boolean;
  hideClientSelector?: boolean;
}

export function TrafficReportFilters({
  clients,
  accounts,
  selectedClient,
  selectedAccounts,
  selectedPlatform,
  dateRange,
  onClientChange,
  onAccountsChange,
  onPlatformChange,
  onDateRangeChange,
  onRefresh,
  isLoading,
  hideClientSelector = false
}: TrafficReportFiltersProps) {
  const quickRanges = [
    { label: 'Últimos 7 dias', days: 7 },
    { label: 'Últimos 15 dias', days: 15 },
    { label: 'Últimos 30 dias', days: 30 },
    { label: 'Últimos 90 dias', days: 90 }
  ];

  const handleQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    onDateRangeChange({ start, end });
  };

  return (
    <div className="bg-card rounded-lg border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filtros</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      <div className={cn(
        "grid gap-4",
        hideClientSelector 
          ? "grid-cols-1 md:grid-cols-3" 
          : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      )}>
        {/* Cliente */}
        {!hideClientSelector && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Cliente</label>
            <Select value={selectedClient} onValueChange={onClientChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Plataforma */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Plataforma</label>
          <Select value={selectedPlatform} onValueChange={onPlatformChange as any}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="meta">Meta Ads</SelectItem>
              <SelectItem value="google">Google Ads</SelectItem>
              <SelectItem value="both">Ambas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Conta de Anúncios - Multi-Select */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Contas de Anúncios</label>
          <AccountMultiSelect
            accounts={accounts}
            selectedIds={selectedAccounts}
            onChange={onAccountsChange}
            disabled={!selectedClient || accounts.length === 0}
          />
        </div>

        {/* Período */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Período</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.start && dateRange.end ? (
                  <>
                    {format(dateRange.start, 'dd/MM/yy', { locale: ptBR })} - {format(dateRange.end, 'dd/MM/yy', { locale: ptBR })}
                  </>
                ) : (
                  <span>Selecione o período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 border-b space-y-2">
                {quickRanges.map((range) => (
                  <Button
                    key={range.days}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleQuickRange(range.days)}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
              <Calendar
                mode="range"
                selected={{ from: dateRange.start, to: dateRange.end }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    onDateRangeChange({ start: range.from, end: range.to });
                  }
                }}
                locale={ptBR}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
