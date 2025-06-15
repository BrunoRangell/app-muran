
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MenuItem } from "@/types/sidebar";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarMenuItemProps extends MenuItem {
  isActive: boolean;
  onClick?: () => void;
  isCollapsed?: boolean;
}

export const SidebarMenuItem = ({ 
  icon: Icon, 
  label, 
  path, 
  submenu,
  isActive,
  onClick,
  isCollapsed = false
}: SidebarMenuItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const hasSubmenu = submenu && submenu.length > 0;

  const toggleSubmenu = (e: React.MouseEvent) => {
    if (hasSubmenu) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  const isItemActive = hasSubmenu 
    ? isActive || (isOpen && submenu?.some(item => item.path === location.pathname))
    : isActive;

  const MenuLink = () => (
    <Link
      to={hasSubmenu ? "#" : path}
      onClick={(e) => {
        toggleSubmenu(e);
        if (!hasSubmenu && onClick) onClick();
      }}
      className={cn(
        "flex items-center justify-between transition-colors rounded-lg w-full h-12 p-3",
        isItemActive
          ? "bg-muran-primary text-white" 
          : "hover:bg-muran-complementary/80 text-gray-300",
      )}
    >
      <div className="flex items-center gap-x-3 overflow-hidden">
        <Icon size={20} className="flex-shrink-0" />
        <div className={cn(
          "transition-all duration-300 ease-in-out",
          isCollapsed ? "w-0 opacity-0" : "w-full opacity-100"
        )}>
          <span className="whitespace-nowrap">{label}</span>
        </div>
      </div>
      {hasSubmenu && (
        <ChevronDown 
          size={16} 
          className={cn(
            "transition-opacity duration-300 ease-in-out flex-shrink-0",
            isOpen && "transform rotate-180",
            isCollapsed && "opacity-0"
          )}
        />
      )}
    </Link>
  );

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <MenuLink />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-muran-dark text-white">
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div>
      <MenuLink />
      
      {hasSubmenu && isOpen && (
        <div className="ml-4 mt-1 space-y-1 border-l-2 border-muran-complementary/30">
          {submenu.map((item) => (
            <SidebarMenuItem
              key={item.path}
              {...item}
              isActive={location.pathname === item.path}
              onClick={onClick}
              isCollapsed={false}
            />
          ))}
        </div>
      )}
    </div>
  );
};
