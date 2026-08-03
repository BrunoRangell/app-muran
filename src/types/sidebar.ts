
import { LucideIcon } from "lucide-react";

export interface MenuItem {
  icon: LucideIcon;
  label: string;
  path: string;
  submenu?: MenuItem[];
  /** Abre a rota em uma nova aba do navegador (app standalone). */
  external?: boolean;
}

export interface SidebarProps {
  menuItems: MenuItem[];
}
