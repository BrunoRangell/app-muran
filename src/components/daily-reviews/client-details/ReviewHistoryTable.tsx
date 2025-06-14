import { formatCurrency } from "@/utils/formatters";
import { AlertCircle, Calendar, Loader } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateInBrasiliaTz } from "@/utils/dateUtils";

interface ReviewHistoryTableProps {
  isLoading: boolean;
  reviewHistory: any[] | null;
}

export const ReviewHistoryTable = ({ isLoading, reviewHistory }: ReviewHistoryTableProps) => {
  console.log('Componente ReviewHistoryTable renderizado. isLoading:', isLoading, 'reviewHistory:', reviewHistory);

  if (isLoading) {
    console.log('Exibindo estado de carregamento');
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="text-muran-primary" size={18} />
            Histórico de Revisões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-md"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!reviewHistory || reviewHistory.length === 0) {
    console.log('Nenhum histórico de revisões encontrado');
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="text-muran-primary" size={18} />
            Histórico de Revisões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-gray-500">
            <AlertCircle className="h-12 w-12 text-gray-300 mb-2" />
            <p>Nenhuma revisão encontrada para este cliente</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  console.log('Renderizando tabela com histórico de revisões');
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="text-muran-primary" size={18} />
          Histórico de Revisões
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="pb-2">Data</th>
                <th className="pb-2">Orçamento Diário</th>
                <th className="pb-2">Total Gasto</th>
              </tr>
            </thead>
            <tbody>
              {reviewHistory.map((review) => {
                console.log('Antes do log da data da revisão para review.id:', review.id);
                console.log('Tipo de review.review_date:', typeof review.review_date);
                console.log('Data da revisão antes de formatar:', review.review_date);
                console.log('Depois do log da data da revisão para review.id:', review.id);

                return (
                  <tr key={review.id} className="border-b">
                    <td className="py-2">
                      {formatDateInBrasiliaTz(review.review_date, "dd/MM/yyyy HH:mm")}
                    </td>
                    <td className="py-2">
                      {formatCurrency(review.meta_daily_budget_current || 0)}
                    </td>
                    <td className="py-2">
                      {formatCurrency(review.meta_total_spent || 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
