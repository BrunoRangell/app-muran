import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MemberAvatar } from "@/components/tasks/MemberAvatar";
import { ColorPicker } from "@/components/tasks/folderVisuals";
import { TaskListSkeleton } from "@/components/tasks/TasksSkeleton";
import {
  useDeleteTaskMember,
  useSaveTaskMemberAccess,
  useTaskMembers,
  useTaskSpaceAccess,
} from "@/hooks/useTaskMembers";
import { useTaskSpaces } from "@/hooks/useTaskStructure";
import { useTaskAuth } from "@/hooks/useTaskAuth";
import {
  FOLDER_COLORS,
  TASK_MEMBER_ROLE_LABEL,
  TASK_PERMISSION_LEVEL_LABEL,
  TaskMember,
  TaskMemberRole,
  TaskPermissionLevel,
} from "@/types/tasks";
import { Pencil, Plus, Trash2, Users } from "lucide-react";

const ROLES: (TaskMemberRole | "none")[] = ["admin", "member", "guest", "none"];
const LEVELS: TaskPermissionLevel[] = ["view", "comment", "edit"];

const ROLE_HINT: Record<TaskMemberRole | "none", string> = {
  admin: "Acesso total: gerencia espaços, membros e permissões.",
  member: "Vê e edita todos os espaços, pastas, listas e tarefas.",
  guest: "Acessa apenas os espaços selecionados, no nível definido.",
  none: "Sem login: serve apenas como responsável em tarefas.",
};

