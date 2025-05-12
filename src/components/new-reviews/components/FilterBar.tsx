
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader, Search, LayoutGrid, List, RefreshCw } from "lucide-react";

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  showOnlyAdjustments: boolean;
  setShowOnlyAdjustments: (value: boolean) => void;
  showOnlyWithAccounts: boolean;
  setShowOnlyWithAccounts: (value: boolean) => void;
  viewMode: "grid" | "list";
  setViewMode: (value: "grid" | "list") => void;
  onAnalyzeAll: () => void;
  isProcessingBatch: boolean;
  clientCount: number;
}

export function FilterBar({
  searchQuery,
  setSearchQuery,
  showOnlyAdjustments,
  setShowOnlyAdjustments,
  showOnlyWithAccounts,
  setShowOnlyWithAccounts,
  viewMode,
  setViewMode,
  onAnalyzeAll,
  isProcessingBatch,
  clientCount
}: FilterBarProps) {
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Campo de busca */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Botão de analisar todos */}
        <Button 
          onClick={onAnalyzeAll}
          disabled={isProcessingBatch || clientCount === 0}
          className="bg-[#ff6e00] hover:bg-[#e66300]"
        >
          {isProcessingBatch ? (
            <>
              <Loader size={16} className="mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <RefreshCw size={16} className="mr-2" />
              Analisar Todos
            </>
          )}
        </Button>
      </div>
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Opções de filtro */}
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <Checkbox 
              id="adjustments-filter" 
              checked={showOnlyAdjustments}
              onCheckedChange={(checked) => setShowOnlyAdjustments(checked as boolean)}
            />
            <Label htmlFor="adjustments-filter" className="text-sm text-gray-700">
              Mostrar apenas clientes que precisam de ajuste
            </Label>
          </div>
          
          <div className="flex items-center gap-2">
            <Checkbox 
              id="accounts-filter" 
              checked={showOnlyWithAccounts}
              onCheckedChange={(checked) => setShowOnlyWithAccounts(checked as boolean)}
            />
            <Label htmlFor="accounts-filter" className="text-sm text-gray-700">
              Mostrar apenas clientes com contas configuradas
            </Label>
          </div>
        </div>
        
        {/* Controles de visualização */}
        <div className="flex gap-1 border rounded-md overflow-hidden">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            className={viewMode === "grid" 
              ? "rounded-none bg-[#ff6e00] hover:bg-[#e66300]" 
              : "rounded-none"}
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid size={16} />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            className={viewMode === "list" 
              ? "rounded-none bg-[#ff6e00] hover:bg-[#e66300]" 
              : "rounded-none"}
            onClick={() => setViewMode("list")}
          >
            <List size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
