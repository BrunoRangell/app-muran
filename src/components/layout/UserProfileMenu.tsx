
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, LogOut, ChevronDown, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useCurrentUser } from "@/hooks/useTeamMembers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

export const UserProfileMenu = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: user, isLoading, refetch } = useCurrentUser();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      
      navigate("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: "Ocorreu um erro ao tentar desconectar.",
      });
    }
  };
  
  // Nova função para renovar manualmente a sessão
  const handleRefreshSession = async () => {
    try {
      setIsRefreshing(true);
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw error;
      }
      
      if (data.session) {
        await refetch();
        toast({
          title: "Sessão renovada",
          description: "Sua sessão foi renovada com sucesso.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao renovar sessão",
          description: "Não foi possível renovar sua sessão. Tente fazer login novamente.",
        });
        navigate("/login");
      }
    } catch (error) {
      console.error("Erro ao renovar sessão:", error);
      toast({
        variant: "destructive",
        title: "Erro ao renovar sessão",
        description: "Ocorreu um erro ao tentar renovar sua sessão.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading || !user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none w-full">
        <div className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muran-complementary/10 transition-colors data-[state=open]:bg-muran-primary/10">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.photo_url || ""} alt={user.name} />
              <AvatarFallback className="bg-muran-primary text-white">{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-white">{user.name}</span>
              <span className="text-xs text-gray-400">{user.role}</span>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56 bg-[#4a2f4a] text-white border border-white/20">
        <DropdownMenuItem 
          onClick={handleRefreshSession} 
          disabled={isRefreshing}
          className="cursor-pointer hover:bg-[#5a3a5a] flex items-center"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Renovando sessão...' : 'Renovar sessão'}</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate("/configuracoes")} className="cursor-pointer hover:bg-[#5a3a5a]">
          <Settings className="mr-2 h-4 w-4" />
          <span>Configurações</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-white/10" />
        
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 hover:bg-[#5a3a5a]">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
