import { TrendingUp, TrendingDown, Check, AlertTriangle, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FilterState } from "./SmartFilters";

interface DailyOptimizationProps {
  filters: FilterState;
}

// Mock data - em produção viria da API
const mockOptimizationData = [
  {
    id: 1,
    client: "Cliente ABC",
    platform: "meta" as const,
    campaign: "Campanha Verão 2024",
    currentBudget: 150,
    suggestedBudget: 200,
    suggestion: "increase" as const,
    reason: "Performance 25% acima da meta. Recomendo aumento para aproveitar momento positivo.",
    impact: "+33% budget, est. +40% conversões",
    confidence: 85,
    priority: "high" as const
  },
  {
    id: 2,
    client: "Cliente XYZ", 
    platform: "google" as const,
    campaign: "Shopping - Produtos Casa",
    currentBudget: 300,
    suggestedBudget: 180,
    suggestion: "decrease" as const,
    reason: "CPA 60% acima da meta. Reduzir orçamento para melhorar eficiência.",
    impact: "-40% budget, est. -15% conversões, +30% eficiência",
    confidence: 92,
    priority: "medium" as const
  },
  {
    id: 3,
    client: "Cliente DEF",
    platform: "meta" as const,
    campaign: "Remarketing Carrinho",
    currentBudget: 80,
    suggestedBudget: 80,
    suggestion: "maintain" as const,
    reason: "Performance estável e dentro da meta. Manter orçamento atual.",
    impact: "Manter performance atual",
    confidence: 78,
    priority: "low" as const
  }
];

const suggestionConfig = {
  increase: {
    icon: TrendingUp,
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
    badge: "bg-green-100 text-green-800"
  },
  decrease: {
    icon: TrendingDown,
    color: "text-red-600", 
    bg: "bg-red-50 border-red-200",
    badge: "bg-red-100 text-red-800"
  },
  maintain: {
    icon: Check,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200", 
    badge: "bg-blue-100 text-blue-800"
  }
};

const priorityConfig = {
  high: { color: "bg-orange-100 text-orange-800", label: "Alta" },
  medium: { color: "bg-yellow-100 text-yellow-800", label: "Média" },
  low: { color: "bg-gray-100 text-gray-800", label: "Baixa" }
};

export const DailyOptimizationPanel = ({ filters }: DailyOptimizationProps) => {
  // Filtrar dados baseado nos filtros
  const filteredData = mockOptimizationData.filter(item => {
    if (filters.clientSearch && !item.client.toLowerCase().includes(filters.clientSearch.toLowerCase())) {
      return false;
    }
    if (filters.platform !== "all" && item.platform !== filters.platform) {
      return false;
    }
    return true;
  });

  const handleApplySuggestion = (item: typeof mockOptimizationData[0]) => {
    console.log(`Aplicando sugestão para ${item.client} - ${item.campaign}`);
  };

  const handleViewCampaign = (item: typeof mockOptimizationData[0]) => {
    console.log(`Abrindo campanha ${item.campaign} do ${item.client}`);
  };

  return (
    <div className="space-y-6">
      {/* Header da Seção */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6 text-muran-primary" />
          <h2 className="text-2xl font-semibold text-muran-dark">Otimização Diária</h2>
        </div>
        <div className="text-sm text-muran-dark/60">
          Baseado na performance das últimas 7 dias
        </div>
      </div>

      {/* Resumo das Sugestões */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-semibold text-green-800">
                  {filteredData.filter(item => item.suggestion === "increase").length} Aumentar
                </div>
                <div className="text-xs text-green-600">Campanhas com boa performance</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <div>
                <div className="font-semibold text-red-800">
                  {filteredData.filter(item => item.suggestion === "decrease").length} Reduzir
                </div>
                <div className="text-xs text-red-600">Campanhas ineficientes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-semibold text-blue-800">
                  {filteredData.filter(item => item.suggestion === "maintain").length} Manter
                </div>
                <div className="text-xs text-blue-600">Campanhas estáveis</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Sugestões */}
      <div className="space-y-4">
        {filteredData.map((item) => {
          const config = suggestionConfig[item.suggestion];
          const priorityStyle = priorityConfig[item.priority];
          const SuggestionIcon = config.icon;

          return (
            <Card key={item.id} className={`${config.bg} border transition-all hover:shadow-lg`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg text-muran-dark flex items-center gap-2">
                      <SuggestionIcon className={`w-5 h-5 ${config.color}`} />
                      {item.client}
                    </CardTitle>
                    <div className="text-sm text-muran-dark/70">{item.campaign}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={priorityStyle.color} variant="secondary">
                      Prioridade {priorityStyle.label}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {item.platform === "meta" ? "Meta" : "Google"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-muran-dark/60 mb-1">Orçamento Atual</div>
                        <div className="font-semibold text-muran-dark">
                          R$ {item.currentBudget}/dia
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muran-dark/60 mb-1">Sugerido</div>
                        <div className={`font-semibold ${config.color}`}>
                          R$ {item.suggestedBudget}/dia
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muran-dark/60 mb-1">Impacto Esperado</div>
                      <div className="text-sm text-muran-dark font-medium">
                        {item.impact}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-xs text-muran-dark/60">Confiança:</div>
                      <Badge variant="outline" className="text-xs">
                        {item.confidence}%
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-muran-dark/60 mb-1">Justificativa</div>
                      <div className="text-sm text-muran-dark">
                        {item.reason}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApplySuggestion(item)}
                        className="bg-muran-primary hover:bg-muran-primary/90"
                      >
                        <SuggestionIcon className="w-3 h-3 mr-1" />
                        Aplicar Sugestão
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewCampaign(item)}
                      >
                        Ver Campanha
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};