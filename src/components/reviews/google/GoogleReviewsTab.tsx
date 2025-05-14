
import { useState } from 'react';
import { FilterBar } from '../common/FilterBar';
import { MetricsPanel } from '../common/MetricsPanel';
import { ClientCard } from '../common/ClientCard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useReviewsContext } from '@/contexts/ReviewsContext';
import { useGoogleReviewsData } from '@/hooks/useGoogleReviewsData';
import { useReviewOperations } from '@/hooks/useReviewOperations';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface GoogleReviewsTabProps {
  onRefreshCompleted?: () => void;
}

export function GoogleReviewsTab({ onRefreshCompleted }: GoogleReviewsTabProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { state } = useReviewsContext();
  const filters = state.filters.google;
  
  // Hooks para busca de dados e operações
  const { 
    data, 
    isLoading, 
    error, 
    metrics, 
    refresh 
  } = useGoogleReviewsData();
  
  const { 
    reviewClient, 
    reviewAllClients, 
    isProcessing, 
    lastError 
  } = useReviewOperations({
    platform: 'google',
    onComplete: () => {
      refresh();
      if (onRefreshCompleted) onRefreshCompleted();
    }
  });
  
  // Filtrar dados com base nos filtros atuais
  const filteredData = data
    ? data
        .filter(client => 
          client.company_name.toLowerCase().includes(filters.searchQuery.toLowerCase())
        )
        .filter(client => 
          !filters.showOnlyAdjustments || client.needsAdjustment
        )
    : [];
  
  // Atualizar dados
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      if (onRefreshCompleted) onRefreshCompleted();
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Iniciar revisão em lote para todos os clientes
  const handleBatchReview = () => {
    if (data && data.length > 0) {
      reviewAllClients(data);
    }
  };
  
  // Verificar erro (seja do carregamento de dados ou da última operação)
  const displayError = error || lastError;
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="space-y-6">
      {displayError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            {displayError instanceof Error 
              ? displayError.message 
              : 'Ocorreu um erro ao carregar os dados'}
          </AlertDescription>
        </Alert>
      )}
      
      <MetricsPanel 
        metrics={metrics} 
        onBatchReview={handleBatchReview}
        isProcessing={isProcessing}
      />
      
      <FilterBar 
        platform="google"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
      
      {filteredData.length === 0 ? (
        <EmptyState 
          title="Nenhum cliente encontrado" 
          description="Não há clientes que correspondam aos critérios de filtro ou não há dados disponíveis."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredData.map(client => (
            <ClientCard 
              key={client.id}
              client={client}
              platform="google"
              onReview={reviewClient}
              isProcessing={state.processingClients.includes(client.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
