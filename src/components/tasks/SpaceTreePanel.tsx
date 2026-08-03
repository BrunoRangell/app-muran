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
import { ChevronRight, ListChecks, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FOLDER_COLORS, FolderIconName, TaskFolder } from "@/types/tasks";
import {
  useCreateFolder,
  useCreateList,
  useDeleteFolder,
  useDeleteList,
  useTaskFolders,
  useTaskLists,
  useUpdateFolder,
  useUpdateList,
} from "@/hooks/useTaskStructure";
import { useListTasks } from "@/hooks/useTasks";
import { ColorPicker, FolderIconPicker, getFolderIcon } from "@/components/tasks/folderVisuals";
import { TasksTree } from "@/components/tasks/TasksShell";
import { usePersistentState } from "@/components/tasks/usePersistentState";

/* --------------------------- diálogo de pasta ---------------------------- */

const FolderDialog = ({
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

/* ------------------------------- lista ---------------------------------- */

const ListRow = ({
  listId,
  label,
  active,
  onClick,
}: {
  listId: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) => {
  const { data: tasks = [] } = useListTasks(listId);
  const [renaming, setRenaming] = useState(false);
  const updateList = useUpdateList();
  const deleteList = useDeleteList();

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
        <ListChecks className={cn("h-3.5 w-3.5 shrink-0", active ? "text-primary" : "opacity-60")} />
        <span className="truncate">{label}</span>
      </button>
      <span className="text-[11px] tabular-nums text-muted-foreground/80 group-hover:hidden">
        {tasks.length || ""}
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
              if (confirm(`Excluir a lista "${label}" e suas tarefas?`)) deleteList.mutate(listId);
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
        initial={label}
        onSubmit={(name) => updateList.mutate({ id: listId, name })}
      />
    </div>
  );
};

/* -------------------------------- pasta --------------------------------- */

const FolderNode = ({
  folder,
  expanded,
  onToggle,
  selectedList,
  onSelectList,
}: {
  folder: TaskFolder;
  expanded: boolean;
  onToggle: () => void;
  selectedList: string | null;
  onSelectList: (listId: string, folderName: string, listName: string) => void;
}) => {
  const { data: lists = [] } = useTaskLists(expanded ? folder.id : undefined);
  const [editing, setEditing] = useState(false);
  const [newList, setNewList] = useState(false);
  const updateFolder = useUpdateFolder();
  const deleteFolder = useDeleteFolder();
  const createList = useCreateList();
  const Icon = getFolderIcon(folder.icon);
  const hasSelected = lists.some((l) => l.id === selectedList);

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
            <DropdownMenuItem onClick={() => setEditing(true)}>
              Renomear / cor / ícone
            </DropdownMenuItem>
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
                listId={l.id}
                label={l.name}
                active={selectedList === l.id}
                onClick={() => onSelectList(l.id, folder.name, l.name)}
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

      <FolderDialog
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
        onSubmit={(name) => createList.mutate({ folder_id: folder.id, name })}
      />
    </div>
  );
};

/* ------------------------------- painel --------------------------------- */

export const FolderTreePanel = ({
  selectedList,
  onSelectList,
}: {
  selectedList: string | null;
  onSelectList: (listId: string, folderName: string, listName: string) => void;
}) => {
  const { data: folders = [] } = useTaskFolders();
  const [expanded, setExpanded] = usePersistentState<string | null>("tasks:folders:expanded", null);
  const [creating, setCreating] = useState(false);
  const createFolder = useCreateFolder();

  return (
    <TasksTree title="Pastas">
      {folders.map((f) => (
        <FolderNode
          key={f.id}
          folder={f}
          expanded={expanded === f.id}
          onToggle={() => setExpanded((e) => (e === f.id ? null : f.id))}
          selectedList={selectedList}
          onSelectList={onSelectList}
        />
      ))}
      <button
        type="button"
        onClick={() => setCreating(true)}
        className="mt-1 flex w-full items-center gap-1.5 rounded-[4px] px-2 py-[6px] text-[12.5px] text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" /> Nova pasta
      </button>

      <FolderDialog
        open={creating}
        onOpenChange={setCreating}
        title="Nova pasta"
        onSubmit={(v) => createFolder.mutate(v)}
      />
    </TasksTree>
  );
};
