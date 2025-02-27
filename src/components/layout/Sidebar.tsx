
import { ElementRef, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { NavLink, useLocation } from "react-router-dom";
import { SidebarLogo } from "./SidebarLogo";
import { SidebarMenuItem } from "./SidebarMenuItem";
import { SidebarLogout } from "./SidebarLogout";
import { Button } from "@/components/ui/button";
import { UserProfileMenu } from "./UserProfileMenu";
import { PanelLeftInactive, DollarSign } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { menuItems } from "@/components/layout/menuItems";

interface SidebarProps {
  onMobileItemClick?: () => void;
}

export const Sidebar = ({ onMobileItemClick }: SidebarProps = {}) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const pathname = location.pathname;

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  const [isCollapsed, setIsCollapsed] = useState(false);
  const sidebarRef = useRef<ElementRef<"aside">>(null);

  useEffect(() => {
    if (isMobile) {
      handleCollapse();
    } else {
      handleExpand();
    }
  }, [isMobile]);

  const handleExpand = () => {
    if (!sidebarRef.current) return;
    setIsCollapsed(false);
  };

  const handleCollapse = () => {
    if (!sidebarRef.current) return;
    setIsCollapsed(true);
  };

  const resetWidth = () => {
    if (!sidebarRef.current) return;
    setIsCollapsed(false);
  };

  const toggleSidebar = () => {
    if (isCollapsed) {
      handleExpand();
    } else {
      handleCollapse();
    }
  };

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        "group/sidebar relative h-full bg-card duration-500 flex flex-col",
        isCollapsed ? "w-[70px]" : "w-60"
      )}
    >
      <div
        onClick={toggleSidebar}
        role="button"
        className={cn(
          "h-6 w-6 text-muted-foreground rounded-sm hover:bg-zinc-300 dark:hover:bg-zinc-600 absolute top-3 right-2 opacity-0 group-hover/sidebar:opacity-100 transition",
          isCollapsed && "opacity-100 rotate-180"
        )}
      >
        <PanelLeftInactive className="h-6 w-6" />
      </div>
      <SidebarLogo isCollapsed={isCollapsed} />
      <div className="mt-4 flex flex-col gap-1 px-2">
        {menuItems.map((item, index) => (
          <SidebarMenuItem
            key={index}
            isCollapsed={isCollapsed}
            isActive={
              item.href === "/novo-recebimentos" 
                ? isActive("/novo-recebimentos") 
                : isActive(item.href)
            }
            icon={item.icon}
            label={item.label}
            href={item.href}
            onClick={onMobileItemClick}
          />
        ))}

        {/* Nova opção de menu para a página recriada */}
        <SidebarMenuItem
          isCollapsed={isCollapsed}
          isActive={isActive("/novo-recebimentos")}
          icon={DollarSign}
          label="Novo Recebimentos"
          href="/novo-recebimentos"
          onClick={onMobileItemClick}
        />
      </div>
      <div className="mt-auto px-2 mb-4">
        <UserProfileMenu isCollapsed={isCollapsed} />
        <SidebarLogout isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
};
