
import { useLocation } from "react-router-dom";
import { 
  Users, 
  DollarSign,
  Home,
  ListTodo,
  Receipt,
  CreditCard,
  BarChart3
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { SidebarLogo } from "./SidebarLogo";
import { SidebarMenuItem } from "./SidebarMenuItem";
import { UserProfileMenu } from "./UserProfileMenu";
import { MenuItem } from "@/types/sidebar";

interface SidebarProps {
  onMobileItemClick?: () => void;
}

const financialSubMenu: MenuItem[] = [
  { icon: DollarSign, label: "Relatório Financeiro", path: "/clientes/relatorio" },
  { icon: Users, label: "Clientes", path: "/clientes" },
  { icon: Receipt, label: "Recebimentos", path: "/recebimentos-nova" },
  { icon: CreditCard, label: "Registro de Custos", path: "/clientes/custos" }
];

const adminMenuItems: MenuItem[] = [
  { icon: Home, label: "Início", path: "/" },
  { 
    icon: DollarSign, 
    label: "Financeiro Muran", 
    path: "/clientes",
    submenu: financialSubMenu
  },
  { icon: Users, label: "Equipe", path: "/equipe" },
  { icon: DollarSign, label: "Meu Financeiro", path: "/financeiro" },
  { icon: ListTodo, label: "Gestão de Tarefas", path: "/tarefas" },
  { icon: BarChart3, label: "Revisão Meta Ads", path: "/revisao-meta" },
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

  const isPathActive = (path: string, submenu?: MenuItem[]) => {
    if (submenu) {
      return submenu.some(item => location.pathname === item.path);
    }
    return location.pathname === path;
  };

  return (
    <div className="h-screen w-64 bg-muran-complementary text-white p-4 fixed left-0 top-0 flex flex-col">
      <SidebarLogo />
      <div>
        <UserProfileMenu />
      </div>
      <nav className="flex-1 space-y-2 mt-4">
        {menuItems.map((item) => (
          <SidebarMenuItem
            key={item.path}
            {...item}
            isActive={isPathActive(item.path, item.submenu)}
            onClick={onMobileItemClick}
          />
        ))}
      </nav>
    </div>
  );
};
