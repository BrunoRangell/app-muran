import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { SalaryChart } from "@/components/managers/SalaryChart";
import { seedInitialData } from "@/lib/seed";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";

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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-muran-dark">Meu Financeiro</h1>
        {salaries.length === 0 && (
          <Button 
            onClick={handleSeedData}
            className="bg-[#ff6e00] hover:bg-[#ff6e00]/90"
          >
            Criar Dados Iniciais
          </Button>
        )}
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">Evolução Salarial</h2>
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
          <Card className="p-6 animate-accordion-down">
            <h2 className="text-xl font-bold mb-6">Histórico de Salários</h2>
            <div className="space-y-4">
              {salaries.map((salary, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium">
                    {new Date(salary.month).toLocaleDateString('pt-BR', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                  <span className="text-green-600 font-semibold">
                    R$ {salary.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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