import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, Users } from "lucide-react";

interface AudienceProgressProps {
  isOpen: boolean;
}

const AudienceProgress = ({ isOpen }: AudienceProgressProps) => {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-10 h-10 text-primary" />
            </div>
            <Loader2 className="w-8 h-8 text-primary animate-spin absolute -bottom-2 -right-2" />
          </div>
          
          <h3 className="text-xl font-semibold mb-2">Criando Públicos</h3>
          <p className="text-muted-foreground text-center">
            Aguarde enquanto processamos sua solicitação...
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AudienceProgress;
