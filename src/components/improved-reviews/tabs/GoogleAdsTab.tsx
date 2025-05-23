
import { useState } from "react";
import { ClientsList } from "../clients/ClientsList";
import { FilterBar } from "../filters/FilterBar";
import { MetricsPanel } from "../dashboard/MetricsPanel";
import { useGoogleAdsData } from "../hooks/useGoogleAdsData";
import { ImprovedLoadingState } from "../common/ImprovedLoadingState";
import { EmptyState } from "../common/EmptyState";
import { useBatchOperations } from "../hooks/useBatchOperations";
import { useTokenVerification } from "../hooks/useTokenVerification";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface GoogleAdsTabProps {
  onRefreshCompleted?: () => void;
}

export function GoogleAdsTab({ onRefreshCompleted }: GoogleAdsTabProps = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table" | "list">("cards");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);
  const { data, isLoading, error, metrics, refreshData } = useGoogleAdsData();
  const { reviewAllClients, isReviewingBatch } = useBatchOperations({
    platform: "google",
    onComplete: () => {
      console.log("Revisão em lote do Google Ads concluída. Atualizando dados...");
      refreshData();
      if (onRefreshCompleted) onRefreshCompleted();
    }
  });

  // Uso do hook de verificação de token
  const { verifyGoogleAdsToken, isVerifying, tokenStatus } = useTokenVerification();
  const { toast } = useToast();

  // Handle search query changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // Handle view mode changes
  const handleViewModeChange = (mode: "cards" | "table" | "list") => {
    setViewMode(mode);
  };

  // Handle filter changes
  const handleFilterChange = (showAdjustments: boolean) => {
    setShowOnlyAdjustments(showAdjustments);
  };

  // Handle refresh
  const handleRefresh = async () => {
    console.log("Atualizando dados do Google Ads...");
    await refreshData();
    if (onRefreshCompleted) onRefreshCompleted();
  };

  // Handle batch review
  const handleBatchReview = () => {
    console.log("Iniciando revisão em lote do Google Ads...");
    if (data && data.length > 0) {
      reviewAllClients(data);
    }
  };

  // Verificar token do Google Ads
  const handleVerifyToken = async () => {
    const isValid = await verifyGoogleAdsToken();
    if (isValid) {
      toast({
        title: "Token do Google Ads válido",
        description: "O token está funcionando corretamente.",
        variant: "default",
      });
      // Recarregar dados após confirmar que o token é válido
      refreshData();
    } else {
      toast({
        title: "Token do Google Ads inválido",
        description: tokenStatus.error || "Erro ao verificar o token.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <ImprovedLoadingState />;
  }

  if (error) {
    return (
      <EmptyState
        title="Erro ao carregar dados"
        description={`Ocorreu um erro ao carregar os dados: ${error.message}`}
        icon={<AlertTriangle className="h-16 w-16 text-red-500 mb-4" />}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Status do token */}
      {tokenStatus.isValid !== null && (
        <Alert variant={tokenStatus.isValid ? "default" : "destructive"}>
          {tokenStatus.isValid ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {tokenStatus.isValid ? "Token do Google Ads válido" : "Token do Google Ads inválido"}
          </AlertTitle>
          <AlertDescription>
            {tokenStatus.isValid
              ? "O token está funcionando corretamente."
              : tokenStatus.error || "Erro ao verificar o token."}
          </AlertDescription>
        </Alert>
      )}

      {/* Botão para verificar token */}
      <div className="flex justify-end">
        <Button 
          onClick={handleVerifyToken} 
          disabled={isVerifying}
          className="bg-[#321e32] hover:bg-[#4d2e4d] text-white"
        >
          {isVerifying ? "Verificando..." : "Verificar Token do Google Ads"}
        </Button>
      </div>

      <MetricsPanel 
        metrics={metrics} 
        onBatchReview={handleBatchReview}
        isProcessing={isReviewingBatch}
      />
      
      <FilterBar 
        searchQuery={searchQuery}
        viewMode={viewMode}
        showOnlyAdjustments={showOnlyAdjustments}
        onSearchChange={handleSearchChange}
        onViewModeChange={handleViewModeChange}
        onFilterChange={handleFilterChange}
        onRefresh={handleRefresh}
        isRefreshing={isLoading}
      />
      
      <ClientsList 
        data={data}
        viewMode={viewMode}
        searchQuery={searchQuery}
        showOnlyAdjustments={showOnlyAdjustments}
        platform="google"
      />
    </div>
  );
}
