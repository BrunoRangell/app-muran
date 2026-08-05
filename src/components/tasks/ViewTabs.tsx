import { useEffect, useMemo, useRef, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Check,
  ChevronDown,
  Copy,
  LayoutGrid,
  List,
  Lock,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CLIENT_TASK_STATUSES,
  GroupBy,
  GROUP_BY_LABEL,
  SortBy,
  SortDir,
  SortValue,
  SORT_BY_LABEL,
  TaskMember,
  TaskStatus,
  TaskView,
  TaskViewFilters,
  ViewSlot,
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
import { countActiveFilters, normalizeFilters } from "@/components/tasks/taskGrouping";
import { TaskFiltersPanel } from "@/components/tasks/TaskFiltersPanel";
import { useViewAutosave } from "@/components/tasks/taskPreferences";


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
  /** aba padrão que esta view representa (quando aplicável) */
  slot?: ViewSlot | null;
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
  slot: v.slot ?? null,
});

/** Assinatura estável de (agrupamento, ordenação, filtros) para detectar rascunho. */
const signature = (state: {
  group_by: GroupBy;
  sort_by: SortValue | null;
  filters?: TaskViewFilters | null;
}) => {
  const f = state.filters ?? {};
  return JSON.stringify({
    group_by: state.group_by,
    sort_by: state.sort_by ?? null,
    assignee_ids: [...(f.assignee_ids ?? [])].sort(),
    priorities: [...(f.priorities ?? [])].sort(),
    statuses: [...(f.statuses ?? [])].sort(),
  });
};

