
import { Card } from "@/components/ui/card";
import { SalaryChart } from "@/components/managers/SalaryChart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const Financial = () => {
  const { data: salaries = [], isLoading } = useQuery({
    queryKey: ["salaries"],
    queryFn: async () => {
      console.log("Buscando salários do usuário...");
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        console.log("Usuário não autenticado");
        return [];
      }

      const { data, error } = await supabase
        .from("salaries")
        .select("month, amount")
        .eq("manager_id", session.user.id)
        .order("month", { ascending: false });

      if (error) {
        console.error("Erro ao buscar salários:", error);
        throw error;
      }

      console.log("Salários encontrados:", data);
      return data || [];
    },
  });

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto space-y-4 p-4 md:p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl md:text-3xl font-bold text-muran-dark">
            Meu Financeiro
          </h1>
        </div>

        <Card className="p-4 md:p-6">
          <div className="space-y-4 md:space-y-6">
            <div className="bg-muran-primary/5 rounded-lg p-3 md:p-4 border-l-4 border-muran-primary">
              <p className="text-sm md:text-base text-muran-complementary">
                Acompanhe sua evolução financeira e celebre cada conquista! 
                Na Muran, acreditamos no seu potencial e queremos fazer parte 
                da sua jornada de crescimento. 🚀
              </p>
            </div>
            <div className="w-full overflow-x-auto">
              <div className="min-w-[600px] md:min-w-0">
                {isLoading ? (
                  <p className="text-center text-gray-500">Carregando dados financeiros...</p>
                ) : (
                  <SalaryChart salaries={salaries} />
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Financial;
