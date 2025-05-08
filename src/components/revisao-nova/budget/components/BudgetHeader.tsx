
import React from "react";
import { CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Info } from "lucide-react";

interface BudgetHeaderProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  onHelpClick: () => void;
}

export const BudgetHeader = ({ searchTerm, setSearchTerm, onHelpClick }: BudgetHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <CardTitle className="text-xl text-muran-dark flex items-center gap-2">
          Gerenciamento de Orçamentos
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-6 w-6 rounded-full" 
            onClick={onHelpClick}
          >
            <Info className="h-4 w-4 text-muran-primary" />
          </Button>
        </CardTitle>
        <CardDescription className="mt-1">
          Configure os orçamentos mensais e IDs de contas para cada cliente
        </CardDescription>
      </div>
      <div className="relative w-full md:w-72">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </div>
  );
};
