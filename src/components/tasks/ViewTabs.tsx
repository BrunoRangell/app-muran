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
import { ChevronDown, Copy, LayoutGrid, List, Lock, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GroupBy,
  GROUP_BY_LABEL,
  SortBy,
  SortDir,
  SortValue,
  SORT_BY_LABEL,
  TaskMember,
  TaskView,
  TaskViewFilters,
  ViewType,
  parseSort,
  serializeSort,
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
  sort_by: SortValue | null;
  filters: TaskViewFilters | null;
  /** true quando é uma visualização salva em task_views */
  saved?: boolean;
  is_private?: boolean;
  owner_id?: string | null;
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
  saved: true,
  is_private: v.is_private,
  owner_id: v.owner_id,
});

const ViewFormDialog = ({
  open,
  onOpenChange,
  initial,
  title,
  canBePrivate,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Partial<ActiveView>;
  title: string;
  canBePrivate: boolean;
  onSubmit: (values: {
    name: string;
    view_type: ViewType;
    group_by: GroupBy;
    sort_by: SortValue | null;
    filters: TaskViewFilters;
    is_private: boolean;
  }) => void;
}) => {
  const initialSort = parseSort(initial?.sort_by);
  const [name, setName] = useState(initial?.name ?? "");
  const [viewType, setViewType] = useState<ViewType>(initial?.view_type ?? "list");
  const [groupBy, setGroupBy] = useState<GroupBy>(initial?.group_by ?? "status");
  const [sortBy, setSortBy] = useState<string>(initialSort.field ?? NONE);
  const [sortDir, setSortDir] = useState<SortDir>(initialSort.dir);
  const [isPrivate, setIsPrivate] = useState(!!initial?.is_private);


  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (v) {
          const s = parseSort(initial?.sort_by);
          setName(initial?.name ?? "");
          setViewType(initial?.view_type ?? "list");
          setGroupBy(initial?.group_by ?? "status");
          setSortBy(s.field ?? NONE);
          setSortDir(s.dir);
          setIsPrivate(!!initial?.is_private);
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
              <Label>Direção</Label>
              <Select
                value={sortDir}
                onValueChange={(v) => setSortDir(v as SortDir)}
                disabled={sortBy === NONE}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="tasks-dark">
                  <SelectItem value="asc">Crescente</SelectItem>
                  <SelectItem value="desc">Decrescente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Visibilidade</Label>
              <Select
                value={isPrivate ? "private" : "shared"}
                onValueChange={(v) => setIsPrivate(v === "private")}
                disabled={!canBePrivate}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="tasks-dark">
                  <SelectItem value="shared">Compartilhada</SelectItem>
                  <SelectItem value="private">Somente eu</SelectItem>
                </SelectContent>
              </Select>
              {!canBePrivate && (
                <p className="text-[11px] text-muted-foreground">
                  Seu login não está vinculado a um membro do módulo, então só é possível criar
                  visualizações compartilhadas.
                </p>
              )}
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
                sort_by: sortBy === NONE ? null : serializeSort(sortBy as SortBy, sortDir),
                filters: initial?.filters ?? {},
                is_private: canBePrivate ? isPrivate : false,

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
  currentMemberId,
  toolbar,
  baseViews = DEFAULT_VIEWS,
  currentState,
}: {
  listId: string | null;
  members: TaskMember[];
  activeId: string;
  onChange: (view: ActiveView) => void;
  /** task_members.id do usuário logado (null quando não há vínculo) */
  currentMemberId?: string | null;
  toolbar?: React.ReactNode;
  /** Abas padrão exibidas antes das visualizações salvas. */
  baseViews?: ActiveView[];
  /** Configuração aplicada na tela agora (usada para pré-preencher a criação). */
  currentState?: {
    view_type: ViewType;
    group_by: GroupBy;
    sort_by: SortValue | null;
    filters: TaskViewFilters;
  };
}) => {
  const { data: saved = [] } = useTaskViews(listId);
  const createView = useCreateView();
  const updateView = useUpdateView();
  const deleteView = useDeleteView();
  /** initial pré-preenchido da criação (null = fechado) */
  const [createInitial, setCreateInitial] = useState<Partial<ActiveView> | null>(null);
  const [editing, setEditing] = useState<TaskView | null>(null);

  const tabs = [...baseViews, ...saved.map(toActive)];

  const openCreate = () =>
    setCreateInitial({
      name: "",
      view_type: currentState?.view_type ?? "list",
      group_by: currentState?.group_by ?? "status",
      sort_by: currentState?.sort_by ?? null,
      filters: currentState?.filters ?? {},
      is_private: false,
    });

  const activeIsBase = baseViews.some((b) => b.id === activeId);
  const hasCustomState =
    !!currentState &&
    (Object.values(currentState.filters ?? {}).some((v) =>
      Array.isArray(v) ? v.length > 0 : !!v
    ) ||
      currentState.group_by !== "status" ||
      !!currentState.sort_by);

  return (
    <div className="mb-3 flex items-center gap-1 border-b border-border/70 pb-0 text-[12px]">
      {tabs.map((tab) => {
        const savedView = saved.find((s) => s.id === tab.id);
        const Icon = tab.view_type === "board" ? LayoutGrid : List;
        const active = activeId === tab.id;
        const canManage =
          !!savedView && (!savedView.is_private || savedView.owner_id === currentMemberId);
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
              {tab.is_private && <Lock className="h-3 w-3 opacity-70" />}
            </button>
            {canManage && savedView && (
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
                <DropdownMenuContent align="start" className="tasks-dark min-w-[190px]">
                  <DropdownMenuItem onClick={() => setEditing(savedView)}>Editar</DropdownMenuItem>
                  <DropdownMenuItem onClick={openCreate}>
                    <Copy className="mr-2 h-3.5 w-3.5" /> Salvar como nova visualização
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => {
                      deleteView.mutate(savedView.id);
                      if (active) onChange(baseViews[0]);
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
        onClick={openCreate}
        className="mb-1 ml-1 flex items-center gap-1 rounded px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" /> Visualização
      </button>

      {activeIsBase && hasCustomState && (
        <button
          type="button"
          onClick={openCreate}
          className="mb-1 flex items-center gap-1 rounded px-2 py-1 text-[12px] text-primary transition-colors hover:bg-accent/60"
        >
          <Copy className="h-3.5 w-3.5" /> Salvar como nova visualização
        </button>
      )}

      {toolbar && <div className="mb-1 ml-auto">{toolbar}</div>}

      {createInitial && (
        <ViewFormDialog
          open
          onOpenChange={(v) => !v && setCreateInitial(null)}
          initial={createInitial}
          title="Nova visualização"
          canBePrivate={!!currentMemberId}
          onSubmit={(v) =>
            createView.mutate(
              {
                list_id: listId,
                ...v,
                owner_id: v.is_private ? currentMemberId ?? null : null,
              },
              { onSuccess: (created) => onChange(toActive(created)) }
            )
          }
        />
      )}

      <ViewFormDialog
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        initial={editing ? toActive(editing) : undefined}
        title="Editar visualização"
        canBePrivate={!!currentMemberId}
        onSubmit={(v) => {
          if (!editing) return;
          const owner_id = v.is_private ? editing.owner_id ?? currentMemberId ?? null : null;
          updateView.mutate({ id: editing.id, ...v, owner_id });
          onChange({
            id: editing.id,
            ...v,
            filters: editing.filters,
            saved: true,
            owner_id,
          });
        }}
      />
    </div>
  );
};
