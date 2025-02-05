import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { SalaryChart } from "@/components/managers/SalaryChart";
import { Button } from "@/components/ui/button";
import { History, TrendingUp, Sparkles } from "lucide-react";

interface Salary {
  month: string;
  amount: number;
}

const ManagerFinancial = () => {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Função para carregar os salários
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

  // Carrega os salários ao montar o componente
  useEffect(() => {
    fetchSalaries();
  }, [navigate, toast]);

  // Função para adicionar um novo recebimento
  const handleAddSalary = async (month: string, amount: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/gestores");
      return;
    }

    try {
      const { error } = await supabase
        .from('salaries')
        .insert([{ month, amount, manager_id: session.user.id }]);

      if (error) throw error;

      // Atualiza a lista de salários SEM recarregar a página
      await fetchSalaries();
      toast({ title: "Recebimento adicionado com sucesso!" });
    } catch (error) {
      console.error('Erro ao adicionar recebimento:', error);
      toast({
        title: "Erro ao adicionar recebimento",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
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