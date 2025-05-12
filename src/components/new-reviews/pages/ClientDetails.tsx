
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  RefreshCw, 
  Loader 
} from "lucide-react";
import { useClientDetails } from "../hooks/useClientDetails";
import { BudgetInfoGrid } from "../components/BudgetInfoGrid";
import { useBudgetCalculator } from "../hooks/useBudgetCalculator";

export default function ClientDetails() {
  const { clientId } = useParams<{ clientId: string }>();
  const [activeTab, setActiveTab] = useState("overview");
  
  const {
    client,
    latestReview,
    reviewHistory,
    isLoading,
    isLoadingHistory,
    error,
    refetchClient,
    reviewClient,
    isReviewing
  } = useClientDetails(clientId || "");
  
  const { calculate } = useBudgetCalculator();
  
  // Calcular informações de orçamento
  const budgetInfo = client && latestReview ? calculate({
    monthlyBudget: client.meta_ads_budget,
    totalSpent: latestReview.meta_total_spent,
    currentDailyBudget: latestReview.meta_daily_budget_current,
    lastFiveDaysAverage: latestReview.meta_last_five_days_spent,
    customBudgetAmount: latestReview.custom_budget_amount,
    customBudgetEndDate: latestReview.custom_budget_end_date,
    usingCustomBudget: latestReview.using_custom_budget
  }) : null;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6e00]"></div>
      </div>
    );
  }
  
  if (!client) {
    return (
      <div className="text-center p-10">
        <h2 className="text-xl font-semibold text-gray-700">Cliente não encontrado</h2>
        <p className="text-gray-500 mt-2">O cliente solicitado não existe ou foi removido.</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-4 space-y-6">
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link to="/revisao-diaria-nova">
              <ArrowLeft className="mr-2" size={16} />
              Voltar
            </Link>
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold">{client.company_name}</h1>
            <p className="text-sm text-gray-500">
              {latestReview 
                ? `Última revisão: ${new Date(latestReview.updated_at).toLocaleDateString('pt-BR')} às ${new Date(latestReview.updated_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`
                : "Nunca revisado"}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetchClient()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader className="animate-spin mr-2" size={14} />
            ) : (
              <RefreshCw className="mr-2" size={14} />
            )}
            Atualizar
          </Button>
          
          <Button
            size="sm"
            className="bg-[#ff6e00] hover:bg-[#e66300]"
            onClick={() => reviewClient()}
            disabled={isReviewing || !client.meta_account_id}
          >
            {isReviewing ? (
              <>
                <Loader className="animate-spin mr-2" size={14} />
                Analisando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2" size={14} />
                Analisar Agora
              </>
            )}
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        
        <CardContent>
          <TabsContent value="overview">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Informações da Conta</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">ID Meta Ads:</span>{" "}
                      <span className="font-mono">{client.meta_account_id || "Não configurado"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">ID Google Ads:</span>{" "}
                      <span className="font-mono">{client.google_account_id || "Não configurado"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>{" "}
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">{client.status}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Orçamentos</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Orçamento Meta Ads:</span>{" "}
                      <span className="font-medium">{client.meta_ads_budget ? formatCurrency(client.meta_ads_budget) : "Não definido"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Orçamento Google Ads:</span>{" "}
                      <span className="font-medium">{client.google_ads_budget ? formatCurrency(client.google_ads_budget) : "Não definido"}</span>
                    </div>
                    {latestReview?.using_custom_budget && (
                      <div>
                        <span className="text-[#ff6e00]">Orçamento Personalizado:</span>{" "}
                        <span className="font-medium text-[#ff6e00]">{latestReview.custom_budget_amount ? formatCurrency(latestReview.custom_budget_amount) : "N/A"}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {latestReview && budgetInfo && (
                <BudgetInfoGrid 
                  monthlyBudget={budgetInfo.monthlyBudget}
                  totalSpent={budgetInfo.totalSpent}
                  currentDailyBudget={budgetInfo.currentDailyBudget}
                  idealDailyBudget={budgetInfo.idealDailyBudget}
                  lastFiveDaysAverage={budgetInfo.lastFiveDaysAverage}
                  isCalculating={false}
                  calculationError={null}
                  hasReview={true}
                  usingCustomBudget={latestReview.using_custom_budget}
                  customBudgetAmount={latestReview.custom_budget_amount}
                  customBudgetEndDate={latestReview.custom_budget_end_date}
                />
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="history">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-16">
                <Loader className="animate-spin h-6 w-6 text-[#ff6e00]" />
              </div>
            ) : reviewHistory && reviewHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diário Atual</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gasto Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orçamento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reviewHistory.map((review) => (
                      <tr key={review.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(review.review_date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(review.meta_daily_budget_current || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(review.meta_total_spent || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {review.using_custom_budget && review.custom_budget_amount 
                            ? formatCurrency(review.custom_budget_amount) 
                            : formatCurrency(client.meta_ads_budget || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {review.using_custom_budget ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-[#ff6e00]/10 text-[#ff6e00]">
                              Personalizado
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                              Mensal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Nenhum histórico de revisão encontrado.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Configurações de Orçamento</h3>
                <p className="text-gray-500 text-sm">
                  Defina os orçamentos mensais para as campanhas de anúncios deste cliente.
                </p>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Orçamento Meta Ads (Mensal)</label>
                  <div className="flex gap-2">
                    <input 
                      type="number"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      defaultValue={client.meta_ads_budget || ""}
                      placeholder="Valor do orçamento"
                    />
                    <Button className="bg-[#ff6e00] hover:bg-[#e66300]">Salvar</Button>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4">
                  <label className="text-sm font-medium">Orçamento Google Ads (Mensal)</label>
                  <div className="flex gap-2">
                    <input 
                      type="number"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      defaultValue={client.google_ads_budget || ""}
                      placeholder="Valor do orçamento"
                    />
                    <Button className="bg-[#ff6e00] hover:bg-[#e66300]">Salvar</Button>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Orçamento Personalizado</h3>
                
                {latestReview?.using_custom_budget ? (
                  <div className="bg-[#ff6e00]/10 border border-[#ff6e00]/20 p-4 rounded-lg">
                    <h4 className="font-medium text-[#ff6e00] mb-2">Orçamento Personalizado Ativo</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Valor:</span>{" "}
                        <span className="font-medium">{formatCurrency(latestReview.custom_budget_amount || 0)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Período:</span>{" "}
                        <span className="font-medium">
                          {latestReview.custom_budget_start_date && latestReview.custom_budget_end_date ? (
                            `${new Date(latestReview.custom_budget_start_date).toLocaleDateString('pt-BR')} a ${new Date(latestReview.custom_budget_end_date).toLocaleDateString('pt-BR')}`
                          ) : "Não definido"}
                        </span>
                      </div>
                      <Button variant="outline" className="mt-2">Gerenciar Orçamento Personalizado</Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-500 text-sm mb-4">
                      Não há orçamento personalizado ativo para este cliente. 
                      Você pode criar um orçamento personalizado para substituir 
                      temporariamente o orçamento mensal padrão.
                    </p>
                    <Button variant="outline">Criar Orçamento Personalizado</Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Card>
    </div>
  );
}

// Função auxiliar para formatação de moeda
function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "R$ 0,00";
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
