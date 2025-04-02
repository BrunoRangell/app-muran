
import { useState } from "react";
import { ReviewsDashboardCard } from "./ReviewsDashboardCard";
import { NextReviewCountdown } from "./components/NextReviewCountdown";
import { CronScheduleMonitor } from "./components/CronScheduleMonitor";
import { MetaDashboardCard } from "./MetaDashboardCard";
import { GoogleAdsDashboardCard } from "./GoogleAdsDashboardCard";

interface ReviewsDashboardProps {
  onViewClientDetails: (clientId: string) => void;
}

export function ReviewsDashboard({ onViewClientDetails }: ReviewsDashboardProps) {
  // Estado para os filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <ReviewsDashboardCard onViewClientDetails={onViewClientDetails} />
        </div>
        <div className="md:col-span-1">
          <NextReviewCountdown />
        </div>
      </div>
      
      {/* Adicionando o monitor de agendamento para fins de diagnóstico */}
      <CronScheduleMonitor />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetaDashboardCard onViewClientDetails={onViewClientDetails} />
        <GoogleAdsDashboardCard 
          onViewClientDetails={onViewClientDetails} 
          searchQuery={searchQuery}
          viewMode={viewMode}
          showOnlyAdjustments={showOnlyAdjustments}
        />
      </div>
    </div>
  );
}
