
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Search, Save, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientBudget {
  id: string;
  company_name: string;
  meta_ads_budget: number;
  google_ads_budget: number;
  meta_account_id: string | null;
  google_account_id: string | null;
}

export function BudgetManagerTabV2() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [editedBudgets, setEditedBudgets] = useState<Record<string, { meta: number, google: number }>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Buscar clientes para gerenciamento de orçamento
  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients-budgets-v2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name, meta_ads_budget, google_ads_budget, meta_account_id, google_account_id")
        .eq("status", "active")
        .order("company_name");

      if (error) {
        console.error("Erro ao buscar clientes:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível buscar os clientes",
          variant: "destructive",
        });
        return [];
      }

      return data as ClientBudget[];
    },
  });

  // Filtrar clientes com base na pesquisa
  const filteredClients = clients?.filter(client =>
    client.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Mutation para atualizar orçamentos
  const updateBudgetMutation = useMutation({
    mutationFn: async ({ clientId, metaBudget, googleBudget }: {
      clientId: string;
      metaBudget?: number;
      googleBudget?: number;
    }) => {
      const updates: Record<string, unknown> = {};
      
      if (metaBudget !== undefined) {
        updates.meta_ads_budget = metaBudget;
      }
      
      if (googleBudget !== undefined) {
        updates.google_ads_budget = googleBudget;
      }
      
      const { error } = await supabase
        .from("clients")
        .update(updates)
        .eq("id", clientId);
        
      if (error) {
        throw new Error(`Erro ao atualizar orçamento: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients-budgets-v2"] });
    },
  });

  // Função para manipular mudanças nos valores de orçamento
  const handleBudgetChange = (clientId: string, platform: "meta" | "google", value: string) => {
    const numValue = parseFloat(value) || 0;
    
    setEditedBudgets(prev => ({
      ...prev,
      [clientId]: {
        ...prev[clientId] || { meta: 0, google: 0 },
        [platform]: numValue
      }
    }));
  };

  // Função para salvar os orçamentos editados
  const handleSaveAllBudgets = async () => {
    setIsSaving(true);
    
    try {
      // Processar cada cliente com orçamentos alterados
      for (const [clientId, budgets] of Object.entries(editedBudgets)) {
        const client = clients?.find(c => c.id === clientId);
        
        if (client) {
          // Verificar quais valores foram realmente alterados
          const metaChanged = budgets.meta !== client.meta_ads_budget;
          const googleChanged = budgets.google !== client.google_ads_budget;
          
          // Atualizar apenas se houver mudanças
          if (metaChanged || googleChanged) {
            await updateBudgetMutation.mutateAsync({
              clientId,
              metaBudget: metaChanged ? budgets.meta : undefined,
              googleBudget: googleChanged ? budgets.google : undefined
            });
          }
        }
      }
      
      // Limpar os orçamentos editados após salvar
      setEditedBudgets({});
      
      toast({
        title: "Orçamentos atualizados",
        description: "Os valores foram salvos com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao atualizar os orçamentos.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Função para verificar se há mudanças pendentes
  const hasPendingChanges = Object.keys(editedBudgets).length > 0;

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl text-muran-dark">
          Gerenciador de Orçamentos
        </CardTitle>
        <CardDescription className="mt-1">
          Configure os orçamentos mensais padrão para Meta Ads e Google Ads de cada cliente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Barra de busca e ações */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar clientes..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              className="bg-[#ff6e00] hover:bg-[#e66200]"
              disabled={!hasPendingChanges || isSaving}
              onClick={handleSaveAllBudgets}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar alterações
                </>
              )}
            </Button>
          </div>

          {/* Tabela de orçamentos */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Cliente</TableHead>
                  <TableHead className="text-right">Orçamento Meta Ads</TableHead>
                  <TableHead className="text-right">Orçamento Google Ads</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Estado de carregamento
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-[250px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[100px] ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[100px] ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-[60px]" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredClients.length === 0 ? (
                  // Estado vazio
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                      {searchTerm ? "Nenhum cliente encontrado." : "Nenhum cliente disponível."}
                    </TableCell>
                  </TableRow>
                ) : (
                  // Dados dos clientes
                  filteredClients.map((client) => {
                    const editedBudget = editedBudgets[client.id];
                    const metaBudgetChanged = editedBudget && client.meta_ads_budget !== editedBudget.meta;
                    const googleBudgetChanged = editedBudget && client.google_ads_budget !== editedBudget.google;
                    
                    return (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          {client.company_name}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className={`w-[150px] ml-auto text-right ${metaBudgetChanged ? "border-[#ff6e00]" : ""}`}
                            defaultValue={client.meta_ads_budget || 0}
                            onChange={(e) => handleBudgetChange(client.id, "meta", e.target.value)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className={`w-[150px] ml-auto text-right ${googleBudgetChanged ? "border-[#ff6e00]" : ""}`}
                            defaultValue={client.google_ads_budget || 0}
                            onChange={(e) => handleBudgetChange(client.id, "google", e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          {(metaBudgetChanged || googleBudgetChanged) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                setEditedBudgets(prev => {
                                  const { [client.id]: _, ...rest } = prev;
                                  return rest;
                                });
                              }}
                            >
                              ↺
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
