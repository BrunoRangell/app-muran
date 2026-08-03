import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MemberAvatar } from "@/components/tasks/MemberAvatar";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { useTaskMembers } from "@/hooks/useTaskMembers";
import { useMyTasks } from "@/hooks/useTasks";
import {
  CLIENT_TASK_STATUSES,
  TaskStatus,
  TASK_PRIORITY_META,
  TASK_STATUS_META,
} from "@/types/tasks";
import { cn } from "@/lib/utils";
import { CalendarDays, CheckSquare } from "lucide-react";
import { TaskListSkeleton } from "@/components/tasks/TasksSkeleton";
import { usePersistentState } from "@/components/tasks/usePersistentState";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseLocalDate } from "@/utils/dateHelpers";

const ALL = "__all__";

const MyTasks = () => {
  const { data: members = [], isLoading: loadingMembers } = useTaskMembers();
  const [memberId, setMemberId] = usePersistentState<string | null>("tasks:minhas:member", null);
  const currentMember = members.find((m) => m.id === memberId) ?? null;
  const { data: tasks = [], isLoading } = useMyTasks(currentMember?.id);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [order, setOrder] = useState<"due_asc" | "due_desc">("due_asc");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const list = tasks.filter((t) => (statusFilter === ALL ? true : t.status === statusFilter));
    return [...list].sort((a, b) => {
      const av = a.due_date ?? "9999-12-31";
      const bv = b.due_date ?? "9999-12-31";
      return order === "due_asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [tasks, statusFilter, order]);

  const selected = tasks.find((t) => t.id === selectedId) ?? null;

  return (
    <div className="min-w-0 flex-1 space-y-4 overflow-y-auto p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto flex items-center gap-2 text-[15px] font-semibold">
          <CheckSquare className="h-4 w-4 text-primary" /> Minhas tarefas
        </h1>
        <Select value={memberId ?? ""} onValueChange={(v) => setMemberId(v)}>
          <SelectTrigger className="w-[190px]">
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="tasks-dark">
            <SelectItem value={ALL}>Todos os status</SelectItem>
            {CLIENT_TASK_STATUSES.map((s: TaskStatus) => (
              <SelectItem key={s} value={s}>
                {TASK_STATUS_META[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={order} onValueChange={(v) => setOrder(v as typeof order)}>
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="tasks-dark">
            <SelectItem value="due_asc">Prazo (mais próximo)</SelectItem>
            <SelectItem value="due_desc">Prazo (mais distante)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="divide-y p-0">
        {!currentMember && !loadingMembers && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Selecione um membro para ver as tarefas atribuídas.
          </p>
        )}
        {currentMember && isLoading && <TaskListSkeleton />}
        {currentMember && !isLoading && filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma tarefa atribuída a {currentMember.name}.
          </p>
        )}
        {currentMember &&
          !isLoading &&
          filtered.map((t) => {
            const status = TASK_STATUS_META[t.status];
            const origem = t.is_internal
              ? `Interna · ${t.internal_area}`
              : `${t.task_lists?.task_folders?.name ?? "Pasta"} · ${t.task_lists?.name ?? ""}`;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedId(t.id)}
                className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50"
              >
                <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", status.dot)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{origem}</p>
                </div>
                {t.priority && (
                  <span
                    className={cn(
                      "hidden rounded-full border px-2 py-0.5 text-[10px] font-semibold sm:inline",
                      TASK_PRIORITY_META[t.priority].badge
                    )}
                  >
                    {TASK_PRIORITY_META[t.priority].label}
                  </span>
                )}
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    status.badge
                  )}
                >
                  {status.label}
                </span>
                {t.due_date && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    {format(parseLocalDate(t.due_date), "dd MMM", { locale: ptBR })}
                  </span>
                )}
                <MemberAvatar member={currentMember} className="h-6 w-6" />
              </button>
            );
          })}
      </Card>

      <TaskDetailModal
        task={selected}
        statuses={CLIENT_TASK_STATUSES}
        members={members}
        open={!!selected}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </div>
  );
};

export default MyTasks;
