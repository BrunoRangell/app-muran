import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SalaryData {
  month: string;
  amount: number;
}

export const SalaryChart = () => {
  const [salaryData, setSalaryData] = useState<SalaryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSalaryData = async () => {
      try {
        console.log('Buscando dados de salários...');
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Erro ao buscar sessão:', sessionError);
          throw sessionError;
        }

        if (!sessionData.session?.user?.id) {
          console.log('Usuário não autenticado');
          setIsLoading(false);
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from('team_members')
          .select('id')
          .eq('email', sessionData.session.user.email)
          .single();

        if (userError) {
          console.error('Erro ao buscar dados do usuário:', userError);
          throw userError;
        }

        if (!userData) {
          console.log('Usuário não encontrado');
          setIsLoading(false);
          return;
        }

        console.log('ID do gestor:', userData.id);

        const { data, error } = await supabase
          .from('salaries')
          .select('month, amount')
          .eq('manager_id', userData.id)
          .order('month', { ascending: true });

        if (error) {
          console.error('Erro ao buscar salários:', error);
          throw error;
        }

        console.log('Dados de salários encontrados:', data);
        
        const formattedData = data?.map(item => ({
          month: format(new Date(item.month), 'MMM/yyyy', { locale: ptBR }),
          amount: item.amount
        })) || [];

        setSalaryData(formattedData);
      } catch (error) {
        console.error('Erro ao carregar dados de salários:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalaryData();
  }, []);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (salaryData.length === 0) {
    return <div>Nenhum dado salarial encontrado.</div>;
  }

  return (
    <ChartContainer
      className="aspect-[2/1]"
      config={{
        salary: {
          theme: {
            light: "#ff6e00",
            dark: "#ff6e00",
          },
        },
      }}
    >
      <LineChart data={salaryData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tick={{ fill: '#0f0f0f' }}
        />
        <YAxis
          tick={{ fill: '#0f0f0f' }}
          tickFormatter={(value) => `R$ ${value}`}
        />
        <ChartTooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            return (
              <ChartTooltipContent
                className="bg-white"
                payload={payload}
                formatter={(value) => `R$ ${value}`}
              />
            );
          }}
        />
        <Line
          type="monotone"
          dataKey="amount"
          name="Salário"
          stroke="var(--color-salary)"
          strokeWidth={2}
          dot={{ fill: "var(--color-salary)" }}
        />
      </LineChart>
    </ChartContainer>
  );
};