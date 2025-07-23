
import { Card } from "@/components/ui/card";
import { CostFilters } from "@/types/cost";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { addMonths, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InteractiveChartsProps {
  filters: CostFilters;
  financialData: {
    clients: any[];
    costs: any[];
    payments: any[];
    metrics: any;
  };
}

export const InteractiveCharts = ({ filters, financialData }: InteractiveChartsProps) => {
  // Gerar dados mensais para os últimos 12 meses
  const generateMonthlyData = () => {
    const data = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const month = addMonths(now, -i);
      const monthStr = format(month, 'yyyy-MM');
      const monthLabel = format(month, 'MMM/yy', { locale: ptBR });
      
      // Calcular MRR para este mês
      const activeClientsInMonth = financialData.clients.filter(client => {
        if (client.status !== 'active') return false;
        
        const firstPayment = client.first_payment_date ? parseISO(client.first_payment_date) : null;
        const lastPayment = client.last_payment_date ? parseISO(client.last_payment_date) : null;
        
        if (!firstPayment) return false;
        if (firstPayment > month) return false;
        if (lastPayment && lastPayment < month) return false;
        
        return true;
      });
      
      const mrr = activeClientsInMonth.reduce((sum, client) => sum + (client.contract_value || 0), 0);
      
      // Calcular custos para este mês
      const costsInMonth = financialData.costs
        .filter(cost => cost.date && cost.date.startsWith(monthStr))
        .reduce((sum, cost) => sum + Number(cost.amount || 0), 0);
      
      data.push({
        month: monthLabel,
        mrr,
        costs: costsInMonth,
        clients: activeClientsInMonth.length,
        profit: mrr - costsInMonth
      });
    }
    
    return data;
  };

  const monthlyData = generateMonthlyData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Gráfico de Receita vs Custos */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Receita vs Custos (Últimos 12 Meses)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip 
              formatter={(value: number, name: string) => [
                formatCurrency(value), 
                name === 'mrr' ? 'Receita' : name === 'costs' ? 'Custos' : 'Lucro'
              ]}
            />
            <Line 
              type="monotone" 
              dataKey="mrr" 
              stroke="#10b981" 
              strokeWidth={3}
              name="mrr"
            />
            <Line 
              type="monotone" 
              dataKey="costs" 
              stroke="#ef4444" 
              strokeWidth={3}
              name="costs"
            />
            <Line 
              type="monotone" 
              dataKey="profit" 
              stroke="#3b82f6" 
              strokeWidth={3}
              name="profit"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Gráfico de Evolução de Clientes */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Evolução da Base de Clientes</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => [value, 'Clientes Ativos']}
            />
            <Bar 
              dataKey="clients" 
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
