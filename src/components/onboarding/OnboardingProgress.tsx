import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, HardDrive, MessageSquare, FolderKanban } from "lucide-react";

interface OnboardingProgressProps {
  isOpen: boolean;
}

export const OnboardingProgress = ({ isOpen }: OnboardingProgressProps) => {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Loader2 className="h-6 w-6 animate-spin text-muran-primary" />
            Processando Onboarding
          </DialogTitle>
          <DialogDescription>
            Aguarde enquanto configuramos tudo para o novo cliente
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-6">
          {/* Google Drive */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-blue-50 border border-blue-100 animate-fade-in">
            <div className="p-2 bg-blue-100 rounded-lg">
              <HardDrive className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-muran-dark">Google Drive</p>
              <p className="text-sm text-muted-foreground">Criando pasta organizada...</p>
            </div>
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          </div>

          {/* Discord */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-indigo-50 border border-indigo-100 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="p-2 bg-indigo-100 rounded-lg">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-muran-dark">Discord</p>
              <p className="text-sm text-muted-foreground">Configurando canal privado...</p>
            </div>
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
          </div>

          {/* ClickUp */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-purple-50 border border-purple-100 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="p-2 bg-purple-100 rounded-lg">
              <FolderKanban className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-muran-dark">ClickUp</p>
              <p className="text-sm text-muted-foreground">Criando projeto completo...</p>
            </div>
            <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-center text-muted-foreground">
              ⏱️ Este processo pode levar alguns segundos
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
