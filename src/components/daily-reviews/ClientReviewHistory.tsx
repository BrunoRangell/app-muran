
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/formatters";

interface ClientReviewHistoryProps {
  clientId?: string;
}

export const ClientReviewHistory = ({ clientId }: ClientReviewHistoryProps) => {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!clientId) return;
      
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from("budget_reviews")
          .select("*")
          .eq("client_id", clientId)
          .eq("platform", "meta")
          .order("review_date", { ascending: false })
          .limit(30);
          
        if (error) throw error;
        setHistory(data || []);
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHistory();
  }, [clientId]);

  if (isLoading) {
    return (
      <div className="text-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6e00] mx-auto"></div>
        <p className="mt-2 text-gray-500">Carregando histórico...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center p-10">
        <p className="text-gray-500">Nenhum histórico de revisão disponível</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Histórico de Revisões</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-4 text-left">Data</th>
                <th className="py-2 px-4 text-left">Orçamento Atual</th>
                <th className="py-2 px-4 text-left">Gasto Total</th>
                <th className="py-2 px-4 text-left">Tipo de Orçamento</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">
                    {new Date(item.review_date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-2 px-4">
                    {formatCurrency(item.daily_budget_current)}
                  </td>
                  <td className="py-2 px-4">
                    {formatCurrency(item.total_spent)}
                  </td>
                  <td className="py-2 px-4">
                    {item.using_custom_budget ? 
                      <span className="text-blue-600 font-medium">Personalizado</span> : 
                      <span>Padrão</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
