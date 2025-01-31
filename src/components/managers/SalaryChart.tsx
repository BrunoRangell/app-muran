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

        if (!sessionData.session?.user?.email) {
          console.log('Email do usuário não encontrado na sessão');
          setIsLoading(false);
          return;
        }

        console.log('Buscando usuário com email:', sessionData.session.user.email);

        const { data: userData, error: userError } = await supabase
          .from('team_members')
          .select('id')
          .eq('email', sessionData.session.user.email);

        if (userError) {
          console.error('Erro ao buscar dados do usuário:', userError);
          toast({
            title: "Erro ao carregar dados",
            description: "Não foi possível buscar seus dados. Tente novamente mais tarde.",
            variant: "destructive",
          });
          return;
        }

        if (!userData || userData.length === 0) {
          console.log('Usuário não encontrado na tabela team_members');
          toast({
            title: "Usuário não encontrado",
            description: "Não foi possível encontrar seus dados na base. Entre em contato com o suporte.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const managerId = userData[0].id;
        console.log('ID do gestor encontrado:', managerId);

        const { data: salariesData, error: salariesError } = await supabase
          .from('salaries')
          .select('month, amount')
          .eq('manager_id', managerId)
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