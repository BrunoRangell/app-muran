import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { SalaryChart } from "@/components/managers/SalaryChart";
import { seedInitialData } from "@/lib/seed";
import { Button } from "@/components/ui/button";
import { History, TrendingUp, Sparkles } from "lucide-react";

interface Salary {
  month: Date;
  amount: number;
}

const ManagerFinancial = () => {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
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

    checkAuth();
  }, [navigate, toast]);

  const handleSeedData = async () => {
    try {
      await seedInitialData();
      toast({
        title: "Dados criados com sucesso!",
        description: "Recarregue a página para ver os dados.",
      });
      window.location.reload();
    } catch (error) {
      console.error('Erro ao criar dados:', error);
      toast({
        title: "Erro ao criar dados",
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
        {salaries.length === 0 && (
          <Button 
            onClick={handleSeedData}
            className="bg-muran-primary hover:bg-muran-primary/90 flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Criar Dados Iniciais
          </Button>
        )}
      </div>

      <Card className="p-4 md:p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          Evolução Salarial
          <TrendingUp className="h-5 w-5 text-muran-primary" />
        </h2>
        <SalaryChart />
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
              {salaries.map((salary, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-2 md:gap-0"
                >
                  <span className="font-medium">
                    {new Date(salary.month).toLocaleDateString('pt-BR', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                  <span className="text-green-600 font-semibold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(salary.amount)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ManagerFinancial;