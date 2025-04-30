
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MetaDashboardCard } from "@/components/daily-reviews/dashboard/MetaDashboardCard";

export default function RevisaoMeta() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountId');

  const handleViewClientDetails = (clientId: string) => {
    setSelectedClientId(clientId);
    console.log(`Visualizando detalhes do cliente: ${clientId}${accountId ? `, conta: ${accountId}` : ''}`);
  };

  console.log("Renderizando página RevisaoMeta", accountId ? `com accountId: ${accountId}` : 'sem accountId');

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-[#321e32]">
        Revisão de Orçamentos Meta Ads
      </h1>

      <div className="grid grid-cols-1 gap-6">
        <MetaDashboardCard onViewClientDetails={handleViewClientDetails} />
      </div>
    </div>
  );
}
