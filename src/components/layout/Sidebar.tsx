
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
  ChevronLeft,
  Wallet
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
  { icon: BarChart3, label: "Revisão Diária", path: "/revisao-diaria-avancada" },
];

const regularMenuItems: MenuItem[] = [
  { icon: Home, label: "Início", path: "/" },
  { icon: Users, label: "Equipe", path: "/equipe" },
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

  // Selecionar menu baseado na permissão do usuário
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
        "h-screen bg-muran-complementary text-white p-4 fixed left-0 top-0 flex flex-col transition-all duration-300 ease-in-out z-40",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header com logo e botão de toggle */}
      <div className="mb-8 flex items-center justify-between">
        <SidebarLogo isCollapsed={isCollapsed} />
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="text-white hover:bg-white/10 hover:text-white h-10 w-10 shrink-0 transition-all duration-200 hover:scale-105"
          aria-label={isCollapsed ? "Expandir menu" : "Comprimir menu"}
          title={isCollapsed ? "Expandir menu" : "Comprimir menu"}
        >
          {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </Button>
      </div>

      {/* Profile menu */}
      <div className="mb-4">
        <UserProfileMenu isCollapsed={isCollapsed} />
      </div>

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
