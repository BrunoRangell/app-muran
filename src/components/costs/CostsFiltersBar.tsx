
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CostCategory, CostFilters } from "@/types/cost";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

interface CostsFiltersBarProps {
  filters: CostFilters;
  onFiltersChange: (filters: CostFilters) => void;
}

const costCategories: { value: CostCategory; label: string }[] = [
  { value: "marketing", label: "Marketing" },
  { value: "salarios", label: "Salários" },
  { value: "comissoes", label: "Comissões" },
  { value: "impostos", label: "Impostos" },
  { value: "alimentacao", label: "Alimentação" },
  { value: "ferramentas_e_softwares", label: "Ferramentas e Softwares" },
  { value: "viagem_e_hospedagem", label: "Viagem e Hospedagem" },
  { value: "equipamentos_e_escritorio", label: "Equipamentos e Escritório" },
  { value: "despesas_financeiras", label: "Despesas Financeiras" },
  { value: "outros", label: "Outros" },
];

export function CostsFiltersBar({ filters, onFiltersChange }: CostsFiltersBarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar custo..."
          value={filters.search || ""}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          className="pl-8"
        />
      </div>

      <Select
        value={filters.category}
        onValueChange={(value: CostCategory) =>
          onFiltersChange({ ...filters, category: value })
        }
      >
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          {costCategories.map((category) => (
            <SelectItem key={category.value} value={category.value}>
              {category.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full md:w-[240px] justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.startDate ? (
              filters.endDate ? (
                <>
                  {format(new Date(filters.startDate), "dd/MM/yyyy", { locale: ptBR })} -{" "}
                  {format(new Date(filters.endDate), "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : (
                format(new Date(filters.startDate), "dd/MM/yyyy", { locale: ptBR })
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
            defaultMonth={filters.startDate ? new Date(filters.startDate) : new Date()}
            selected={{
              from: filters.startDate ? new Date(filters.startDate) : undefined,
              to: filters.endDate ? new Date(filters.endDate) : undefined,
            }}
            onSelect={(range) =>
              onFiltersChange({
                ...filters,
                startDate: range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
                endDate: range?.to ? format(range.to, "yyyy-MM-dd") : undefined,
              })
            }
            numberOfMonths={2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        onClick={() => onFiltersChange({})}
        className="w-full md:w-auto"
      >
        Limpar Filtros
      </Button>
    </div>
  );
}
