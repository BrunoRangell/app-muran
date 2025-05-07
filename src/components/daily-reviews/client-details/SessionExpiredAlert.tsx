
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export const SessionExpiredAlert = () => {
  return (
    <Alert className="mb-4 bg-amber-50 border-amber-200">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">Sessão do Meta Ads expirada</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p className="text-amber-700">
          Sua sessão do Meta Ads expirou. Para continuar usando todas as funcionalidades, é necessário se autenticar novamente.
        </p>
        <div>
          <Button 
            variant="outline"
            size="sm"
            className="border-amber-500 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
            onClick={() => window.location.href = "/configuracoes"}
          >
            Autenticar Meta Ads
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
