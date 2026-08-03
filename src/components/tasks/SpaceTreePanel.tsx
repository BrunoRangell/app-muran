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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight, KanbanSquare, ListChecks, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FOLDER_COLORS, FolderIconName, TaskFolder, TaskList, TaskSpace } from "@/types/tasks";
import {
  useCreateFolder,
  useCreateList,
  useCreateSpace,
  useDeleteFolder,
  useDeleteList,
  useDeleteSpace,
  useTaskFolders,
  useTaskLists,
  useTaskSpaces,
  useUpdateFolder,
  useUpdateList,
  useUpdateSpace,
} from "@/hooks/useTaskStructure";
import { useListTasks } from "@/hooks/useTasks";
import { ColorPicker, FolderIconPicker, getFolderIcon } from "@/components/tasks/folderVisuals";
import { TasksTree } from "@/components/tasks/TasksShell";
import { usePersistentState } from "@/components/tasks/usePersistentState";

/** Seleção emitida ao clicar numa lista da árvore. */
export interface ListSelection {
  list: TaskList;
  spaceName: string;
  folderName: string;
}

/* --------------------- diálogo de nome/cor/ícone (espaço e pasta) --------------------- */

const VisualDialog = ({
  open,
  onOpenChange,
  initial,
  onSubmit,
  title,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: { name: string; color: string; icon: string | null };
  onSubmit: (values: { name: string; color: string; icon: FolderIconName }) => void;
  title: string;
}) => {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? FOLDER_COLORS[0]);
  const [icon, setIcon] = useState<FolderIconName>((initial?.icon as FolderIconName) ?? "folder");

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (v) {
          setName(initial?.name ?? "");
          setColor(initial?.color ?? FOLDER_COLORS[0]);
          setIcon((initial?.icon as FolderIconName) ?? "folder");
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
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Cor</Label>
            <ColorPicker value={color} onChange={setColor} colors={FOLDER_COLORS} />
          </div>
          <div className="space-y-1.5">
            <Label>Ícone</Label>
            <FolderIconPicker value={icon} onChange={setIcon} />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!name.trim()}
            onClick={() => {
              onSubmit({ name: name.trim(), color, icon });
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

const NameDialog = ({
  open,
  onOpenChange,
  title,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  initial?: string;
  onSubmit: (name: string) => void;
}) => {
  const [name, setName] = useState(initial ?? "");
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (v) setName(initial ?? "");
      }}
    >
      <DialogContent className="tasks-dark max-w-sm border-border bg-background text-foreground">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <DialogFooter>
          <Button
            disabled={!name.trim()}
            onClick={() => {
              onSubmit(name.trim());
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

/* ------------------------------- nível 3: lista ------------------------------- */

const ListRow = ({
  list,
  active,
  onClick,
}: {
  list: TaskList;
  active: boolean;
  onClick: () => void;
}) => {
  const isLeads = list.kind === "leads";
  const { data: tasks = [] } = useListTasks(isLeads ? undefined : list.id);
  const [renaming, setRenaming] = useState(false);
  const updateList = useUpdateList();
  const deleteList = useDeleteList();
  const Icon = isLeads ? KanbanSquare : ListChecks;

  return (
    <div
      className={cn(
        "group flex items-center gap-1.5 rounded-[4px] px-2 py-[5px] text-[12.5px] transition-colors",
        active
          ? "bg-primary/15 font-medium text-foreground shadow-[inset_2px_0_0_0_hsl(var(--primary))]"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
      )}
    >
      <button type="button" onClick={onClick} className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
        <Icon className={cn("h-3.5 w-3.5 shrink-0", active ? "text-primary" : "opacity-60")} />
        <span className="truncate">{list.name}</span>
      </button>
      <span className="text-[11px] tabular-nums text-muted-foreground/80 group-hover:hidden">
        {isLeads ? "" : tasks.length || ""}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="hidden h-4 w-4 items-center justify-center rounded text-muted-foreground hover:text-foreground group-hover:flex"
            aria-label="Opções da lista"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="tasks-dark min-w-[160px]">
          <DropdownMenuItem onClick={() => setRenaming(true)}>Renomear</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => {
              if (confirm(`Excluir a lista "${list.name}" e suas tarefas?`)) deleteList.mutate(list.id);
            }}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <NameDialog
        open={renaming}
        onOpenChange={setRenaming}
        title="Renomear lista"
        initial={list.name}
        onSubmit={(name) => updateList.mutate({ id: list.id, name })}
      />
    </div>
  );
};

/* ------------------------------- nível 2: pasta ------------------------------- */

const FolderNode = ({
  folder,
  spaceName,
  expanded,
  onToggle,
  selectedListId,
  onSelectList,
}: {
  folder: TaskFolder;
  spaceName: string;
  expanded: boolean;
  onToggle: () => void;
  selectedListId: string | null;
  onSelectList: (selection: ListSelection) => void;
}) => {
  const { data: lists = [] } = useTaskLists(expanded ? folder.id : undefined);
  const [editing, setEditing] = useState(false);
  const [newList, setNewList] = useState(false);
  const updateFolder = useUpdateFolder();
  const deleteFolder = useDeleteFolder();
  const createList = useCreateList();
  const Icon = getFolderIcon(folder.icon);
  const hasSelected = lists.some((l) => l.id === selectedListId);

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1.5 rounded-[4px] px-2 py-[5px] text-[12.5px] transition-colors hover:bg-accent/60",
          hasSelected || expanded ? "text-foreground" : "text-foreground/80"
        )}
      >
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
              expanded && "rotate-90"
            )}
          />
          <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: folder.color }} />
          <span className="truncate">{folder.name}</span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="hidden h-4 w-4 items-center justify-center rounded text-muted-foreground hover:text-foreground group-hover:flex"
              aria-label="Opções da pasta"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="tasks-dark min-w-[180px]">
            <DropdownMenuItem onClick={() => setNewList(true)}>
              <Plus className="mr-2 h-3.5 w-3.5" /> Nova lista
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEditing(true)}>Renomear / cor / ícone</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                if (confirm(`Excluir a pasta "${folder.name}" com listas e tarefas?`))
                  deleteFolder.mutate(folder.id);
              }}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div
        className={cn(
          "grid transition-all duration-200 ease-out",
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="ml-[18px] border-l border-border/70 pl-1">
            {lists.map((l) => (
              <ListRow
                key={l.id}
                list={l}
                active={selectedListId === l.id}
                onClick={() => onSelectList({ list: l, spaceName, folderName: folder.name })}
              />
            ))}
            <button
              type="button"
              onClick={() => setNewList(true)}
              className="flex w-full items-center gap-1.5 rounded-[4px] px-2 py-[5px] text-[12px] text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" /> Nova lista
            </button>
          </div>
        </div>
      </div>

      <VisualDialog
        open={editing}
        onOpenChange={setEditing}
        title="Editar pasta"
        initial={{ name: folder.name, color: folder.color, icon: folder.icon }}
        onSubmit={(v) => updateFolder.mutate({ id: folder.id, ...v })}
      />
      <NameDialog
        open={newList}
        onOpenChange={setNewList}
        title="Nova lista"
        onSubmit={(name) => createList.mutate({ folder_id: folder.id, name, kind: "tasks" })}
      />
    </div>
  );
};

