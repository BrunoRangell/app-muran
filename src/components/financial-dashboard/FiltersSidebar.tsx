
import { X, Calendar, Users, DollarSign, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DateFilter } from "@/components/costs/filters/DateFilter";
import { CostFilters } from "@/types/cost";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface FiltersSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: CostFilters;
  onFiltersChange: (filters: CostFilters) => void;
}

export const FiltersSidebar = ({ isOpen, onClose, filters, onFiltersChange }: FiltersSidebarProps) => {
  const hasActiveFilters = Object.values(filters).some(value => value && value !== '');

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-white shadow-2xl border-r z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-muran-primary/5 to-muran-complementary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muran-primary/10 rounded-lg">
                <Filter className="h-5 w-5 text-muran-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-muran-dark">Filtros Avançados</h2>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="mt-1 bg-muran-primary/10 text-muran-primary">
                    Filtros Ativos
                  </Badge>
                )}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="p-6 space-y-6 overflow-y-auto h-full pb-32">
          {/* Filtro de Data */}
          <Card className="p-4 border-l-4 border-l-muran-primary">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-muran-primary" />
              <h3 className="font-semibold text-muran-dark">Período</h3>
            </div>
            <DateFilter 
              filters={filters} 
              onFiltersChange={onFiltersChange}
            />
          </Card>

          {/* Filtro de Clientes */}
          <Card className="p-4 border-l-4 border-l-blue-500">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-blue-500" />
              <h3 className="font-semibold text-muran-dark">Segmentação</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Status do Cliente
                </label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                    <SelectItem value="paused">Pausados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Canal de Aquisição
                </label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os canais" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organic">Orgânico</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="referral">Indicação</SelectItem>
                    <SelectItem value="social">Redes Sociais</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Filtro Financeiro */}
          <Card className="p-4 border-l-4 border-l-green-500">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-green-500" />
              <h3 className="font-semibold text-muran-dark">Valores</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Faixa de Ticket
                </label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as faixas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-500">R$ 0 - 500</SelectItem>
                    <SelectItem value="500-1500">R$ 500 - 1.500</SelectItem>
                    <SelectItem value="1500-3000">R$ 1.500 - 3.000</SelectItem>
                    <SelectItem value="3000+">R$ 3.000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Ações */}
          {hasActiveFilters && (
            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={clearAllFilters}
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
              >
                Limpar Todos os Filtros
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
