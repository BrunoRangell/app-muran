
import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title = "Erro ao carregar dados", 
  message, 
  onRetry 
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-lg bg-white shadow-sm border border-red-100 text-center">
      <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{message}</p>
      
      {onRetry && (
        <Button 
          onClick={onRetry}
          variant="outline"
          className="border-red-200 hover:bg-red-50 text-red-600"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
