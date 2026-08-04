import { ReactNode, Suspense } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Building2,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Folder,
  FolderOpen,
  LayoutGrid,
  Users,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TaskListSkeleton } from "./TasksSkeleton";

const railItems = [
  { icon: LayoutGrid, label: "Espaços", path: "/tarefas/espacos" },
  { icon: Users, label: "Membros", path: "/tarefas/membros" },
];

/** Coluna secundária (árvore) usada pelas telas da seção. */
export const TasksTree = ({
  title,
  children,
  collapsed = false,
  onToggleCollapse,
}: {
  title: string;
  children: ReactNode;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) => (
  <aside
    className={cn(
      "hidden shrink-0 flex-col border-r border-border bg-card/40 transition-[width] duration-200 lg:flex",
      collapsed ? "w-[44px]" : "w-[248px]"
    )}
  >
    <div className="flex items-center gap-1 px-2 py-2.5">
      {!collapsed && (
        <span className="flex-1 truncate px-1 text-[12px] font-semibold text-foreground/90">
          {title}
        </span>
      )}
      {onToggleCollapse && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? "Expandir painel" : "Recolher painel"}
              className="mx-auto flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
            >
              {collapsed ? (
                <ChevronsRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronsLeft className="h-3.5 w-3.5" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{collapsed ? "Expandir" : "Recolher"}</TooltipContent>
        </Tooltip>
      )}
    </div>
    {!collapsed && <div className="flex-1 overflow-y-auto px-1.5 pb-4">{children}</div>}
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