/* ------------------------------- nível 1: espaço ------------------------------ */

const SpaceNode = ({
  space,
  expanded,
  onToggle,
  expandedFolder,
  onToggleFolder,
  selectedListId,
  onSelectList,
}: {
  space: TaskSpace;
  expanded: boolean;
  onToggle: () => void;
  expandedFolder: string | null;
  onToggleFolder: (folderId: string) => void;
  selectedListId: string | null;
  onSelectList: (selection: ListSelection) => void;
}) => {
  const { data: folders = [] } = useTaskFolders(expanded ? space.id : undefined);
  const [editing, setEditing] = useState(false);
  const [newFolder, setNewFolder] = useState(false);
  const updateSpace = useUpdateSpace();
  const deleteSpace = useDeleteSpace();
  const createFolder = useCreateFolder();
  const Icon = getFolderIcon(space.icon);

  return (
    <div className="mb-0.5">
      <div className="group flex items-center gap-1.5 rounded-[4px] px-2 py-[6px] text-[12.5px] font-semibold text-foreground transition-colors hover:bg-accent/60">
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
              expanded && "rotate-90"
            )}
          />
          <span
            className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px]"
            style={{ backgroundColor: `${space.color}22` }}
          >
            <Icon className="h-3 w-3" style={{ color: space.color }} />
          </span>
          <span className="truncate">{space.name}</span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="hidden h-4 w-4 items-center justify-center rounded text-muted-foreground hover:text-foreground group-hover:flex"
              aria-label="Opções do espaço"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="tasks-dark min-w-[180px]">
            <DropdownMenuItem onClick={() => setNewFolder(true)}>
              <Plus className="mr-2 h-3.5 w-3.5" /> Nova pasta
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEditing(true)}>Renomear / cor / ícone</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                if (confirm(`Excluir o espaço "${space.name}" com pastas, listas e tarefas?`))
                  deleteSpace.mutate(space.id);
              }}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div
        className={cn(
          "grid transition-all duration-200 ease-out",
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="ml-[18px] border-l border-border/70 pl-1">
            {folders.map((f) => (
              <FolderNode
                key={f.id}
                folder={f}
                spaceName={space.name}
                expanded={expandedFolder === f.id}
                onToggle={() => onToggleFolder(f.id)}
                selectedListId={selectedListId}
                onSelectList={onSelectList}
              />
            ))}
            <button
              type="button"
              onClick={() => setNewFolder(true)}
              className="flex w-full items-center gap-1.5 rounded-[4px] px-2 py-[5px] text-[12px] text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" /> Nova pasta
            </button>
          </div>
        </div>
      </div>

      <VisualDialog
        open={editing}
        onOpenChange={setEditing}
        title="Editar espaço"
        initial={{ name: space.name, color: space.color, icon: space.icon }}
        onSubmit={(v) => updateSpace.mutate({ id: space.id, ...v })}
      />
      <VisualDialog
        open={newFolder}
        onOpenChange={setNewFolder}
        title="Nova pasta"
        onSubmit={(v) => createFolder.mutate({ space_id: space.id, ...v })}
      />
    </div>
  );
};

