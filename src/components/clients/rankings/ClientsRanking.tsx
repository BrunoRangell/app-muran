
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Clock } from "lucide-react";
import { Client } from "../types";
import { formatCurrency } from "@/utils/formatters";
import { useState } from "react";
import { calculateRetention } from "../table/utils";

interface ClientsRankingProps {
  clients: Client[];
}

export const ClientsRanking = ({ clients }: ClientsRankingProps) => {
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'retention'>('revenue');

  // Filtra apenas clientes ativos
  const activeClients = clients.filter(client => client.status === 'active');

  // Calcula o ranking baseado na métrica selecionada
  const rankedClients = [...activeClients].sort((a, b) => {
    if (selectedMetric === 'revenue') {
      return b.contract_value - a.contract_value;
    }
    return calculateRetention(b) - calculateRetention(a);
  }).slice(0, 5); // Pega os top 5

  return (
    <Card className="p-6">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-muran-dark">Ranking de Clientes</h2>
          <div className="flex gap-2">
            <Button
              variant={selectedMetric === 'revenue' ? 'default' : 'outline'}
              onClick={() => setSelectedMetric('revenue')}
              className="gap-2"
            >
              <Trophy className="h-4 w-4" />
              Por Receita
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
                    {selectedMetric === 'revenue' 
                      ? formatCurrency(client.contract_value)
                      : `${calculateRetention(client)} meses`}
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
