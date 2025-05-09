
import React from "react";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, LayoutGrid, List, Table as TableIcon } from "lucide-react";

interface FilterBarProps {
  searchQuery: string;
  viewMode: "cards" | "table" | "list";
  showOnlyAdjustments: boolean;
  onSearchChange: (query: string) => void;
  onViewModeChange: (mode: "cards" | "table" | "list") => void;
  onFilterChange: (showAdjustments: boolean) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  platform?: string; // Adicionada a propriedade platform como opcional
}

export function FilterBar({
  searchQuery,
  viewMode,
  showOnlyAdjustments,
  onSearchChange,
  onViewModeChange,
  onFilterChange,
  onRefresh,
  isRefreshing = false,
  platform
}: FilterBarProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 border border-gray-100">
      <div className="relative w-full md:w-auto flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder={`Buscar ${platform === 'google' ? 'campanha' : 'cliente'}...`}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff6e00] focus:border-transparent"
        />
      </div>
      
      <div className="flex items-center space-x-4 w-full md:w-auto">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="showOnlyAdjustments"
            checked={showOnlyAdjustments}
            onChange={(e) => onFilterChange(e.target.checked)}
            className="rounded-sm border-gray-300 text-[#ff6e00] focus:ring-[#ff6e00]"
          />
          <label htmlFor="showOnlyAdjustments" className="text-sm text-gray-700">
            Apenas {platform === 'google' ? 'campanhas' : 'clientes'} com ajustes
          </label>
        </div>
        
        <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
          <button
            onClick={() => onViewModeChange("cards")}
            className={`p-1.5 rounded-md ${
              viewMode === "cards" ? "bg-white shadow-sm" : "hover:bg-gray-200"
            }`}
            title="Visualização em cards"
          >
            <LayoutGrid className="h-4 w-4 text-gray-700" />
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`p-1.5 rounded-md ${
              viewMode === "list" ? "bg-white shadow-sm" : "hover:bg-gray-200"
            }`}
            title="Visualização em lista"
          >
            <List className="h-4 w-4 text-gray-700" />
          </button>
          <button
            onClick={() => onViewModeChange("table")}
            className={`p-1.5 rounded-md ${
              viewMode === "table" ? "bg-white shadow-sm" : "hover:bg-gray-200"
            }`}
            title="Visualização em tabela"
          >
            <TableIcon className="h-4 w-4 text-gray-700" />
          </button>
        </div>
        
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="ml-2"
          >
            <RefreshCw
              className={`mr-1 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            {isRefreshing ? 'Atualizando...' : 'Atualizar'}
          </Button>
        )}
      </div>
    </div>
  );
}
