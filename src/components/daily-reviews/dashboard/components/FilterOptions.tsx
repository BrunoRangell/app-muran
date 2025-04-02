
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { CompactNextReviewCountdown } from "./CompactNextReviewCountdown";

interface FilterOptionsProps {
  showOnlyAdjustments: boolean;
  onShowOnlyAdjustmentsChange: (value: boolean) => void;
  onAnalyzeAll: () => Promise<void>; // Updated to match the type used in CompactNextReviewCountdown
}

export function FilterOptions({ 
  showOnlyAdjustments, 
  onShowOnlyAdjustmentsChange,
  onAnalyzeAll // Added to props destructuring
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
      
      <div className="border-l pl-4">
        <CompactNextReviewCountdown onAnalyzeAll={onAnalyzeAll} />
      </div>
    </div>
  );
}
