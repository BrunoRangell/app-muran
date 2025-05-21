
import { AlertTriangle } from "lucide-react";

interface ClientStatusBadgeProps {
  inactive: boolean;
  calculationError: boolean | null;
}

export const ClientStatusBadge = ({ inactive, calculationError }: ClientStatusBadgeProps) => {
  if (inactive) {
    return (
      <div className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
        Sem Meta Ads
      </div>
    );
  }
  
  if (calculationError) {
    return (
      <div className="bg-red-50 text-red-600 text-xs px-2 py-1 rounded flex items-center">
        <AlertTriangle size={12} className="mr-1" />
        Erro
      </div>
    );
  }
  
  return null;
};
