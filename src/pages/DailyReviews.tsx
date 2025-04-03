
import React from 'react';
import { ReviewsDashboardCard } from '@/components/daily-reviews/dashboard/ReviewsDashboardCard';
import { GoogleAdsDashboardCard } from '@/components/daily-reviews/dashboard/GoogleAdsDashboardCard';

const DailyReviews: React.FC = () => {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-[#321e32]">
        Revisão Diária
      </h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <ReviewsDashboardCard onViewClientDetails={() => {}} />
        <GoogleAdsDashboardCard />
      </div>
    </div>
  );
};

export default DailyReviews;
