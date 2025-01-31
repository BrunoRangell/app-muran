import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface SalaryData {
  month: string;
  amount: number;
}

const formSchema = z.object({
  month: z.string().min(1, "Selecione um mês"),
  amount: z.string().min(1, "Digite um valor"),
});

export const SalaryChart = () => {
  const [salaryData, setSalaryData] = useState<SalaryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalSalary, setTotalSalary] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      month: "",
      amount: "",
    },
  });

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

      const total = formattedData.reduce((acc, curr) => acc + curr.amount, 0);
      setTotalSalary(total);
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

  useEffect(() => {
    fetchSalaryData();
  }, [toast]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user?.id) {
        toast({
          title: "Erro ao adicionar salário",
          description: "Você precisa estar autenticado para adicionar um salário.",
          variant: "destructive",
        });
        return;
      }

      // Ajusta o formato da data adicionando o dia (primeiro dia do mês)
      const formattedDate = `${values.month}-01`;
      console.log('Data formatada:', formattedDate);

      const amount = parseFloat(values.amount.replace(/\D/g, '')) / 100;
      const { error } = await supabase
        .from('salaries')
        .insert([
          {
            manager_id: sessionData.session.user.id,
            month: formattedDate, // Usa a data formatada
            amount: amount,
          },
        ]);

      if (error) throw error;

      toast({
        title: "Salário adicionado",
        description: "O salário foi adicionado com sucesso!",
      });

      form.reset();
      setIsDialogOpen(false);
      fetchSalaryData();
    } catch (error) {
      console.error('Erro ao adicionar salário:', error);
      toast({
        title: "Erro ao adicionar salário",
        description: "Não foi possível adicionar o salário. Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: string) => {
    const onlyNumbers = value.replace(/\D/g, '');
    const amount = parseInt(onlyNumbers) / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Carregando gráfico...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="bg-muran-secondary rounded-lg px-4 py-2">
          <span className="text-sm font-medium text-muran-dark">
            Total acumulado: {' '}
            <span className="text-muran-primary">
              {new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              }).format(totalSalary)}
            </span>
          </span>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-muran-primary hover:bg-muran-primary/90">
              <Plus className="w-4 h-4" />
              Adicionar Recebimento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Recebimento</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mês de Referência</FormLabel>
                      <FormControl>
                        <Input
                          type="month"
                          {...field}
                          placeholder="Selecione o mês"
                          className="cursor-pointer"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field: { onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => {
                            const formatted = formatCurrency(e.target.value);
                            e.target.value = formatted;
                            onChange(e);
                          }}
                          placeholder="R$ 0,00"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-muran-primary hover:bg-muran-primary/90">
                  Adicionar
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

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
            cursor={{ stroke: '#e5e7eb' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0];
              return (
                <div className="bg-white p-2 rounded-lg shadow-lg border border-gray-100">
                  <p className="text-sm font-medium text-muran-dark">
                    {data.payload.month}
                  </p>
                  <p className="text-sm font-bold text-muran-primary">
                    {new Intl.NumberFormat('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    }).format(data.value as number)}
                  </p>
                </div>
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
    </div>
  );
};