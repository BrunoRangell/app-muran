import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Repeat2 } from "lucide-react";
import {
  TaskMember,
  TaskPriority,
  TaskRecurrence,
  TaskStatus,
  TASK_PRIORITY_META,
} from "@/types/tasks";
import { TaskInput, useCreateTask } from "@/hooks/useTasks";
import { DueDateRecurrencePanel } from "@/components/tasks/DueDateRecurrencePanel";
import { describeRecurrence } from "@/components/tasks/recurrence";

interface Props {
  members: TaskMember[];
  status: TaskStatus;
  /** Escopo da tarefa: lista ou área interna */
  scope: Pick<TaskInput, "list_id" | "is_internal" | "internal_area">;
  /** Valores pré-preenchidos (ex.: grupo por responsável/prioridade) */
  defaults?: Pick<TaskInput, "assignee_id" | "priority">;
  label?: string;
}

const NONE = "__none__";

const formatDue = (value: string | null) => {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  return `${d}/${m}/${String(y).slice(-2)}`;
};

export const NewTaskDialog = ({ members, status, scope, defaults, label = "Nova tarefa" }: Props) => {
  const initialAssignees = defaults?.assignee_id ? [defaults.assignee_id] : [];
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignees, setAssignees] = useState<string[]>(initialAssignees);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [recurrence, setRecurrence] = useState<TaskRecurrence | null>(null);
  const [priority, setPriority] = useState<string>(defaults?.priority ?? NONE);
  const createTask = useCreateTask();

  const submit = () => {
    if (!title.trim()) return;
    createTask.mutate(
      {
        ...scope,
        title: title.trim(),
        description: description || null,
        status,
        assignee_ids: assignees,
        due_date: dueDate || null,
        recurrence,
        priority: priority === NONE ? null : (priority as TaskPriority),
      },
      {
        onSuccess: () => {
          setTitle("");
          setDescription("");
          setAssignees(initialAssignees);
          setDueDate(null);
          setRecurrence(null);
          setPriority(defaults?.priority ?? NONE);
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
          <DialogDescription className="sr-only">Defina título, responsável, prazo e recorrência.</DialogDescription>
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
                <SelectContent className="tasks-dark">
                  <SelectItem value={NONE}>Sem responsável</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Prazo + recorrência reutilizando o mesmo painel da edição */}
            <div className="space-y-1.5">
              <Label>Prazo e recorrência</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full justify-start gap-2 text-[13px] font-normal"
                  >
                    <CalendarIcon className="h-3.5 w-3.5 opacity-60" />
                    {formatDue(dueDate) ?? <span className="text-muted-foreground">Sem prazo</span>}
                    {recurrence && <Repeat2 className="ml-auto h-3.5 w-3.5 text-primary" />}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  collisionPadding={12}
                  className="tasks-dark pointer-events-auto w-[280px] overflow-hidden p-0"
                >
                  <DueDateRecurrencePanel
                    dueDate={dueDate}
                    recurrence={recurrence}
                    onChange={(patch) => {
                      if (patch.due_date !== undefined) setDueDate(patch.due_date);
                      if (patch.recurrence !== undefined) setRecurrence(patch.recurrence);
                    }}
                  />
                </PopoverContent>
              </Popover>
              {recurrence && (
                <p className="text-[11px] text-muted-foreground">
                  {describeRecurrence(recurrence)}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Sem prioridade" />
                </SelectTrigger>
                <SelectContent className="tasks-dark">
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
