import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { MemberAvatar } from "@/components/tasks/MemberAvatar";
import { ColorPicker } from "@/components/tasks/folderVisuals";
import { TaskListSkeleton } from "@/components/tasks/TasksSkeleton";
import {
  useCreateTaskMember,
  useDeleteTaskMember,
  useTaskMembers,
  useUpdateTaskMember,
} from "@/hooks/useTaskMembers";
import { FOLDER_COLORS, TaskMember } from "@/types/tasks";
import { Pencil, Plus, Trash2, Users } from "lucide-react";

const MemberDialog = ({
  open,
  onOpenChange,
  initial,
  title,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: TaskMember;
  title: string;
  onSubmit: (values: { name: string; email: string | null; color: string }) => void;
}) => {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [color, setColor] = useState(initial?.color ?? FOLDER_COLORS[0]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (v) {
          setName(initial?.name ?? "");
          setEmail(initial?.email ?? "");
          setColor(initial?.color ?? FOLDER_COLORS[0]);
        }
      }}
    >
      <DialogContent className="tasks-dark max-w-md border-border bg-background text-foreground">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </div>
          <div className="space-y-1.5">
            <Label>Cor do avatar</Label>
            <ColorPicker value={color} onChange={setColor} colors={FOLDER_COLORS} />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!name.trim()}
            onClick={() => {
              onSubmit({ name: name.trim(), email: email.trim() || null, color });
              onOpenChange(false);
            }}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const TaskMembers = () => {
  const { data: members = [], isLoading } = useTaskMembers();
  const createMember = useCreateTaskMember();
  const updateMember = useUpdateTaskMember();
  const deleteMember = useDeleteTaskMember();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TaskMember | null>(null);

  return (
    <div className="min-w-0 flex-1 space-y-4 overflow-y-auto p-4">
      <div className="flex items-center gap-2">
        <h1 className="mr-auto flex items-center gap-2 text-[15px] font-semibold">
          <Users className="h-4 w-4 text-primary" /> Membros
        </h1>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="mr-1 h-4 w-4" /> Novo membro
        </Button>
      </div>

      <Card className="divide-y p-0">
        {isLoading && <TaskListSkeleton />}
        {!isLoading && members.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Nenhum membro cadastrado ainda.
          </p>
        )}
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 p-3">
            <MemberAvatar member={m} className="h-8 w-8" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">{m.name}</p>
              <p className="truncate text-[12px] text-muted-foreground">{m.email ?? "—"}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setEditing(m)} aria-label="Editar">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              aria-label="Remover"
              onClick={() => {
                if (confirm(`Remover ${m.name}? As tarefas dele ficarão sem responsável.`))
                  deleteMember.mutate(m.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </Card>

      <MemberDialog
        open={creating}
        onOpenChange={setCreating}
        title="Novo membro"
        onSubmit={(v) => createMember.mutate(v)}
      />
      {editing && (
        <MemberDialog
          key={editing.id}
          open
          onOpenChange={(v) => !v && setEditing(null)}
          initial={editing}
          title="Editar membro"
          onSubmit={(v) => updateMember.mutate({ id: editing.id, ...v })}
        />
      )}
    </div>
  );
};

export default TaskMembers;
