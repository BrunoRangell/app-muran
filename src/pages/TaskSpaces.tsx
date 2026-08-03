import { useState } from "react";
import { KanbanBoard, KanbanColumnDef } from "@/components/tasks/KanbanBoard";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";
import { TaskListView } from "@/components/tasks/TaskListView";
import { ListSelection, SpaceTreePanel } from "@/components/tasks/SpaceTreePanel";
import { ActiveView, DEFAULT_VIEWS, ViewTabs } from "@/components/tasks/ViewTabs";
import { TasksToolbar, ToolbarState } from "@/components/tasks/TasksToolbar";
import { TaskBoardSkeleton, TaskListSkeleton } from "@/components/tasks/TasksSkeleton";
import { usePersistentState } from "@/components/tasks/usePersistentState";
import { buildTaskGroups } from "@/components/tasks/taskGrouping";
import { useListTasks, useUpdateTask } from "@/hooks/useTasks";
import { useCurrentTaskMember, useTaskMembers } from "@/hooks/useTaskMembers";
import { useUpdateView } from "@/hooks/useTaskStructure";
import { CLIENT_TASK_STATUSES, ListKind, Task, TaskStatus } from "@/types/tasks";
import LeadsPipeline from "@/components/tasks/LeadsPipeline";

interface Crumb {
  space: string;
  folder: string;
  list: string;
  kind: ListKind;
}

const TaskSpaces = () => {
  const [listId, setListId] = usePersistentState<string | null>("tasks:spaces:listId", null);
  const [crumb, setCrumb] = usePersistentState<Crumb | null>("tasks:spaces:crumb", null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = usePersistentState<ActiveView>("tasks:spaces:view", DEFAULT_VIEWS[0]);

  const isLeads = crumb?.kind === "leads";
  const { data: tasks = [], isLoading } = useListTasks(!listId || isLeads ? undefined : listId);
  const { data: members = [] } = useTaskMembers();
  const { data: currentMember } = useCurrentTaskMember();
  const updateTask = useUpdateTask();
  const updateView = useUpdateView();
  const selected: Task | null = tasks.find((t) => t.id === selectedId) ?? null;

  /** Barra de ferramentas: views salvas persistem no banco; abas padrão ficam na sessão. */
  const handleToolbarChange = (next: ToolbarState) => {
    setView({ ...view, ...next });
    if (view.saved) {
      updateView.mutate({
        id: view.id,
        group_by: next.group_by,
        sort_by: next.sort_by,
        filters: next.filters,
      });
    }
  };

  const groups = buildTaskGroups({
    tasks,
    statuses: CLIENT_TASK_STATUSES,
    members,
    groupBy: view.group_by,
    sortBy: view.sort_by,
    filters: view.filters,
  });

  const columns: KanbanColumnDef<string>[] = groups.map((g) => ({
    id: g.key,
    label: g.label,
    dot: g.pillDot,
    border: "border-t-transparent",
    header: "text-foreground/90",
  }));

  const groupOf = (task: Task) =>
    groups.find((g) => g.tasks.some((t) => t.id === task.id))?.key ?? groups[0]?.key ?? "";

  const handleSelectList = ({ list, spaceName, folderName }: ListSelection) => {
    setListId(list.id);
    setCrumb({
      space: spaceName,
      folder: folderName,
      list: list.name,
      kind: list.kind ?? "tasks",
    });
  };

  return (
    <>
      <SpaceTreePanel selectedListId={listId} onSelectList={handleSelectList} />

      <section className="min-w-0 flex-1 overflow-x-auto p-4">
        <div className="mb-4 flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <span>Espaços</span>
          {crumb && (
            <>
              <span className="opacity-40">/</span>
              <span>{crumb.space}</span>
              <span className="opacity-40">/</span>
              <span>{crumb.folder}</span>
              <span className="opacity-40">/</span>
              <span className="font-semibold text-foreground">{crumb.list}</span>
            </>
          )}
        </div>

        {!listId ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Escolha um espaço, uma pasta e uma lista na barra lateral.
          </p>
        ) : isLeads ? (
          <LeadsPipeline />
        ) : (
          <>
            <ViewTabs
              listId={listId}
              members={members}
              activeId={view.id}
              onChange={setView}
              currentMemberId={currentMember?.id ?? null}
              toolbar={
                <TasksToolbar
                  members={members}
                  statuses={CLIENT_TASK_STATUSES}
                  value={{
                    group_by: view.group_by,
                    sort_by: view.sort_by,
                    filters: view.filters ?? {},
                  }}
                  onChange={handleToolbarChange}
                />
              }
            />

            {isLoading ? (
              view.view_type === "list" ? (
                <TaskListSkeleton />
              ) : (
                <TaskBoardSkeleton />
              )
            ) : view.view_type === "list" ? (
              <TaskListView
                statuses={CLIENT_TASK_STATUSES}
                tasks={tasks}
                members={members}
                onOpenTask={(t) => setSelectedId(t.id)}
                newTaskScope={{ list_id: listId, is_internal: false }}
                storageKey={`tasks:list:collapsed:${view.id}`}
                groupBy={view.group_by}
                sortBy={view.sort_by}
                filters={view.filters}
              />
            ) : (
              <KanbanBoard
                columns={columns}
                items={groups.flatMap((g) => g.tasks)}
                getStatus={groupOf}
                onStatusChange={(t, key) => {
                  const patch = groups.find((g) => g.key === key)?.patch;
                  if (patch) updateTask.mutate({ id: t.id, ...patch });
                }}
                renderCard={(t) => (
                  <TaskCard
                    task={t}
                    member={members.find((m) => m.id === t.assignee_id)}
                    onClick={() => setSelectedId(t.id)}
                  />
                )}
                footer={(key) => {
                  const patch = groups.find((g) => g.key === key)?.patch ?? {};
                  return (
                    <NewTaskDialog
                      members={members}
                      status={(patch.status as TaskStatus) ?? CLIENT_TASK_STATUSES[0]}
                      scope={{ list_id: listId, is_internal: false }}
                      defaults={{ assignee_id: patch.assignee_id, priority: patch.priority }}
                      label="Adicionar Tarefa"
                    />
                  );
                }}
              />
            )}
          </>
        )}
      </section>

      <TaskDetailModal
        task={selected}
        statuses={CLIENT_TASK_STATUSES}
        members={members}
        breadcrumb={crumb ? [crumb.space, crumb.folder, crumb.list] : undefined}
        open={!!selected}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </>
  );
};

export default TaskSpaces;
