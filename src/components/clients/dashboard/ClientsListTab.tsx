
import { useState } from "react";
import { ClientsList } from "../ClientsList";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Grid, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const ClientsListTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const quickFilters = [
    { label: "Ativos", value: "active", count: 45 },
    { label: "Inativos", value: "inactive", count: 3 },
    { label: "Tráfego Pago", value: "paid-traffic", count: 25 },
    { label: "Indicação", value: "referral", count: 15 },
  ];

  const toggleFilter = (filterValue: string) => {
    setActiveFilters(prev => 
      prev.includes(filterValue)
        ? prev.filter(f => f !== filterValue)
        : [...prev, filterValue]
    );
  };

  return (
    <div className="space-y-6">
      {/* Busca e Controles */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "cards" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("cards")}
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filtros Rápidos */}
      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter) => (
          <Badge
            key={filter.value}
            variant={activeFilters.includes(filter.value) ? "default" : "outline"}
            className="cursor-pointer hover:bg-muran-primary/10 px-3 py-1"
            onClick={() => toggleFilter(filter.value)}
          >
            {filter.label} ({filter.count})
          </Badge>
        ))}
        {activeFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveFilters([])}
            className="text-xs"
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Lista de Clientes */}
      <div className="bg-white rounded-lg border">
        <ClientsList />
      </div>
    </div>
  );
};
