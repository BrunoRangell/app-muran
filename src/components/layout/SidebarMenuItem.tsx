
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
        "flex items-center transition-colors rounded-lg w-full",
        isCollapsed ? "p-2 justify-center" : "p-3 justify-between",
        isItemActive
          ? "bg-muran-primary text-white" 
          : "hover:bg-muran-complementary/80 text-gray-300",
      )}
    >
      <div className={cn(
        "grid items-center transition-all duration-200",
        isCollapsed ? "grid-cols-[20px_0fr]" : "grid-cols-[20px_1fr] gap-x-2"
      )}>
        <Icon size={20} />
        <div className="overflow-hidden">
          <span className="whitespace-nowrap">{label}</span>
        </div>
      </div>
      {hasSubmenu && (
        <ChevronDown 
          size={16} 
          className={cn(
            "transition-all duration-200",
            isOpen && "transform rotate-180",
            isCollapsed && "opacity-0 w-0"
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
