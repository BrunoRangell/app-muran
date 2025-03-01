
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon, Save, Loader } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, parseCurrencyToNumber } from "@/utils/formatters";

type Client = {
  id: string;
  company_name: string;
  meta_ads_budget: number;
  google_ads_budget: number;
};

export const BudgetSetupForm = () => {
  const [search, setSearch] = useState("");
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [budgetValues, setBudgetValues] = useState<Record<string, { meta: string; google: string }>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Buscar clientes
  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients-for-budget-setup"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name, meta_ads_budget, google_ads_budget")
        .eq("status", "active")
        .order("company_name");

      if (error) throw error;
      return data as Client[];
    },
  });

  // Mutation para atualizar orçamentos
  const updateMutation = useMutation({
    mutationFn: async ({ 
      clientId, 
      metaBudget, 
      googleBudget 
    }: { 
      clientId: string; 
      metaBudget: number; 
      googleBudget: number 
    }) => {
      const { error } = await supabase
        .from("clients")
        .update({
          meta_ads_budget: metaBudget,
          google_ads_budget: googleBudget,
        })
        .eq("id", clientId);

      if (error) throw error;
      return { clientId, metaBudget, googleBudget };
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Orçamentos atualizados",
        description: "Os valores de orçamento foram salvos com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["clients-for-budget-setup"] });
      queryClient.invalidateQueries({ queryKey: ["clients-active"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  // Inicializar valores de orçamento
  useEffect(() => {
    if (clients) {
      const values: Record<string, { meta: string; google: string }> = {};
      clients.forEach((client) => {
        values[client.id] = {
          meta: client.meta_ads_budget ? formatCurrency(client.meta_ads_budget) : "",
          google: client.google_ads_budget ? formatCurrency(client.google_ads_budget) : "",
        };
      });
      setBudgetValues(values);
    }
  }, [clients]);

  // Filtrar clientes com base na busca
  useEffect(() => {
    if (clients) {
      const filtered = clients.filter((client) =>
        client.company_name.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredClients(filtered);
    }
  }, [search, clients]);

  const handleInputChange = (clientId: string, platform: "meta" | "google", value: string) => {
    // Formatação do valor para moeda
    let formattedValue = value;
    
    // Remover caracteres não numéricos, exceto vírgula e ponto
    const numericValue = value.replace(/[^\d.,]/g, "");
    
    if (numericValue) {
      // Converter para número e formatar
      try {
        const number = parseCurrencyToNumber(numericValue);
        formattedValue = formatCurrency(number);
      } catch (e) {
        formattedValue = value;
      }
    } else {
      formattedValue = "";
    }

    setBudgetValues((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        [platform]: formattedValue,
      },
    }));
  };

  const handleSave = (clientId: string) => {
    const values = budgetValues[clientId];
    const metaBudget = parseCurrencyToNumber(values.meta);
    const googleBudget = parseCurrencyToNumber(values.google);

    updateMutation.mutate({ clientId, metaBudget, googleBudget });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-10 bg-gray-200 rounded w-full"></div>
        {Array(5)
          .fill(0)
          .map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-10 bg-gray-100 rounded"></div>
                  <div className="h-10 bg-gray-100 rounded"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded w-1/4 mt-4 ml-auto"></div>
              </CardContent>
            </Card>
          ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          className="pl-10"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">Nenhum cliente encontrado</p>
          </CardContent>
        </Card>
      ) : (
        filteredClients.map((client) => (
          <Card key={client.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{client.company_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <CardDescription>Orçamento mensal Meta Ads</CardDescription>
                  <Input
                    placeholder="R$ 0,00"
                    value={budgetValues[client.id]?.meta || ""}
                    onChange={(e) => handleInputChange(client.id, "meta", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <CardDescription>Orçamento mensal Google Ads</CardDescription>
                  <Input
                    placeholder="R$ 0,00"
                    value={budgetValues[client.id]?.google || ""}
                    onChange={(e) => handleInputChange(client.id, "google", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  onClick={() => handleSave(client.id)}
                  disabled={updateMutation.isPending && updateMutation.variables?.clientId === client.id}
                >
                  {updateMutation.isPending && updateMutation.variables?.clientId === client.id ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
