
import { Card } from "@/components/ui/card";
import { Trophy, TrendingUp, Clock, BarChart3, AlertCircle, Medal, Crown } from "lucide-react";
import { Client } from "../types";
import { formatCurrency } from "@/utils/formatters";
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
    }).slice(0, 5); // Top 5
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
      borderColor: 'border-l-muran-primary',
      iconBg: 'bg-muran-primary/10',
      iconColor: 'text-muran-primary',
      headerBg: 'bg-muran-primary'
    },
    {
      metric: 'total_revenue' as RankingMetric,
      title: 'Receita Total',
      icon: Trophy,
      borderColor: 'border-l-muran-complementary',
      iconBg: 'bg-muran-complementary/10',
      iconColor: 'text-muran-complementary',
      headerBg: 'bg-muran-complementary'
    },
    {
      metric: 'retention' as RankingMetric,
      title: 'Retenção',
      icon: Clock,
      borderColor: 'border-l-muran-dark',
      iconBg: 'bg-muran-dark/10',
      iconColor: 'text-muran-dark',
      headerBg: 'bg-gradient-to-r from-muran-primary to-muran-complementary'
    }
  ];

  const getPositionIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 1:
        return <Medal className="h-4 w-4 text-gray-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-amber-600" />;
      default:
        return (
          <div className="flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
            {index + 1}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-r from-muran-primary to-muran-complementary">
          <Trophy className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-muran-dark">Rankings de Clientes</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {rankingConfigs.map((config) => {
          const rankedClients = getRankedClients(config.metric);
          const IconComponent = config.icon;
          
          return (
            <Card 
              key={config.metric} 
              className={`overflow-hidden hover:shadow-lg transition-all duration-300 ${config.borderColor} border-l-4`}
            >
              <div className={`${config.headerBg} p-4 text-white`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-lg">{config.title}</h3>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                {rankedClients.map((client, index) => (
                  <div 
                    key={client.id} 
                    className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-200 hover:shadow-sm ${
                      index === 0 ? 'bg-yellow-50 border border-yellow-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {getPositionIcon(index)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm truncate ${
                        index === 0 ? 'text-muran-dark' : 'text-gray-700'
                      }`}>
                        {client.company_name}
                      </p>
                      <p className={`text-xs ${
                        index === 0 ? 'text-yellow-700 font-medium' : 'text-gray-500'
                      }`}>
                        {getMetricValue(client, config.metric)}
                      </p>
                    </div>

                    <div className={`p-2 rounded-full ${config.iconBg}`}>
                      <IconComponent className={`h-4 w-4 ${config.iconColor}`} />
                    </div>
                  </div>
                ))}
                
                {rankedClients.length === 0 && (
                  <div className="text-center text-gray-500 text-sm py-8">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum dado disponível</p>
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
