
import { useLocation } from "react-router-dom";
import { 
  Users, 
  DollarSign,
  Home,
  ListTodo,
  Receipt,
  CreditCard,
  BarChart3,
  Menu,
  ChevronLeft
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { SidebarLogo } from "./SidebarLogo";
import { SidebarMenuItem } from "./SidebarMenuItem";
import { UserProfileMenu } from "./UserProfileMenu";
import { MenuItem } from "@/types/sidebar";
import { useSidebarCollapse } from "@/hooks/useSidebarCollapse";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  { icon: ListTodo, label: "Gestão de Tarefas", path: "/tarefas" },
  { icon: BarChart3, label: "Revisão Diária", path: "/revisao-diaria-avancada" },
];

const regularMenuItems: MenuItem[] = [
  { icon: Home, label: "Início", path: "/" },
  { icon: Users, label: "Equipe", path: "/equipe" },
  { icon: ListTodo, label: "Gestão de Tarefas", path: "/tarefas" },
  { icon: BarChart3, label: "Revisão Diária", path: "/revisao-diaria-avancada" },
];

export const Sidebar = ({ onMobileItemClick }: SidebarProps) => {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const { isCollapsed, toggleCollapse } = useSidebarCollapse();

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
    <div 
      className={cn(
        "h-screen bg-muran-complementary text-white p-4 fixed left-0 top-0 flex flex-col transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header com botão de toggle */}
      <div className="flex items-center justify-between mb-4">
        {!isCollapsed && <SidebarLogo />}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapse}
          className="text-white hover:bg-muran-complementary/80 p-2 h-8 w-8"
        >
          {isCollapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </div>

      {/* Profile menu - apenas quando expandido */}
      {!isCollapsed && (
        <div className="mb-4">
          <UserProfileMenu />
        </div>
      )}

      {/* Navigation menu */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <SidebarMenuItem
            key={item.path}
            {...item}
            isActive={isPathActive(item.path, item.submenu)}
            onClick={onMobileItemClick}
            isCollapsed={isCollapsed}
          />
        ))}
      </nav>
    </div>
  );
};
