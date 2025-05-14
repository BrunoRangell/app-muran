
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { CustomBudgetFormData } from "../tabs/CustomBudgetTabV2";
import { format, addDays } from "date-fns";
import { RefreshCw } from "lucide-react";

interface CustomBudgetFormProps {
  selectedBudget: any | null;
  isSubmitting: boolean;
  onSubmit: (formData: CustomBudgetFormData) => void;
  onCancel: () => void;
}

export function CustomBudgetFormV2({
  selectedBudget,
  isSubmitting,
  onSubmit,
  onCancel
}: CustomBudgetFormProps) {
  // Estados do formulário
  const [clientId, setClientId] = useState<string>(selectedBudget?.client_id || "");
  const [accountId, setAccountId] = useState<string>(selectedBudget?.account_id || "");
  const [platform, setPlatform] = useState<"meta" | "google">(selectedBudget?.platform || "meta");
  const [budgetAmount, setBudgetAmount] = useState<number>(selectedBudget?.budget_amount || 0);
  const [startDate, setStartDate] = useState<string>(
    selectedBudget?.start_date || format(new Date(), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState<string>(
    selectedBudget?.end_date || format(addDays(new Date(), 30), "yyyy-MM-dd")
  );
  const [description, setDescription] = useState<string>(selectedBudget?.description || "");

  // Consulta para buscar clientes
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ["clients-for-budget-form-v2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name, meta_account_id, google_account_id")
        .eq("status", "active")
        .order("company_name");

      if (error) {
        console.error("Erro ao buscar clientes:", error);
        throw error;
      }

      return data;
    }
  });

  // Consulta para buscar contas Meta do cliente selecionado
  const { data: metaAccounts, isLoading: isLoadingMetaAccounts } = useQuery({
    queryKey: ["meta-accounts-for-client-v2", clientId],
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from("client_meta_accounts")
        .select("account_id, account_name")
        .eq("client_id", clientId)
        .eq("status", "active");

      if (error) {
        console.error("Erro ao buscar contas Meta:", error);
        throw error;
      }

      return data;
    },
    enabled: !!clientId && platform === "meta"
  });

  // Consulta para buscar contas Google do cliente selecionado
  const { data: googleAccounts, isLoading: isLoadingGoogleAccounts } = useQuery({
    queryKey: ["google-accounts-for-client-v2", clientId],
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from("client_google_accounts")
        .select("account_id, account_name")
        .eq("client_id", clientId)
        .eq("status", "active");

      if (error) {
        console.error("Erro ao buscar contas Google:", error);
        throw error;
      }

      return data;
    },
    enabled: !!clientId && platform === "google"
  });

  // Atualizar os estados quando o orçamento selecionado muda
  useEffect(() => {
    if (selectedBudget) {
      setClientId(selectedBudget.client_id || "");
      setAccountId(selectedBudget.account_id || "");
      setPlatform(selectedBudget.platform || "meta");
      setBudgetAmount(selectedBudget.budget_amount || 0);
      setStartDate(selectedBudget.start_date || format(new Date(), "yyyy-MM-dd"));
      setEndDate(selectedBudget.end_date || format(addDays(new Date(), 30), "yyyy-MM-dd"));
      setDescription(selectedBudget.description || "");
    } else {
      // Valores padrão para novo orçamento
      setClientId("");
      setAccountId("");
      setPlatform("meta");
      setBudgetAmount(0);
      setStartDate(format(new Date(), "yyyy-MM-dd"));
      setEndDate(format(addDays(new Date(), 30), "yyyy-MM-dd"));
      setDescription("");
    }
  }, [selectedBudget]);

  // Ao mudar a plataforma, resetamos o ID da conta
  useEffect(() => {
    setAccountId("");
  }, [platform]);

  // Handler para envio do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulário
    if (!clientId) {
      alert("Por favor, selecione um cliente.");
      return;
    }

    if (budgetAmount <= 0) {
      alert("O valor do orçamento deve ser maior que zero.");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert("A data final deve ser posterior à data inicial.");
      return;
    }

    // Enviar dados
    onSubmit({
      clientId,
      accountId: accountId || undefined,
      platform,
      budgetAmount,
      startDate,
      endDate,
      description: description || undefined
    });
  };

  // Determinar quais contas estão disponíveis com base na plataforma
  const availableAccounts = platform === "meta" 
    ? metaAccounts || []
    : googleAccounts || [];

  const isLoadingAccounts = platform === "meta"
    ? isLoadingMetaAccounts
    : isLoadingGoogleAccounts;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="platform">Plataforma</Label>
            <Select
              value={platform}
              onValueChange={(value: "meta" | "google") => setPlatform(value)}
              disabled={!!selectedBudget}
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

          <div>
            <Label htmlFor="client">Cliente</Label>
            <Select
              value={clientId}
              onValueChange={setClientId}
              disabled={isSubmitting || isLoadingClients || !!selectedBudget}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="account">Conta específica (opcional)</Label>
            <Select
              value={accountId}
              onValueChange={setAccountId}
              disabled={isSubmitting || isLoadingAccounts || !clientId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as contas (padrão)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as contas (padrão)</SelectItem>
                {availableAccounts.map((account) => (
                  <SelectItem key={account.account_id} value={account.account_id}>
                    {account.account_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Se não selecionar uma conta específica, o orçamento será aplicado a todas as contas do cliente.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="budgetAmount">Valor do orçamento (R$)</Label>
            <Input
              id="budgetAmount"
              type="number"
              min="0"
              step="0.01"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(Number(e.target.value))}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Data de início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">Data de término</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Descreva o propósito deste orçamento personalizado"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !clientId}
          className="bg-[#ff6e00] hover:bg-[#e66200]"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              {selectedBudget ? "Atualizando..." : "Criando..."}
            </>
          ) : (
            selectedBudget ? "Atualizar orçamento" : "Criar orçamento"
          )}
        </Button>
      </div>
    </form>
  );
}
