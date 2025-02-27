
import { DollarSign, Users, BarChart3, Wallet, Calendar, Settings, Home } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface MenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

export const menuItems: MenuItem[] = [
  {
    icon: Home,
    label: "Dashboard",
    href: "/"
  },
  {
    icon: Users,
    label: "Clientes",
    href: "/clientes"
  },
  {
    icon: DollarSign,
    label: "Recebimentos",
    href: "/clientes/recebimentos"
  },
  {
    icon: BarChart3,
    label: "Financeiro",
    href: "/financeiro"
  },
  {
    icon: Wallet,
    label: "Custos",
    href: "/custos"
  },
  {
    icon: Calendar,
    label: "Tarefas",
    href: "/tarefas"
  },
  {
    icon: Settings,
    label: "Configurações",
    href: "/configuracoes"
  }
];
