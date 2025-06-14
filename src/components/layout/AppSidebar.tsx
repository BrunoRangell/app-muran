
import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { 
  Home,
  Users, 
  DollarSign,
  ListTodo,
  Receipt,
  CreditCard,
  BarChart3,
  Search,
  Star,
  History,
  Settings,
  User
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarLogo } from "./SidebarLogo";
import { UserProfileMenu } from "./UserProfileMenu";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  isActive?: boolean;
  submenu?: MenuItem[];
}

export const AppSidebar = () => {
  const location = useLocation();
  const { state } = useSidebar();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentPages, setRecentPages] = useState<string[]>([]);

  // Verificar status de admin
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

  // Carregar favoritos e páginas recentes do localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem("sidebar-favorites");
    const savedRecent = localStorage.getItem("sidebar-recent");
    
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
    
    if (savedRecent) {
      setRecentPages(JSON.parse(savedRecent));
    }
  }, []);

  // Atualizar páginas recentes quando a rota mudar
  useEffect(() => {
    const currentPath = location.pathname;
    const updatedRecent = [
      currentPath,
      ...recentPages.filter(page => page !== currentPath)
    ].slice(0, 5);
    
    setRecentPages(updatedRecent);
    localStorage.setItem("sidebar-recent", JSON.stringify(updatedRecent));
  }, [location.pathname]);

  // Definir itens do menu baseado nas permissões
  const dashboardItems: MenuItem[] = [
    {
      title: "Início",
      url: "/",
      icon: Home,
    }
  ];

  const financialItems: MenuItem[] = isAdmin ? [
    {
      title: "Relatório Financeiro",
      url: "/clientes/relatorio",
      icon: DollarSign,
    },
    {
      title: "Clientes",
      url: "/clientes",
      icon: Users,
    },
    {
      title: "Recebimentos",
      url: "/recebimentos-nova",
      icon: Receipt,
    },
    {
      title: "Registro de Custos",
      url: "/clientes/custos",
      icon: CreditCard,
    }
  ] : [];

  const managementItems: MenuItem[] = [
    {
      title: "Equipe",
      url: "/equipe",
      icon: Users,
    },
    {
      title: "Gestão de Tarefas",
      url: "/tarefas",
      icon: ListTodo,
    },
    {
      title: "Revisão Diária",
      url: "/revisao-diaria-avancada",
      icon: BarChart3,
      badge: 3, // Exemplo de badge para notificação
    }
  ];

  const settingsItems: MenuItem[] = [
    {
      title: "Configurações",
      url: "/configuracoes",
      icon: Settings,
    }
  ];

  // Função para verificar se um item está ativo
  const isItemActive = (url: string) => {
    return location.pathname === url;
  };

  // Função para alternar favoritos
  const toggleFavorite = (url: string) => {
    const updatedFavorites = favorites.includes(url)
      ? favorites.filter(fav => fav !== url)
      : [...favorites, url];
    
    setFavorites(updatedFavorites);
    localStorage.setItem("sidebar-favorites", JSON.stringify(updatedFavorites));
  };

  // Filtrar itens baseado na busca
  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    if (!searchQuery) return items;
    
    return items.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Obter todos os itens para busca
  const getAllItems = () => [
    ...dashboardItems,
    ...financialItems,
    ...managementItems,
    ...settingsItems
  ];

  // Obter itens favoritos
  const getFavoriteItems = (): MenuItem[] => {
    const allItems = getAllItems();
    return allItems.filter(item => favorites.includes(item.url));
  };

  // Obter itens recentes
  const getRecentItems = (): MenuItem[] => {
    const allItems = getAllItems();
    return recentPages
      .map(path => allItems.find(item => item.url === path))
      .filter(Boolean) as MenuItem[];
  };

  return (
    <Sidebar className="bg-muran-complementary text-white">
      <SidebarHeader className="p-4">
        <SidebarLogo />
        <UserProfileMenu />
        
        {/* Busca Rápida */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar no menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muran-complementary/80 border-gray-600 text-white placeholder-gray-400"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4">
        {/* Resultados da Busca */}
        {searchQuery && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-gray-300">
              Resultados da Busca
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filterMenuItems(getAllItems()).map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isItemActive(item.url)}>
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {item.badge && (
                          <Badge variant="destructive" className="ml-auto">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Menu Normal */}
        {!searchQuery && (
          <>
            {/* Favoritos */}
            {favorites.length > 0 && (
              <>
                <SidebarGroup>
                  <SidebarGroupLabel className="text-gray-300 flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Favoritos
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {getFavoriteItems().map((item) => (
                        <SidebarMenuItem key={item.url}>
                          <SidebarMenuButton asChild isActive={isItemActive(item.url)}>
                            <Link to={item.url} className="flex items-center gap-3">
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-auto p-1 h-auto"
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleFavorite(item.url);
                                }}
                              >
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              </Button>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
                <SidebarSeparator />
              </>
            )}

            {/* Páginas Recentes */}
            {recentPages.length > 0 && (
              <>
                <SidebarGroup>
                  <SidebarGroupLabel className="text-gray-300 flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Recentes
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {getRecentItems().slice(0, 3).map((item) => (
                        <SidebarMenuItem key={item.url}>
                          <SidebarMenuButton asChild isActive={isItemActive(item.url)}>
                            <Link to={item.url} className="flex items-center gap-3">
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
                <SidebarSeparator />
              </>
            )}

            {/* Dashboard */}
            <SidebarGroup>
              <SidebarGroupLabel className="text-gray-300">
                Dashboard
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {dashboardItems.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={isItemActive(item.url)}>
                        <Link to={item.url} className="flex items-center gap-3">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto p-1 h-auto opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.preventDefault();
                              toggleFavorite(item.url);
                            }}
                          >
                            <Star className={`h-3 w-3 ${favorites.includes(item.url) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                          </Button>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Financeiro - Apenas para Admins */}
            {isAdmin && financialItems.length > 0 && (
              <>
                <SidebarSeparator />
                <SidebarGroup>
                  <SidebarGroupLabel className="text-gray-300">
                    Financeiro
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {financialItems.map((item) => (
                        <SidebarMenuItem key={item.url}>
                          <SidebarMenuButton asChild isActive={isItemActive(item.url)}>
                            <Link to={item.url} className="flex items-center gap-3 group">
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                              {item.badge && (
                                <Badge variant="destructive" className="ml-auto">
                                  {item.badge}
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-auto p-1 h-auto opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleFavorite(item.url);
                                }}
                              >
                                <Star className={`h-3 w-3 ${favorites.includes(item.url) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                              </Button>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </>
            )}

            {/* Gestão */}
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel className="text-gray-300">
                Gestão
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {managementItems.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={isItemActive(item.url)}>
                        <Link to={item.url} className="flex items-center gap-3 group">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          {item.badge && (
                            <Badge variant="destructive" className="ml-auto">
                              {item.badge}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto p-1 h-auto opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.preventDefault();
                              toggleFavorite(item.url);
                            }}
                          >
                            <Star className={`h-3 w-3 ${favorites.includes(item.url) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                          </Button>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Configurações */}
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel className="text-gray-300">
                Sistema
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {settingsItems.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={isItemActive(item.url)}>
                        <Link to={item.url} className="flex items-center gap-3 group">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto p-1 h-auto opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.preventDefault();
                              toggleFavorite(item.url);
                            }}
                          >
                            <Star className={`h-3 w-3 ${favorites.includes(item.url) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                          </Button>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="text-xs text-gray-400 text-center">
          {state === "collapsed" ? "M" : "Muran © 2024"}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
