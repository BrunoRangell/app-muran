
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, Search, DollarSign, Loader } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

export const BudgetSetupForm = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [budgets, setBudgets] = useState<Record<string, { meta: string }>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todos os clientes
  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients-budget-setup"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name, meta_ads_budget, status")
        .eq("status", "active")
        .order("company_name");

      if (error) throw error;
      return data;
    },
  });

  // Mutation para salvar orçamentos
  const saveBudgetsMutation = useMutation({
    mutationFn: async () => {
      // Convertemos os valores de string para number e criamos um array de objetos com o formato correto
      const updates = Object.entries(budgets).map(([clientId, values]) => ({
        id: clientId,
        meta_ads_budget: values.meta ? parseFloat(values.meta) : 0,
      }));

      console.log("Enviando atualizações:", updates);

      // Usamos upsert para atualizar vários registros de uma vez
      const { data, error } = await supabase
        .from("clients")
        .upsert(updates, { onConflict: 'id' });

      if (error) {
        console.error("Erro na atualização:", error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
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
      const initialBudgets: Record<string, { meta: string }> = {};
      clients.forEach((client) => {
        initialBudgets[client.id] = {
          meta: client.meta_ads_budget?.toString() || "",
        };
      });
      setBudgets(initialBudgets);
    }
  }, [clients]);

  const handleChange = (clientId: string, value: string) => {
    setBudgets((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        meta: value,
      },
    }));
  };

  const handleSave = () => {
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
                    <TableHead className="w-[350px]">Cliente</TableHead>
                    <TableHead>Orçamento Meta Ads</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients?.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.company_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`meta-${client.id}`} className="sr-only">
                            Orçamento Meta Ads
                          </Label>
                          <span className="text-gray-500">R$</span>
                          <Input
                            id={`meta-${client.id}`}
                            placeholder="0.00"
                            value={budgets[client.id]?.meta || ""}
                            onChange={(e) => handleChange(client.id, e.target.value)}
                            className="max-w-[150px]"
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
