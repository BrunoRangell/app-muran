import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FilterPopoverProps {
  filters: {
    status: string;
    acquisition_channel: string;
    payment_type: string;
  };
  onFilterChange: (filters: any) => void;
}

export const FilterPopover = ({ filters, onFilterChange }: FilterPopoverProps) => {
  const handleFilterChange = (key: string, value: string) => {
    onFilterChange({ ...filters, [key]: value === "all" ? "" : value });
  };

  const getSelectValue = (value: string) => {
    return value === "" ? "all" : value;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium">Filtros</h4>
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={getSelectValue(filters.status)}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Canal de Aquisição</label>
              <Select
                value={getSelectValue(filters.acquisition_channel)}
                onValueChange={(value) => handleFilterChange('acquisition_channel', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Tráfego pago">Tráfego pago</SelectItem>
                  <SelectItem value="Indicação">Indicação</SelectItem>
                  <SelectItem value="Prospecção fria">Prospecção fria</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Tipo de Pagamento</label>
              <Select
                value={getSelectValue(filters.payment_type)}
                onValueChange={(value) => handleFilterChange('payment_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pre">Pré-pago</SelectItem>
                  <SelectItem value="post">Pós-pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};