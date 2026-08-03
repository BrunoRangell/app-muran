import { useState } from "react";
import { KanbanBoard, KanbanColumnDef } from "@/components/tasks/KanbanBoard";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";
import { TasksTree, TasksTreeItem } from "@/components/tasks/TasksShell";
import { useInternalTasks, useUpdateTask } from "@/hooks/useTasks";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import {
  InternalArea,
  INTERNAL_AREAS,
  INTERNAL_TASK_STATUSES,
  TaskStatus,
  TASK_STATUS_META,
} from "@/types/tasks";
import { Building2, Loader2 } from "lucide-react";

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

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
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
