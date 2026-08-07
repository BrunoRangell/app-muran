import { CalendarDays, Flag, Link2, Repeat2 } from "lucide-react";
import { Task, TaskMember, TASK_PRIORITY_META } from "@/types/tasks";
import { MemberAvatarStack } from "./MemberAvatarStack";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseLocalDate } from "@/utils/dateHelpers";

interface Props {
  task: Task;
  /** Responsável único (compatibilidade) */
  member?: TaskMember | null;
  /** Todos os responsáveis (pilha de avatares) */
  assignees?: TaskMember[];
  subtitle?: string;
  onClick?: () => void;
}

const formatDue = (value: string) => {
  try {
    return format(parseLocalDate(value), "d MMM", { locale: ptBR });
  } catch {
    return value;
  }
};

export const TaskCard = ({ task, member, assignees, subtitle, onClick }: Props) => {
  const priority = task.priority ? TASK_PRIORITY_META[task.priority] : null;
  const people = assignees ?? (member ? [member] : []);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      <p className="text-[13px] font-medium leading-snug text-foreground">{task.title}</p>
      {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>}

      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
        {task.description && <Repeat2 className="h-3.5 w-3.5 opacity-60" />}
        <MemberAvatarStack members={people} className="h-5 w-5" emptyPlaceholder />

        {task.due_date && (
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {formatDue(task.due_date)}
          </span>
        )}
        {priority && (
          <span className={cn("flex items-center gap-1", priority.flag)}>
            <Flag className="h-3 w-3 fill-current" />
            {priority.label}
          </span>
        )}
        <Link2 className="ml-auto h-3.5 w-3.5 opacity-40" />
      </div>
    </button>
  );
};
