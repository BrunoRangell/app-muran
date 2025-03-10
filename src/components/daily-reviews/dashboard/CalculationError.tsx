
import { AlertCircle } from "lucide-react";

interface CalculationErrorProps {
  error: string | null;
}

export const CalculationError = ({ error }: CalculationErrorProps) => {
  if (!error) return null;
  
  return (
    <div className="mt-2 p-2 bg-amber-50 rounded-lg flex items-center gap-2 text-xs text-amber-700">
      <AlertCircle size={14} />
      {error}
    </div>
  );
};
