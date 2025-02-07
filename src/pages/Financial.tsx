
import { Card } from "@/components/ui/card";
import { SalaryChart } from "@/components/managers/SalaryChart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Financial = () => {
  const { memberId } = useParams();

  const { data: salaries = [], isLoading } = useQuery({
    queryKey: ["salaries", memberId],
    queryFn: async () => {
      console.log("Buscando salários do usuário...", memberId);
      
      if (!memberId) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          console.log("Usuário não autenticado");
          return [];
        }
        memberId = session.user.id;
      }

      const { data, error } = await supabase
        .from("salaries")
        .select("month, amount")
        .eq("manager_id", memberId)
        .order("month", { ascending: false });

      if (error) {
        console.error("Erro ao buscar salários:", error);
        throw error;
      }

      console.log("Salários encontrados:", data);
      return data || [];
    },
  });

  const { data: member } = useQuery({
    queryKey: ["team_member", memberId],
    enabled: !!memberId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("name")
        .eq("id", memberId)
        .single();

      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-xl md:text-3xl font-bold text-muran-dark">
          {memberId ? `Financeiro - ${member?.name}` : "Meu Financeiro"}
        </h1>
      </div>

      <Card className="p-4 md:p-6">
        <div className="space-y-4 md:space-y-6">
          <div className="bg-muran-primary/5 rounded-lg p-3 md:p-4 border-l-4 border-muran-primary">
            <p className="text-sm md:text-base text-muran-complementary">
              {memberId 
                ? "Visualize a evolução financeira do membro selecionado."
                : "Acompanhe sua evolução financeira e celebre cada conquista! Na Muran, acreditamos no seu potencial e queremos fazer parte da sua jornada de crescimento. 🚀"
              }
            </p>
          </div>
          <div className="w-full overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
            <div className="min-w-[600px] md:min-w-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 text-muran-primary animate-spin" />
                </div>
              ) : (
                <SalaryChart salaries={salaries} />
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Financial;

