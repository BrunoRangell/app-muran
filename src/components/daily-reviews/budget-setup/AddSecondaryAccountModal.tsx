
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
};

export const AddSecondaryAccountModal = ({
  isOpen,
  onClose,
  onSave,
  clientName,
  isLoading = false
}: AddSecondaryAccountModalProps) => {
  const [platform, setPlatform] = useState<'meta' | 'google'>('meta');
  const [accountName, setAccountName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');

  const handleSave = () => {
    if (!accountName.trim() || !accountId.trim() || !budgetAmount) {
      return;
    }

    onSave({
      platform,
      accountName: accountName.trim(),
      accountId: accountId.trim(),
      budgetAmount: parseBrazilianCurrency(budgetAmount)
    });

    // Reset form
    setAccountName('');
    setAccountId('');
    setBudgetAmount('');
    setPlatform('meta');
  };

  const handleBudgetChange = (value: string) => {
    const formatted = formatCurrencyInput(value);
    setBudgetAmount(formatted);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Conta Secundária</DialogTitle>
          <p className="text-sm text-gray-600">
            Cliente: <span className="font-medium">{clientName}</span>
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
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

          <div>
            <Label htmlFor="accountName">Nome da Conta</Label>
            <Input
              id="accountName"
              placeholder="Ex: Campanha Sazonal"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="accountId">ID da Conta</Label>
            <Input
              id="accountId"
              placeholder="ID da conta da plataforma"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="budgetAmount">Orçamento</Label>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">R$</span>
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
              disabled={!accountName.trim() || !accountId.trim() || !budgetAmount || isLoading}
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