const ViewFormDialog = ({
  open,
  onOpenChange,
  initial,
  title,
  canBePrivate,
  members,
  statuses,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Partial<ActiveView>;
  title: string;
  canBePrivate: boolean;
  members: TaskMember[];
  statuses: TaskStatus[];
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
  /** Filtros salvos da visualização (editáveis aqui dentro). */
  const [filters, setFilters] = useState<TaskViewFilters>(
    normalizeFilters(initial?.filters) as TaskViewFilters
  );
  const filterCount = countActiveFilters(filters);


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
          setFilters(normalizeFilters(initial?.filters) as TaskViewFilters);
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
          <div className="space-y-1.5">
            <Label>
              Filtros
              {filterCount > 0 && (
                <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                  {filterCount}
                </span>
              )}
            </Label>
            <div className="rounded-md border border-border p-2">
              <TaskFiltersPanel
                members={members}
                statuses={statuses}
                value={filters}
                onChange={setFilters}
              />
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
                filters,
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

/** Botão "Salvar visualização" + chevron com as 4 opções (estilo ClickUp). */
const SaveViewMenu = ({
  dirty,
  autosave,
  onSave,
  onToggleAutosave,
  onSaveAsNew,
  onRevert,
}: {
  dirty: boolean;
  autosave: boolean;
  onSave: () => void;
  onToggleAutosave: (value: boolean) => void;
  onSaveAsNew: () => void;
  onRevert: () => void;
}) => {
  /** Atalho ⌘↵ / Ctrl+Enter salva a visualização ativa. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && dirty) {
        e.preventDefault();
        onSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dirty, onSave]);

  return (
    <div className="flex items-center">
      <button
        type="button"
        disabled={!dirty}
        onClick={onSave}
        className={cn(
          "flex items-center gap-1.5 rounded-l-[4px] border border-border/70 px-2 py-1 text-[12px] transition-colors",
          dirty
            ? "border-primary/60 bg-primary/10 text-primary hover:bg-primary/20"
            : "text-muted-foreground opacity-60"
        )}
      >
        <Save className="h-3.5 w-3.5" />
        Salvar visualização
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Opções de salvamento"
            className="rounded-r-[4px] border border-l-0 border-border/70 px-1.5 py-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="tasks-dark min-w-[250px]">
          <DropdownMenuItem disabled={!dirty} onClick={onSave} className="justify-between">
            <span className="flex items-center gap-2">
              <Save className="h-3.5 w-3.5" /> Salvar visualização
            </span>
            <span className="text-[11px] text-muted-foreground">⌘↵</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              onToggleAutosave(!autosave);
            }}
            className="justify-between"
          >
            <span className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 opacity-70" /> Habilitar salvamento automático
            </span>
            <Switch checked={autosave} onCheckedChange={onToggleAutosave} />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onSaveAsNew}>
            <Copy className="mr-2 h-3.5 w-3.5" /> Salvar como nova visualização
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!dirty} onClick={onRevert}>
            <RotateCcw className="mr-2 h-3.5 w-3.5" /> Reverter alterações
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
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
  statuses = CLIENT_TASK_STATUSES,
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
  /** Status disponíveis para os filtros do diálogo de visualização. */
  statuses?: TaskStatus[];

  /** Configuração aplicada na tela agora (rascunho). */
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
  const [autosaveMap, setAutosaveMap] = useViewAutosave();
  /** initial pré-preenchido da criação (null = fechado) */
  const [createInitial, setCreateInitial] = useState<Partial<ActiveView> | null>(null);
  const [editing, setEditing] = useState<TaskView | null>(null);
  const creatingSlot = useRef(false);

  /** Views nomeadas (as com `slot` substituem as abas padrão). */
  const namedViews = useMemo(() => saved.filter((v) => !v.slot), [saved]);
  const slotRow = (slot: ViewSlot) => saved.find((v) => v.slot === slot);

  /** Abas padrão resolvidas: se existe linha com o slot, ela assume a aba. */
  const resolvedBase = useMemo(
    () =>
      baseViews.map((b) => {
        const slot: ViewSlot = b.view_type === "board" ? "board" : "list";
        const row = saved.find((v) => v.slot === slot);
        return row ? toActive(row) : { ...b, slot };
      }),
    [baseViews, saved]
  );

  const tabs = [...resolvedBase, ...namedViews.map(toActive)];

  /** Sincroniza o id ativo quando uma aba padrão passou a ter linha no banco. */
  useEffect(() => {
    if (tabs.some((t) => t.id === activeId)) return;
    const base = baseViews.find((b) => b.id === activeId);
    if (!base) return;
    const row = slotRow(base.view_type === "board" ? "board" : "list");
    if (row) onChange(toActive(row));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, saved]);

  const activeTab = tabs.find((t) => t.id === activeId) ?? tabs[0];
  const autosaveKey = activeTab?.id ?? "";
  const autosave = !!autosaveMap[autosaveKey];

  const draft = currentState ?? {
    view_type: activeTab?.view_type ?? "list",
    group_by: activeTab?.group_by ?? "status",
    sort_by: activeTab?.sort_by ?? null,
    filters: activeTab?.filters ?? {},
  };
  const dirty = !!activeTab && signature(draft) !== signature(activeTab);

  const saveActive = () => {
    if (!activeTab || !dirty) return;
    const payload = {
      group_by: draft.group_by,
      sort_by: draft.sort_by,
      filters: draft.filters ?? {},
    };
    if (activeTab.saved) {
      updateView.mutate({ id: activeTab.id, ...payload });
      onChange({ ...activeTab, ...payload, saved: true });
      return;
    }
    /** Aba padrão sem linha ainda: cria a view com o slot correspondente. */
    if (creatingSlot.current) return;
    creatingSlot.current = true;
    createView.mutate(
      {
        list_id: listId,
        name: activeTab.name,
        view_type: activeTab.view_type,
        slot: (activeTab.slot ?? (activeTab.view_type === "board" ? "board" : "list")) as ViewSlot,
        is_private: false,
        owner_id: null,
        ...payload,
      },
      {
        onSuccess: (created) => onChange(toActive(created)),
        onSettled: () => {
          creatingSlot.current = false;
        },
      }
    );
  };

  /** Salvamento automático opcional (desligado por padrão). */
  useEffect(() => {
    if (autosave && dirty) saveActive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autosave, dirty, signature(draft)]);

  const revertActive = () => {
    if (activeTab) onChange({ ...activeTab });
  };

  const openCreate = () =>
    setCreateInitial({
      name: "",
      view_type: draft.view_type,
      group_by: draft.group_by,
      sort_by: draft.sort_by,
      filters: draft.filters ?? {},
      is_private: false,
    });

  return (
    <div className="mb-3 flex items-center gap-1 border-b border-border/70 pb-0 text-[12px]">
      {tabs.map((tab) => {
        const savedView = saved.find((s) => s.id === tab.id);
        const Icon = tab.view_type === "board" ? LayoutGrid : List;
        const active = activeId === tab.id;
        const isBaseSlot = !!tab.slot;
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
                  {!isBaseSlot && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          if (
                            !window.confirm(
                              `Excluir a visualização "${savedView.name}"? Esta ação não pode ser desfeita.`
                            )
                          )
                            return;
                          deleteView.mutate(savedView.id);
                          if (active) onChange(resolvedBase[0]);
                        }}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Excluir
                      </DropdownMenuItem>
                    </>
                  )}
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

      <div className="mb-1 ml-auto flex items-center gap-2">
        {toolbar}
        <SaveViewMenu
          dirty={dirty}
          autosave={autosave}
          onSave={saveActive}
          onToggleAutosave={(value) =>
            setAutosaveMap({ ...autosaveMap, [autosaveKey]: value })
          }
          onSaveAsNew={openCreate}
          onRevert={revertActive}
        />
      </div>

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
                slot: null,
                owner_id: v.is_private ? currentMemberId ?? null : null,
              },
              { onSuccess: (created) => onChange(toActive(created)) }
            )
          }
        />
      )}

      {editing && (
      <ViewFormDialog
        key={editing.id}
        open
        onOpenChange={(v) => !v && setEditing(null)}
        initial={toActive(editing)}
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
            slot: editing.slot ?? null,
          });
        }}
      />
      )}
    </div>
  );
};
