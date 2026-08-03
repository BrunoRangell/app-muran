import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { KanbanBoard, KanbanColumnDef } from "@/components/tasks/KanbanBoard";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";
import { useClientTaskLists, useListTasks, useUpdateTask } from "@/hooks/useTasks";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { CLIENT_TASK_STATUSES, Task, TaskStatus, TASK_STATUS_META } from "@/types/tasks";
import { Loader2 } from "lucide-react";

const columns: KanbanColumnDef<TaskStatus>[] = CLIENT_TASK_STATUSES.map((s) => ({
  id: s,
  label: TASK_STATUS_META[s].label,
  dot: TASK_STATUS_META[s].dot,
  border: TASK_STATUS_META[s].border,
  header: TASK_STATUS_META[s].header,
}));

const ListBoard = ({ listId }: { listId: string }) => {
  const { data: tasks = [], isLoading } = useListTasks(listId);
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
          <NewTaskDialog members={members} status={status} scope={{ list_id: listId, is_internal: false }} />
        )}
      />
      <TaskDetailModal
        task={current}
        statuses={CLIENT_TASK_STATUSES}
        members={members}
        open={!!current}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  );
};

export const ClientTasksTab = ({ clientId }: { clientId: string }) => {
  const { data: lists = [], isLoading } = useClientTaskLists(clientId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muran-primary" />
      </div>
    );
  }

  if (lists.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma lista para este cliente.</p>;
  }

  return (
    <Tabs defaultValue={lists[0].id} className="space-y-4">
      <TabsList className="flex-wrap">
        {lists.map((l) => (
          <TabsTrigger key={l.id} value={l.id}>
            {l.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {lists.map((l) => (
        <TabsContent key={l.id} value={l.id}>
          <ListBoard listId={l.id} />
        </TabsContent>
      ))}
    </Tabs>
  );
};