const MemberDialog = ({
  open,
  onOpenChange,
  initial,
  initialSpaceIds = [],
  initialLevel = "view",
  title,
  onSubmit,
  saving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: TaskMember;
  initialSpaceIds?: string[];
  initialLevel?: TaskPermissionLevel;
  title: string;
  saving?: boolean;
  onSubmit: (values: {
    name: string;
    email: string | null;
    color: string;
    role: TaskMemberRole | null;
    space_ids: string[];
    permission_level: TaskPermissionLevel;
  }) => void;
}) => {
  const { data: spaces = [] } = useTaskSpaces();
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [color, setColor] = useState(initial?.color ?? FOLDER_COLORS[0]);
  const [role, setRole] = useState<TaskMemberRole | "none">(initial?.role ?? "none");
  const [spaceIds, setSpaceIds] = useState<string[]>(initialSpaceIds);
  const [level, setLevel] = useState<TaskPermissionLevel>(initialLevel);

  const needsEmail = role !== "none";
  const invalid =
    !name.trim() ||
    (needsEmail && !email.trim()) ||
    (role === "guest" && spaceIds.length === 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="tasks-dark max-h-[85vh] max-w-md overflow-y-auto border-border bg-background text-foreground">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Defina os dados, o papel e os espaços que este membro pode acessar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>E-mail {needsEmail && <span className="text-destructive">*</span>}</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </div>
          <div className="space-y-1.5">
            <Label>Cor do avatar</Label>
            <ColorPicker value={color} onChange={setColor} colors={FOLDER_COLORS} />
          </div>

          <div className="space-y-2">
            <Label>Papel no módulo de tarefas</Label>
            <div className="flex flex-wrap gap-1.5">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-md border px-2.5 py-1 text-[12px] transition-colors ${
                    role === r
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  {r === "none" ? "Sem acesso" : TASK_MEMBER_ROLE_LABEL[r]}
                </button>
              ))}
            </div>
            <p className="text-[12px] text-muted-foreground">{ROLE_HINT[role]}</p>
          </div>

          {role === "guest" && (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <div className="space-y-2">
                <Label>Espaços liberados</Label>
                {spaces.length === 0 && (
                  <p className="text-[12px] text-muted-foreground">Nenhum espaço criado ainda.</p>
                )}
                {spaces.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-[13px]">
                    <Checkbox
                      checked={spaceIds.includes(s.id)}
                      onCheckedChange={(v) =>
                        setSpaceIds((prev) =>
                          v ? [...prev, s.id] : prev.filter((id) => id !== s.id),
                        )
                      }
                    />
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    {s.name}
                  </label>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label>Nível de permissão</Label>
                <div className="flex gap-1.5">
                  {LEVELS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLevel(l)}
                      className={`rounded-md border px-2.5 py-1 text-[12px] transition-colors ${
                        level === l
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      {TASK_PERMISSION_LEVEL_LABEL[l]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {needsEmail && (
            <p className="text-[12px] text-muted-foreground">
              Um convite será enviado para definir a senha em <code>/tarefas/definir-senha</code>.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            disabled={invalid || saving}
            onClick={() =>
              onSubmit({
                name: name.trim(),
                email: email.trim() || null,
                color,
                role: role === "none" ? null : role,
                space_ids: role === "guest" ? spaceIds : [],
                permission_level: level,
              })
            }
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const TaskMembers = () => {
  const { data: members = [], isLoading } = useTaskMembers();
  const { data: access = [] } = useTaskSpaceAccess();
  const { data: spaces = [] } = useTaskSpaces();
  const { data: taskAuth } = useTaskAuth();
  const saveMember = useSaveTaskMemberAccess();
  const deleteMember = useDeleteTaskMember();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TaskMember | null>(null);

  const accessFor = (memberId: string) => access.filter((a) => a.task_member_id === memberId);
  const spaceName = (id: string) => spaces.find((s) => s.id === id)?.name ?? "Espaço";

  return (
    <div className="min-w-0 flex-1 space-y-4 overflow-y-auto p-4">
      <div className="flex items-center gap-2">
        <h1 className="mr-auto flex items-center gap-2 text-[15px] font-semibold">
          <Users className="h-4 w-4 text-primary" /> Membros
        </h1>
        {taskAuth?.isTaskAdmin && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="mr-1 h-4 w-4" /> Novo membro
          </Button>
        )}
      </div>

      <Card className="divide-y p-0">
        {isLoading && <TaskListSkeleton />}
        {!isLoading && members.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Nenhum membro cadastrado ainda.
          </p>
        )}
        {members.map((m) => {
          const grants = accessFor(m.id);
          return (
            <div key={m.id} className="flex items-center gap-3 p-3">
              <MemberAvatar member={m} className="h-8 w-8" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-[13px] font-medium">
                  {m.name}
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {m.role ? TASK_MEMBER_ROLE_LABEL[m.role] : "Sem acesso"}
                  </Badge>
                </p>
                <p className="truncate text-[12px] text-muted-foreground">{m.email ?? "—"}</p>
                {m.role === "guest" && grants.length > 0 && (
                  <p className="truncate text-[11px] text-muted-foreground">
                    {grants
                      .map(
                        (g) =>
                          `${spaceName(g.space_id)} (${TASK_PERMISSION_LEVEL_LABEL[g.permission_level]})`,
                      )
                      .join(" · ")}
                  </p>
                )}
              </div>
              {taskAuth?.isTaskAdmin && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing(m)}
                    aria-label="Editar"
                  >
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
                </>
              )}
            </div>
          );
        })}
      </Card>

      {creating && (
        <MemberDialog
          open
          onOpenChange={(v) => !v && setCreating(false)}
          title="Novo membro"
          saving={saveMember.isPending}
          onSubmit={(v) =>
            saveMember.mutate(v, { onSuccess: () => setCreating(false) })
          }
        />
      )}
      {editing && (
        <MemberDialog
          key={editing.id}
          open
          onOpenChange={(v) => !v && setEditing(null)}
          initial={editing}
          initialSpaceIds={accessFor(editing.id).map((a) => a.space_id)}
          initialLevel={accessFor(editing.id)[0]?.permission_level ?? "view"}
          title="Editar membro"
          saving={saveMember.isPending}
          onSubmit={(v) =>
            saveMember.mutate(
              { member_id: editing.id, ...v },
              { onSuccess: () => setEditing(null) },
            )
          }
        />
      )}
    </div>
  );
};

export default TaskMembers;
