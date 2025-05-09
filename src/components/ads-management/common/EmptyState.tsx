
import React, { ReactNode } from "react";
import { SearchX, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actionButton?: ReactNode;
  onAction?: () => void;
  actionLabel?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  actionButton,
  onAction,
  actionLabel = "Tentar novamente"
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-lg bg-white shadow-sm border border-gray-100 text-center">
      {icon || <SearchX className="h-16 w-16 text-gray-400 mb-4" />}
      <h3 className="text-lg font-medium text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{description}</p>
      {actionButton || (onAction && (
        <Button 
          onClick={onAction}
          className="bg-[#ff6e00] hover:bg-[#e66300] text-white"
        >
          {actionLabel}
        </Button>
      ))}
    </div>
  );
}
