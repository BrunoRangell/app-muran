import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KanbanBoard, KanbanColumnDef } from "@/components/tasks/KanbanBoard";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";
import { TaskListView } from "@/components/tasks/TaskListView";
import { TasksTree, TasksTreeItem } from "@/components/tasks/TasksShell";
import { useClientTaskLists, useListTasks, useUpdateTask } from "@/hooks/useTasks";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { CLIENT_TASK_STATUSES, Task, TaskStatus, TASK_STATUS_META } from "@/types/tasks";
import { ChevronDown, ChevronRight, Folder, LayoutGrid, List, ListChecks, Loader2 } from "lucide-react";

const columns: KanbanColumnDef<TaskStatus>[] = CLIENT_TASK_STATUSES.map((s) => ({
  id: s,
  label: TASK_STATUS_META[s].label,
  dot: TASK_STATUS_META[s].dot,
  border: TASK_STATUS_META[s].border,
  header: TASK_STATUS_META[s].header,
}));

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
  return (
    <TasksTreeItem
      label={label}
      icon={ListChecks}
      count={tasks.length}
      active={active}
      onClick={onClick}
    />
  );
};

const ClientNode = ({
  clientId,
  name,
  expanded,
  onToggle,
  selectedList,
  onSelectList,
}: {
  clientId: string;
  name: string;
  expanded: boolean;
  onToggle: () => void;
  selectedList: string | null;
  onSelectList: (listId: string, clientName: string, listName: string) => void;
}) => {
  const { data: lists = [] } = useClientTaskLists(expanded ? clientId : undefined);

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-1.5 rounded-[4px] px-2 py-[5px] text-left text-[12.5px] text-foreground/80 transition-colors hover:bg-accent/60 hover:text-foreground"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        )}
        <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
        <span className="truncate">{name}</span>
      </button>
      {expanded && (
        <div className="ml-[18px] border-l border-border/70 pl-1">
          {lists.map((l) => (
            <ListRow
              key={l.id}
              listId={l.id}
              label={l.name}
              active={selectedList === l.id}
              onClick={() => onSelectList(l.id, name, l.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ClientTasks = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [expanded, setExpanded] = useState<string | null>(searchParams.get("clientId"));
  const [listId, setListId] = useState<string | null>(null);
  const [crumb, setCrumb] = useState<{ client: string; list: string } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<"lista" | "quadro">("lista");

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-for-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name")
        .order("company_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: tasks = [], isLoading } = useListTasks(listId ?? undefined);
  const { data: members = [] } = useTeamMembers();
  const updateTask = useUpdateTask();
  const selected: Task | null = tasks.find((t) => t.id === selectedId) ?? null;

  useEffect(() => {
    if (expanded) setSearchParams({ clientId: expanded }, { replace: true });
  }, [expanded, setSearchParams]);

  return (
    <>
      <TasksTree title="Gestão de Clientes">
        {clients.map((c) => (
          <ClientNode
            key={c.id}
            clientId={c.id}
            name={c.company_name}
            expanded={expanded === c.id}
            onToggle={() => setExpanded((e) => (e === c.id ? null : c.id))}
            selectedList={listId}
            onSelectList={(id, client, list) => {
              setListId(id);
              setCrumb({ client, list });
            }}
          />
        ))}
      </TasksTree>

      <section className="min-w-0 flex-1 overflow-x-auto p-4">
        <div className="mb-4 flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <span>Gestão de Clientes</span>
          {crumb && (
            <>
              <span className="opacity-40">/</span>
              <span>{crumb.client}</span>
              <span className="opacity-40">/</span>
              <span className="font-semibold text-foreground">{crumb.list}</span>
            </>
          )}
        </div>

        {listId && (
          <div className="mb-3 flex items-center gap-1 border-b border-border/70 pb-0 text-[12px]">
            {([
              { id: "lista" as const, label: "Lista", icon: List },
              { id: "quadro" as const, label: "Quadro", icon: LayoutGrid },
            ]).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id)}
                className={
                  "flex items-center gap-1.5 border-b-2 px-2.5 pb-2 pt-1 transition-colors " +
                  (view === tab.id
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground")
                }
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {!listId ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Escolha um cliente e uma lista na barra lateral.
          </p>
        ) : isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : view === "lista" ? (
          <TaskListView
            statuses={CLIENT_TASK_STATUSES}
            tasks={tasks}
            members={members}
            onOpenTask={(t) => setSelectedId(t.id)}
            newTaskScope={{ list_id: listId, is_internal: false }}
          />
        ) : (
          <KanbanBoard
            columns={columns}
            items={tasks}
            getStatus={(t) => t.status}
            onStatusChange={(t, status) => updateTask.mutate({ id: t.id, status })}
            renderCard={(t) => (
              <TaskCard
                task={t}
                member={members.find((m) => m.id === t.assignee_id)}
                onClick={() => setSelectedId(t.id)}
              />
            )}
            footer={(status) => (
              <NewTaskDialog
                members={members}
                status={status}
                scope={{ list_id: listId, is_internal: false }}
                label="Adicionar Tarefa"
              />
            )}
          />
        )}
      </section>

      <TaskDetailModal
        task={selected}
        statuses={CLIENT_TASK_STATUSES}
        members={members}
        breadcrumb={crumb ? ["Gestão de Clientes", crumb.client, crumb.list] : undefined}
        open={!!selected}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </>
  );
};

export default ClientTasks;
