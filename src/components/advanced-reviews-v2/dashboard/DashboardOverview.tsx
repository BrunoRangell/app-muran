
import { useClientDataV2 } from "../hooks/useClientDataV2";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChartBar,
  AlertTriangle, 
  CheckIcon, 
  Info
} from "lucide-react";

export function DashboardOverview() {
  const { 
    isLoading, 
    metaClients, 
    googleClients,
    metrics
  } = useClientDataV2();
  
  // Calcular a proporção de clientes que precisam de ajuste
  const totalClients = metrics.combined.clientsCount;
  const clientsNeedingAdjustment = metrics.combined.clientsNeedingAdjustment;
  const adjustmentPercentage = totalClients > 0
    ? (clientsNeedingAdjustment / totalClients) * 100
    : 0;

  // Calcular percentual de orçamento gasto
  const spendPercentage = metrics.combined.averageSpendPercentage || 0;
  
  // Status de gasto baseado no percentual
  const getSpendStatus = () => {
    if (spendPercentage < 70) return { color: "bg-green-500", text: "text-green-700", message: "Dentro do esperado" };
    if (spendPercentage < 90) return { color: "bg-orange-500", text: "text-orange-700", message: "Monitorar" };
    return { color: "bg-red-500", text: "text-red-700", message: "Atenção: Acima do esperado" };
  };
  
  const spendStatus = getSpendStatus();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#321e32]">Dashboard Geral</h2>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-5 w-1/3 mb-4" />
              <Skeleton className="h-10 w-1/2 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-2 w-full" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card de Clientes */}
          <Card className="p-6 bg-gradient-to-br from-white to-slate-50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Clientes</h3>
              <span className="p-1 rounded-full bg-blue-100">
                <Info className="h-4 w-4 text-blue-500" />
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-[#321e32]">
                {totalClients}
              </div>
              <p className="text-sm text-gray-500">
                {metrics.meta.clientsCount} Meta Ads | {metrics.google.clientsCount} Google Ads
              </p>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Precisam de ajuste</span>
                <span className="font-medium">
                  {clientsNeedingAdjustment} clientes ({Math.round(adjustmentPercentage)}%)
                </span>
              </div>
              <Progress value={adjustmentPercentage} className="h-2" />
            </div>
          </Card>
          
          {/* Card de Orçamentos */}
          <Card className="p-6 bg-gradient-to-br from-white to-slate-50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Orçamento Total</h3>
              <span className="p-1 rounded-full bg-blue-100">
                <Info className="h-4 w-4 text-blue-500" />
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-[#321e32]">
                {formatCurrency(metrics.combined.totalMonthlyBudget)}
              </div>
              <p className="text-sm text-gray-500">
                {metrics.combined.customBudgetsCount} orçamentos personalizados ativos
              </p>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Gasto até agora</span>
                <span className="font-medium">
                  {formatCurrency(metrics.combined.totalSpent)} 
                  ({Math.round(spendPercentage)}%)
                </span>
              </div>
              <Progress 
                value={Math.min(100, spendPercentage)} 
                className={`h-2 ${spendPercentage > 90 ? 'bg-red-200' : ''}`} 
              />
              <p className={`text-xs mt-1 ${spendStatus.text}`}>{spendStatus.message}</p>
            </div>
          </Card>
          
          {/* Card de Status */}
          <Card className="p-6 bg-gradient-to-br from-white to-slate-50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Status do Sistema</h3>
              <span className="p-1 rounded-full bg-blue-100">
                <Info className="h-4 w-4 text-blue-500" />
              </span>
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckIcon className="h-5 w-5 text-green-500" />
                <span>Revisões automáticas ativas</span>
              </div>
              
              <div className="flex items-center gap-2">
                <CheckIcon className="h-5 w-5 text-green-500" />
                <span>API Meta conectada</span>
              </div>
              
              <div className="flex items-center gap-2">
                <CheckIcon className="h-5 w-5 text-green-500" />
                <span>API Google conectada</span>
              </div>
              
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <span>2 orçamentos personalizados expirando em 7 dias</span>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* Clientes que precisam de atenção */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-[#321e32] mb-4">
          Clientes que precisam de atenção
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            // Skeletons para carregamento
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-5 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-2 w-full mb-2" />
                <Skeleton className="h-2 w-3/4" />
              </Card>
            ))
          ) : (
            // Lista de clientes que precisam de ajuste
            [...metaClients, ...googleClients]
              .filter(client => client.needsBudgetAdjustment)
              .slice(0, 6) // Mostrar apenas os 6 primeiros
              .map(client => (
                <Card key={client.id} className="p-4 border-l-4 border-l-orange-500">
                  <h3 className="font-medium text-[#321e32]">{client.company_name}</h3>
                  <p className="text-sm text-gray-500">
                    {client.meta_account_id ? 'Meta Ads' : 'Google Ads'}
                  </p>
                  <div className="mt-2 text-sm">
                    <div className="flex items-center text-orange-600">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      <span>Orçamento precisa de ajuste</span>
                    </div>
                  </div>
                </Card>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
