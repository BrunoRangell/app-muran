
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

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="col-span-1">
        <MetaDashboardCard onViewClientDetails={onViewClientDetails} />
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
