import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DueDateRecurrencePanel } from "@/components/tasks/DueDateRecurrencePanel";
import { TaskRecurrence } from "@/types/tasks";

/** Rota temporária de validação visual do painel de data/recorrência. */
const DueDatePreview = () => {
  const [dueDate, setDueDate] = useState<string | null>("2026-08-05");
  const [recurrence, setRecurrence] = useState<TaskRecurrence | null>(null);

  return (
    <div className="tasks-dark min-h-screen bg-background p-8 text-foreground">
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <button type="button" className="rounded border border-border px-3 py-1.5 text-sm">
            Abrir data
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          collisionPadding={12}
          className="tasks-dark pointer-events-auto max-h-[min(70vh,520px)] w-[280px] overflow-y-auto overscroll-contain p-0"
        >
          <DueDateRecurrencePanel
            dueDate={dueDate}
            recurrence={recurrence}
            onChange={(patch) => {
              if ("due_date" in patch) setDueDate(patch.due_date ?? null);
              if ("recurrence" in patch) setRecurrence(patch.recurrence ?? null);
            }}
          />
        </PopoverContent>
      </Popover>
      <pre data-testid="state" className="mt-4 text-xs">
        {JSON.stringify({ dueDate, recurrence })}
      </pre>
    </div>
  );
};

export default DueDatePreview;
