
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader, Save, AlertCircle } from "lucide-react";

interface SaveButtonProps {
  isLoading: boolean;
  isSaving: boolean;
  onSave: () => void;
  hasErrors?: boolean;
}

export const SaveButton = ({ 
  isLoading, 
  isSaving, 
  onSave, 
  hasErrors = false 
}: SaveButtonProps) => {
  return (
    <div className="mt-6 flex justify-end">
      {hasErrors && (
        <div className="flex items-center mr-4 text-red-500 text-sm">
          <AlertCircle className="mr-1 h-4 w-4" />
          Erros encontrados
        </div>
      )}
      
      <Button 
        onClick={onSave} 
        disabled={isLoading || isSaving || hasErrors}
        className="bg-muran-primary hover:bg-muran-primary/90 font-medium"
        size="lg"
      >
        {isSaving ? (
          <>
            <Loader className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Salvar alterações
          </>
        )}
      </Button>
    </div>
  );
};
