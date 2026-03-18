
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrencyInput, parseBrazilianCurrency } from "@/utils/currencyUtils";

type AddSecondaryAccountModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    platform: 'meta' | 'google';
    accountName: string;
    accountId: string;
    budgetAmount: number;
  }) => void;
  clientName: string;
  isLoading?: boolean;
  title?: string;
  /** Quando fornecido, esconde o seletor de plataforma e usa esse valor */
  fixedPlatform?: 'meta' | 'google';
  /** Quando true, esconde o campo nome da conta e usa "Conta Principal" */
  hideAccountName?: boolean;
};

export const AddSecondaryAccountModal = ({
  isOpen,
  onClose,
  onSave,
  clientName,
  isLoading = false,
  title = "Adicionar Conta Secundária",
  fixedPlatform,
  hideAccountName = false,
}: AddSecondaryAccountModalProps) => {
  const [platform, setPlatform] = useState<'meta' | 'google'>(fixedPlatform || 'meta');
  const [accountName, setAccountName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');

  const effectivePlatform = fixedPlatform || platform;
  const effectiveAccountName = hideAccountName ? 'Conta Principal' : accountName.trim();
  const hasNonNumericId = accountId.length > 0 && /\D/.test(accountId);
  const isIdValid = accountId.length > 0 && !hasNonNumericId;

  const handleSave = () => {
    if (!effectiveAccountName || !isIdValid || !budgetAmount) {
      return;
    }

    onSave({
      platform: effectivePlatform,
      accountName: effectiveAccountName,
      accountId: accountId.trim(),
      budgetAmount: parseBrazilianCurrency(budgetAmount)
    });

    // Reset form
    setAccountName('');
    setAccountId('');
    setBudgetAmount('');
    if (!fixedPlatform) setPlatform('meta');
  };

  const handleBudgetChange = (value: string) => {
    const formatted = formatCurrencyInput(value);
    setBudgetAmount(formatted);
  };

  const canSave = (hideAccountName || !!accountName.trim()) && isIdValid && !!budgetAmount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Cliente: <span className="font-medium">{clientName}</span>
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          {!fixedPlatform && (
            <div>
              <Label htmlFor="platform">Plataforma</Label>
              <Select value={platform} onValueChange={(value: 'meta' | 'google') => setPlatform(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meta">Meta Ads</SelectItem>
                  <SelectItem value="google">Google Ads</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {!hideAccountName && (
            <div>
              <Label htmlFor="accountName">Nome da Conta</Label>
              <Input
                id="accountName"
                placeholder="Ex: Campanha Sazonal"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>
          )}

          <div>
            <Label htmlFor="accountId">ID da Conta</Label>
            <Input
              id="accountId"
              placeholder="Ex: 123456789"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className={hasNonNumericId ? "border-destructive" : ""}
            />
            {hasNonNumericId && (
              <p className="text-xs text-destructive mt-1">O ID deve conter apenas números</p>
            )}
          </div>

          <div>
            <Label htmlFor="budgetAmount">Orçamento</Label>
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">R$</span>
              <Input
                id="budgetAmount"
                placeholder="0,00"
                value={budgetAmount}
                onChange={(e) => handleBudgetChange(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!canSave || isLoading}
              className="bg-[#ff6e00] hover:bg-[#ff6e00]/90"
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
