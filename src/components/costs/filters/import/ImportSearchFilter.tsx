import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ImportSearchFilterProps {
  searchTerm: string;
  onSearchChange: (searchTerm: string) => void;
}

export function ImportSearchFilter({ searchTerm, onSearchChange }: ImportSearchFilterProps) {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Buscar transações..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}