import { CalendarDays, MessageSquare } from "lucide-react";
import { Task, TASK_PRIORITY_META, TASK_STATUS_META } from "@/types/tasks";
import { TeamMember } from "@/types/team";
import { MemberAvatar } from "./MemberAvatar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseLocalDate } from "@/utils/dateHelpers";

interface Props {
  task: Task;
  member?: TeamMember | null;
  subtitle?: string;
  onClick?: () => void;
}

const formatDue = (value: string) => {
  try {
    return format(parseLocalDate(value), "dd MMM", { locale: ptBR });
  } catch {
    return value;
  }
};

export const TaskCard = ({ task, member, subtitle, onClick }: Props) => {
  const status = TASK_STATUS_META[task.status];
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border bg-card p-3 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-2">
        <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", status.dot)} />
        <p className="flex-1 text-sm font-medium leading-snug text-foreground">{task.title}</p>
      </div>

      {subtitle && <p className="mt-1 pl-4 text-xs text-muted-foreground">{subtitle}</p>}

      <div className="mt-3 flex items-center gap-2">
        <MemberAvatar member={member} className="h-6 w-6" />
        {task.due_date && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="h-3 w-3" />
            {formatDue(task.due_date)}
          </span>
        )}
        {task.priority && (
          <span
            className={cn(
              "ml-auto rounded-full border px-2 py-0.5 text-[10px] font-semibold",
              TASK_PRIORITY_META[task.priority].badge
            )}
          >
            {TASK_PRIORITY_META[task.priority].label}
          </span>
        )}
      </div>

      {task.description && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
          <MessageSquare className="h-3 w-3" /> descrição
        </div>
      )}
    </button>
  );
};
