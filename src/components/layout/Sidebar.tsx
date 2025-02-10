import { useLocation } from "react-router-dom";
import { 
  Users, 
  DollarSign,
  Home,
  ListTodo,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { SidebarLogo } from "./SidebarLogo";
import { SidebarMenuItem } from "./SidebarMenuItem";
import { SidebarLogout } from "./SidebarLogout";
import { MenuItem } from "@/types/sidebar";

interface SidebarProps {
  onMobileItemClick?: () => void;
}

const adminMenuItems: MenuItem[] = [
  { icon: Home, label: "Início", path: "/" },
  { icon: DollarSign, label: "Financeiro Muran", path: "/clientes" },
  { icon: Users, label: "Equipe", path: "/equipe" },
  { icon: DollarSign, label: "Meu Financeiro", path: "/financeiro" },
  { icon: ListTodo, label: "Gestão de Tarefas", path: "/tarefas" },
];

const regularMenuItems: MenuItem[] = [
  { icon: Home, label: "Início", path: "/" },
  { icon: Users, label: "Equipe", path: "/equipe" },
  { icon: DollarSign, label: "Meu Financeiro", path: "/financeiro" },
  { icon: ListTodo, label: "Gestão de Tarefas", path: "/tarefas" },
];

export const Sidebar = ({ onMobileItemClick }: SidebarProps) => {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const { data: teamMember } = await supabase
            .from('team_members')
            .select('permission')
            .eq('email', session.user.email)
            .single();

          setIsAdmin(teamMember?.permission === 'admin');
        }
      } catch (error) {
        console.error("Erro ao verificar status de admin:", error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, []);

  const menuItems = isAdmin ? adminMenuItems : regularMenuItems;

  return (
    <div className="h-screen w-64 bg-muran-complementary text-white p-4 fixed left-0 top-0">
      <SidebarLogo />
      
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <SidebarMenuItem
            key={item.path}
            {...item}
            isActive={location.pathname === item.path}
            onClick={onMobileItemClick}
          />
        ))}
      </nav>

      <SidebarLogout />
    </div>
  );
};
