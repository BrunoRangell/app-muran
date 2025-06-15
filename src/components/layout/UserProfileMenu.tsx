
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, LogOut, ChevronDown } from "lucide-react";
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
import { cn } from "@/lib/utils";

export const UserProfileMenu = ({ isCollapsed }: { isCollapsed?: boolean }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: user, isLoading } = useCurrentUser();

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

  if (isLoading || !user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none w-full">
        <div className="flex items-center justify-between w-full p-3 h-14 rounded-lg hover:bg-muran-complementary/10 transition-colors data-[state=open]:bg-muran-primary/10">
          <div className="flex items-center gap-x-3 overflow-hidden">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={user.photo_url || ""} alt={user.name} />
              <AvatarFallback className="bg-muran-primary text-white">{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className={cn(
              "flex flex-col items-start transition-all duration-300 ease-in-out",
              isCollapsed ? "w-0 opacity-0" : "w-full opacity-100"
            )}>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-white whitespace-nowrap">{user.name}</span>
                <span className="text-xs text-gray-400 whitespace-nowrap">{user.role}</span>
              </div>
            </div>
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 text-gray-400 transition-opacity duration-300 ease-in-out flex-shrink-0",
            isCollapsed && "opacity-0"
          )} />
        </div>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56 bg-[#4a2f4a] text-white border border-white/20">
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
