
import { Card } from "@/components/ui/card";
import { ClientsRanking } from "../rankings/ClientsRanking";
import { useClients } from "@/hooks/queries/useClients";
import { Trophy } from "lucide-react";

export const ClientsRankingTab = () => {
  const { clients } = useClients();

  return (
    <Card className="border border-gray-100 shadow-sm">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Trophy className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-muran-dark">Ranking de Clientes</h2>
            <p className="text-gray-600 text-sm">Top performers por diferentes métricas</p>
          </div>
        </div>
        
        <ClientsRanking clients={clients || []} />
      </div>
    </Card>
  );
};
