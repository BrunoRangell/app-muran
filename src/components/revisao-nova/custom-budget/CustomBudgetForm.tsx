
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { AlertDialogFooter } from "@/components/ui/alert-dialog";
import { CustomBudgetFormData } from "../hooks/useCustomBudgets";

export interface CustomBudgetFormProps {
  selectedBudget?: CustomBudgetFormData;
  isSubmitting: boolean;
  onSubmit: (data: CustomBudgetFormData) => void;
  onCancel: () => void;
  clients: { id: string; company_name: string }[];
}

export function CustomBudgetForm({
  selectedBudget,
  isSubmitting,
  onSubmit,
  onCancel,
  clients
}: CustomBudgetFormProps) {
  const [clientId, setClientId] = useState<string>(selectedBudget?.clientId || '');
  const [budgetAmount, setBudgetAmount] = useState<number>(selectedBudget?.budgetAmount || 0);
  const [startDate, setStartDate] = useState<string>(selectedBudget?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(selectedBudget?.endDate || '');
  const [platform, setPlatform] = useState<'meta' | 'google'>(selectedBudget?.platform || 'meta');
  const [description, setDescription] = useState<string>(selectedBudget?.description || '');
  const [accountId, setAccountId] = useState<string | undefined>(selectedBudget?.accountId || undefined);
  
  useEffect(() => {
    if (selectedBudget) {
      setClientId(selectedBudget.clientId);
      setBudgetAmount(selectedBudget.budgetAmount);
      setStartDate(selectedBudget.startDate);
      setEndDate(selectedBudget.endDate);
      setPlatform(selectedBudget.platform);
      setDescription(selectedBudget.description || '');
      setAccountId(selectedBudget.accountId || undefined);
    }
  }, [selectedBudget]);
  
  // Validar form antes de enviar
  const isFormValid = () => {
    return clientId && budgetAmount > 0 && startDate && endDate;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;
    
    onSubmit({
      clientId,
      budgetAmount,
      startDate,
      endDate,
      platform,
      description,
      accountId
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="client">Cliente</Label>
          <Select
            value={clientId}
            onValueChange={setClientId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.company_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid gap-3">
          <Label htmlFor="platform">Plataforma</Label>
          <Select
            value={platform}
            onValueChange={(value: string) => setPlatform(value as 'meta' | 'google')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a plataforma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="meta">Meta Ads</SelectItem>
              <SelectItem value="google">Google Ads</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid gap-3">
          <Label htmlFor="budget">Valor do Orçamento (R$)</Label>
          <Input
            id="budget"
            type="number"
            min="0"
            step="0.01"
            value={budgetAmount}
            onChange={(e) => setBudgetAmount(parseFloat(e.target.value))}
            required
          />
        </div>
        
        <div className="grid gap-3">
          <Label htmlFor="start_date">Data de Início</Label>
          <Input
            id="start_date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        
        <div className="grid gap-3">
          <Label htmlFor="end_date">Data de Término</Label>
          <Input
            id="end_date"
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
        
        <div className="grid gap-3">
          <Label htmlFor="description">Descrição (opcional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Campanha especial para Black Friday"
            rows={3}
          />
        </div>
        
        <div className="grid gap-3">
          <Label htmlFor="accountId">ID da Conta Específica (opcional)</Label>
          <Input
            id="accountId"
            type="text"
            value={accountId || ''}
            onChange={(e) => setAccountId(e.target.value || undefined)}
            placeholder="Deixe em branco para aplicar a todas as contas"
          />
          <p className="text-xs text-muted-foreground">
            Se preenchido, o orçamento será aplicado apenas a esta conta.
          </p>
        </div>
      </div>
      
      <AlertDialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={!isFormValid() || isSubmitting}
          className="bg-[#ff6e00] hover:bg-[#e66300] text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar'
          )}
        </Button>
      </AlertDialogFooter>
    </form>
  );
}
