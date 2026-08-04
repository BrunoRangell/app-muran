import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TaskRecurrence } from "@/types/tasks";
import { parseISODate, toISODate, WEEKDAY_LABELS } from "@/components/tasks/recurrence";
import { CalendarX2, Repeat2 } from "lucide-react";

type Mode = "none" | "daily" | "weekly" | "monthly" | "custom";
type Unit = "daily" | "weekly" | "monthly";

const modeOf = (r: TaskRecurrence | null): Mode => {
  if (!r) return "none";
  if ((r.interval ?? 1) > 1) return "custom";
  return r.type;
};

interface Props {
  dueDate: string | null;
  recurrence: TaskRecurrence | null;
  onChange: (patch: { due_date?: string | null; recurrence?: TaskRecurrence | null }) => void;
}

/**
 * Conteúdo do popover de data de vencimento: calendário + seção "Repetir".
 * Reutilizado na célula da lista e no modal de detalhe da tarefa.
 */
export const DueDateRecurrencePanel = ({ dueDate, recurrence, onChange }: Props) => {
  const [mode, setMode] = useState<Mode>(modeOf(recurrence));
  const [unit, setUnit] = useState<Unit>(recurrence?.type ?? "weekly");
  const [interval, setIntervalValue] = useState(recurrence?.interval ?? 1);
  const [weekdays, setWeekdays] = useState<number[]>(recurrence?.weekdays ?? []);
  const [endDate, setEndDate] = useState(recurrence?.end_date ?? "");

  useEffect(() => {
    setMode(modeOf(recurrence));
    setUnit(recurrence?.type ?? "weekly");
    setIntervalValue(recurrence?.interval ?? 1);
    setWeekdays(recurrence?.weekdays ?? []);
    setEndDate(recurrence?.end_date ?? "");
  }, [recurrence]);

  const selected = dueDate ? parseISODate(dueDate) : undefined;
  const effectiveUnit: Unit = mode === "custom" ? unit : (mode === "none" ? "weekly" : mode);
  const showWeekdays = mode === "weekly" || (mode === "custom" && unit === "weekly");

  const buildRule = (): TaskRecurrence | null => {
    if (mode === "none") return null;
    return {
      type: effectiveUnit,
      interval: mode === "custom" ? Math.max(1, Number(interval) || 1) : 1,
      weekdays: showWeekdays && weekdays.length ? [...weekdays].sort() : null,
      end_date: endDate || null,
    };
  };

  const applyRecurrence = () => onChange({ recurrence: buildRule() });

  return (
    <div className="tasks-dark bg-popover text-popover-foreground">
      <Calendar
        mode="single"
        selected={selected}
        onSelect={(date) => onChange({ due_date: date ? toISODate(date) : null })}
        initialFocus
        className="p-3 pointer-events-auto"
      />

      <div className="border-t border-border/70 px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-full justify-start text-[12px]"
          onClick={() => onChange({ due_date: null })}
        >
          <CalendarX2 className="mr-2 h-3.5 w-3.5" /> Limpar data
        </Button>
      </div>

      <div className="space-y-2.5 border-t border-border/70 p-3">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <Repeat2 className="h-3.5 w-3.5" /> Repetir
        </div>

        <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <SelectTrigger className="h-8 text-[12.5px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="tasks-dark">
            <SelectItem value="none">Não repetir</SelectItem>
            <SelectItem value="daily">Diariamente</SelectItem>
            <SelectItem value="weekly">Semanalmente</SelectItem>
            <SelectItem value="monthly">Mensalmente</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>

        {mode === "custom" && (
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground">a cada</span>
            <Input
              type="number"
              min={1}
              value={interval}
              onChange={(e) => setIntervalValue(Math.max(1, Number(e.target.value) || 1))}
              className="h-8 w-16 text-[12.5px]"
            />
            <Select value={unit} onValueChange={(v) => setUnit(v as Unit)}>
              <SelectTrigger className="h-8 flex-1 text-[12.5px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="tasks-dark">
                <SelectItem value="daily">dias</SelectItem>
                <SelectItem value="weekly">semanas</SelectItem>
                <SelectItem value="monthly">meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {showWeekdays && (
          <div className="flex gap-1">
            {WEEKDAY_LABELS.map((label, day) => (
              <button
                key={day}
                type="button"
                onClick={() =>
                  setWeekdays((prev) =>
                    prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
                  )
                }
                className={cn(
                  "h-7 w-7 rounded-full border text-[11px] font-medium transition-colors",
                  weekdays.includes(day)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-accent"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {mode !== "none" && (
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground">Repetir até (opcional)</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 text-[12.5px]"
            />
          </div>
        )}

        <Button size="sm" className="h-7 w-full text-[12px]" onClick={applyRecurrence}>
          Salvar recorrência
        </Button>
      </div>
    </div>
  );
};
