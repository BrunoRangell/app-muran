
import { GoogleAdsDashboardCard } from "./GoogleAdsDashboardCard";
import { MetaDashboardCard } from "./MetaDashboardCard";
import { useState } from "react";

interface ReviewsDashboardProps {
  onViewClientDetails: (clientId: string) => void;
}

export const ReviewsDashboard = ({ onViewClientDetails }: ReviewsDashboardProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);

  // Adicionando função de análise em lote que pode ser sobrescrita pelo componente pai
  const handleAnalyzeAll = async () => {
    console.log("Análise em lote iniciada do componente ReviewsDashboard");
    // Esta função será sobrescrita pela implementação real no MetaDashboardCard
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="col-span-1">
        <MetaDashboardCard 
          onViewClientDetails={onViewClientDetails} 
          onAnalyzeAll={handleAnalyzeAll}
        />
      </div>
      <div className="col-span-1">
        <GoogleAdsDashboardCard 
          onViewClientDetails={onViewClientDetails}
          searchQuery={searchQuery}
          viewMode={viewMode}
          showOnlyAdjustments={showOnlyAdjustments}
        />
      </div>
    </div>
  );
};
