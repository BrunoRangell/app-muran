
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader, AlertTriangle, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

type Client = {
  id: string;
  company_name: string;
  meta_ads_budget: number;
  meta_account_id: string | null;
};

type ClientsListProps = {
  onAnalyzeClient: (clientId: string) => void;
  onConfigureBudget: (clientId: string) => void;
  analyzingClientId: string | null;
};

export const ClientsList = ({ onAnalyzeClient, onConfigureBudget, analyzingClientId }: ClientsListProps) => {
  // Buscar clientes ativos
  const { data: clients, isLoading: isLoadingClients, error } = useQuery({
    queryKey: ["clients-active"],
    queryFn: async () => {
      const { data: clients, error } = await supabase
        .from("clients")
        .select("*")
        .eq("status", "active")
        .order("company_name");

      if (error) throw error;
      return clients as Client[];
    },
  });

  if (isLoadingClients) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array(6)
          .fill(0)
          .map((_, index) => (
            <Card key={index} className="h-[160px] animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
              </CardContent>
              <CardFooter>
                <div className="h-9 bg-gray-200 rounded w-full"></div>
              </CardFooter>
            </Card>
          ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <CardHeader>
          <CardTitle className="flex justify-center items-center text-red-500">
            <AlertTriangle className="mr-2" />
            Erro ao carregar clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Não foi possível carregar a lista de clientes. Tente novamente mais tarde.</p>
          <p className="text-sm text-gray-500 mt-2">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!clients?.length) {
    return (
      <div className="col-span-3 text-center p-8">
        <p className="text-gray-500">Nenhum cliente encontrado</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {clients.map((client) => (
        <Card key={client.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{client.company_name}</CardTitle>
            <CardDescription>
              {client.meta_ads_budget > 0 && client.meta_account_id
                ? "Orçamento configurado"
                : "Orçamento não configurado"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            {client.meta_ads_budget > 0 && (
              <p className="text-sm">
                Meta Ads: {formatCurrency(client.meta_ads_budget)}
              </p>
            )}
            {client.meta_account_id && (
              <p className="text-sm text-gray-500">
                ID da Conta: {client.meta_account_id}
              </p>
            )}
            {!client.meta_account_id && (
              <p className="text-sm text-amber-500 flex items-center gap-1">
                <AlertCircle size={16} />
                Conta Meta Ads não configurada
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => 
                (client.meta_ads_budget > 0 && client.meta_account_id) 
                  ? onAnalyzeClient(client.id)
                  : onConfigureBudget(client.id)
              }
              className="w-full"
              variant={(client.meta_ads_budget > 0 && client.meta_account_id) ? "default" : "outline"}
              disabled={analyzingClientId === client.id}
            >
              {analyzingClientId === client.id ? (
                <>
                  <Loader className="animate-spin mr-2" size={16} />
                  Analisando...
                </>
              ) : (
                <>
                  {(client.meta_ads_budget > 0 && client.meta_account_id)
                    ? "Analisar orçamentos"
                    : "Configurar orçamentos"}
                  <ArrowRight className="ml-2" size={16} />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
