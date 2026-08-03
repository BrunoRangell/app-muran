import { ReactNode, Suspense } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Building2,
  CheckSquare,
  ChevronRight,
  Folder,
  FolderOpen,
  LayoutGrid,
  ListChecks,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TaskListSkeleton } from "./TasksSkeleton";

const railItems = [
  { icon: LayoutGrid, label: "Pastas", path: "/tarefas/clientes" },
  { icon: Building2, label: "Internas", path: "/tarefas/internas" },
  { icon: CheckSquare, label: "Minhas", path: "/tarefas/minhas" },
  { icon: Target, label: "Leads", path: "/tarefas/leads" },
  { icon: Users, label: "Membros", path: "/tarefas/membros" },
];

const railStatic = [
  { icon: Sparkles, label: "IA" },
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
      "group flex w-full items-center gap-1.5 rounded-[4px] px-2 py-[5px] text-left text-[12.5px] transition-colors",
      active
        ? "bg-primary/15 font-medium text-foreground shadow-[inset_2px_0_0_0_hsl(var(--primary))]"
        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
    )}
  >
    {Icon && (
      <Icon
        className={cn(
          "h-3.5 w-3.5 shrink-0 transition-opacity",
          active ? "text-primary opacity-100" : "opacity-60 group-hover:opacity-90"
        )}
      />
    )}
    <span className="truncate">{label}</span>
    {count !== undefined && count > 0 && (
      <span className="ml-auto text-[11px] tabular-nums text-muted-foreground/80">{count}</span>
    )}
  </button>
);

/** Nó de pasta (cliente/área) com chevron animado e ícone de pasta aberta/fechada. */
export const TasksTreeFolder = ({
  label,
  expanded,
  active,
  onToggle,
  children,
}: {
  label: string;
  expanded: boolean;
  active?: boolean;
  onToggle: () => void;
  children?: ReactNode;
}) => (
  <div>
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "group flex w-full items-center gap-1.5 rounded-[4px] px-2 py-[5px] text-left text-[12.5px] transition-colors",
        active || expanded
          ? "text-foreground"
          : "text-foreground/80 hover:text-foreground",
        "hover:bg-accent/60"
      )}
    >
      <ChevronRight
        className={cn(
          "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
          expanded && "rotate-90"
        )}
      />
      {expanded ? (
        <FolderOpen className="h-3.5 w-3.5 shrink-0 text-primary/80" />
      ) : (
        <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
      )}
      <span className="truncate">{label}</span>
    </button>
    <div
      className={cn(
        "grid transition-all duration-200 ease-out",
        expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}
    >
      <div className="overflow-hidden">
        <div className="ml-[18px] border-l border-border/70 pl-1">{children}</div>
      </div>
    </div>
  </div>
);

export const TasksShell = () => {
  const { pathname } = useLocation();

  return (
    <div className="tasks-dark flex h-screen w-screen overflow-hidden bg-background text-foreground">
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

      <div className="flex min-h-0 min-w-0 flex-1">
        <Suspense
          fallback={
            <div className="min-w-0 flex-1 p-4">
              <TaskListSkeleton />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
};

export default TasksShell;
