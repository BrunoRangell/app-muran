
import { Card } from "@/components/ui/card";
import { SalaryChart } from "@/components/managers/SalaryChart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Financial = () => {
  const { memberId: paramMemberId } = useParams();

  const { data: salaries = [], isLoading } = useQuery({
    queryKey: ["salaries", paramMemberId],
    queryFn: async () => {
      console.log("Iniciando busca de salários...");
      console.log("ID do membro nos parâmetros:", paramMemberId);
      
      // Se temos um ID nos parâmetros, usamos ele diretamente
      if (paramMemberId) {
        console.log("Buscando salários do membro específico:", paramMemberId);
        const { data, error } = await supabase
          .from("salaries")
          .select("month, amount")
          .eq("team_member_id", paramMemberId)
          .order("month", { ascending: false });

        if (error) {
          console.error("Erro ao buscar salários do membro:", error);
          throw error;
        }

        console.log("Salários encontrados para o membro:", data);
        return data || [];
      }
      
      // Caso contrário, buscamos o usuário atual
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        console.log("Usuário não autenticado");
        return [];
      }
      
      console.log("Buscando salários do usuário atual:", session.user.email);
      
      const { data: currentUser } = await supabase
        .from("team_members")
        .select("id")
        .eq("email", session.user.email)
        .single();
        
      if (!currentUser?.id) {
        console.log("ID do usuário atual não encontrado");
        return [];
      }

      console.log("ID do usuário atual:", currentUser.id);

      const { data, error } = await supabase
        .from("salaries")
        .select("month, amount")
        .eq("team_member_id", currentUser.id)
        .order("month", { ascending: false });

      if (error) {
        console.error("Erro ao buscar salários do usuário atual:", error);
        throw error;
      }

      console.log("Salários encontrados para o usuário atual:", data);
      return data || [];
    },
  });

  const { data: member } = useQuery({
    queryKey: ["team_member", paramMemberId],
    enabled: !!paramMemberId,
    queryFn: async () => {
      console.log("Buscando informações do membro:", paramMemberId);
      
      const { data, error } = await supabase
        .from("team_members")
        .select("name")
        .eq("id", paramMemberId)
        .single();

      if (error) {
        console.error("Erro ao buscar membro:", error);
        throw error;
      }

      console.log("Membro encontrado:", data);
      return data;
    }
  });

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-xl md:text-3xl font-bold text-muran-dark">
          {paramMemberId ? `Financeiro - ${member?.name}` : "Meu Financeiro"}
        </h1>
      </div>

      <Card className="p-4 md:p-6">
        <div className="space-y-4 md:space-y-6">
          <div className="bg-muran-primary/5 rounded-lg p-3 md:p-4 border-l-4 border-muran-primary">
            <p className="text-sm md:text-base text-muran-complementary">
              {paramMemberId 
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
