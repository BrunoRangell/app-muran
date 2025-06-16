
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
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

  // Para modo retraído com submenu, criar um botão ao invés de Link
  const CollapsedSubmenuButton = () => (
    <button
      onClick={(e) => {
        e.preventDefault();
        setIsPopoverOpen(!isPopoverOpen);
      }}
      className={cn(
        "flex items-center transition-colors rounded-lg w-full h-12 p-2 justify-center",
        isItemActive
          ? "bg-muran-primary text-white" 
          : "hover:bg-muran-complementary/80 text-gray-300",
      )}
    >
      <Icon size={20} />
    </button>
  );

  // Para modo normal ou items sem submenu
  const MenuLink = () => (
    <Link
      to={hasSubmenu ? "#" : path}
      onClick={(e) => {
        if (hasSubmenu && !isCollapsed) {
          toggleSubmenu(e);
        }
        if (!hasSubmenu && onClick) onClick();
      }}
      className={cn(
        "flex items-center transition-colors rounded-lg w-full h-12",
        isCollapsed ? "p-2 justify-center" : "p-3 justify-between",
        isItemActive
          ? "bg-muran-primary text-white" 
          : "hover:bg-muran-complementary/80 text-gray-300",
      )}
    >
      <div className={cn(
        "grid items-center transition-all duration-300 ease-in-out",
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
            "transition-all duration-300 ease-in-out",
            isOpen && "transform rotate-180",
            isCollapsed && "opacity-0 w-0"
          )}
        />
      )}
    </Link>
  );

  // Componente do submenu para o popover
  const SubmenuContent = () => (
    <div className="w-48 p-2">
      <div className="text-sm font-medium text-muran-primary mb-2">{label}</div>
      <div className="space-y-1">
        {submenu?.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => {
              setIsPopoverOpen(false);
              if (onClick) onClick();
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
              location.pathname === item.path
                ? "bg-muran-primary text-white"
                : "hover:bg-muran-secondary text-gray-700 hover:text-gray-900"
            )}
          >
            <item.icon size={16} />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );

  if (isCollapsed) {
    return (
      <TooltipProvider>
        {hasSubmenu ? (
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <div>
                <CollapsedSubmenuButton />
              </div>
            </PopoverTrigger>
            <PopoverContent 
              side="right" 
              align="start" 
              className="bg-white border border-gray-200 shadow-lg z-50"
              sideOffset={8}
            >
              <SubmenuContent />
            </PopoverContent>
          </Popover>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <MenuLink />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-muran-dark text-white z-50">
              <p>{label}</p>
            </TooltipContent>
          </Tooltip>
        )}
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
