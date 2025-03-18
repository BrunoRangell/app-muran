
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Search, LayoutGrid, Table } from "lucide-react";

interface SearchControlsProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  viewMode: string;
  onViewModeChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
}

export const SearchControls = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange
}: SearchControlsProps) => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-4 mb-3">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          type="text"
          placeholder="Buscar cliente por nome..."
          className="pl-10 w-full"
          value={searchQuery}
          onChange={onSearchChange}
        />
      </div>
      
      <div className="flex gap-2 items-center">
        <ToggleGroup type="single" value={viewMode} onValueChange={(val) => val && onViewModeChange(val)}>
          <ToggleGroupItem value="grid" aria-label="Visualização em grade">
            <LayoutGrid size={18} />
          </ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Visualização em tabela">
            <Table size={18} />
          </ToggleGroupItem>
        </ToggleGroup>
        
        <Separator orientation="vertical" className="h-8 mx-2" />
        
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="adjustments">Ajustes Necessários</SelectItem>
            <SelectItem value="name">Nome</SelectItem>
            <SelectItem value="budget">Orçamento</SelectItem>
            <SelectItem value="lastReview">Última Revisão</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
