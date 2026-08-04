import { useState } from "react";
import { DueDateRecurrencePanel } from "@/components/tasks/DueDateRecurrencePanel";
import { TaskRecurrence } from "@/types/tasks";

/** Página temporária só para validação visual do popover de data/recorrência. */
export default function DueDatePreview() {
  const [due, setDue] = useState<string | null>("2026-08-12");
  const [rec, setRec] = useState<TaskRecurrence | null>(null);
  return (
    <div className="tasks-dark flex min-h-screen items-start gap-8 bg-background p-10">
      <div className="w-[280px] rounded-md border border-border bg-popover">
        <DueDateRecurrencePanel
          dueDate={due}
          recurrence={rec}
          onChange={(p) => {
            if ("due_date" in p) setDue(p.due_date ?? null);
            if ("recurrence" in p) setRec(p.recurrence ?? null);
          }}
        />
      </div>
      <div className="w-[280px] rounded-md border border-border bg-popover">
        <DueDateRecurrencePanel
          dueDate="2026-08-12"
          recurrence={{ type: "weekly", interval: 2, weekdays: [1, 3, 5], end_date: "2026-12-31" }}
          onChange={() => {}}
        />
      </div>
    </div>
  );
}
