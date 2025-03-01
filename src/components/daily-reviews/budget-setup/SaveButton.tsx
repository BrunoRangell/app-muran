
import { Button } from "@/components/ui/button";
import { Loader, Save } from "lucide-react";

type SaveButtonProps = {
  onSave: () => void;
  isSaving: boolean;
  isLoading: boolean;
};

export const SaveButton = ({ onSave, isSaving, isLoading }: SaveButtonProps) => {
  return (
    <div className="flex justify-end pt-4">
      <Button
        onClick={onSave}
        disabled={isSaving || isLoading}
        className="bg-[#ff6e00] hover:bg-[#e06200]"
      >
        {isSaving ? (
          <>
            <Loader className="animate-spin mr-2 h-4 w-4" />
            Salvando...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Salvar Orçamentos
          </>
        )}
      </Button>
    </div>
  );
};
