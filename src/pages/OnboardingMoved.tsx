import { Button } from "@/components/ui/button";
import { ExternalLink, Handshake } from "lucide-react";

const GESTOR_URL = "https://clickup.muranmarketing.com.br/onboarding";

// Onboarding e offboarding de clientes saíram do APP Muran: agora são feitos no gestor de tarefas da Muran.
export default function OnboardingMoved() {
  return (
    <div className="flex items-center justify-center py-24 px-6">
      <div className="max-w-md text-center space-y-5">
        <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Handshake className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-semibold">Onboarding e offboarding mudaram de lugar</h1>
        <p className="text-muted-foreground">
          Agora eles são feitos no gestor de tarefas da Muran, na tela Onboarding.
        </p>
        <Button asChild>
          <a href={GESTOR_URL} target="_blank" rel="noopener noreferrer">
            Abrir o gestor de tarefas
            <ExternalLink className="h-4 w-4 ml-2" />
          </a>
        </Button>
      </div>
    </div>
  );
}
