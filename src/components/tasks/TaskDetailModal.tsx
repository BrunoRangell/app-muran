import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Task,
  TaskMember,
  TaskPriority,
  TaskStatus,
  TASK_PRIORITY_META,
  TASK_STATUS_META,
} from "@/types/tasks";
import { useAddTaskComment, useDeleteTask, useTaskComments, useUpdateTask } from "@/hooks/useTasks";
import { MemberAvatar } from "./MemberAvatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DueDateRecurrencePanel } from "@/components/tasks/DueDateRecurrencePanel";
import { describeRecurrence, parseISODate } from "@/components/tasks/recurrence";
import { cn } from "@/lib/utils";
import { CalendarDays, Circle, Flag, Loader2, Repeat2, Send, Timer, Trash2, User2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  task: Task | null;
  statuses: TaskStatus[];
  members: TaskMember[];
  breadcrumb?: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NONE = "__none__";

const Field = ({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Circle;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center gap-3 py-1.5">
    <span className="flex w-32 shrink-0 items-center gap-1.5 text-[12px] text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
    <div className="min-w-0 flex-1">{children}</div>
  </div>
);

export const TaskDetailModal = ({
  task,
  statuses,
  members,
  breadcrumb,
  open,
  onOpenChange,
}: Props) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [comment, setComment] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { data: comments = [], isLoading: loadingComments } = useTaskComments(task?.id);
  const addComment = useAddTaskComment(task?.id);

  useEffect(() => {
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setComment("");
    setEditingTitle(false);
  }, [task?.id, task?.title, task?.description]);

  if (!task) return null;

  const patch = (updates: Record<string, unknown>) => updateTask.mutate({ id: task.id, ...updates });
  const memberById = (id: string | null) => members.find((m) => m.id === id) || null;
  const status = TASK_STATUS_META[task.status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="tasks-dark max-h-[90vh] max-w-5xl gap-0 overflow-hidden border-border bg-background p-0 text-foreground">
        <DialogTitle className="sr-only">{task.title}</DialogTitle>
        <DialogDescription className="sr-only">Detalhes da tarefa</DialogDescription>
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 border-b border-border px-5 py-3 text-[12px] text-muted-foreground">
          {(breadcrumb ?? ["Tarefas"]).map((part, i, arr) => (
            <span key={`${part}-${i}`} className="flex items-center gap-1.5">
              <span className={i === arr.length - 1 ? "font-semibold text-foreground" : ""}>{part}</span>
              {i < arr.length - 1 && <span className="opacity-40">/</span>}
            </span>
          ))}
        </div>

        <div className="grid max-h-[calc(90vh-3rem)] grid-cols-1 overflow-hidden lg:grid-cols-[1fr_320px]">
          {/* Coluna principal */}
          <div className="overflow-y-auto px-6 py-5">
            {editingTitle ? (
              <Input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  setEditingTitle(false);
                  if (title.trim() && title.trim() !== task.title) patch({ title: title.trim() });
                  else setTitle(task.title);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  if (e.key === "Escape") {
                    setTitle(task.title);
                    setEditingTitle(false);
                  }
                }}
                className="h-auto border-0 bg-transparent px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
              />
            ) : (
              <h2
                onClick={() => setEditingTitle(true)}
                title="Clique para editar"
                className="cursor-text rounded-[4px] px-0 py-0.5 text-2xl font-semibold leading-tight transition-colors hover:bg-accent/40"
              >
                {task.title}
              </h2>
            )}

            <div className="mt-4 divide-y divide-border/60">
              <Field icon={Circle} label="Status">
                <Select value={task.status} onValueChange={(v) => patch({ status: v })}>
                  <SelectTrigger className="h-8 w-auto gap-2 border-0 bg-transparent px-0 shadow-none focus:ring-0">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-bold",
                        status.badge
                      )}
                    >
                      <span className={cn("h-2 w-2 rounded-full", status.dot)} />
                      {status.label}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="tasks-dark">
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-[3px] px-1.5 py-[2px] text-[11px] font-semibold uppercase tracking-wide",
                            TASK_STATUS_META[s].pill
                          )}
                        >
                          <span className={cn("h-[7px] w-[7px] rounded-full", TASK_STATUS_META[s].pillDot)} />
                          {TASK_STATUS_META[s].label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field icon={User2} label="Responsável">
                <Select
                  value={task.assignee_id ?? NONE}
                  onValueChange={(v) => patch({ assignee_id: v === NONE ? null : v })}
                >
                  <SelectTrigger className="h-8 border-0 bg-transparent px-0 text-[13px] shadow-none focus:ring-0">
                    <span className="flex items-center gap-2">
                      <MemberAvatar member={memberById(task.assignee_id)} className="h-5 w-5" />
                      {memberById(task.assignee_id)?.name ?? "Sem responsável"}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="tasks-dark">
                    <SelectItem value={NONE}>Sem responsável</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field icon={CalendarDays} label="Datas">
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded px-1 py-[3px] text-[13px] text-foreground transition-colors hover:bg-accent"
                    >
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                      {task.due_date
                        ? format(parseISODate(task.due_date), "dd/MM/yyyy", { locale: ptBR })
                        : <span className="text-muted-foreground">Sem data</span>}
                      {task.recurrence && (
                        <span className="flex items-center gap-1 text-[11px] text-primary">
                          <Repeat2 className="h-3.5 w-3.5" />
                          {describeRecurrence(task.recurrence)}
                        </span>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="tasks-dark w-[280px] p-0">
                    <DueDateRecurrencePanel
                      dueDate={task.due_date}
                      recurrence={task.recurrence ?? null}
                      onChange={(p) => patch(p as Record<string, unknown>)}
                    />
                  </PopoverContent>
                </Popover>
              </Field>


              <Field icon={Flag} label="Prioridade">
                <Select
                  value={task.priority ?? NONE}
                  onValueChange={(v) => patch({ priority: v === NONE ? null : (v as TaskPriority) })}
                >
                  <SelectTrigger className="h-8 border-0 bg-transparent px-0 text-[13px] shadow-none focus:ring-0">
                    <span
                      className={cn(
                        "flex items-center gap-1.5",
                        task.priority ? TASK_PRIORITY_META[task.priority].flag : "text-muted-foreground"
                      )}
                    >
                      <Flag className="h-3.5 w-3.5 fill-current" />
                      {task.priority ? TASK_PRIORITY_META[task.priority].label : "Sem prioridade"}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="tasks-dark">
                    <SelectItem value={NONE}>Sem prioridade</SelectItem>
                    {(Object.keys(TASK_PRIORITY_META) as TaskPriority[]).map((p) => (
                      <SelectItem key={p} value={p}>
                        <span className={cn("flex items-center gap-1.5", TASK_PRIORITY_META[p].flag)}>
                          <Flag className="h-3 w-3 fill-current" />
                          {TASK_PRIORITY_META[p].label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field icon={Timer} label="Rastrear tempo">
                <span className="text-[13px] text-muted-foreground/60">—</span>
              </Field>
            </div>

            <Textarea
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() =>
                description !== (task.description ?? "") && patch({ description: description || null })
              }
              placeholder="Adicione uma descrição..."
              className="mt-5 resize-none border-0 bg-transparent px-0 text-[13px] leading-relaxed shadow-none focus-visible:ring-0"
            />

            <div className="mt-4 border-t border-border pt-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => deleteTask.mutate(task.id, { onSuccess: () => onOpenChange(false) })}
              >
                <Trash2 className="mr-1 h-4 w-4" /> Excluir tarefa
              </Button>
            </div>
          </div>

          {/* Painel de atividade */}
          <div className="flex min-h-0 flex-col border-t border-border bg-card/40 lg:border-l lg:border-t-0">
            <div className="border-b border-border px-4 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              Atividade
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {loadingComments && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {!loadingComments && comments.length === 0 && (
                <p className="text-[12px] text-muted-foreground">Nenhum comentário ainda.</p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="rounded-lg bg-accent/50 p-2.5 text-[13px]">
                  <p className="whitespace-pre-wrap">{c.content}</p>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(c.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-t border-border p-3">
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escreva um comentário..."
                className="h-9 text-[13px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && comment.trim()) {
                    addComment.mutate(comment.trim(), { onSuccess: () => setComment("") });
                  }
                }}
              />
              <Button
                size="icon"
                className="h-9 w-9 shrink-0"
                disabled={!comment.trim() || addComment.isPending}
                onClick={() => addComment.mutate(comment.trim(), { onSuccess: () => setComment("") })}
              >
                {addComment.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
