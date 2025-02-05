import { Link } from "react-router-dom";
import { MenuItem } from "@/types/sidebar";

interface SidebarMenuItemProps extends MenuItem {
  isActive: boolean;
  onClick?: () => void;
}

export const SidebarMenuItem = ({ 
  icon: Icon, 
  label, 
  path, 
  isActive,
  onClick 
}: SidebarMenuItemProps) => {
  return (
    <Link
      to={path}
      onClick={onClick}
      className={`flex items-center space-x-2 p-3 rounded-lg transition-colors ${
        isActive 
          ? "bg-muran-primary text-white" 
          : "hover:bg-muran-complementary/80 text-gray-300"
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  );
};