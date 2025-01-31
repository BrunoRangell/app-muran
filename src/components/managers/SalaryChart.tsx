import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
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
          .eq('manager_id', userId)
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
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Carregando gráfico...</p>
      </div>
    );
  }

  if (salaryData.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Nenhum dado salarial encontrado.</p>
      </div>
    );
  }

  return (
    <ChartContainer
      className="aspect-[2/1] w-full"
      config={{
        salary: {
          theme: {
            light: "#ff6e00",
            dark: "#ff6e00",
          },
        },
      }}
    >
      <LineChart data={salaryData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="month"
          tick={{ fill: '#0f0f0f', fontSize: 12 }}
          tickLine={{ stroke: '#e5e7eb' }}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis
          tick={{ fill: '#0f0f0f', fontSize: 12 }}
          tickFormatter={(value) => `R$ ${value}`}
          tickLine={{ stroke: '#e5e7eb' }}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <ChartTooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            return (
              <ChartTooltipContent
                className="bg-white shadow-lg border border-gray-100"
                payload={payload}
                formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              />
            );
          }}
        />
        <Line
          type="monotone"
          dataKey="amount"
          name="Salário"
          stroke="#ff6e00"
          strokeWidth={2}
          dot={{ fill: "#ff6e00", strokeWidth: 2 }}
          activeDot={{ r: 6, fill: "#ff6e00" }}
        />
      </LineChart>
    </ChartContainer>
  );
};