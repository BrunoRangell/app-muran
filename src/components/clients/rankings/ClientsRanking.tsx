
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Clock, BarChart3, AlertCircle } from "lucide-react";
import { Client } from "../types";
import { formatCurrency } from "@/utils/formatters";
import { useState, useMemo } from "react";
import { calculateRetention } from "../table/utils";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ClientsRankingProps {
  clients: Client[];
}

type RankingMetric = 'monthly_revenue' | 'total_revenue' | 'retention';

export const ClientsRanking = ({ clients }: ClientsRankingProps) => {
  const { toast } = useToast();

  // Filtra apenas clientes ativos
  const activeClients = clients.filter(client => client.status === 'active');
  const activeIds = activeClients.map(c => c.id);

  // Totais de receita real por cliente a partir de payments
  const { data: totalsByClient = {}, isLoading: loadingTotals } = useQuery({
    queryKey: ['payments_totals_by_client', activeIds],
    queryFn: async () => {
      if (!activeIds.length) return {} as Record<string, number>;
      const { data, error } = await supabase
        .from('payments')
        .select('client_id, amount')
        .in('client_id', activeIds);
      if (error) throw error;
      const totals: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        const n = Number(row.amount) || 0;
        totals[row.client_id] = (totals[row.client_id] || 0) + n;
      });
      return totals;
    },
    enabled: activeIds.length > 0,
  });

  if (!Array.isArray(clients)) {
    console.error("Erro: clients não é um array válido", clients);
    toast({
      variant: "destructive",
      title: "Erro ao carregar ranking",
      description: "Não foi possível carregar os dados dos clientes. Tente novamente mais tarde.",
    });
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center p-4 text-red-500 gap-2">
          <AlertCircle className="h-5 w-5" />
          <p>Erro ao carregar dados</p>
        </div>
      </Card>
    );
  }

  if (activeClients.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center p-4 text-gray-500 gap-2">
          <TrendingUp className="h-8 w-8 mb-2" />
          <p>Nenhum cliente ativo encontrado</p>
          <p className="text-sm">Adicione clientes ativos para ver o ranking</p>
        </div>
      </Card>
    );
  }

  // Calcula rankings para cada métrica
  const getRankedClients = (metric: RankingMetric) => {
    return [...activeClients].sort((a, b) => {
      try {
        switch (metric) {
          case 'monthly_revenue':
            return b.contract_value - a.contract_value;
          case 'total_revenue':
            const totalA = (totalsByClient as Record<string, number>)[a.id] ?? 0;
            const totalB = (totalsByClient as Record<string, number>)[b.id] ?? 0;
            return totalB - totalA;
          case 'retention':
            const retentionA = calculateRetention(a);
            const retentionB = calculateRetention(b);
            if (isNaN(retentionA) || isNaN(retentionB)) {
              throw new Error("Erro no cálculo da retenção");
            }
            return retentionB - retentionA;
          default:
            return 0;
        }
      } catch (error) {
        console.error("Erro ao calcular ranking:", error);
        return 0;
      }
    }).slice(0, 3); // Top 3 para economizar espaço
  };

  const getMetricValue = (client: Client, metric: RankingMetric) => {
    try {
      switch (metric) {
        case 'monthly_revenue':
          return formatCurrency(client.contract_value);
        case 'total_revenue':
          const total = (totalsByClient as Record<string, number>)[client.id] ?? 0;
          return formatCurrency(total);
        case 'retention':
          const retention = calculateRetention(client);
          if (isNaN(retention)) throw new Error("Valor de retenção inválido");
          return `${retention}m`;
        default:
          return '';
      }
    } catch (error) {
      console.error("Erro ao formatar valor métrica:", error);
      return "Erro";
    }
  };

  const rankingConfigs = [
    {
      metric: 'monthly_revenue' as RankingMetric,
      title: 'Receita Mensal',
      icon: BarChart3,
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      metric: 'total_revenue' as RankingMetric,
      title: 'Receita Total',
      icon: Trophy,
      gradient: 'from-green-500 to-green-600'
    },
    {
      metric: 'retention' as RankingMetric,
      title: 'Retenção',
      icon: Clock,
      gradient: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-muran-dark">Rankings de Clientes</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {rankingConfigs.map((config) => {
          const rankedClients = getRankedClients(config.metric);
          const IconComponent = config.icon;
          
          return (
            <Card key={config.metric} className="overflow-hidden">
              <div className={`bg-gradient-to-r ${config.gradient} p-4 text-white`}>
                <div className="flex items-center gap-2">
                  <IconComponent className="h-5 w-5" />
                  <h3 className="font-semibold">{config.title}</h3>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                {rankedClients.map((client, index) => (
                  <div key={client.id} className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-muran-dark truncate">
                        {client.company_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getMetricValue(client, config.metric)}
                      </p>
                    </div>
                  </div>
                ))}
                
                {rankedClients.length === 0 && (
                  <div className="text-center text-gray-500 text-sm py-4">
                    Nenhum dado disponível
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
