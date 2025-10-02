import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface OnboardingProgressProps {
  isOpen: boolean;
}

export const OnboardingProgress = ({ isOpen }: OnboardingProgressProps) => {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Processando Onboarding</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>Criando cliente no sistema...</span>
          </div>
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>Processando integrações...</span>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Este processo pode levar alguns segundos. Por favor, aguarde.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
