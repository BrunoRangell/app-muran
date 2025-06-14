
import { HealthTable } from "@/components/campaign-health/HealthTable";
import { HealthFilters } from "@/components/campaign-health/HealthFilters";

export default function CampaignHealth() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Saúde de Campanhas</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Visão centralizada dos principais clientes, gastos de hoje e campanhas que precisam de atenção.
      </p>
      <HealthFilters />
      <HealthTable />
    </div>
  );
}
