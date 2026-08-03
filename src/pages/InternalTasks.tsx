import { useState } from "react";
import { KanbanBoard, KanbanColumnDef } from "@/components/tasks/KanbanBoard";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";
import { TasksTree, TasksTreeItem } from "@/components/tasks/TasksShell";
import { TaskListView } from "@/components/tasks/TaskListView";
import { TaskBoardSkeleton, TaskListSkeleton } from "@/components/tasks/TasksSkeleton";
import { usePersistentState } from "@/components/tasks/usePersistentState";
import { useInternalTasks, useUpdateTask } from "@/hooks/useTasks";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import {
  InternalArea,
  INTERNAL_AREAS,
  INTERNAL_TASK_STATUSES,
  TaskStatus,
  TASK_STATUS_META,
} from "@/types/tasks";
import { Building2, LayoutGrid, List } from "lucide-react";

const columns: KanbanColumnDef<TaskStatus>[] = INTERNAL_TASK_STATUSES.map((s) => ({
  id: s,
  label: TASK_STATUS_META[s].label,
  dot: TASK_STATUS_META[s].dot,
  border: TASK_STATUS_META[s].border,
  header: TASK_STATUS_META[s].header,
}));

const InternalTasks = () => {
  const [area, setArea] = useState<InternalArea>(INTERNAL_AREAS[0]);
  const { data: tasks = [], isLoading } = useInternalTasks(area);
  const { data: members = [] } = useTeamMembers();
  const updateTask = useUpdateTask();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = usePersistentState<"lista" | "quadro">("tasks:internas:view", "lista");
  const selected = tasks.find((t) => t.id === selectedId) ?? null;

  return (
    <>
      <TasksTree title="Muran · Interno">
        {INTERNAL_AREAS.map((a) => (
          <TasksTreeItem
            key={a}
            label={a}
            icon={Building2}
            active={area === a}
            onClick={() => setArea(a)}
          />
        ))}
      </TasksTree>

      <section className="min-w-0 flex-1 overflow-x-auto p-4">
        <div className="mb-4 flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <span>Tarefas Internas</span>
          <span className="opacity-40">/</span>
          <span className="font-semibold text-foreground">{area}</span>
        </div>

        <div className="mb-3 flex items-center gap-1 border-b border-border/70 text-[12px]">
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

        {isLoading ? (
          view === "lista" ? (
            <TaskListSkeleton groups={4} />
          ) : (
            <TaskBoardSkeleton columns={4} />
          )
        ) : view === "lista" ? (
          <TaskListView
            statuses={INTERNAL_TASK_STATUSES}
            tasks={tasks}
            members={members}
            onOpenTask={(t) => setSelectedId(t.id)}
            newTaskScope={{ is_internal: true, internal_area: area, list_id: null }}
            storageKey="tasks:list:collapsed:internas"
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
                scope={{ is_internal: true, internal_area: area, list_id: null }}
                label="Adicionar Tarefa"
              />
            )}
          />
        )}
      </section>

      <TaskDetailModal
        task={selected}
        statuses={INTERNAL_TASK_STATUSES}
        members={members}
        breadcrumb={["Tarefas Internas", area]}
        open={!!selected}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </>
  );
};

export default InternalTasks;
