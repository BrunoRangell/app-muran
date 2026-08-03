import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, LayoutGrid, List, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GroupBy,
  GROUP_BY_LABEL,
  SortBy,
  SORT_BY_LABEL,
  TaskMember,
  TaskPriority,
  TaskView,
  TaskViewFilters,
  TASK_PRIORITY_META,
  ViewType,
} from "@/types/tasks";
import {
  useCreateView,
  useDeleteView,
  useTaskViews,
  useUpdateView,
} from "@/hooks/useTaskStructure";

const NONE = "__none__";

export interface ActiveView {
  id: string;
  name: string;
  view_type: ViewType;
  group_by: GroupBy;
  sort_by: SortBy | null;
  filters: TaskViewFilters | null;
}

export const DEFAULT_VIEWS: ActiveView[] = [
  { id: "lista", name: "Lista", view_type: "list", group_by: "status", sort_by: null, filters: null },
  { id: "quadro", name: "Quadro", view_type: "board", group_by: "status", sort_by: null, filters: null },
];

const toActive = (v: TaskView): ActiveView => ({
  id: v.id,
  name: v.name,
  view_type: v.view_type,
  group_by: v.group_by,
  sort_by: v.sort_by,
  filters: v.filters,
});

const ViewFormDialog = ({
  open,
  onOpenChange,
  members,
  initial,
  title,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  members: TaskMember[];
  initial?: Partial<ActiveView>;
  title: string;
  onSubmit: (values: {
    name: string;
    view_type: ViewType;
    group_by: GroupBy;
    sort_by: SortBy | null;
    filters: TaskViewFilters;
  }) => void;
}) => {
  const [name, setName] = useState(initial?.name ?? "");
  const [viewType, setViewType] = useState<ViewType>(initial?.view_type ?? "list");
  const [groupBy, setGroupBy] = useState<GroupBy>(initial?.group_by ?? "status");
  const [sortBy, setSortBy] = useState<string>(initial?.sort_by ?? NONE);
  const [assignee, setAssignee] = useState<string>(initial?.filters?.assignee_id ?? NONE);
  const [priority, setPriority] = useState<string>(initial?.filters?.priority ?? NONE);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (v) {
          setName(initial?.name ?? "");
          setViewType(initial?.view_type ?? "list");
          setGroupBy(initial?.group_by ?? "status");
          setSortBy(initial?.sort_by ?? NONE);
          setAssignee(initial?.filters?.assignee_id ?? NONE);
          setPriority(initial?.filters?.priority ?? NONE);
        }
      }}
    >
      <DialogContent className="tasks-dark max-w-md border-border bg-background text-foreground">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Ex.: Por responsável" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={viewType} onValueChange={(v) => setViewType(v as ViewType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="tasks-dark">
                  <SelectItem value="list">Lista</SelectItem>
                  <SelectItem value="board">Quadro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Agrupar por</Label>
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="tasks-dark">
                  {(Object.keys(GROUP_BY_LABEL) as GroupBy[]).map((g) => (
                    <SelectItem key={g} value={g}>{GROUP_BY_LABEL[g]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ordenar por</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="tasks-dark">
                  <SelectItem value={NONE}>Padrão</SelectItem>
                  {(Object.keys(SORT_BY_LABEL) as SortBy[]).map((s) => (
                    <SelectItem key={s} value={s}>{SORT_BY_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Filtrar responsável</Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="tasks-dark">
                  <SelectItem value={NONE}>Todos</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Filtrar prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="tasks-dark">
                  <SelectItem value={NONE}>Todas</SelectItem>
                  {(Object.keys(TASK_PRIORITY_META) as TaskPriority[]).map((p) => (
                    <SelectItem key={p} value={p}>{TASK_PRIORITY_META[p].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!name.trim()}
            onClick={() => {
              onSubmit({
                name: name.trim(),
                view_type: viewType,
                group_by: groupBy,
                sort_by: sortBy === NONE ? null : (sortBy as SortBy),
                filters: {
                  assignee_id: assignee === NONE ? null : assignee,
                  priority: priority === NONE ? null : (priority as TaskPriority),
                },
              });
              onOpenChange(false);
            }}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/** Abas Lista/Quadro + visualizações salvas (task_views) com "+" de criação. */
export const ViewTabs = ({
  listId,
  members,
  activeId,
  onChange,
}: {
  listId: string;
  members: TaskMember[];
  activeId: string;
  onChange: (view: ActiveView) => void;
}) => {
  const { data: saved = [] } = useTaskViews(listId);
  const createView = useCreateView();
  const updateView = useUpdateView();
  const deleteView = useDeleteView();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TaskView | null>(null);

  const tabs = [...DEFAULT_VIEWS, ...saved.map(toActive)];

  return (
    <div className="mb-3 flex items-center gap-1 border-b border-border/70 pb-0 text-[12px]">
      {tabs.map((tab) => {
        const savedView = saved.find((s) => s.id === tab.id);
        const Icon = tab.view_type === "board" ? LayoutGrid : List;
        const active = activeId === tab.id;
        return (
          <div key={tab.id} className="flex items-center">
            <button
              type="button"
              onClick={() => onChange(tab)}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-2.5 pb-2 pt-1 transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.name}
            </button>
            {savedView && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="mb-1 rounded p-0.5 text-muted-foreground hover:text-foreground"
                    aria-label="Opções da visualização"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="tasks-dark min-w-[160px]">
                  <DropdownMenuItem onClick={() => setEditing(savedView)}>Editar</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => {
                      deleteView.mutate(savedView.id);
                      if (active) onChange(DEFAULT_VIEWS[0]);
                    }}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => setCreating(true)}
        className="mb-1 ml-1 flex items-center gap-1 rounded px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" /> Visualização
      </button>

      <ViewFormDialog
        open={creating}
        onOpenChange={setCreating}
        members={members}
        title="Nova visualização"
        onSubmit={(v) =>
          createView.mutate(
            { list_id: listId, ...v },
            { onSuccess: (created) => onChange(toActive(created)) }
          )
        }
      />
      <ViewFormDialog
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        members={members}
        initial={editing ? toActive(editing) : undefined}
        title="Editar visualização"
        onSubmit={(v) => {
          if (!editing) return;
          updateView.mutate({ id: editing.id, ...v });
          onChange({ id: editing.id, ...v });
        }}
      />
    </div>
  );
};
