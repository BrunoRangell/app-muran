
import { Button } from "@/components/ui/button";
import { RefreshCw, BarChart, Calendar, Clock } from "lucide-react";
import { ClientReviewCard } from "./ClientReviewCard";
import { useBatchReview } from "../hooks/useBatchReview";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { formatDateInBrasiliaTz, getRemainingDaysInMonth } from "../summary/utils";
import { ptBR } from "date-fns/locale";

interface ReviewsDashboardProps {
  onViewClientDetails: (clientId: string) => void;
}

export const ReviewsDashboard = ({ onViewClientDetails }: ReviewsDashboardProps) => {
  const {
    clientsWithReviews,
    isLoading,
    processingClients,
    reviewInProgress,
    lastReviewTime,
    reviewSingleClient,
    reviewAllClients,
    isBatchAnalyzing
  } = useBatchReview();

  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar clientes com base no termo de pesquisa
  const filteredClients = clientsWithReviews?.filter(client => 
    client.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Obter data e hora atual formatada
  const currentDateTime = formatDateInBrasiliaTz(
    new Date(),
    "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
    { locale: ptBR }
  );
  
  // Obter dias restantes no mês
  const remainingDays = getRemainingDaysInMonth();

  // Formatar data e hora da última revisão
  const getFormattedLastReviewTime = () => {
    if (!lastReviewTime) return "Nenhuma revisão realizada";
    
    // Usar formatDateInBrasiliaTz para garantir o fuso horário correto
    return formatDateInBrasiliaTz(
      lastReviewTime, 
      "'Última revisão em' dd 'de' MMMM 'às' HH:mm", 
      { locale: ptBR }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BarChart className="text-muran-primary" size={20} />
            Dashboard de Revisão Diária
          </h2>
          <p className="text-sm text-gray-500 mb-1">
            {getFormattedLastReviewTime()}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={reviewAllClients}
            disabled={reviewInProgress || isBatchAnalyzing}
            className="whitespace-nowrap"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${reviewInProgress || isBatchAnalyzing ? 'animate-spin' : ''}`} />
            {reviewInProgress || isBatchAnalyzing 
              ? "Analisando..." 
              : "Fazer revisão diária"}
          </Button>
        </div>
      </div>

      <div className="bg-muran-secondary rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-2 text-muran-dark">
          <Calendar size={18} className="text-muran-primary" />
          <span className="font-medium">{currentDateTime}</span>
        </div>
        <div className="flex items-center gap-2 text-muran-dark">
          <Clock size={18} className="text-muran-primary" />
          <span className="font-medium">{remainingDays} {remainingDays === 1 ? 'dia restante' : 'dias restantes'} no mês</span>
        </div>
      </div>

      <div className="w-full max-w-sm mb-4">
        <Input
          placeholder="Buscar cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div 
              key={i} 
              className="h-[200px] bg-gray-100 animate-pulse rounded-lg"
            />
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">Nenhum cliente encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <ClientReviewCard
              key={client.id}
              client={client}
              onViewDetails={onViewClientDetails}
              onReviewClient={reviewSingleClient}
              isProcessing={processingClients.includes(client.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
