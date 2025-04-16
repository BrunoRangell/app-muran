
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ViewIcon } from "lucide-react";

interface FilterOptionsProps {
  showOnlyAdjustments: boolean;
  onShowOnlyAdjustmentsChange: (value: boolean) => void;
  viewMode?: string;
  onViewModeChange?: (value: string) => void;
}

export const FilterOptions = ({ 
  showOnlyAdjustments, 
  onShowOnlyAdjustmentsChange,
  viewMode,
  onViewModeChange
}: FilterOptionsProps) => {
  return (
    <div className="flex flex-wrap items-center gap-6 mb-4 bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center space-x-2">
        <Switch
          id="show-adjustments"
          checked={showOnlyAdjustments}
          onCheckedChange={onShowOnlyAdjustmentsChange}
        />
        <Label htmlFor="show-adjustments">
          Mostrar apenas contas que precisam de ajuste
        </Label>
      </div>
      
      {viewMode && onViewModeChange && (
        <div className="flex items-center space-x-2">
          <Select value={viewMode} onValueChange={onViewModeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Visualização" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">Cards</SelectItem>
              <SelectItem value="table">Tabela</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};
