
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ 
  title = "Nenhum item encontrado", 
  description = "Não há itens para exibir.", 
  icon,
  action
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow-sm text-center">
      {icon || <Inbox className="h-16 w-16 text-gray-400 mb-4" />}
      <h3 className="text-xl font-medium text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-md mx-auto">{description}</p>
      
      {action && (
        <Button 
          onClick={action.onClick}
          className="mt-6 bg-[#ff6e00] hover:bg-[#e66300] text-white"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
