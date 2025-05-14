
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actionButton?: ReactNode;
}

export function EmptyState({ 
  title, 
  description, 
  icon, 
  actionButton 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg border border-gray-100 shadow-sm min-h-[250px]">
      {icon && <div className="mb-4">{icon}</div>}
      
      <h3 className="text-xl font-medium text-gray-800">{title}</h3>
      
      <p className="text-gray-600 mt-2 text-center max-w-md">
        {description}
      </p>
      
      {actionButton && (
        <div className="mt-6">
          {actionButton}
        </div>
      )}
    </div>
  );
}
