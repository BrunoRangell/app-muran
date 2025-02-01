import { useLocation } from "react-router-dom";
import { 
  Home,
  Users, 
  DollarSign,
  ListTodo,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { SidebarLogo } from "./SidebarLogo";
import { SidebarMenuItem } from "./SidebarMenuItem";
import { SidebarLogout } from "./SidebarLogout";
import { MenuItem } from "@/types/sidebar";

const menuItems: MenuItem[] = [
  { icon: Home, label: "Início", path: "/" },
  { icon: Users, label: "Clientes", path: "/clientes" },
  { icon: Users, label: "Equipe", path: "/equipe" },
  { icon: DollarSign, label: "Meu Financeiro", path: "/financeiro" },
  { icon: ListTodo, label: "Gestão de Tarefas", path: "/tarefas" },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="h-screen w-64 bg-muran-complementary text-white p-4 fixed left-0 top-0">
      <SidebarLogo />
      
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <SidebarMenuItem
            key={item.path}
            {...item}
            isActive={location.pathname === item.path}
          />
        ))}
      </nav>

      <SidebarLogout />
    </div>
  );
};