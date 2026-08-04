import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { DueDateRecurrencePanel } from "@/components/tasks/DueDateRecurrencePanel";
import { TaskRecurrence } from "@/types/tasks";

/** Rota temporária de validação visual do painel de data/recorrência. */
const DueDatePreview = () => {
  const [open, setOpen] = useState(true);
  const [due, setDue] = useState<string | null>("2026-08-12");
  const [rec, setRec] = useState<TaskRecurrence | null>(null);

  return (
    <div className="tasks-dark min-h-screen bg-background p-8 text-foreground">
      <Button onClick={() => setOpen(true)}>Abrir modal</Button>
      <pre data-testid="state" className="mt-4 text-xs">{JSON.stringify({ due, rec })}</pre>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="tasks-dark max-w-3xl border-border bg-background p-6 text-foreground">
          <DialogTitle>Tarefa exemplo</DialogTitle>
          <DialogDescription>Detalhes</DialogDescription>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Datas</Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="tasks-dark z-[70] w-[280px] p-0">
              <DueDateRecurrencePanel
                dueDate={due}
                recurrence={rec}
                onChange={(p) => {
                  if (p.due_date !== undefined) setDue(p.due_date);
                  if (p.recurrence !== undefined) setRec(p.recurrence);
                }}
              />
            </PopoverContent>
          </Popover>
          <pre data-testid="modal-state" className="text-xs">{JSON.stringify(rec)}</pre>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DueDatePreview;
