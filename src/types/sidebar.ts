
import { LucideIcon } from "lucide-react";

export interface MenuItem {
  icon: LucideIcon;
  label: string;
  path: string;
  submenu?: MenuItem[];
}

export interface SidebarProps {
  menuItems: MenuItem[];
}
