import { ReactNode } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Building2,
  CheckSquare,
  LayoutGrid,
  ListChecks,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const railItems = [
  { icon: LayoutGrid, label: "Clientes", path: "/tarefas/clientes" },
  { icon: Building2, label: "Internas", path: "/tarefas/internas" },
  { icon: CheckSquare, label: "Minhas", path: "/tarefas/minhas" },
  { icon: Target, label: "Leads", path: "/tarefas/leads" },
];

const railStatic = [
  { icon: Sparkles, label: "IA" },
  { icon: Users, label: "Equipes" },
  { icon: ListChecks, label: "Painéis" },
];

/** Coluna secundária (árvore) usada pelas telas da seção. */
export const TasksTree = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <aside className="hidden w-[248px] shrink-0 flex-col border-r border-border bg-card/40 lg:flex">
    <div className="px-3 py-2.5 text-[12px] font-semibold text-foreground/90">{title}</div>
    <div className="flex-1 overflow-y-auto px-1.5 pb-4">{children}</div>
  </aside>
);

export const TasksTreeItem = ({
  label,
  count,
  active,
  icon: Icon,
  onClick,
}: {
  label: string;
  count?: number;
  active?: boolean;
  icon?: typeof Building2;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex w-full items-center gap-1.5 rounded-[4px] px-2 py-[5px] text-left text-[12.5px] transition-colors",
      active
        ? "bg-accent font-medium text-foreground"
        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
    )}
  >
    {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-60" />}
    <span className="truncate">{label}</span>
    {count !== undefined && count > 0 && (
      <span className="ml-auto text-[11px] tabular-nums text-muted-foreground/80">{count}</span>
    )}
  </button>
);

export const TasksShell = () => {
  const { pathname } = useLocation();

  return (
    <div className="tasks-dark flex min-h-[calc(100vh-1rem)] overflow-hidden rounded-xl border border-border bg-background text-foreground">
      {/* Trilha fina de ícones */}
      <nav className="flex w-[68px] shrink-0 flex-col items-center gap-1 border-r border-border bg-card/60 py-4">
        {railItems.map((item) => {
          const active = pathname.startsWith(item.path);
          return (
            <Tooltip key={item.path}>
              <TooltipTrigger asChild>
                <NavLink
                  to={item.path}
                  className={cn(
                    "flex w-14 flex-col items-center gap-1 rounded-lg py-2 text-[10px] transition-colors",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
        <div className="my-2 h-px w-8 bg-border" />
        {railStatic.map((item) => (
          <div
            key={item.label}
            className="flex w-14 flex-col items-center gap-1 rounded-lg py-2 text-[10px] text-muted-foreground/50"
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </div>
        ))}
      </nav>

      <div className="flex min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default TasksShell;
