
import React, { useState, useEffect } from 'react';
import { ReviewsDashboardCard } from '@/components/daily-reviews/dashboard/ReviewsDashboardCard';
import { GoogleAdsDashboardCard } from '@/components/daily-reviews/dashboard/GoogleAdsDashboardCard';
import { useNavigate } from 'react-router-dom';

const DailyReviews: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);
  const navigate = useNavigate();
  
  const handleViewClientDetails = (clientId: string) => {
    console.log("Visualizando detalhes do cliente:", clientId);
    navigate(`/client/${clientId}/reviews`);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleViewModeChange = (mode: string) => {
    setViewMode(mode);
  };

  const handleAdjustmentsChange = (showAdjustments: boolean) => {
    setShowOnlyAdjustments(showAdjustments);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-[#321e32]">
        Revisão Diária
      </h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <ReviewsDashboardCard 
          onViewClientDetails={handleViewClientDetails}
          onSearchChange={handleSearchChange}
          onViewModeChange={handleViewModeChange}
          onAdjustmentsChange={handleAdjustmentsChange}
        />
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
