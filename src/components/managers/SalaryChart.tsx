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
import { useToast } from "@/components/ui/use-toast";

interface SalaryData {
  month: string;
  amount: number;
}

export const SalaryChart = () => {
  const [salaryData, setSalaryData] = useState<SalaryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSalaryData = async () => {
      try {
        console.log('Buscando dados de salários...');
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Erro ao buscar sessão:', sessionError);
          toast({
            title: "Erro ao carregar dados",
            description: "Não foi possível verificar sua sessão. Tente novamente mais tarde.",
            variant: "destructive",
          });
          return;
        }

        if (!sessionData.session?.user?.id) {
          console.log('Usuário não autenticado');
          setIsLoading(false);
          return;
        }

        const userId = sessionData.session.user.id;
        console.log('ID do usuário:', userId);

        const { data: salariesData, error: salariesError } = await supabase
          .from('salaries')
          .select('month, amount')
          .eq('user_id', userId)
          .order('month', { ascending: true });

        if (salariesError) {
          console.error('Erro ao buscar salários:', salariesError);
          toast({
            title: "Erro ao carregar salários",
            description: "Não foi possível buscar seus dados salariais. Tente novamente mais tarde.",
            variant: "destructive",
          });
          return;
        }

        console.log('Dados de salários encontrados:', salariesData);
        
        const formattedData = salariesData?.map(item => ({
          month: format(new Date(item.month), 'MMM/yyyy', { locale: ptBR }),
          amount: item.amount
        })) || [];

        setSalaryData(formattedData);
      } catch (error) {
        console.error('Erro ao carregar dados de salários:', error);
        toast({
          title: "Erro inesperado",
          description: "Ocorreu um erro ao carregar seus dados. Tente novamente mais tarde.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalaryData();
  }, [toast]);

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