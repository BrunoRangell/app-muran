import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarLogo } from "./SidebarLogo";
import { SidebarLogout } from "./SidebarLogout";
import { Home, Users, Wallet, Building2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Sidebar = () => {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      console.log('Verificando permissões do usuário...');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.email) {
          const { data: teamMember } = await supabase
            .from('team_members')
            .select('permission')
            .eq('email', session.user.email)
            .single();

          const userIsAdmin = teamMember?.permission === 'admin';
          console.log('Usuário é admin?', userIsAdmin);
          setIsAdmin(userIsAdmin);
        }
      } catch (error) {
        console.error('Erro ao verificar permissões:', error);
      }
    };

    checkPermissions();
  }, []);

  const adminMenuItems = [
    {
      title: "Início",
      icon: Home,
      href: "/inicio",
    },
    {
      title: "Clientes",
      icon: Building2,
      href: "/clientes",
    },
    {
      title: "Equipe",
      icon: Users,
      href: "/equipe",
    },
    {
      title: "Financeiro",
      icon: Wallet,
      href: "/financeiro",
    },
  ];

  const regularMenuItems = [
    {
      title: "Início",
      icon: Home,
      href: "/inicio",
    },
    {
      title: "Financeiro",
      icon: Wallet,
      href: "/gestor/financeiro",
    },
  ];

  const menuItems = isAdmin ? adminMenuItems : regularMenuItems;

  return (
    <div className="relative flex h-screen w-72 flex-col border-r bg-background">
      <div className="p-6">
        <SidebarLogo />
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {menuItems.map((item) => (
            <Link key={item.href} to={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2",
                  location.pathname === item.href && "bg-muran-secondary text-muran-dark hover:bg-muran-secondary/90"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Button>
            </Link>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4">
        <SidebarLogout />
      </div>
    </div>
  );
};