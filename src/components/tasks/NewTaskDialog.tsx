import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { TeamMember } from "@/types/team";
import { TaskPriority, TaskStatus, TASK_PRIORITY_META } from "@/types/tasks";
import { TaskInput, useCreateTask } from "@/hooks/useTasks";

interface Props {
  members: TeamMember[];
  status: TaskStatus;
  /** Escopo da tarefa: lista de cliente ou área interna */
  scope: Pick<TaskInput, "list_id" | "is_internal" | "internal_area">;
  label?: string;
}

const NONE = "__none__";

export const NewTaskDialog = ({ members, status, scope, label = "Nova tarefa" }: Props) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState(NONE);
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState(NONE);
  const createTask = useCreateTask();

  const submit = () => {
    if (!title.trim()) return;
    createTask.mutate(
      {
        ...scope,
        title: title.trim(),
        description: description || null,
        status,
        assignee_id: assignee === NONE ? null : assignee,
        due_date: dueDate || null,
        priority: priority === NONE ? null : (priority as TaskPriority),
      },
      {
        onSuccess: () => {
          setTitle("");
          setDescription("");
          setAssignee(NONE);
          setDueDate("");
          setPriority(NONE);
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start text-[12px] text-muted-foreground hover:bg-accent/60">
          <Plus className="mr-1 h-4 w-4" /> {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="tasks-dark max-w-lg border-border bg-background text-foreground">
        <DialogHeader>
          <DialogTitle>Nova tarefa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Responsável</Label>
              <Select value={assignee} onValueChange={setAssignee}>
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
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
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
          <Button className="w-full" onClick={submit} disabled={!title.trim() || createTask.isPending}>
            Criar tarefa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
