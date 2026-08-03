import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { KanbanBoard, KanbanColumnDef } from "@/components/tasks/KanbanBoard";
import { MemberAvatar } from "@/components/tasks/MemberAvatar";
import { useCreateLead, useDeleteLead, useLeads, useUpdateLead } from "@/hooks/useLeads";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { Lead, LEAD_STATUSES, LEAD_STATUS_META, LeadStatus } from "@/types/tasks";
import { cn } from "@/lib/utils";
import { Loader2, Plus, Target, Trash2 } from "lucide-react";

const NONE = "__none__";

const columns: KanbanColumnDef<LeadStatus>[] = LEAD_STATUSES.map((s) => ({
  id: s,
  label: LEAD_STATUS_META[s].label,
  dot: LEAD_STATUS_META[s].dot,
  border: "border-t-transparent",
  header: "text-foreground",
}));

const NewLeadDialog = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<LeadStatus>("novo_lead");
  const [assignee, setAssignee] = useState(NONE);
  const [notes, setNotes] = useState("");
  const { data: members = [] } = useTeamMembers();
  const createLead = useCreateLead();

  const submit = () => {
    if (!name.trim()) return;
    createLead.mutate(
      {
        name: name.trim(),
        company: company || null,
        contact_info: contact || null,
        status,
        assignee_id: assignee === NONE ? null : assignee,
        notes: notes || null,
      },
      {
        onSuccess: () => {
          setName("");
          setCompany("");
          setContact("");
          setNotes("");
          setAssignee(NONE);
          setStatus("novo_lead");
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="">
          <Plus className="mr-1 h-4 w-4" /> Novo lead
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo lead</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Empresa</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Contato</Label>
              <Input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="E-mail ou telefone"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Etapa</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {LEAD_STATUS_META[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          </div>
          <div className="space-y-1.5">
            <Label>Anotações</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button className="w-full" onClick={submit} disabled={!name.trim() || createLead.isPending}>
            Criar lead
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const LeadDetailModal = ({
  lead,
  open,
  onOpenChange,
}: {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { data: members = [] } = useTeamMembers();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const [notes, setNotes] = useState(lead?.notes ?? "");

  const currentNotes = useMemo(() => lead?.notes ?? "", [lead?.id, lead?.notes]);

  if (!lead) return null;
  const patch = (updates: Record<string, unknown>) => updateLead.mutate({ id: lead.id, ...updates });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{lead.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Etapa</Label>
              <Select value={lead.status} onValueChange={(v) => patch({ status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {LEAD_STATUS_META[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Responsável</Label>
              <Select
                value={lead.assignee_id ?? NONE}
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
              <Label>Empresa</Label>
              <Input
                defaultValue={lead.company ?? ""}
                onBlur={(e) => patch({ company: e.target.value || null })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contato</Label>
              <Input
                defaultValue={lead.contact_info ?? ""}
                onBlur={(e) => patch({ contact_info: e.target.value || null })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Anotações</Label>
            <Textarea
              rows={4}
              defaultValue={currentNotes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => notes !== currentNotes && patch({ notes: notes || null })}
            />
          </div>
          <div className="flex justify-end border-t pt-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => deleteLead.mutate(lead.id, { onSuccess: () => onOpenChange(false) })}
            >
              <Trash2 className="mr-1 h-4 w-4" /> Excluir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Leads = () => {
  const { data: leads = [], isLoading } = useLeads();
  const { data: members = [] } = useTeamMembers();
  const updateLead = useUpdateLead();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = leads.find((l) => l.id === selectedId) ?? null;

  return (
    <div className="min-w-0 flex-1 space-y-4 overflow-x-auto p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="flex items-center gap-2 text-xl font-bold text-foreground md:text-2xl">
          <Target className="h-6 w-6 text-primary" />
          Leads
        </h1>
        <NewLeadDialog />
      </div>

      <Card className="p-3 md:p-5">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="kanban" className="space-y-4">
            <TabsList>
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
              <TabsTrigger value="lista">Lista</TabsTrigger>
            </TabsList>

            <TabsContent value="kanban">
              <KanbanBoard
                columns={columns}
                items={leads}
                getStatus={(l) => l.status}
                onStatusChange={(l, status) => updateLead.mutate({ id: l.id, status })}
                emptyLabel="Nenhum lead"
                renderCard={(l) => (
                  <button
                    type="button"
                    onClick={() => setSelectedId(l.id)}
                    className="w-full rounded-xl border bg-card p-3 text-left shadow-sm transition-shadow hover:shadow-md"
                  >
                    <p className="text-sm font-medium">{l.name}</p>
                    {l.company && <p className="text-xs text-muted-foreground">{l.company}</p>}
                    <div className="mt-3 flex items-center gap-2">
                      <MemberAvatar
                        member={members.find((m) => m.id === l.assignee_id)}
                        className="h-6 w-6"
                      />
                      <span
                        className={cn(
                          "ml-auto rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          LEAD_STATUS_META[l.status].badge
                        )}
                      >
                        {LEAD_STATUS_META[l.status].label}
                      </span>
                    </div>
                  </button>
                )}
              />
            </TabsContent>

            <TabsContent value="lista">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Etapa</TableHead>
                      <TableHead>Responsável</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                          Nenhum lead cadastrado.
                        </TableCell>
                      </TableRow>
                    )}
                    {leads.map((l) => (
                      <TableRow
                        key={l.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedId(l.id)}
                      >
                        <TableCell className="font-medium">{l.name}</TableCell>
                        <TableCell>{l.company ?? "—"}</TableCell>
                        <TableCell>{l.contact_info ?? "—"}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                              LEAD_STATUS_META[l.status].badge
                            )}
                          >
                            {LEAD_STATUS_META[l.status].label}
                          </span>
                        </TableCell>
                        <TableCell>
                          {members.find((m) => m.id === l.assignee_id)?.name ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </Card>

      <LeadDetailModal
        lead={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </div>
  );
};

export default Leads;
