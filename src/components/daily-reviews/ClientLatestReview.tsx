
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/formatters";

interface ClientLatestReviewProps {
  clientId?: string;
}

export const ClientLatestReview = ({ clientId }: ClientLatestReviewProps) => {
  const [latestReview, setLatestReview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLatestReview = async () => {
      if (!clientId) return;
      
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from("budget_reviews")
          .select("*")
          .eq("client_id", clientId)
          .eq("platform", "meta")
          .order("review_date", { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (error && error.code !== 'PGRST116') throw error;
        setLatestReview(data);
      } catch (error) {
        console.error("Erro ao carregar última revisão:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLatestReview();
  }, [clientId]);

  if (isLoading) {
    return (
      <div className="text-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6e00] mx-auto"></div>
        <p className="mt-2 text-gray-500">Carregando última revisão...</p>
      </div>
    );
  }

  if (!latestReview) {
    return (
      <div className="text-center p-10">
        <p className="text-gray-500">Nenhuma revisão disponível</p>
      </div>
    );
  }

  const budgetType = latestReview.using_custom_budget ? "Personalizado" : "Padrão";
  const reviewDate = new Date(latestReview.review_date).toLocaleDateString('pt-BR');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Última Revisão ({reviewDate})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Orçamento Atual</p>
              <p className="text-xl font-semibold">{formatCurrency(latestReview.daily_budget_current)}</p>
              <p className="text-xs text-gray-500">Tipo: {budgetType}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Gasto Total</p>
              <p className="text-xl font-semibold">{formatCurrency(latestReview.total_spent)}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Data da Revisão</p>
              <p className="text-xl font-semibold">{reviewDate}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
