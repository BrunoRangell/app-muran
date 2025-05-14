
import React, { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actionButton?: ReactNode;
}

export const EmptyState = ({ 
  title, 
  description, 
  icon = <AlertCircle className="h-16 w-16 text-amber-500 mb-4" />,
  actionButton 
}: EmptyStateProps) => {
  return (
    <div className="bg-white p-8 rounded-md shadow-sm border border-gray-100 flex flex-col items-center justify-center my-8">
      <div className="text-center space-y-4 max-w-lg">
        {icon}
        <h2 className="text-lg font-medium text-gray-800">{title}</h2>
        <p className="text-gray-600">{description}</p>
        {actionButton}
      </div>
    </div>
  );
};
