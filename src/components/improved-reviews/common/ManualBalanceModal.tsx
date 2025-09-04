import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/utils/formatters";
import { BadgeDollarSign, Loader2 } from "lucide-react";

interface ManualBalanceModalProps {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (balance: number) => void;
  currentBalance?: number;
  clientName?: string;
  accountName?: string;
}

export function ManualBalanceModal({
  isOpen,
  isLoading,
  onClose,
  onConfirm,
  currentBalance = 0,
  clientName = "",
  accountName = ""
}: ManualBalanceModalProps) {
  const [balanceInput, setBalanceInput] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const balance = parseFloat(balanceInput.replace(",", "."));
    
    if (isNaN(balance)) {
      setError("Por favor, insira um valor válido");
      return;
    }

    if (balance < -999999 || balance > 999999) {
      setError("Valor deve estar entre -R$ 999.999 e R$ 999.999");
      return;
    }

    setError("");
    onConfirm(balance);
  };

  const handleClose = () => {
    setBalanceInput("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BadgeDollarSign className="h-5 w-5 text-blue-600" />
            Definir Saldo Atual
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <div>
              <strong>Cliente:</strong> {clientName}
            </div>
            <div>
              <strong>Conta:</strong> {accountName}
            </div>
            <div className="text-sm text-gray-600 mt-3">
              Informe o saldo atual disponível na conta Meta Ads. 
              O sistema irá recalcular automaticamente com base nos gastos futuros.
            </div>
            {currentBalance !== null && (
              <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                <strong>Saldo atual no sistema:</strong> {formatCurrency(currentBalance)}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="balance">Saldo Atual (R$)</Label>
            <Input
              id="balance"
              type="text"
              placeholder="Ex: 1500.50 ou -250.75"
              value={balanceInput}
              onChange={(e) => {
                setBalanceInput(e.target.value);
                setError("");
              }}
              disabled={isLoading}
              className={error ? "border-red-500" : ""}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <p className="text-xs text-gray-500">
              Pode ser positivo (saldo disponível) ou negativo (conta no vermelho)
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !balanceInput.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Definir Saldo"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}