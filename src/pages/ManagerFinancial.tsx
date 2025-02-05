import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { SalaryChart } from "@/components/managers/SalaryChart";
import { Button } from "@/components/ui/button";
import { History, TrendingUp, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface Salary {
  month: string;
  amount: number;
}

const formSchema = z.object({
  month: z.string().min(1, "Selecione um mês"),
  amount: z.string().min(1, "Digite um valor"),
});

const ManagerFinancial = () => {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      month: "",
      amount: "",
    },
  });

  const fetchSalaries = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/gestores");
      return;
    }

    try {
      const { data: salariesData, error } = await supabase
        .from('salaries')
        .select('month, amount')
        .eq('manager_id', session.user.id)
        .order('month', { ascending: false });

      if (error) throw error;

      setSalaries(salariesData || []);
    } catch (error) {
      console.error('Error fetching salaries:', error);
      toast({
        title: "Erro ao carregar salários",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaries();
  }, [navigate, toast]);

  const handleAddSalary = async (values: z.infer<typeof formSchema>) => {
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

      const [year, month] = values.month.split('-').map(Number);
      const formattedDate = format(new Date(year, month - 1, 1), "yyyy-MM-dd");

      const amount = parseFloat(values.amount.replace(/\D/g, '')) / 100;
      const { error } = await supabase
        .from('salaries')
        .insert([
          {
            manager_id: sessionData.session.user.id,
            month: formattedDate,
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
      fetchSalaries(); // Atualiza a lista de salários
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
        <p className="text-gray-500">Carregando dados financeiros...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-muran-dark flex items-center gap-2">
            Meu Financeiro
            <Sparkles className="h-6 w-6 text-muran-primary animate-pulse" />
          </h1>
          <p className="text-gray-600">
            Acompanhe sua evolução financeira e celebre suas conquistas!
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-muran-primary hover:bg-muran-primary/90 w-full md:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Recebimento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Recebimento</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddSalary)} className="space-y-4">
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

      <Card className="p-4 md:p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          Evolução Salarial
          <TrendingUp className="h-5 w-5 text-muran-primary" />
        </h2>
        <SalaryChart salaries={salaries} />
      </Card>

      <div className="flex flex-col gap-4">
        <Button
          onClick={() => setShowHistory(!showHistory)}
          variant="outline"
          className="w-full md:w-auto flex items-center gap-2"
        >
          <History className="w-4 h-4" />
          {showHistory ? "Ocultar Histórico" : "Ver Histórico de Salários"}
        </Button>

        {showHistory && (
          <Card className="p-4 md:p-6 animate-accordion-down">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              Histórico de Salários
              <History className="h-5 w-5 text-muran-primary" />
            </h2>
            <div className="space-y-4">
              {salaries.map((salary, index) => {
                const [year, month] = salary.month.split('-');
                const date = new Date(Number(year), Number(month) - 1);
                return (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-2 md:gap-0"
                  >
                    <span className="font-medium">
                      {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)}
                    </span>
                    <span className="text-green-600 font-semibold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(salary.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ManagerFinancial;