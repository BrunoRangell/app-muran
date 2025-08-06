
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, LogOut, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useTeamMembers";
import { useAuth } from "@/hooks/useAuth";
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
  const { data: user, isLoading } = useCurrentUser();
  const { logout } = useAuth();

  if (isLoading || !user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none w-full">
        <div className="flex items-center justify-between w-full p-2 h-14 rounded-lg hover:bg-muran-complementary/10 transition-colors data-[state=open]:bg-muran-primary/10">
          <div className={cn(
            "grid items-center gap-x-3 transition-all duration-300 ease-in-out",
            isCollapsed ? "grid-cols-[40px_0fr]" : "grid-cols-[40px_1fr]"
          )}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.photo_url || ""} alt={user.name} />
              <AvatarFallback className="bg-muran-primary text-white">{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-white whitespace-nowrap">{user.name}</span>
                <span className="text-xs text-gray-400 whitespace-nowrap">{user.role}</span>
              </div>
            </div>
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 text-gray-400 transition-all duration-300 ease-in-out",
            isCollapsed && "opacity-0 w-0"
          )} />
        </div>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56 bg-[#4a2f4a] text-white border border-white/20">
        <DropdownMenuItem onClick={() => navigate("/configuracoes")} className="cursor-pointer hover:bg-[#5a3a5a]">
          <Settings className="mr-2 h-4 w-4" />
          <span>Configurações</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-white/10" />
        
        <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-400 hover:bg-[#5a3a5a]">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
