
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DownloadIcon, PlusCircle, Search } from "lucide-react";
import { BudgetStatsGrid } from "./BudgetStatsGrid";

interface BudgetManagerHeaderProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  getBudgetStats: () => {
    total: number;
    active: number;
    scheduled: number;
    meta: number;
    google: number;
  };
  exportToCSV: () => void;
  onAddNewBudget: () => void;
}

export const BudgetManagerHeader = ({
  searchTerm,
  setSearchTerm,
  getBudgetStats,
  exportToCSV,
  onAddNewBudget,
}: BudgetManagerHeaderProps) => {
  const budgetStats = getBudgetStats();

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <CardTitle className="text-xl text-muran-dark">
          Orçamentos Personalizados
        </CardTitle>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => exportToCSV()}
            className="flex items-center gap-2"
          >
            <DownloadIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onAddNewBudget}
            className="flex items-center gap-2 bg-muran-primary text-white hover:bg-muran-primary/80"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Novo Orçamento</span>
          </Button>
        </div>
      </div>
      <CardDescription className="mt-1">
        Configure orçamentos com períodos personalizados para Meta e Google Ads
      </CardDescription>

      {/* Estatísticas de orçamento */}
      <BudgetStatsGrid stats={budgetStats} />

      <div className="relative flex-1 mt-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </>
  );
};
