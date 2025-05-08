
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader, Save } from "lucide-react";

interface SaveButtonProps {
  isLoading: boolean;
  isSaving: boolean;
  onSave: () => void;
}

export const SaveButton = ({ isLoading, isSaving, onSave }: SaveButtonProps) => {
  return (
    <div className="mt-6 flex justify-end">
      <Button 
        onClick={onSave} 
        disabled={isLoading || isSaving}
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
