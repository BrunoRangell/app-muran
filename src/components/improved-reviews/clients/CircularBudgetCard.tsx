import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  BadgeDollarSign,
  Calendar,
  CheckCircle,
  ChevronRight,
  Loader,
  Loader2,
  EyeOff,
  ExternalLink,
  Activity,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { formatDateBr } from "@/utils/dateFormatter";
import { useBatchOperations } from "../hooks/useBatchOperations";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { IgnoreWarningDialog } from "@/components/daily-reviews/dashboard/components/IgnoreWarningDialog";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useCampaignVeiculationStatus } from "../hooks/useCampaignVeiculationStatus";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info } from "lucide-react";
import { useRecentlyReviewed } from "../context/RecentlyReviewedContext";
import { AddSecondaryAccountModal } from "@/components/daily-reviews/budget-setup/AddSecondaryAccountModal";
import { useMutation } from "@tanstack/react-query";

interface CircularBudgetCardProps {
  client: any;
  platform?: "meta" | "google";
  budgetCalculationMode?: "weighted" | "current";
  considerTaxes?: boolean;
  onIndividualReviewComplete?: () => void;
}
export function CircularBudgetCard({
  client,
  platform = "meta",
  budgetCalculationMode = "weighted",
  considerTaxes = false,
  onIndividualReviewComplete,
}: CircularBudgetCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [localWarningIgnored, setLocalWarningIgnored] = useState(false);
  const { markAsReviewed } = useRecentlyReviewed();

  useEffect(() => {
    console.log("CircularBudgetCard mounted/updated:", {
      last_funding_detected_at: client.last_funding_detected_at,
      last_funding_amount: client.last_funding_amount,
    });
  }, [client.last_funding_detected_at, client.last_funding_amount]);

  const { reviewClient, processingIds } = useBatchOperations({
    platform: platform as "meta" | "google",
    onIndividualComplete: () => {
      console.log(`🔄 Revisão individual ${platform} concluída - callback do card`);
      if (onIndividualReviewComplete) {
        onIndividualReviewComplete();
      }
    },
  });
  const isProcessing = processingIds.includes(client.id);

  // Preparar dados para exibição - CORRIGIDO: usar nomes de campos unificados
  const companyName = client.company_name;
  const spentAmount = client.review?.total_spent || 0;
  const budgetAmount = client.budget_amount || 0;
  const originalBudgetAmount = client.original_budget_amount || budgetAmount;
  
  // Cálculo de tributos Meta Ads (12,15%)
  const TAX_RATE = 0.1215;
  const effectiveBudget = considerTaxes ? budgetAmount * (1 - TAX_RATE) : budgetAmount;
  const taxAmount = budgetAmount * TAX_RATE;
  const spentPercentage = effectiveBudget > 0 ? (spentAmount / effectiveBudget) * 100 : 0;

  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> CORREÇÃO AQUI (única mudança funcional)
  const originalIdealDailyBudget = client.budgetCalculation?.idealDailyBudget || 0;
  const currentDailyBudget = client.review?.daily_budget_current || 0;
  const remainingDays = client.budgetCalculation?.remainingDays || 0;
  
  // Recalcular diário ideal quando tributos estão ativos
  const idealDailyBudget = considerTaxes
    ? Math.max(effectiveBudget - spentAmount, 0) / Math.max(remainingDays, 1)
    : originalIdealDailyBudget;
  
  // Para Google Ads no modo "weighted", comparar com média ponderada
  const weightedAverage = client.weightedAverage || 0;
  const comparisonValue = (platform === "google" && budgetCalculationMode === "weighted" && weightedAverage > 0)
    ? weightedAverage
    : currentDailyBudget;

  const budgetDifference = idealDailyBudget - comparisonValue;
  // define se precisa ajustar (threshold de R$ 5 ou mais)
  const needsAdjustment = Math.abs(budgetDifference) >= 5;
  // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< FIM DA CORREÇÃO

  // remainingDays já declarado acima
  const isUsingCustomBudget = client.isUsingCustomBudget || false;
  const customBudget = client.customBudget;

  // OTIMIZADO: Obter informações da conta diretamente dos dados do cliente
  const getAccountInfo = () => {
    if (platform === "meta") {
      // Para Meta Ads, usar o account_name da tabela client_accounts
      const accountName = client.meta_account_name || "Conta Principal";
      const accountId = client.meta_account_id || "N/A";
      return {
        name: accountName,
        id: accountId,
      };
    } else {
      // Para Google Ads, manter comportamento existente
      const accountName = client.google_account_name || "Conta Principal";
      const accountId = client.google_account_id || "N/A";
      return {
        name: accountName,
        id: accountId,
      };
    }
  };

  // Verificar se o aviso foi ignorado hoje (obtido do banco de dados OU estado local)
  const warningIgnoredToday = localWarningIgnored || client.budgetCalculation?.warningIgnoredToday || false;

  // weightedAverage já declarado acima (linha 90)

  // Determinar cor e status - APENAS 2 estados principais + ignorado
  const getStatusInfo = () => {
    if (warningIgnoredToday) {
      return {
        borderColor: "border-gray-200",
        textColor: "text-gray-500",
        barColor: "bg-gray-400",
        status: "Ajuste ocultado hoje",
        statusColor: "text-gray-500",
      };
    }
    if (needsAdjustment) {
      return {
        borderColor: "border-amber-200",
        textColor: "text-amber-600",
        barColor: "bg-amber-500",
        status: budgetDifference > 0 
          ? `+${formatCurrency(Math.abs(budgetDifference))}` 
          : `-${formatCurrency(Math.abs(budgetDifference))}`,
        statusColor: "text-amber-600",
      };
    } else {
      return {
        borderColor: "border-emerald-200",
        textColor: "text-emerald-600",
        barColor: "bg-emerald-500",
        status: "Sem ação necessária",
        statusColor: "text-emerald-600",
      };
    }
  };
  const statusInfo = getStatusInfo();
  const accountInfo = getAccountInfo();

  // Buscar informações de veiculação das campanhas
  // Para Meta Ads: usar hook que busca do banco
  // Para Google Ads: usar dados já calculados pelo useGoogleAdsData
  const metaVeiculationAccountId =
    platform === "meta"
      ? client.review?.account_id || client.meta_account_uuid
      : null;

  const { data: metaVeiculationInfo } = useCampaignVeiculationStatus(
    client.id, 
    metaVeiculationAccountId || "", 
    platform
  );

  // Para Google Ads, usar os dados já calculados no hook useGoogleAdsData
  const veiculationInfo = platform === "meta" ? metaVeiculationInfo : client.veiculationStatus;

  // Determinar tipo de orçamento
  const getBudgetType = () => {
    if (isUsingCustomBudget) return "Orçamento personalizado";
    if (remainingDays <= 7) return "Orçamento final";
    if (spentPercentage > 80) return "Orçamento crítico";
    return "Orçamento total";
  };
  const handleReviewClick = async () => {
    console.log(`🔍 Iniciando revisão individual para cliente ${client.company_name} (${platform})`);
    const accountId = platform === "meta" ? client.meta_account_id : client.google_account_id;
    
    // Marcar como recém-revisado ANTES da revisão para manter posição durante atualização
    markAsReviewed(client.id);
    
    const result = await reviewClient(client.id, accountId);
    
    if (result?.success) {
      console.log(`✅ Revisão do cliente ${client.company_name} concluída com sucesso`);
    } else {
      console.warn(`⚠️ Revisão do cliente ${client.company_name} não confirmada: ${result?.reason}`);
    }
  };
  const handleWarningIgnored = async () => {
    console.log(`✅ Processando aviso ignorado para cliente ${client.company_name}`);
    try {
      const today = new Date().toISOString().split("T")[0];
      if (platform === "google") {
        // Atualizar na tabela budget_reviews para Google Ads
        const { error } = await supabase
          .from("budget_reviews")
          .update({
            warning_ignored_today: true,
            warning_ignored_date: today,
          })
          .eq("client_id", client.id)
          .eq("platform", "google")
          .eq("review_date", today);
        if (error) {
          console.error("Erro ao atualizar aviso ignorado no Google Ads:", error);
          throw error;
        }
      } else {
        // Para Meta Ads, atualizar na tabela budget_reviews usando account_id correto
        const { error } = await supabase
          .from("budget_reviews")
          .update({
            warning_ignored_today: true,
            warning_ignored_date: today,
          })
          .eq("client_id", client.id)
          .eq("platform", "meta")
          .eq("review_date", today);

        if (error) {
          console.error("Erro ao atualizar aviso ignorado no Meta Ads:", error);
          throw error;
        }
      }

      // CORREÇÃO PRINCIPAL: Invalidar cache do React Query para atualização imediata
      console.log(`🔄 Invalidando cache do React Query para ${platform}...`);
      if (platform === "meta") {
        await queryClient.invalidateQueries({
          queryKey: ["improved-meta-reviews"],
        });
      } else {
        await queryClient.invalidateQueries({
          queryKey: ["google-ads-clients-data"],
        });
      }

      // Atualizar estado local imediatamente para refletir mudança
      setLocalWarningIgnored(true);

      // Toast de confirmação removido - conforme solicitação do usuário
      // toast({
      //   title: "Aviso ignorado",
      //   description: `O aviso de ajuste para ${companyName} foi ocultado por hoje.`
      // });
      console.log(`✅ Cache invalidado e interface atualizada para ${platform}`);

      // Chamar callback se fornecido para atualizar a interface
      if (onIndividualReviewComplete) {
        onIndividualReviewComplete();
      }
    } catch (error: any) {
      console.error(`❌ Erro ao ignorar aviso para cliente ${client.company_name}:`, error);
      toast({
        title: "Erro ao ignorar aviso",
        description: error.message || "Ocorreu um erro ao ignorar o aviso",
        variant: "destructive",
      });
    }
  };

  // Estado do modal de cadastro
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  
  const registerAccountMutation = useMutation({
    mutationFn: async (data: { platform: 'meta' | 'google'; accountName: string; accountId: string; budgetAmount: number }) => {
      const { error } = await supabase
        .from("client_accounts")
        .insert({
          client_id: client.id,
          platform: data.platform,
          account_name: data.accountName,
          account_id: data.accountId,
          budget_amount: data.budgetAmount,
          is_primary: true,
          status: 'active'
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Conta cadastrada", description: "A conta foi cadastrada com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["improved-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["clients-with-accounts-setup"] });
      setShowRegisterModal(false);
    },
    onError: (error) => {
      toast({ title: "Erro ao cadastrar conta", description: String(error), variant: "destructive" });
    },
  });

  // Card simplificado para clientes sem conta cadastrada
  if (!client.hasAccount) {
    return (
      <>
        <Card className="w-full bg-gray-50 border-gray-200 border-2">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center py-8">
            <h3 className="font-semibold text-gray-900 text-sm mb-1">{companyName}</h3>
            <Badge variant="outline" className={platform === "meta" ? "bg-blue-100 text-blue-800 border-blue-200 text-[10px] px-1.5 py-0" : "bg-amber-100 text-amber-800 border-amber-200 text-[10px] px-1.5 py-0"}>
              {platform === "meta" ? "Meta" : "Google"}
            </Badge>
            <p className="text-xs text-gray-400 mt-3">Nenhuma conta cadastrada</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setShowRegisterModal(true)}
            >
              Cadastrar conta
            </Button>
          </CardContent>
        </Card>
        <AddSecondaryAccountModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onSave={(data) => registerAccountMutation.mutate(data)}
          clientName={companyName}
          isLoading={registerAccountMutation.isPending}
          title="Cadastrar Conta"
          fixedPlatform={platform}
          hideAccountName
        />
      </>
    );
  }

  return (
    <>
      <Card className={`w-full bg-white ${statusInfo.borderColor} border-2 transition-all hover:shadow-md`}>
        <CardContent className="p-3">
          {/* Header com nome e ícones */}
           <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{companyName}</h3>
                <Badge variant="outline" className={platform === "meta" ? "bg-blue-100 text-blue-800 border-blue-200 text-[10px] px-1.5 py-0" : "bg-amber-100 text-amber-800 border-amber-200 text-[10px] px-1.5 py-0"}>
                  {platform === "meta" ? "Meta" : "Google"}
                </Badge>
              </div>
              <p className="text-gray-500 text-xs truncate">{accountInfo.name}</p>
            </div>

            <div className="flex items-center gap-2 ml-3">
              {isUsingCustomBudget && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <BadgeDollarSign className="h-4 w-4 text-[#ff6e00]" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="p-2">
                        <p className="font-medium">Orçamento Personalizado</p>
                        {customBudget && (
                          <p className="text-sm">
                            {formatDateBr(customBudget.start_date)} a {formatDateBr(customBudget.end_date)}
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {needsAdjustment && !warningIgnoredToday && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ajuste de orçamento recomendado</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {/* Botão "Ignorar aviso" no header */}
              {needsAdjustment && !warningIgnoredToday && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsDialogOpen(true)}
                        className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      >
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ignorar aviso de ajuste por hoje</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {/* Ícone para abrir conta Meta Ads (apenas para Meta) */}
              {platform === "meta" && accountInfo.id !== "N/A" && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const metaUrl = `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${accountInfo.id}`;
                          window.open(metaUrl, "_blank");
                        }}
                        className="h-8 w-8 p-0 text-gray-500 hover:text-[#ff6e00] hover:bg-orange-50"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Abrir conta no Meta Ads Manager</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>

          {/* Seção de Saldo Meta Ads (apenas para Meta) */}
          {platform === "meta" && client.balance_info && (
            <div className="mb-2 p-2 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-1.5">
                <BadgeDollarSign className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-xs font-medium text-blue-800">Saldo da Conta</span>
                <a
                  href={`https://business.facebook.com/billing_hub/accounts/details?asset_id=${accountInfo.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-600 hover:text-blue-800 underline ml-auto"
                >
                  Ver saldo
                </a>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${
                    client.balance_info.billing_model === "pre"
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-blue-100 text-blue-800 border-blue-200"
                  }`}
                >
                  {client.balance_info.billing_model === "pre" ? "Pré-paga" : "Pós-paga"}
                </Badge>
              </div>

              {/* Conta com SALDO NUMÉRICO (pré-paga ou pós-paga com saldo manual) */}
              {client.balance_info.balance_type === "numeric" && client.balance_info.balance_value !== null ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-blue-900">
                      {formatCurrency(client.balance_info.balance_value)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      {client.balance_info.billing_model === "pre" &&
                        (() => {
                          const balance = client.balance_info.balance_value || 0;
                          const dailyBudget = client.meta_daily_budget || 0;
                          if (balance <= 0) return <span className="text-[10px] text-red-600">Saldo esgotado</span>;
                          if (dailyBudget <= 0) return null;
                          const daysUntilEmpty = balance / dailyBudget;
                          if (daysUntilEmpty > 365) return <span className="text-[10px] text-gray-500">&gt;1 ano</span>;
                          return <span className="text-[10px] text-gray-500">~{Math.floor(daysUntilEmpty)}d</span>;
                        })()}
                      {client.balance_info.balance_percent && (
                        <span className="text-xs text-blue-700">
                          {Math.round(client.balance_info.balance_percent * 100)}%
                        </span>
                      )}
                    </span>
                  </div>

                  {client.balance_info.balance_percent && (
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          client.balance_info.balance_percent < 0.25
                            ? "bg-red-500"
                            : client.balance_info.balance_percent < 0.5
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, client.balance_info.balance_percent * 100))}%` }}
                      />
                    </div>
                  )}
                </div>
              ) : client.balance_info.balance_type === "credit_card" ? (
                <div className="text-blue-800">
                  <span className="text-sm">💳 Cartão de crédito</span>
                </div>
              ) : (
                <div className="text-gray-600">
                  <span className="text-sm">Saldo não encontrado</span>
                </div>
              )}
            </div>
          )}

          {/* Seção de Status de Veiculação (apenas para Meta Ads) */}
          {platform === "meta" && veiculationInfo && veiculationInfo.status !== "no_data" && (
            <div className="mb-2">
              <Popover>
                <PopoverTrigger asChild>
                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors group">
                    <div className="flex items-center gap-2">
                      <Activity className="h-3.5 w-3.5 text-gray-600" />
                      <span className="text-xs font-medium text-gray-800">Campanhas</span>
                      <Info className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <Badge variant="outline" className={`text-[10px] font-medium ml-auto ${veiculationInfo.badgeColor}`}>
                        {veiculationInfo.message}
                      </Badge>
                      {veiculationInfo.activeCampaigns > 0 && (
                        <span className="text-[10px] text-gray-600">
                          {veiculationInfo.activeCampaigns} ativa{veiculationInfo.activeCampaigns > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Detalhes das Campanhas</h4>
                    {veiculationInfo.campaignsDetailed && veiculationInfo.campaignsDetailed.length > 0 ? (
                      <div className="space-y-2">
                        {veiculationInfo.campaignsDetailed.map((campaign, index) => (
                          <div key={index} className="p-2 bg-muted/30 rounded text-xs space-y-1">
                            <div className="font-medium">{campaign.name}</div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>
                                Custo: R${" "}
                                {campaign.cost?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "0,00"}
                              </span>
                              <span>{campaign.impressions?.toLocaleString("pt-BR") || "0"} impr.</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhuma campanha encontrada.</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Seção de Status de Veiculação (apenas para Google Ads) */}
          {platform === "google" && veiculationInfo && veiculationInfo.status !== "no_data" && (
            <div className="mb-2">
              <Popover>
                <PopoverTrigger asChild>
                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors group">
                    <div className="flex items-center gap-2">
                      <Activity className="h-3.5 w-3.5 text-gray-600" />
                      <span className="text-xs font-medium text-gray-800">Campanhas</span>
                      <Info className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <Badge variant="outline" className={`text-[10px] font-medium ml-auto ${veiculationInfo.badgeColor}`}>
                        {veiculationInfo.message}
                      </Badge>
                      {veiculationInfo.activeCampaigns > 0 && (
                        <span className="text-[10px] text-gray-600">
                          {veiculationInfo.activeCampaigns} ativa{veiculationInfo.activeCampaigns > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Detalhes das Campanhas</h4>
                    {veiculationInfo.campaignsDetailed && veiculationInfo.campaignsDetailed.length > 0 ? (
                      <div className="space-y-2">
                        {veiculationInfo.campaignsDetailed.map((campaign, index) => (
                          <div key={index} className="p-2 bg-muted/30 rounded text-xs space-y-1">
                            <div className="font-medium">{campaign.name}</div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>
                                Custo: R${" "}
                                {campaign.cost?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "0,00"}
                              </span>
                              <span>{campaign.impressions?.toLocaleString("pt-BR") || "0"} impr.</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhuma campanha encontrada.</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Layout principal: barra de progresso + infos */}
          <div className="flex flex-col mb-3">
            {/* Barra de progresso horizontal */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${statusInfo.barColor}`} 
                  style={{ width: `${Math.min(spentPercentage, 100)}%`, transition: "width 0.5s ease-in-out" }} 
                />
              </div>
              <span className={`text-sm font-bold ${statusInfo.textColor} whitespace-nowrap`}>
                {Math.round(spentPercentage)}%
              </span>
            </div>

            {/* Grid 2 colunas com infos */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full">
              <div>
                <p className="text-xs text-gray-500 mb-1">Orçamento</p>
                <p className="text-base font-bold text-gray-900 whitespace-nowrap">{formatCurrency(effectiveBudget)}</p>
                {considerTaxes && (
                  <div className="text-[10px] text-gray-400 leading-tight mt-0.5">
                    <span>Original: {formatCurrency(budgetAmount)}</span>
                    <span className="mx-1">|</span>
                    <span>Tributo: {formatCurrency(taxAmount)}</span>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Gasto atual <span className="text-gray-400">(até ontem)</span></p>
                <p className="text-sm font-semibold text-gray-700">{formatCurrency(spentAmount)}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Dias restantes</p>
                <p className="text-sm font-semibold text-gray-700">{remainingDays} dias</p>
              </div>

              {/* Métrica baseada no modo selecionado para Google Ads */}
              {platform === "google" && (
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="cursor-pointer group">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          {budgetCalculationMode === "weighted" ? "Média Pond" : "Orç. atual"}
                          <Info className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </p>
                        <p className="text-sm font-semibold text-gray-700">
                          {formatCurrency(budgetCalculationMode === "weighted" ? weightedAverage : currentDailyBudget)}
                        </p>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Composição do orçamento diário</h4>
                        {client.review?.campaign_budgets && client.review.campaign_budgets.length > 0 ? (
                          <div className="space-y-1.5 max-h-60 overflow-y-auto">
                            {client.review.campaign_budgets.map((item: any, index: number) => (
                              <div key={index} className="flex items-center justify-between text-xs p-1.5 bg-muted/30 rounded">
                                <span className="font-medium truncate flex-1 min-w-0">{item.name}</span>
                                <span className="font-medium ml-2 whitespace-nowrap">{formatCurrency(item.budget)}</span>
                              </div>
                            ))}
                            <div className="border-t pt-2 flex justify-between text-xs font-semibold">
                              <span>Total</span>
                              <span>{formatCurrency(client.review?.daily_budget_current || 0)}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Detalhamento não disponível. Analise o cliente para ver a composição.
                          </p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Diário ideal Google */}
              {platform === "google" &&
              idealDailyBudget !== (budgetCalculationMode === "weighted" ? weightedAverage : currentDailyBudget) ? (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Diário ideal</p>
                  <p className="text-sm font-semibold text-gray-700">{formatCurrency(idealDailyBudget)}</p>
                </div>
              ) : null}

              {platform === "meta" && (
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="cursor-pointer group">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          Diário atual
                          <Info className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </p>
                        <p className="text-sm font-semibold text-gray-700">
                          {formatCurrency(client.review?.daily_budget_current || 0)}
                        </p>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Composição do orçamento diário</h4>
                        {client.review?.campaign_budgets && client.review.campaign_budgets.length > 0 ? (
                          <div className="space-y-1.5 max-h-60 overflow-y-auto">
                            {client.review.campaign_budgets.map((item: any, index: number) => (
                              <div key={index} className="flex items-center justify-between text-xs p-1.5 bg-muted/30 rounded">
                                <div className="flex-1 min-w-0">
                                  {item.source === 'adset' && item.campaign_name && (
                                    <span className="text-muted-foreground text-[10px] block truncate">{item.campaign_name}</span>
                                  )}
                                  <span className={`block truncate ${item.source === 'adset' ? 'pl-2' : 'font-medium'}`}>
                                    {item.source === 'adset' ? `└ ${item.name}` : item.name}
                                  </span>
                                </div>
                                <span className="font-medium ml-2 whitespace-nowrap">{formatCurrency(item.budget)}</span>
                              </div>
                            ))}
                            <div className="border-t pt-2 flex justify-between text-xs font-semibold">
                              <span>Total</span>
                              <span>{formatCurrency(client.review?.daily_budget_current || 0)}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Detalhamento não disponível. Analise o cliente para ver a composição.
                          </p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Diário ideal Meta */}
              {platform === "meta" && idealDailyBudget !== (client.review?.daily_budget_current || 0) ? (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Diário ideal</p>
                  <p className="text-sm font-semibold text-gray-700">{formatCurrency(idealDailyBudget)}</p>
                </div>
              ) : null}
            </div>

            {/* Ajuste recomendado / Status OK */}
            {needsAdjustment && !warningIgnoredToday ? (
              <div className="mt-2 p-1.5 rounded-md flex items-center gap-2 text-xs font-medium bg-red-50 text-red-700 border border-dashed border-red-200">
                {budgetDifference > 0 
                  ? <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" /> 
                  : <TrendingDown className="h-3.5 w-3.5 flex-shrink-0" />}
                <span>{budgetDifference > 0 ? "Aumentar" : "Reduzir"} orçamento: {budgetDifference > 0 ? "+" : "-"}{formatCurrency(Math.abs(budgetDifference))}</span>
              </div>
            ) : !warningIgnoredToday ? (
              <div className="mt-2 p-1.5 rounded-md flex items-center gap-2 text-xs font-medium bg-green-50 text-green-700 border border-dashed border-green-200">
                <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Orçamento OK</span>
              </div>
            ) : null}
          </div>

          {/* Botão */}
          <div>
            <Button
              className="w-full bg-[#321e32] hover:bg-[#321e32]/90 text-white"
              onClick={handleReviewClick}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  Analisar
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de confirmação */}
      <IgnoreWarningDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onConfirm={handleWarningIgnored}
        clientName={companyName}
      />
    </>
  );
}
