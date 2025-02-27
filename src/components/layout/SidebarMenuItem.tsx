
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MenuItem } from "@/types/sidebar";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SidebarMenuItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  isActive: boolean;
  isCollapsed?: boolean;
  path?: string;
  submenu?: any[];
  onClick?: () => void;
}

export const SidebarMenuItem = ({ 
  icon: Icon, 
  label, 
  href,
  path,
  submenu,
  isActive,
  isCollapsed = false,
  onClick 
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

  if (isCollapsed) {
    return (
      <Link
        to={hasSubmenu ? "#" : href}
        onClick={(e) => {
          toggleSubmenu(e);
          if (!hasSubmenu && onClick) onClick();
        }}
        className={cn(
          "flex items-center justify-center p-3 rounded-lg transition-colors",
          isItemActive
            ? "bg-muran-primary text-white" 
            : "hover:bg-muran-complementary/80 text-gray-300",
        )}
        title={label}
      >
        <Icon size={20} />
      </Link>
    );
  }

  return (
    <div>
      <Link
        to={hasSubmenu ? "#" : href}
        onClick={(e) => {
          toggleSubmenu(e);
          if (!hasSubmenu && onClick) onClick();
        }}
        className={cn(
          "flex items-center justify-between p-3 rounded-lg transition-colors",
          isItemActive
            ? "bg-muran-primary text-white" 
            : "hover:bg-muran-complementary/80 text-gray-300",
        )}
      >
        <div className="flex items-center space-x-2">
          <Icon size={20} />
          <span>{label}</span>
        </div>
        {hasSubmenu && (
          <ChevronDown 
            size={16} 
            className={cn(
              "transition-transform duration-200",
              isOpen && "transform rotate-180"
            )}
          />
        )}
      </Link>

      {hasSubmenu && isOpen && (
        <div className="ml-4 mt-1 space-y-1 border-l-2 border-muran-complementary/30">
          {submenu.map((item) => (
            <SidebarMenuItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              href={item.href || '#'}
              path={item.path}
              isActive={location.pathname === item.path}
              isCollapsed={isCollapsed}
              onClick={onClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};