/* --------------------------------- painel --------------------------------- */

export const SpaceTreePanel = ({
  selectedListId,
  onSelectList,
}: {
  selectedListId: string | null;
  onSelectList: (selection: ListSelection) => void;
}) => {
  const { data: spaces = [] } = useTaskSpaces();
  const [expandedSpace, setExpandedSpace] = usePersistentState<string | null>(
    "tasks:spaces:expandedSpace",
    null
  );
  const [expandedFolder, setExpandedFolder] = usePersistentState<string | null>(
    "tasks:spaces:expandedFolder",
    null
  );
  const [creating, setCreating] = useState(false);
  const createSpace = useCreateSpace();

  return (
    <TasksTree title="Espaços">
      {spaces.map((s) => (
        <SpaceNode
          key={s.id}
          space={s}
          expanded={expandedSpace === s.id}
          onToggle={() => setExpandedSpace((e) => (e === s.id ? null : s.id))}
          expandedFolder={expandedFolder}
          onToggleFolder={(folderId) => setExpandedFolder((e) => (e === folderId ? null : folderId))}
          selectedListId={selectedListId}
          onSelectList={onSelectList}
        />
      ))}
      <button
        type="button"
        onClick={() => setCreating(true)}
        className="mt-1 flex w-full items-center gap-1.5 rounded-[4px] px-2 py-[6px] text-[12.5px] text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" /> Novo espaço
      </button>

      <VisualDialog
        open={creating}
        onOpenChange={setCreating}
        title="Novo espaço"
        onSubmit={(v) => createSpace.mutate(v)}
      />
    </TasksTree>
  );
};

export default SpaceTreePanel;
