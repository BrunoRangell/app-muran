import { useState } from "react";
import { subDays } from "date-fns";
import { X, Users, Layers, Calendar, LayoutTemplate, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { AccountMultiSelect } from "@/components/traffic-reports/AccountMultiSelect";
import { TemplateSelector } from "@/components/traffic-reports/TemplateSelector";
import { TemplateCustomizer } from "@/components/traffic-reports/TemplateCustomizer";
import { ClientPortalButton } from "@/components/traffic-reports/ClientPortalButton";
import { cn } from "@/lib/utils";
import { ReportTemplate } from "@/hooks/useReportTemplates";

interface EditorToolbarProps {
  // Client
  clients: Array<{ id: string; company_name: string; status: string }>;
  selectedClient: string;
  onClientChange: (clientId: string) => void;
  clientName?: string;
  
  // Accounts
  accounts: Array<{ id: string; account_id: string; account_name: string; platform: string; is_primary: boolean }>;
  selectedAccounts: string[];
  onAccountsChange: (accounts: string[]) => void;
  
  // Platform
  selectedPlatform: 'meta' | 'google' | 'both';
  onPlatformChange: (platform: 'meta' | 'google' | 'both') => void;
  
  // Date Range
  dateRange: { start: Date; end: Date };
  onDateRangeChange: (range: { start: Date; end: Date }) => void;
  
  // Template
  selectedTemplate: ReportTemplate | null;
  onTemplateSelect: (template: ReportTemplate | null) => void;
  
  // Close
  onClose: () => void;
  
  // Loading
  isLoading?: boolean;
}

const QUICK_RANGES = [
  { label: '7 dias', days: 7 },
  { label: '15 dias', days: 15 },
  { label: '30 dias', days: 30 },
  { label: '60 dias', days: 60 },
  { label: '90 dias', days: 90 },
];

export function EditorToolbar({
  clients,
  selectedClient,
  onClientChange,
  clientName,
  accounts,
  selectedAccounts,
  onAccountsChange,
  selectedPlatform,
  onPlatformChange,
  dateRange,
  onDateRangeChange,
  selectedTemplate,
  onTemplateSelect,
  onClose,
  isLoading
}: EditorToolbarProps) {
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleQuickRange = (days: number) => {
    onDateRangeChange({
      start: subDays(new Date(), days),
      end: new Date()
    });
    setCalendarOpen(false);
  };

  const activeClients = clients?.filter(c => c.status === 'active') || [];

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[60] bg-background/95 backdrop-blur-md border-b shadow-lg animate-in slide-in-from-top duration-300">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 bg-muran-primary rounded-full" />
              <h3 className="font-semibold text-lg">Modo Edição</h3>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Cliente */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Cliente
              </label>
              <Select value={selectedClient} onValueChange={onClientChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {activeClients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Plataforma */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                Plataforma
              </label>
              <Select value={selectedPlatform} onValueChange={(v) => onPlatformChange(v as 'meta' | 'google' | 'both')}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Meta + Google</SelectItem>
                  <SelectItem value="meta">Meta Ads</SelectItem>
                  <SelectItem value="google">Google Ads</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Contas */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Contas
              </label>
              <AccountMultiSelect
                accounts={accounts}
                selectedIds={selectedAccounts}
                onChange={onAccountsChange}
              />
            </div>

            {/* Período */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Período
              </label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3 border-b">
                    <p className="text-xs text-muted-foreground mb-2">Período rápido</p>
                    <div className="flex flex-wrap gap-1">
                      {QUICK_RANGES.map(range => (
                        <Button 
                          key={range.days} 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleQuickRange(range.days)}
                        >
                          {range.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <CalendarComponent
                    mode="range"
                    selected={{ from: dateRange.start, to: dateRange.end }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        onDateRangeChange({ start: range.from, end: range.to });
                        setCalendarOpen(false);
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Template */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <LayoutTemplate className="h-3.5 w-3.5" />
                Template
              </label>
              <TemplateSelector
                selectedTemplateId={selectedTemplate?.id}
                onTemplateSelect={onTemplateSelect}
                onCustomize={() => setCustomizerOpen(true)}
                clientId={selectedClient}
              />
            </div>

            {/* Portal Button */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5" />
                Portal do Cliente
              </label>
              {selectedClient ? (
                <ClientPortalButton 
                  clientId={selectedClient} 
                  clientName={clientName}
                />
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  Selecione um cliente
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Spacer para compensar o header fixo */}
      <div className="h-[140px]" />

      <TemplateCustomizer
        open={customizerOpen}
        onOpenChange={setCustomizerOpen}
        template={selectedTemplate}
        clientId={selectedClient}
      />
    </>
  );
}
