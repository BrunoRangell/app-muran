
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MenuItem } from "@/types/sidebar";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarMenuItemProps extends MenuItem {
  isActive: boolean;
  onClick?: () => void;
}

export const SidebarMenuItem = ({ 
  icon: Icon, 
  label, 
  path, 
  submenu,
  isActive,
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

  return (
    <div>
      <Link
        to={hasSubmenu ? "#" : path}
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
              {...item}
              isActive={location.pathname === item.path}
              onClick={onClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};
