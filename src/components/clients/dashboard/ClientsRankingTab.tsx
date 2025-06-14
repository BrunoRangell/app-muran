
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ClientsRanking } from "../rankings/ClientsRanking";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Crown, Medal } from "lucide-react";

export const ClientsRankingTab = () => {
  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients-ranking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("contract_value", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Trophy className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-muran-dark">
            Ranking de Clientes
          </h2>
          <p className="text-gray-600">
            Visualize os clientes ordenados por diferentes critérios
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              🥇 Maior Contrato
            </CardTitle>
            <Crown className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-amber-700">
              {clients?.[0]?.company_name || "Carregando..."}
            </div>
            <p className="text-xs text-amber-600">
              R$ {clients?.[0]?.contract_value?.toLocaleString() || "0"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              🥈 Segundo Lugar
            </CardTitle>
            <Medal className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-700">
              {clients?.[1]?.company_name || "Carregando..."}
            </div>
            <p className="text-xs text-gray-600">
              R$ {clients?.[1]?.contract_value?.toLocaleString() || "0"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              🥉 Terceiro Lugar
            </CardTitle>
            <Medal className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-orange-700">
              {clients?.[2]?.company_name || "Carregando..."}
            </div>
            <p className="text-xs text-orange-600">
              R$ {clients?.[2]?.contract_value?.toLocaleString() || "0"}
            </p>
          </CardContent>
        </Card>
      </div>

      <ClientsRanking clients={clients || []} />
    </div>
  );
};
