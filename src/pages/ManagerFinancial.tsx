import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { SalaryChart } from "@/components/managers/SalaryChart";

interface Salary {
  month: Date;
  amount: number;
}

const ManagerFinancial = () => {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-muran-dark">Meu Financeiro</h1>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">Evolução Salarial</h2>
        <SalaryChart />
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">Histórico de Salários</h2>
        <div className="space-y-4">
          {salaries.map((salary, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
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
    </div>
  );
};

export default ManagerFinancial;