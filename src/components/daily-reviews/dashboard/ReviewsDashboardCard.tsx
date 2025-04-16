
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { MetaDashboardCard } from "./MetaDashboardCard";
import { useClientReviewAnalysis } from "../hooks/useClientReviewAnalysis";

interface ReviewsDashboardCardProps {
  onViewClientDetails: (clientId: string) => void;
}

export const ReviewsDashboardCard = ({ onViewClientDetails }: ReviewsDashboardCardProps) => {
  const { 
    reviewAllClients, 
    isAnalyzingAll 
  } = useClientReviewAnalysis();

  // Função para análise em lote
  const handleAnalyzeAll = async () => {
    await reviewAllClients();
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold text-[#321e32]">
          Meta Ads
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MetaDashboardCard 
          onViewClientDetails={onViewClientDetails}
          onAnalyzeAll={handleAnalyzeAll}
        />
      </CardContent>
    </Card>
  );
};
