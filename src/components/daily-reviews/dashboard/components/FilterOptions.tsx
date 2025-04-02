
import { useState } from "react";
import { Switch } from "@/components/ui/switch";

interface FilterOptionsProps {
  showOnlyAdjustments: boolean;
  onShowOnlyAdjustmentsChange: (value: boolean) => void;
}

export function FilterOptions({ 
  showOnlyAdjustments, 
  onShowOnlyAdjustmentsChange 
}: FilterOptionsProps) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center gap-2">
        <Switch 
          id="show-adjustments" 
          checked={showOnlyAdjustments} 
          onCheckedChange={onShowOnlyAdjustmentsChange} 
        />
        <label 
          htmlFor="show-adjustments" 
          className="text-sm text-gray-700 cursor-pointer"
        >
          Mostrar apenas clientes com recomendações
        </label>
      </div>
    </div>
  );
}
