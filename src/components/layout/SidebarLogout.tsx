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
      
      // Tenta fazer o logout no Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Erro ao fazer logout no Supabase:", error);
        // Mesmo com erro, vamos limpar a sessão local
        await supabase.auth.clearSession();
      }

      // Limpa a sessão local
      console.log("Limpando sessão local...");
      localStorage.removeItem('supabase.auth.token');
      
      console.log("Logout realizado com sucesso");
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });

      // Sempre redireciona para login
      navigate("/login");
      
    } catch (error) {
      console.error("Erro inesperado ao fazer logout:", error);
      
      // Mesmo com erro, tenta limpar a sessão local
      try {
        await supabase.auth.clearSession();
        localStorage.removeItem('supabase.auth.token');
      } catch (clearError) {
        console.error("Erro ao limpar sessão:", clearError);
      }

      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: "Ocorreu um erro inesperado, mas você foi desconectado.",
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