
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type SearchBarProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
};

export const SearchBar = ({ searchTerm, onSearchChange }: SearchBarProps) => {
  return (
    <div className="flex items-center relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
      <Input
        placeholder="Buscar cliente..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
};
