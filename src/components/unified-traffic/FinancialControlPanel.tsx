import { useState } from "react";
import { DollarSign, CreditCard, AlertCircle, RefreshCw, ExternalLink, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FilterState } from "./SmartFilters";

interface FinancialControlProps {
  filters: FilterState;
}

// Mock data - em produção viria da API
const mockFinancialData = [
  {
    client: "Cliente ABC",
    meta: {
      id: "123456789",
      balance: 450,
      balancePercent: 25,
      billingModel: "pre" as const,
      status: "active" as const,
      lastRecharge: { date: "2024-01-15", amount: 2000 },
      daysRemaining: 3
    },
    google: {
      id: "987654321", 
      balance: null,
      billingModel: "pos" as const,
      status: "active" as const,
      creditCard: true
    }
  },
  {
    client: "Cliente XYZ",
    meta: {
      id: "555666777",
      balance: 1200,
      balancePercent: 75,
      billingModel: "pre" as const,
      status: "active" as const,
      lastRecharge: { date: "2024-01-10", amount: 1500 },
      daysRemaining: 8
    },
    google: {
      id: "111222333",
      balance: 800,
      balancePercent: 60,
      billingModel: "pre" as const,
      status: "active" as const,
      lastRecharge: { date: "2024-01-12", amount: 1000 },
      daysRemaining: 6
    }
  }
];

const getBalanceColor = (percent: number) => {
  if (percent <= 25) return "text-red-600";
  if (percent <= 50) return "text-orange-600";
  return "text-green-600";
};

const getProgressColor = (percent: number) => {
  if (percent <= 25) return "bg-red-500";
  if (percent <= 50) return "bg-orange-500";
  return "bg-green-500";
};

export const FinancialControlPanel = ({ filters }: FinancialControlProps) => {
  const [refreshing, setRefreshing] = useState(false);

  // Filtrar dados baseado nos filtros
  const filteredData = mockFinancialData.filter(item => {
    if (filters.clientSearch && !item.client.toLowerCase().includes(filters.clientSearch.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simular carregamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
  };

  const handleRecharge = (client: string, platform: "meta" | "google") => {
    console.log(`Iniciando recarga para ${client} - ${platform}`);
  };

  const openPlatform = (platform: "meta" | "google", accountId: string) => {
    if (platform === "meta") {
      window.open(`https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${accountId}`, '_blank');
    } else {
      window.open(`https://ads.google.com/aw/overview?ocid=${accountId}`, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header da Seção */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="w-6 h-6 text-muran-primary" />
          <h2 className="text-2xl font-semibold text-muran-dark">Controle Financeiro</h2>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Atualizando..." : "Atualizar Saldos"}
        </Button>
      </div>

      {/* Cards dos Clientes */}
      <div className="space-y-6">
        {filteredData.map((client) => (
          <Card key={client.client} className="border-muran-secondary/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg font-semibold text-muran-dark">
                  {client.client}
                </span>
                <div className="flex gap-2">
                  {/* Alertas de saldo baixo */}
                  {client.meta?.balance && client.meta.balance < 500 && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Saldo baixo
                    </Badge>
                  )}
                  {client.google?.balance && client.google.balance < 500 && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Saldo baixo
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Meta Ads */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#4267B2] rounded"></div>
                    <h3 className="font-semibold text-muran-dark">Meta Ads</h3>
                    <Badge variant="outline" className="text-xs">
                      ID: {client.meta?.id}
                    </Badge>
                  </div>

                  {client.meta ? (
                    <div className="space-y-3">
                      {/* Saldo */}
                      {client.meta.balance !== null ? (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muran-dark/70">Saldo disponível</span>
                            <span className={`font-bold text-lg ${getBalanceColor(client.meta.balancePercent)}`}>
                              R$ {client.meta.balance.toLocaleString()}
                            </span>
                          </div>
                          <Progress 
                            value={client.meta.balancePercent} 
                            className="h-2"
                          />
                          <div className="flex justify-between text-xs text-muran-dark/60">
                            <span>{client.meta.balancePercent}% restante</span>
                            <span>~{client.meta.daysRemaining} dias</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muran-dark/60">
                          <CreditCard className="w-4 h-4" />
                          <span>Cartão de crédito</span>
                        </div>
                      )}

                      {/* Última recarga */}
                      {client.meta.lastRecharge && (
                        <div className="text-xs text-muran-dark/60">
                          Última recarga: {new Date(client.meta.lastRecharge.date).toLocaleDateString('pt-BR')} - 
                          R$ {client.meta.lastRecharge.amount.toLocaleString()}
                        </div>
                      )}

                      {/* Ações */}
                      <div className="flex gap-2">
                        {client.meta.billingModel === "pre" && client.meta.balance !== null && client.meta.balance < 500 && (
                          <Button 
                            size="sm" 
                            onClick={() => handleRecharge(client.client, "meta")}
                            className="bg-muran-primary hover:bg-muran-primary/90"
                          >
                            <DollarSign className="w-3 h-3 mr-1" />
                            Recarregar
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openPlatform("meta", client.meta!.id)}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Abrir
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muran-dark/40 border-2 border-dashed border-muran-secondary/30 rounded-lg">
                      Conta não conectada
                    </div>
                  )}
                </div>

                {/* Google Ads */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#34A853] rounded"></div>
                    <h3 className="font-semibold text-muran-dark">Google Ads</h3>
                    <Badge variant="outline" className="text-xs">
                      ID: {client.google?.id}
                    </Badge>
                  </div>

                  {client.google ? (
                    <div className="space-y-3">
                      {/* Saldo */}
                      {client.google.balance !== null ? (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muran-dark/70">Saldo disponível</span>
                            <span className={`font-bold text-lg ${getBalanceColor(client.google.balancePercent!)}`}>
                              R$ {client.google.balance.toLocaleString()}
                            </span>
                          </div>
                          <Progress 
                            value={client.google.balancePercent} 
                            className="h-2"
                          />
                          <div className="flex justify-between text-xs text-muran-dark/60">
                            <span>{client.google.balancePercent}% restante</span>
                            <span>~{client.google.daysRemaining} dias</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muran-dark/60">
                          <CreditCard className="w-4 h-4" />
                          <span>Cartão de crédito</span>
                        </div>
                      )}

                      {/* Última recarga */}
                      {client.google.lastRecharge && (
                        <div className="text-xs text-muran-dark/60">
                          Última recarga: {new Date(client.google.lastRecharge.date).toLocaleDateString('pt-BR')} - 
                          R$ {client.google.lastRecharge.amount.toLocaleString()}
                        </div>
                      )}

                      {/* Ações */}
                      <div className="flex gap-2">
                        {client.google.billingModel === "pre" && client.google.balance !== null && client.google.balance < 500 && (
                          <Button 
                            size="sm" 
                            onClick={() => handleRecharge(client.client, "google")}
                            className="bg-muran-primary hover:bg-muran-primary/90"
                          >
                            <DollarSign className="w-3 h-3 mr-1" />
                            Recarregar
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openPlatform("google", client.google!.id)}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Abrir
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muran-dark/40 border-2 border-dashed border-muran-secondary/30 rounded-lg">
                      Conta não conectada
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};