import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

interface Salary {
  month: string;
  amount: number;
}

const mockSalaries: Salary[] = [
  { month: "Janeiro 2024", amount: 3500 },
  { month: "Fevereiro 2024", amount: 3500 },
  { month: "Março 2024", amount: 3800 },
];

const ManagerFinancial = () => {
  const [salaries, setSalaries] = useState<Salary[]>(mockSalaries);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/gestores");
      }
    };

    checkAuth();
  }, [navigate]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-muran-dark">Meu Financeiro</h1>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">Histórico de Salários</h2>
        <div className="space-y-4">
          {salaries.map((salary, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
            >
              <span className="font-medium">{salary.month}</span>
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