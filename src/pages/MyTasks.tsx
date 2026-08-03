import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { TaskListView } from "@/components/tasks/TaskListView";
import { TasksToolbar, ToolbarState } from "@/components/tasks/TasksToolbar";
import { TaskListSkeleton } from "@/components/tasks/TasksSkeleton";
import { usePersistentState } from "@/components/tasks/usePersistentState";
import { useCurrentTaskMember, useTaskMembers } from "@/hooks/useTaskMembers";
import { useMyTasks } from "@/hooks/useTasks";
import { CLIENT_TASK_STATUSES } from "@/types/tasks";
import { CheckSquare } from "lucide-react";

const MyTasks = () => {
  const { data: members = [], isLoading: loadingMembers } = useTaskMembers();
  const { data: me, isLoading: loadingMe } = useCurrentTaskMember();
  const [memberId, setMemberId] = usePersistentState<string | null>("tasks:minhas:member", null);
  const [toolbar, setToolbar] = usePersistentState<ToolbarState>("tasks:minhas:toolbar", {
    group_by: "status",
    sort_by: null,
    filters: {},
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!loadingMe && memberId === null && me) {
      setMemberId(me.id);
    }
  }, [loadingMe, memberId, me, setMemberId]);

  const currentMember = members.find((m) => m.id === memberId) ?? null;
  const { data: tasks = [], isLoading } = useMyTasks(currentMember?.id);
  const selected = tasks.find((t) => t.id === selectedId) ?? null;

  return (
    <section className="min-w-0 flex-1 overflow-x-auto p-4">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="mr-auto flex items-center gap-2 text-[15px] font-semibold">
          <CheckSquare className="h-4 w-4 text-primary" /> Minhas tarefas
        </h1>
        <Select value={memberId ?? ""} onValueChange={(v) => setMemberId(v)}>
          <SelectTrigger className="h-7 w-[180px] text-[12px]">
            <SelectValue placeholder="Selecionar membro" />
          </SelectTrigger>
          <SelectContent className="tasks-dark">
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <TasksToolbar
          members={members}
          statuses={CLIENT_TASK_STATUSES}
          value={toolbar}
          onChange={setToolbar}
          allowOriginColumn
        />
      </div>

      {!currentMember && !loadingMembers ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Selecione um membro para ver as tarefas atribuídas.
        </p>
      ) : isLoading || loadingMembers ? (
        <TaskListSkeleton />
      ) : (
        <TaskListView
          statuses={CLIENT_TASK_STATUSES}
          tasks={tasks}
          members={members}
          onOpenTask={(t) => setSelectedId(t.id)}
          newTaskScope={{ is_internal: false }}
          allowCreate={false}
          allowOriginColumn
          storageKey="tasks:list:collapsed:mine"
          groupBy={toolbar.group_by}
          sortBy={toolbar.sort_by}
          filters={toolbar.filters}
        />
      )}

      <TaskDetailModal
        task={selected}
        statuses={CLIENT_TASK_STATUSES}
        members={members}
        open={!!selected}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </section>
  );
};

export default MyTasks;
