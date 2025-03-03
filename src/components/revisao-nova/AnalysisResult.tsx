
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { BarChart4, DollarSign, Calculator, Calendar } from "lucide-react";
import { SimpleAnalysisResult } from "@/components/daily-reviews/hooks/types";
import { CampaignsTable } from "./CampaignsTable";
import { getDaysInMonth, format } from "date-fns";
import { MetaAdsBudgetCard } from "@/components/daily-reviews/client-details/MetaAdsBudgetCard";

interface AnalysisResultProps {
  analysis: SimpleAnalysisResult;
  monthlyBudget: number | null;
  client: any; // Adicionamos client como prop para usar em MetaAdsBudgetCard
}

export function AnalysisResult({ analysis, monthlyBudget, client }: AnalysisResultProps) {
  if (!analysis?.meta) return null;

  const totalSpent = analysis.meta.totalSpent || 0;
  const budgetValue = monthlyBudget || 0;
  
  // Calcular porcentagem do orçamento gasto
  const spentPercentage = budgetValue > 0 
    ? Math.min(Math.round((totalSpent / budgetValue) * 100), 100) 
    : 0;
  
  // Calcular orçamento disponível
  const availableBudget = Math.max(budgetValue - totalSpent, 0);
  
  // Cálculo dos dias restantes no mês
  const today = new Date();
  const currentDay = today.getDate();
  const daysInCurrentMonth = getDaysInMonth(today);
  const remainingDays = daysInCurrentMonth - currentDay + 1; // +1 para incluir o dia atual
  
  // Cálculo do valor diário sugerido
  const suggestedDailyBudget = remainingDays > 0 ? availableBudget / remainingDays : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card de Gastos Acumulados */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart4 className="h-5 w-5 text-muran-primary" />
              Gastos Acumulados
            </CardTitle>
            <CardDescription>
              Valor total gasto em Meta Ads no período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muran-primary">
              {formatCurrency(totalSpent)}
            </div>
            
            {budgetValue > 0 && (
              <>
                <p className="text-sm text-gray-500 mt-1">
                  {spentPercentage}% do orçamento mensal utilizado
                </p>
                <div className="mt-2 w-full bg-gray-100 rounded-full h-2.5">
                  <div 
                    className="bg-muran-primary h-2.5 rounded-full" 
                    style={{ width: `${spentPercentage}%` }}
                  ></div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Card de Orçamento Mensal Disponível */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muran-primary" />
              Orçamento Mensal Disponível
            </CardTitle>
            <CardDescription>
              Valor restante do orçamento mensal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muran-primary">
              {formatCurrency(availableBudget)}
            </div>
            
            {budgetValue > 0 && (
              <>
                <p className="text-sm text-gray-500 mt-1">
                  de {formatCurrency(budgetValue)} do orçamento total
                </p>
                <div className="mt-2 w-full bg-gray-100 rounded-full h-2.5">
                  <div 
                    className="bg-green-500 h-2.5 rounded-full" 
                    style={{ width: `${100 - spentPercentage}%` }}
                  ></div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Card de Valor Diário Sugerido */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5 text-muran-primary" />
              Valor Diário Sugerido
            </CardTitle>
            <CardDescription>
              Valor recomendado para atingir o orçamento mensal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muran-primary">
              {formatCurrency(suggestedDailyBudget)}
            </div>
            
            {budgetValue > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                baseado no orçamento disponível e dias restantes
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Card de Dias Restantes no Mês */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muran-primary" />
              Dias Restantes
            </CardTitle>
            <CardDescription>
              Dias até o fim do mês atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muran-primary">
              {remainingDays}
            </div>
            
            <p className="text-sm text-gray-500 mt-1">
              Hoje é dia {format(today, 'dd/MM/yyyy')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Adicionar o MetaAdsBudgetCard aqui */}
      {client?.meta_account_id && (
        <div className="mt-4">
          <MetaAdsBudgetCard 
            clientId={client.id} 
            metaAccountId={client.meta_account_id}
          />
        </div>
      )}

      {analysis.meta.campaigns && analysis.meta.campaigns.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Campanhas</h3>
          <CampaignsTable campaigns={analysis.meta.campaigns} />
        </div>
      )}
    </div>
  );
}
