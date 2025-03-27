
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader, RefreshCw, ChevronDown, ChevronUp, Alert } from "lucide-react";
import { useGoogleAdsService } from "./hooks/useGoogleAdsService";
import { formatCurrency } from "@/utils/formatters";
import { supabase } from "@/lib/supabase";
import { getRemainingDaysInMonth } from "@/components/daily-reviews/summary/utils";

interface GoogleClient {
  id: string;
  company_name: string;
  google_account_id: string;
  google_ads_budget: number;
}

export const GoogleAdsDashboard = () => {
  const [clients, setClients] = useState<GoogleClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<GoogleClient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const { toast } = useToast();
  const { fetchMonthlySpend, isLoading: isApiLoading, error: apiError, spendInfo } = useGoogleAdsService();

  // Buscar clientes com ID de conta Google Ads configurado
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, company_name, google_account_id, google_ads_budget')
          .eq('status', 'active')
          .order('company_name');

        if (error) throw error;

        const clientsWithGoogleAds = data.filter(client => client.google_account_id);
        setClients(clientsWithGoogleAds);
      } catch (err: any) {
        console.error('Erro ao buscar clientes:', err);
        setError(`Erro ao buscar clientes: ${err.message}`);
        toast({
          title: "Erro ao carregar clientes",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, [toast]);

  const handleClientSelect = (client: GoogleClient) => {
    setSelectedClient(client);
    setAnalysisResult(null);
  };

  const analyzeClient = async () => {
    if (!selectedClient) return;
    
    setIsAnalyzing(true);
    setError(null);

    try {
      // Buscar gastos mensais do Google Ads
      const spend = await fetchMonthlySpend(selectedClient.google_account_id);
      
      // Calcular orçamento diário ideal
      const monthlyBudget = selectedClient.google_ads_budget || 0;
      const totalSpent = spend.totalSpent || 0;
      const remainingBudget = Math.max(monthlyBudget - totalSpent, 0);
      const remainingDays = getRemainingDaysInMonth();
      const idealDailyBudget = remainingDays > 0 ? remainingBudget / remainingDays : 0;
      const dailyAverage = spend.lastFiveDaysAvg || 0;
      
      // Verificar se é preciso ajustar o orçamento diário
      const result = {
        monthlyBudget,
        totalSpent,
        remainingBudget,
        remainingDays,
        idealDailyBudget,
        currentDailyAverage: dailyAverage,
        needsAdjustment: Math.abs(idealDailyBudget - dailyAverage) > 5,
        adjustmentAmount: idealDailyBudget - dailyAverage,
      };
      
      setAnalysisResult(result);
      
      // Salvar esta revisão no banco de dados
      const today = new Date().toISOString().split('T')[0];
      
      const { data: existingReview, error: checkError } = await supabase
        .from('client_current_reviews')
        .select('id')
        .eq('client_id', selectedClient.id)
        .eq('review_date', today)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      if (existingReview) {
        // Atualizar revisão existente
        const { error: updateError } = await supabase
          .from('client_current_reviews')
          .update({
            google_daily_budget_current: dailyAverage,
            google_total_spent: totalSpent,
            google_account_id: selectedClient.google_account_id,
            google_account_name: `Google Ads: ${selectedClient.google_account_id}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingReview.id);
          
        if (updateError) throw updateError;
      } else {
        // Criar nova revisão
        const { error: insertError } = await supabase
          .from('client_current_reviews')
          .insert({
            client_id: selectedClient.id,
            review_date: today,
            google_daily_budget_current: dailyAverage,
            google_total_spent: totalSpent,
            google_account_id: selectedClient.google_account_id,
            google_account_name: `Google Ads: ${selectedClient.google_account_id}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          
        if (insertError) throw insertError;
      }
      
      toast({
        title: "Análise concluída",
        description: `Análise de orçamento Google Ads para ${selectedClient.company_name} concluída com sucesso.`,
      });
    } catch (err: any) {
      console.error('Erro na análise:', err);
      setError(`Erro ao analisar cliente: ${err.message}`);
      toast({
        title: "Erro na análise",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const resetAnalysis = () => {
    setAnalysisResult(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Análise de Orçamento Google Ads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-2/3">
              <label className="text-sm font-medium mb-2 block">
                Selecione um cliente com Google Ads configurado:
              </label>
              <div className="relative">
                <select 
                  className="w-full p-2 border rounded-md"
                  onChange={(e) => {
                    const selected = clients.find(c => c.id === e.target.value);
                    if (selected) handleClientSelect(selected);
                  }}
                  value={selectedClient?.id || ""}
                  disabled={isLoading}
                >
                  <option value="">Selecione um cliente...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.company_name} {client.google_account_id ? `(ID: ${client.google_account_id})` : ''}
                    </option>
                  ))}
                </select>
                {isLoading && (
                  <Loader className="animate-spin absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>
            
            <div className="w-full md:w-1/3 flex items-end">
              <Button 
                onClick={analysisResult ? resetAnalysis : analyzeClient} 
                disabled={!selectedClient || isApiLoading || isAnalyzing}
                className="w-full bg-[#ff6e00] hover:bg-[#cc5800] text-white"
              >
                {isAnalyzing ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Analisando...
                  </>
                ) : analysisResult ? (
                  "Nova Análise"
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Analisar Orçamento
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
              <div className="flex items-center">
                <Alert className="h-5 w-5 mr-2" />
                <span className="font-medium">Erro:</span>
              </div>
              <p className="mt-1">{error}</p>
            </div>
          )}

          {selectedClient && analysisResult && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold">
                Resultado da Análise para {selectedClient.company_name}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">Orçamento Mensal</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(analysisResult.monthlyBudget)}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">Total Gasto</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(analysisResult.totalSpent)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {((analysisResult.totalSpent / analysisResult.monthlyBudget) * 100).toFixed(1)}% do orçamento
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">Média Diária Atual</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(analysisResult.currentDailyAverage)}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">Orçamento Diário Ideal</div>
                    <div className={`text-2xl font-bold ${analysisResult.needsAdjustment ? 'text-amber-600' : 'text-green-600'}`}>
                      {formatCurrency(analysisResult.idealDailyBudget)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-white border rounded-lg p-6 mt-4">
                <h4 className="font-semibold mb-2">Recomendação:</h4>
                
                {analysisResult.needsAdjustment ? (
                  <div className="space-y-3">
                    <div className="flex items-center text-lg">
                      {analysisResult.adjustmentAmount > 0 ? (
                        <>
                          <ChevronUp className="text-green-500 mr-2" />
                          <span className="font-medium">Aumentar orçamento diário em {formatCurrency(Math.abs(analysisResult.adjustmentAmount))}</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="text-red-500 mr-2" />
                          <span className="font-medium">Reduzir orçamento diário em {formatCurrency(Math.abs(analysisResult.adjustmentAmount))}</span>
                        </>
                      )}
                    </div>
                    <p className="text-gray-600">
                      Com base no gasto atual e no orçamento mensal de {formatCurrency(analysisResult.monthlyBudget)}, 
                      o orçamento diário ideal para os {analysisResult.remainingDays} dias restantes no mês 
                      é de {formatCurrency(analysisResult.idealDailyBudget)}.
                    </p>
                    <div className="text-sm text-gray-500 mt-2">
                      <div>Orçamento restante: {formatCurrency(analysisResult.remainingBudget)}</div>
                      <div>Dias restantes: {analysisResult.remainingDays}</div>
                      <div className="mt-1">Cálculo: {formatCurrency(analysisResult.remainingBudget)} ÷ {analysisResult.remainingDays} = {formatCurrency(analysisResult.idealDailyBudget)}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">
                    O orçamento diário atual está adequado para o restante do mês. Não é necessário fazer ajustes.
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
