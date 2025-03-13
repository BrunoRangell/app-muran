
import { formatCurrency } from "@/utils/formatters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BadgeDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export interface ClientSummaryCardProps {
  client: any;
  latestReview: any;
}

export const ClientSummaryCard = ({ client, latestReview }: ClientSummaryCardProps) => {
  // Formatar a data atual no formato brasileiro
  const formatCurrentDate = () => {
    const today = new Date();
    return format(today, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  // Calcular a porcentagem do orçamento mensal gasto
  const calculateBudgetPercentage = () => {
    if (!client?.meta_ads_budget || !latestReview?.meta_total_spent) return 0;
    
    const budget = Number(client.meta_ads_budget);
    const spent = Number(latestReview.meta_total_spent);
    
    console.log("Cálculo de porcentagem - Orçamento:", budget, "Gasto:", spent);
    
    if (budget <= 0 || isNaN(budget) || isNaN(spent)) return 0;
    
    const percentage = Math.round((spent / budget) * 100);
    console.log("Porcentagem calculada:", percentage);
    return percentage > 100 ? 100 : percentage; // Limitar a 100%
  };

  // Obter o gasto total real do mês atual
  const getTotalSpent = () => {
    if (!latestReview?.meta_total_spent) return 0;
    const spent = Number(latestReview.meta_total_spent);
    console.log("Valor total gasto (antes do formatCurrency):", spent);
    return isNaN(spent) ? 0 : spent;
  };

  // Verificar se está usando orçamento personalizado
  const isUsingCustomBudget = latestReview?.using_custom_budget === true;
  const customBudgetAmount = latestReview?.custom_budget_amount;

  // Valores para debug
  console.log("Dados do cliente:", client);
  console.log("Dados da revisão mais recente:", latestReview);
  console.log("Orçamento mensal:", client?.meta_ads_budget);
  console.log("Gasto total na revisão:", latestReview?.meta_total_spent);
  console.log("Usando orçamento personalizado:", isUsingCustomBudget);

  return (
    <Card className={isUsingCustomBudget ? "border-l-4 border-l-[#ff6e00]" : ""}>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          {client?.company_name || "Cliente"}
          {isUsingCustomBudget && (
            <BadgeDollarSign size={20} className="text-[#ff6e00]" />
          )}
        </CardTitle>
        <CardDescription>
          Detalhes da revisão de hoje - {formatCurrentDate()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Orçamento Mensal Meta Ads</div>
            <div className="text-2xl font-bold">
              {formatCurrency(isUsingCustomBudget && customBudgetAmount 
                ? Number(customBudgetAmount) 
                : Number(client?.meta_ads_budget) || 0)}
            </div>
            {isUsingCustomBudget && (
              <div className="mt-2">
                <Badge className="bg-[#ff6e00]/10 border-0 text-[#ff6e00] flex items-center gap-1 py-1">
                  <BadgeDollarSign size={12} />
                  Orçamento personalizado ativo
                </Badge>
                <Link to="/revisao-nova?tab=custom-budgets" className="mt-2 block">
                  <Button size="sm" variant="outline" className="w-full text-xs border-[#ff6e00] text-[#ff6e00] hover:bg-[#ff6e00]/10">
                    Gerenciar orçamentos personalizados
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">ID da Conta Meta</div>
            <div className="text-lg font-medium">{client?.meta_account_id || "Não configurado"}</div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Total Gasto</div>
            <div className="text-2xl font-bold text-[#ff6e00]">
              {formatCurrency(getTotalSpent())}
            </div>
            {client?.meta_ads_budget && latestReview?.meta_total_spent && (
              <div className="text-xs text-gray-500 mt-1">
                {calculateBudgetPercentage()}% do orçamento mensal
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
