
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { ChartBar, Settings, Grid2X2, List, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  isActive?: boolean;
  isPending?: boolean;
  isDisabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

function NavItem({
  href,
  icon,
  title,
  isActive,
  isPending,
  isDisabled,
  onClick,
}: NavItemProps) {
  return (
    <Link
      to={href}
      aria-disabled={isDisabled}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-[#ff6e00]/10 text-[#ff6e00] font-medium"
          : "text-[#321e32] hover:text-[#ff6e00] hover:bg-[#ebebf0]",
        isPending && "opacity-60 cursor-wait",
        isDisabled && "opacity-60 pointer-events-none cursor-not-allowed"
      )}
    >
      {icon}
      {title}
    </Link>
  );
}

export function SideNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Manipulador simplificado para navegação usando React Router
  const handleNavItemClick = (tabParam: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    // Usar o navigate do React Router para atualizar a URL
    navigate(`/revisao-diaria-avancada-v2?tab=${tabParam}`);
  };
  
  // Lista de itens de navegação
  const navItems = [
    {
      title: "Dashboard",
      href: "/revisao-diaria-avancada-v2",
      icon: <Grid2X2 size={18} />,
      match: (path: string) => path === "/revisao-diaria-avancada-v2" || path.includes("tab=dashboard"),
      onClick: handleNavItemClick("dashboard")
    },
    {
      title: "Revisão Meta Ads",
      href: "/revisao-diaria-avancada-v2?tab=meta",
      icon: <ChartBar size={18} />,
      match: (path: string) => path.includes("tab=meta"),
      onClick: handleNavItemClick("meta")
    },
    {
      title: "Revisão Google Ads",
      href: "/revisao-diaria-avancada-v2?tab=google",
      icon: <ChartBar size={18} />,
      match: (path: string) => path.includes("tab=google"),
      onClick: handleNavItemClick("google")
    },
    {
      title: "Gerenciamento de Orçamentos",
      href: "/revisao-diaria-avancada-v2?tab=budgets",
      icon: <List size={18} />,
      match: (path: string) => path.includes("tab=budgets"),
      onClick: handleNavItemClick("budgets")
    },
    {
      title: "Orçamentos Personalizados",
      href: "/revisao-diaria-avancada-v2?tab=custom-budgets",
      icon: <List size={18} />,
      match: (path: string) => path.includes("tab=custom-budgets"),
      onClick: handleNavItemClick("custom-budgets")
    },
    {
      title: "Configurações",
      href: "/revisao-diaria-avancada-v2?tab=settings",
      icon: <Settings size={18} />,
      match: (path: string) => path.includes("tab=settings"),
      onClick: handleNavItemClick("settings")
    },
  ];
  
  // Filtrar itens pela busca
  const filteredItems = navItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="sticky top-0 h-screen pb-12 border-r">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Revisão Diária V2
          </h2>
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="pl-8 bg-slate-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="px-3">
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="space-y-1">
              {filteredItems.map((item, i) => (
                <NavItem
                  key={i}
                  href={item.href}
                  title={item.title}
                  icon={item.icon}
                  isActive={item.match(location.pathname + location.search)}
                  onClick={item.onClick}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
