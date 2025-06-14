
import { NewHealthTable } from "@/components/campaign-health/NewHealthTable";
import { NewHealthFilters } from "@/components/campaign-health/NewHealthFilters";

export default function CampaignHealth() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Saúde de Campanhas</h1>
        <p className="text-sm text-muted-foreground">
          Monitoramento em tempo real de todas as campanhas ativas dos clientes. 
          Dados atualizados com base apenas em campanhas com status ativo.
        </p>
      </div>
      
      <NewHealthFilters />
      <NewHealthTable />
    </div>
  );
}
