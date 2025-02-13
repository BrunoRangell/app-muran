
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Clock, BarChart3, AlertCircle } from "lucide-react";
import { Client } from "../types";
import { formatCurrency } from "@/utils/formatters";
import { useState } from "react";
import { calculateRetention } from "../table/utils";
import { useToast } from "@/hooks/use-toast";

interface ClientsRankingProps {
  clients: Client[];
}

type RankingMetric = 'monthly_revenue' | 'total_revenue' | 'retention';

export const ClientsRanking = ({ clients }: ClientsRankingProps) => {
  const [selectedMetric, setSelectedMetric] = useState<RankingMetric>('monthly_revenue');
  const { toast } = useToast();

  // Filtra apenas clientes ativos
  const activeClients = clients.filter(client => client.status === 'active');

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

  // Calcula o ranking baseado na métrica selecionada
  const rankedClients = [...activeClients].sort((a, b) => {
    try {
      switch (selectedMetric) {
        case 'monthly_revenue':
          return b.contract_value - a.contract_value;
        case 'total_revenue':
          const totalA = a.contract_value * calculateRetention(a);
          const totalB = b.contract_value * calculateRetention(b);
          if (isNaN(totalA) || isNaN(totalB)) {
            throw new Error("Erro no cálculo da receita total");
          }
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
      toast({
        variant: "destructive",
        title: "Erro no cálculo",
        description: "Ocorreu um erro ao calcular o ranking. Alguns dados podem estar incorretos.",
      });
      return 0;
    }
  }).slice(0, 5); // Pega os top 5

  const getMetricValue = (client: Client) => {
    try {
      switch (selectedMetric) {
        case 'monthly_revenue':
          return formatCurrency(client.contract_value);
        case 'total_revenue':
          const total = client.contract_value * calculateRetention(client);
          if (isNaN(total)) throw new Error("Valor total inválido");
          return formatCurrency(total);
        case 'retention':
          const retention = calculateRetention(client);
          if (isNaN(retention)) throw new Error("Valor de retenção inválido");
          return `${retention} meses`;
        default:
          return '';
      }
    } catch (error) {
      console.error("Erro ao formatar valor métrica:", error);
      return "Erro no cálculo";
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h2 className="text-xl font-bold text-muran-dark">Ranking de Clientes</h2>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedMetric === 'monthly_revenue' ? 'default' : 'outline'}
              onClick={() => setSelectedMetric('monthly_revenue')}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Por Receita Mensal
            </Button>
            <Button
              variant={selectedMetric === 'total_revenue' ? 'default' : 'outline'}
              onClick={() => setSelectedMetric('total_revenue')}
              className="gap-2"
            >
              <Trophy className="h-4 w-4" />
              Por Receita Total
            </Button>
            <Button
              variant={selectedMetric === 'retention' ? 'default' : 'outline'}
              onClick={() => setSelectedMetric('retention')}
              className="gap-2"
            >
              <Clock className="h-4 w-4" />
              Por Retenção
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {rankedClients.map((client, index) => (
            <div
              key={client.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muran-primary text-white font-bold">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-muran-dark">{client.company_name}</h3>
                  <p className="text-sm text-gray-500">
                    {getMetricValue(client)}
                  </p>
                </div>
              </div>
              <TrendingUp className={`h-5 w-5 ${index === 0 ? 'text-yellow-500' : 'text-gray-400'}`} />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
