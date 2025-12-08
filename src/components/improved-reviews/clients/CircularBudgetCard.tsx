import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  BadgeDollarSign,
  Calendar,
  ChevronRight,
  Loader,
  Loader2,
  EyeOff,
  ExternalLink,
  Activity,
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

interface CircularBudgetCardProps {
  client: any;
  platform?: "meta" | "google";
  budgetCalculationMode?: "weighted" | "current";
  onIndividualReviewComplete?: () => void;
}
export function CircularBudgetCard({
  client,
  platform = "meta",
  budgetCalculationMode = "weighted",
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
  const spentPercentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;

  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> CORREÇÃO AQUI (única mudança funcional)
  const idealDailyBudget = client.budgetCalculation?.idealDailyBudget || 0;
  const currentDailyBudget = client.review?.daily_budget_current || 0;
  // diferença correta: IDEAL - ATUAL
  const budgetDifference = idealDailyBudget - currentDailyBudget;
  // define se precisa ajustar (threshold de R$ 5 ou mais)
  const needsAdjustment = Math.abs(budgetDifference) >= 5;
  // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< FIM DA CORREÇÃO

  const remainingDays = client.budgetCalculation?.remainingDays || 0;
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

  // NOVA MÉTRICA: Média Ponderada ou Orçamento Atual para Google Ads
  const weightedAverage = client.weightedAverage || 0;

  // Determinar cor e status - APENAS 2 estados principais + ignorado
  const getStatusInfo = () => {
    if (warningIgnoredToday) {
      return {
        color: "stroke-gray-400",
        borderColor: "border-gray-200",
        textColor: "text-gray-500",
        status: "Ajuste ocultado hoje",
        statusColor: "text-gray-500",
      };
    }
    if (needsAdjustment) {
      return {
        color: "stroke-amber-500",
        borderColor: "border-amber-200",
        textColor: "text-amber-600",
        status: budgetDifference > 0 ? "Aumentar orçamento" : "Reduzir orçamento",
        statusColor: "text-amber-600",
      };
    } else {
      return {
        color: "stroke-emerald-500",
        borderColor: "border-emerald-200",
        textColor: "text-emerald-600",
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
    console.log("Antes de reviewClient:", {
      last_funding_detected_at: client.last_funding_detected_at,
      last_funding_amount: client.last_funding_amount,
    });
    try {
      const accountId = platform === "meta" ? client.meta_account_id : client.google_account_id;
      
      // Marcar como recém-revisado ANTES da revisão para manter posição durante atualização
      markAsReviewed(client.id);
      
      await reviewClient(client.id, accountId);
      console.log("Depois de reviewClient:", {
        last_funding_detected_at: client.last_funding_detected_at,
        last_funding_amount: client.last_funding_amount,
      });
      console.log(`✅ Revisão do cliente ${client.company_name} concluída com sucesso`);
    } catch (error: any) {
      console.error(`❌ Erro na revisão do cliente ${client.company_name}:`, error);
      // Toast de erro removido - conforme solicitação do usuário
      // toast({
      //   title: "Erro na análise",
      //   description: error.message || "Ocorreu um erro ao analisar o cliente",
      //   variant: "destructive"
      // });
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

  // Calcular coordenadas do círculo
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (spentPercentage / 100) * circumference;
  return (
    <>
      <Card className={`w-full max-w-sm bg-white ${statusInfo.borderColor} border-2 transition-all hover:shadow-md`}>
        <CardContent className="p-5">
          {/* Header com nome e ícones */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-base line-clamp-1 mb-1">{companyName}</h3>
              <p className="text-gray-600 mb-1 text-xs">{accountInfo.name}</p>
              <p className="text-xs text-gray-500">ID: {accountInfo.id}</p>
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
            <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BadgeDollarSign className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Saldo da Conta</span>
                </div>
                <a
                  href={`https://business.facebook.com/billing_hub/accounts/details?asset_id=${accountInfo.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Ver saldo
                </a>
                <Badge
                  variant="outline"
                  className={`text-xs ${
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-900">
                      {formatCurrency(client.balance_info.balance_value)}
                    </span>
                    {client.balance_info.balance_percent && (
                      <span className="text-sm text-blue-700">
                        {Math.round(client.balance_info.balance_percent * 100)}%
                      </span>
                    )}
                  </div>

                  {/* Cálculo dias até esgotar - apenas para pré-pagas */}
                  {client.balance_info.billing_model === "pre" &&
                    (() => {
                      const balance = client.balance_info.balance_value || 0;
                      const dailyBudget = client.meta_daily_budget || 0;

                      if (balance <= 0) {
                        return <div className="text-xs text-red-600">📅 Saldo esgotado</div>;
                      } else if (dailyBudget <= 0) {
                        return <div className="text-xs text-gray-600">📅 Sem limite definido</div>;
                      } else {
                        const daysUntilEmpty = balance / dailyBudget;
                        if (daysUntilEmpty > 365) {
                          return <div className="text-xs text-gray-600">📅 &gt; 1 ano restante</div>;
                        } else {
                          return (
                            <div className="text-xs text-gray-600">📅 ~{Math.floor(daysUntilEmpty)} dias restantes</div>
                          );
                        }
                      }
                    })()}

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
            <div className="mb-4">
              <Popover>
                <PopoverTrigger asChild>
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors group">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-800">Status das Campanhas</span>
                      <Info className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`text-xs font-medium ${veiculationInfo.badgeColor}`}>
                        {veiculationInfo.message}
                      </Badge>
                      {veiculationInfo.activeCampaigns > 0 && (
                        <span className="text-xs text-gray-600">
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
            <div className="mb-4">
              <Popover>
                <PopoverTrigger asChild>
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors group">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-800">Status das Campanhas</span>
                      <Info className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`text-xs font-medium ${veiculationInfo.badgeColor}`}>
                        {veiculationInfo.message}
                      </Badge>
                      {veiculationInfo.activeCampaigns > 0 && (
                        <span className="text-xs text-gray-600">
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

          {/* Layout principal com informações organizadas */}
          <div className="grid grid-cols-3 gap-4 items-center mb-5">
            {/* Coluna 1: Orçamento e gasto */}
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Orçamento</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(budgetAmount)}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Gasto atual</p>
                <p className="text-sm font-semibold text-gray-700">{formatCurrency(spentAmount)}</p>
              </div>
            </div>

            {/* Coluna 2: Gráfico circular */}
            <div className="flex justify-center">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                  {/* Círculo de fundo */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-gray-200"
                  />
                  {/* Círculo de progresso */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className={statusInfo.color}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    style={{
                      transition: "stroke-dashoffset 0.5s ease-in-out",
                    }}
                  />
                </svg>
                {/* Texto central */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-base font-bold ${statusInfo.textColor}`}>{Math.round(spentPercentage)}%</span>
                </div>
              </div>
            </div>

            {/* Coluna 3: Informações à direita */}
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Restante</p>
                <p className="text-sm font-semibold text-gray-700">{remainingDays} dias</p>
              </div>

              {/* NOVA MÉTRICA: Mostrar valor baseado no modo selecionado para Google Ads */}
              {platform === "google" && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    {budgetCalculationMode === "weighted" ? "Média Pond" : "Orç. atual"}
                  </p>
                  <p className="text-sm font-semibold text-gray-700">
                    {formatCurrency(budgetCalculationMode === "weighted" ? weightedAverage : currentDailyBudget)}
                  </p>
                </div>
              )}

              {/* Mostrar diário ideal sempre que houver diferença (para Google) */}
              {platform === "google" &&
              idealDailyBudget !== (budgetCalculationMode === "weighted" ? weightedAverage : currentDailyBudget) ? (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Diário ideal</p>
                  <p className="text-sm font-semibold text-gray-700">{formatCurrency(idealDailyBudget)}</p>
                </div>
              ) : null}

              {/* Para Meta Ads, mostrar diário atual - CORRIGIDO: usar campo unificado */}
              {platform === "meta" && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Diário atual</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {formatCurrency(client.review?.daily_budget_current || 0)}
                  </p>
                </div>
              )}

              {/* Para Meta Ads, mostrar diário ideal quando diferente do atual - CORRIGIDO */}
              {platform === "meta" && idealDailyBudget !== (client.review?.daily_budget_current || 0) ? (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Diário ideal</p>
                  <p className="text-sm font-semibold text-gray-700">{formatCurrency(idealDailyBudget)}</p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Resto do componente permanece igual */}
          {needsAdjustment && budgetDifference !== 0 && !warningIgnoredToday && (
            <div className="mb-4 p-3 rounded-lg bg-gray-50 border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Ajuste recomendado:</span>
                <span className={`text-sm font-semibold ${statusInfo.statusColor}`}>
                  {budgetDifference > 0 ? "+" : "-"}
                  {formatCurrency(Math.abs(budgetDifference))}
                </span>
              </div>
            </div>
          )}

          {/* Status e botão */}
          <div className="space-y-3">
            <div className="text-center">
              <Badge
                variant="outline"
                className={`${statusInfo.borderColor} ${statusInfo.statusColor} text-xs px-3 py-1`}
              >
                {statusInfo.status}
              </Badge>
            </div>

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
