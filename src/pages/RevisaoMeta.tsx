
import { useState } from "react";
import { MetaDashboardCard } from "@/components/daily-reviews/dashboard/MetaDashboardCard";

export default function RevisaoMeta() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const handleViewClientDetails = (clientId: string) => {
    setSelectedClientId(clientId);
  };

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
