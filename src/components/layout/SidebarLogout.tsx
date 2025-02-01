import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

export const SidebarLogout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      console.log("Iniciando processo de logout...");
      
      // Verifica a sessão atual
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Erro ao verificar sessão:", sessionError);
        navigate("/login");
        return;
      }

      if (!sessionData.session) {
        console.log("Nenhuma sessão ativa encontrada");
        navigate("/login");
        return;
      }

      // Tenta fazer o logout
      const { error: signOutError } = await supabase.auth.signOut({
        scope: 'local'
      });
      
      if (signOutError) {
        console.error("Erro ao fazer logout:", signOutError);
        toast({
          variant: "destructive",
          title: "Erro ao sair",
          description: "Não foi possível fazer logout. Tente novamente.",
        });
        // Mesmo com erro, redireciona para login
        navigate("/login");
        return;
      }

      console.log("Logout realizado com sucesso");
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      navigate("/login");
      
    } catch (error) {
      console.error("Erro inesperado ao fazer logout:", error);
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: "Ocorreu um erro inesperado. Tente novamente.",
      });
      navigate("/login");
    }
  };

  return (
    <div className="absolute bottom-4 left-4 right-4">
      <button 
        onClick={handleLogout}
        className="flex items-center space-x-2 w-full p-3 rounded-lg hover:bg-muran-complementary/80 text-gray-300"
      >
        <LogOut size={20} />
        <span>Sair</span>
      </button>
    </div>
  );
};