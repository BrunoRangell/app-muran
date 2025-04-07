
import React, { useState } from 'react';
import { ReviewsDashboardCard } from '@/components/daily-reviews/dashboard/ReviewsDashboardCard';
import { GoogleAdsDashboardCard } from '@/components/daily-reviews/dashboard/GoogleAdsDashboardCard';

const DailyReviews: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);
  
  const handleViewClientDetails = (clientId: string) => {
    console.log("Visualizando detalhes do cliente:", clientId);
    // Implementar a navegação para a página de detalhes do cliente, se necessário
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-[#321e32]">
        Revisão Diária
      </h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <ReviewsDashboardCard onViewClientDetails={handleViewClientDetails} />
        <GoogleAdsDashboardCard 
          onViewClientDetails={handleViewClientDetails}
          searchQuery={searchQuery}
          viewMode={viewMode}
          showOnlyAdjustments={showOnlyAdjustments}
        />
      </div>
    </div>
  );
};

export default DailyReviews;
