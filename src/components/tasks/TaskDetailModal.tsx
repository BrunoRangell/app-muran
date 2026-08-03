import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Task,
  TaskPriority,
  TaskStatus,
  TASK_PRIORITY_META,
  TASK_STATUS_META,
} from "@/types/tasks";
import { TeamMember } from "@/types/team";
import { useAddTaskComment, useDeleteTask, useTaskComments, useUpdateTask } from "@/hooks/useTasks";
import { MemberAvatar } from "./MemberAvatar";
import { cn } from "@/lib/utils";
import { Loader2, Send, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  task: Task | null;
  statuses: TaskStatus[];
  members: TeamMember[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NONE = "__none__";

export const TaskDetailModal = ({ task, statuses, members, open, onOpenChange }: Props) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [comment, setComment] = useState("");

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { data: comments = [], isLoading: loadingComments } = useTaskComments(task?.id);
  const addComment = useAddTaskComment(task?.id);

  useEffect(() => {
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setComment("");
  }, [task?.id, task?.title, task?.description]);

  if (!task) return null;

  const patch = (updates: Record<string, unknown>) => updateTask.mutate({ id: task.id, ...updates });

  const memberById = (id: string | null) => members.find((m) => m.id === id) || null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-medium text-muted-foreground">
            Detalhes da tarefa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title.trim() && title !== task.title && patch({ title: title.trim() })}
            className="border-0 px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={task.status} onValueChange={(v) => patch({ status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full", TASK_STATUS_META[s].dot)} />
                        {TASK_STATUS_META[s].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Responsável</Label>
              <Select
                value={task.assignee_id ?? NONE}
                onValueChange={(v) => patch({ assignee_id: v === NONE ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sem responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sem responsável</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Prazo</Label>
              <Input
                type="date"
                value={task.due_date ?? ""}
                onChange={(e) => patch({ due_date: e.target.value || null })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Prioridade</Label>
              <Select
                value={task.priority ?? NONE}
                onValueChange={(v) => patch({ priority: v === NONE ? null : (v as TaskPriority) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sem prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sem prioridade</SelectItem>
                  {(Object.keys(TASK_PRIORITY_META) as TaskPriority[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {TASK_PRIORITY_META[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() =>
                description !== (task.description ?? "") && patch({ description: description || null })
              }
              placeholder="Adicione detalhes da tarefa..."
            />
          </div>

          <div className="space-y-3 rounded-xl border p-3">
            <Label>Comentários</Label>
            {loadingComments && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {!loadingComments && comments.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhum comentário ainda.</p>
            )}
            <div className="space-y-2">
              {comments.map((c) => (
                <div key={c.id} className="rounded-lg bg-muted/50 p-2 text-sm">
                  <p className="whitespace-pre-wrap">{c.content}</p>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(c.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escreva um comentário..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && comment.trim()) {
                    addComment.mutate(comment.trim(), { onSuccess: () => setComment("") });
                  }
                }}
              />
              <Button
                size="icon"
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

          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MemberAvatar member={memberById(task.assignee_id)} className="h-6 w-6" />
              {memberById(task.assignee_id)?.name ?? "Sem responsável"}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() =>
                deleteTask.mutate(task.id, { onSuccess: () => onOpenChange(false) })
              }
            >
              <Trash2 className="mr-1 h-4 w-4" /> Excluir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
