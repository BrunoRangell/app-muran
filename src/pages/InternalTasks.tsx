import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { KanbanBoard, KanbanColumnDef } from "@/components/tasks/KanbanBoard";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";
import { useInternalTasks, useUpdateTask } from "@/hooks/useTasks";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import {
  InternalArea,
  INTERNAL_AREAS,
  INTERNAL_TASK_STATUSES,
  Task,
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

const AreaBoard = ({ area }: { area: InternalArea }) => {
  const { data: tasks = [], isLoading } = useInternalTasks(area);
  const { data: members = [] } = useTeamMembers();
  const updateTask = useUpdateTask();
  const [selected, setSelected] = useState<Task | null>(null);
  const current = useMemo(
    () => tasks.find((t) => t.id === selected?.id) ?? null,
    [tasks, selected?.id]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muran-primary" />
      </div>
    );
  }

  return (
    <>
      <KanbanBoard
        columns={columns}
        items={tasks}
        getStatus={(t) => t.status}
        onStatusChange={(t, status) => updateTask.mutate({ id: t.id, status })}
        renderCard={(t) => (
          <TaskCard
            task={t}
            member={members.find((m) => m.id === t.assignee_id)}
            onClick={() => setSelected(t)}
          />
        )}
        footer={(status) => (
          <NewTaskDialog
            members={members}
            status={status}
            scope={{ is_internal: true, internal_area: area, list_id: null }}
          />
        )}
      />
      <TaskDetailModal
        task={current}
        statuses={INTERNAL_TASK_STATUSES}
        members={members}
        open={!!current}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  );
};

const InternalTasks = () => (
  <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
    <h1 className="flex items-center gap-2 text-2xl font-bold text-muran-dark md:text-3xl">
      <Building2 className="h-6 w-6 text-muran-primary" />
      Tarefas Internas
    </h1>

    <Card className="p-3 md:p-5">
      <Tabs defaultValue={INTERNAL_AREAS[0]} className="space-y-4">
        <TabsList>
          {INTERNAL_AREAS.map((a) => (
            <TabsTrigger key={a} value={a}>
              {a}
            </TabsTrigger>
          ))}
        </TabsList>
        {INTERNAL_AREAS.map((a) => (
          <TabsContent key={a} value={a}>
            <AreaBoard area={a} />
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  </div>
);

export default InternalTasks;
