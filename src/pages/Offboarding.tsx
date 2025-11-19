import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserX, AlertTriangle } from "lucide-react";
import { ClientSelector } from "@/components/offboarding/ClientSelector";
import { OffboardingProgress } from "@/components/offboarding/OffboardingProgress";
import { OffboardingResult } from "@/components/offboarding/OffboardingResult";
import { useOffboarding } from "@/hooks/useOffboarding";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SelectedClient {
  id: string;
  company_name: string;
  contact_name: string;
  contract_value: number;
  first_payment_date: string;
}

const Offboarding = () => {
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { executeOffboarding, resetOffboarding, isProcessing, result } = useOffboarding();

  const handleExecuteOffboarding = () => {
    if (selectedClient) {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirm = async () => {
    setShowConfirmDialog(false);
    if (selectedClient) {
      await executeOffboarding(selectedClient.id);
    }
  };

  const handleReset = () => {
    resetOffboarding();
    setSelectedClient(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-destructive/10 rounded-lg">
          <UserX className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Offboarding de Cliente</h1>
          <p className="text-muted-foreground">
            Processo de desligamento e organização de tarefas finais
          </p>
        </div>
      </div>

      {!result && !isProcessing && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Cliente</CardTitle>
              <CardDescription>
                Escolha o cliente que será desligado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClientSelector
                onClientSelect={setSelectedClient}
                disabled={isProcessing}
              />
            </CardContent>
          </Card>

          {selectedClient && (
            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle>Informações do Cliente</CardTitle>
                <CardDescription>
                  Revise os dados antes de prosseguir
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Empresa</p>
                    <p className="font-medium">{selectedClient.company_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contato</p>
                    <p className="font-medium">{selectedClient.contact_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor do Contrato</p>
                    <p className="font-medium">
                      {formatCurrency(selectedClient.contract_value)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Início</p>
                    <p className="font-medium">
                      {formatDate(selectedClient.first_payment_date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-destructive/5 rounded-lg border border-destructive/20 mt-4">
                  <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">Atenção</p>
                    <p className="text-muted-foreground mt-1">
                      Este processo criará tarefas de offboarding no ClickUp. O status do
                      cliente no sistema não será alterado automaticamente.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleExecuteOffboarding}
                  variant="destructive"
                  className="w-full mt-4"
                  size="lg"
                >
                  <UserX className="w-4 h-4 mr-2" />
                  Executar Offboarding
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {isProcessing && <OffboardingProgress />}

      {result && (
        <OffboardingResult
          success={result.success}
          message={result.message}
          data={result.data}
          error={result.error}
          onReset={handleReset}
        />
      )}

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Offboarding</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja iniciar o processo de offboarding para{" "}
              <span className="font-semibold">{selectedClient?.company_name}</span>?
              <br />
              <br />
              Isso criará uma lista de tarefas no ClickUp para organizar o processo de
              desligamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className="bg-destructive hover:bg-destructive/90">
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Offboarding;
