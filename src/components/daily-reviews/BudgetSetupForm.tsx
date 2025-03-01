
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, Search, DollarSign, Loader, Database } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

export const BudgetSetupForm = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [budgets, setBudgets] = useState<Record<string, { meta: string; accountId: string }>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todos os clientes
  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients-budget-setup"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name, meta_ads_budget, meta_account_id, status")
        .eq("status", "active")
        .order("company_name");

      if (error) {
        console.error("Erro ao buscar clientes:", error);
        throw error;
      }
      console.log("Clientes carregados:", data);
      return data;
    },
  });

  // Mutation para salvar orçamentos
  const saveBudgetsMutation = useMutation({
    mutationFn: async () => {
      console.log("Iniciando salvamento de orçamentos...");
      
      // Filtrar apenas os clientes que possuem dados em budgets para atualizar
      const clientsToUpdate = Object.entries(budgets).filter(([clientId, values]) => {
        return clientId && (values.meta || values.accountId);
      });
      
      console.log("Clientes a serem atualizados:", clientsToUpdate);
      
      if (clientsToUpdate.length === 0) {
        console.log("Nenhum cliente para atualizar");
        return true;
      }

      // Preparar os dados para atualização
      const updates = clientsToUpdate.map(([clientId, values]) => {
        // Tratar o valor do orçamento corretamente
        const rawValue = values.meta ? values.meta.replace(/[^\d,.-]/g, '').replace(',', '.') : "0";
        const metaBudget = parseFloat(rawValue) || 0;
        
        console.log(`Preparando atualização para cliente ${clientId}:`, {
          metaBudget,
          accountId: values.accountId
        });
        
        // Retornar objeto formatado para update
        return {
          id: clientId,
          meta_ads_budget: metaBudget,
          meta_account_id: values.accountId || null
        };
      });

      console.log("Objetos preparados para atualização:", updates);

      // Realizar atualização em lote
      for (const update of updates) {
        const { data, error } = await supabase
          .from("clients")
          .update({
            meta_ads_budget: update.meta_ads_budget,
            meta_account_id: update.meta_account_id
          })
          .eq("id", update.id);

        if (error) {
          console.error(`Erro ao atualizar cliente ${update.id}:`, error);
          throw error;
        }
        
        console.log(`Cliente ${update.id} atualizado com sucesso`);
      }
      
      return true;
    },
    onSuccess: () => {
      console.log("Orçamentos salvos com sucesso!");
      toast({
        title: "Orçamentos salvos",
        description: "Os orçamentos mensais foram atualizados com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["clients-budget-setup"] });
    },
    onError: (error) => {
      console.error("Detalhes do erro:", error);
      toast({
        title: "Erro ao salvar orçamentos",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  // Inicializar orçamentos a partir dos dados obtidos
  useEffect(() => {
    if (clients) {
      console.log("Inicializando orçamentos a partir dos clientes carregados");
      const initialBudgets: Record<string, { meta: string; accountId: string }> = {};
      clients.forEach((client) => {
        initialBudgets[client.id] = {
          meta: client.meta_ads_budget ? client.meta_ads_budget.toString() : "",
          accountId: client.meta_account_id || ""
        };
      });
      setBudgets(initialBudgets);
    }
  }, [clients]);

  const handleBudgetChange = (clientId: string, value: string) => {
    // Certifique-se de que aceitamos apenas números e pontos
    const sanitizedValue = value.replace(/[^0-9,.]/g, "");
    
    setBudgets((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        meta: sanitizedValue,
      },
    }));
  };

  const handleAccountIdChange = (clientId: string, value: string) => {
    setBudgets((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        accountId: value,
      },
    }));
  };

  const handleSave = () => {
    console.log("Tentando salvar orçamentos:", budgets);
    saveBudgetsMutation.mutate();
  };

  const filteredClients = clients?.filter(
    (client) =>
      client.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="text-muran-primary" />
          Configurar Orçamentos Meta Ads
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader className="animate-spin mr-2" />
              <span>Carregando clientes...</span>
            </div>
          ) : filteredClients?.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              Nenhum cliente encontrado com o termo "{searchTerm}"
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Cliente</TableHead>
                    <TableHead className="w-[200px]">ID da Conta Meta</TableHead>
                    <TableHead>Orçamento Meta Ads Mensal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients?.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.company_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`account-${client.id}`} className="sr-only">
                            ID da Conta Meta
                          </Label>
                          <Input
                            id={`account-${client.id}`}
                            placeholder="ID da conta"
                            value={budgets[client.id]?.accountId || ""}
                            onChange={(e) => handleAccountIdChange(client.id, e.target.value)}
                            className="max-w-[150px]"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`meta-${client.id}`} className="sr-only">
                            Orçamento Meta Ads
                          </Label>
                          <span className="text-gray-500">R$</span>
                          <Input
                            id={`meta-${client.id}`}
                            placeholder="0,00"
                            value={budgets[client.id]?.meta || ""}
                            onChange={(e) => handleBudgetChange(client.id, e.target.value)}
                            className="max-w-[150px]"
                            type="text"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={saveBudgetsMutation.isPending || isLoading}
              className="bg-[#ff6e00] hover:bg-[#e06200]"
            >
              {saveBudgetsMutation.isPending ? (
                <>
                  <Loader className="animate-spin mr-2 h-4 w-4" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Orçamentos
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
