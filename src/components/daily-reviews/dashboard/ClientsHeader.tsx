
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, PlayCircle } from "lucide-react";

interface ClientsHeaderProps {
  onSearchChange: (query: string) => void;
  onReviewAllClients: () => void;
  onRefreshClients: () => void;
  isLoading: boolean;
  isBatchAnalyzing: boolean;
  clientsCount: number;
}

export const ClientsHeader = ({
  onSearchChange,
  onReviewAllClients,
  onRefreshClients,
  isLoading,
  isBatchAnalyzing,
  clientsCount,
}: ClientsHeaderProps) => {
  const [searchValue, setSearchValue] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearchChange(value);
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
      <div className="relative w-full md:w-auto flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          className="pl-9"
          placeholder="Buscar clientes..."
          value={searchValue}
          onChange={handleSearchChange}
          disabled={isLoading}
        />
      </div>
      
      <div className="flex gap-2 w-full md:w-auto">
        <Button
          variant="outline"
          onClick={onRefreshClients}
          disabled={isLoading || isBatchAnalyzing}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
        
        <Button
          onClick={onReviewAllClients}
          disabled={isLoading || isBatchAnalyzing || clientsCount === 0}
        >
          <PlayCircle className="mr-2 h-4 w-4" />
          {isBatchAnalyzing ? "Analisando..." : "Analisar Todos"}
        </Button>
      </div>
    </div>
  );
};
