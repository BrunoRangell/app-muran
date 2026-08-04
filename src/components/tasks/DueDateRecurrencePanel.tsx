import { ptBR } from "date-fns/locale";
import { useEffect, useRef, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: "none", label: "Não repetir" },
  { value: "daily", label: "Diariamente" },
  { value: "weekly", label: "Semanalmente" },
  { value: "monthly", label: "Mensalmente" },
  { value: "custom", label: "Personalizado" },
];

const UNIT_OPTIONS: { value: Unit; label: string }[] = [
  { value: "daily", label: "dias" },
  { value: "weekly", label: "semanas" },
  { value: "monthly", label: "meses" },
];

interface Props {
  dueDate: string | null;
  recurrence: TaskRecurrence | null;
  onChange: (patch: { due_date?: string | null; recurrence?: TaskRecurrence | null }) => void;
}

/**
 * Conteúdo do popover de data de vencimento: calendário + seção "Repetir".
 * Reutilizado na célula da lista e no modal de detalhe da tarefa.
 *
 * IMPORTANTE: nada aqui usa componentes com portal (Radix Select/Dropdown).
 * Quando o painel vive dentro de um Popover — e esse Popover dentro de um
 * Dialog — abrir um Select em portal move o foco para fora das camadas e o
 * Radix interpreta como "interação externa", fechando o popover (perdendo o
 * estado da recorrência) ou até o modal inteiro. Por isso as opções são
 * botões inline.
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
  const scrollRef = useRef<HTMLDivElement>(null);

  /**
   * O scroll do popover precisa ser tratado aqui dentro: quando o conteúdo não
   * cabe (modo "Personalizado"), o wheel vazava para a página atrás — rolando o
   * fundo e fechando o popover. React registra `onWheel` como passivo, então o
   * listener é adicionado manualmente com `{ passive: false }`.
   */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      el.scrollTop += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);
  const showWeekdays = mode === "weekly" || (mode === "custom" && unit === "weekly");

  const buildRule = (state: {
    mode: Mode;
    unit: Unit;
    interval: number;
    weekdays: number[];
    endDate: string;
  }): TaskRecurrence | null => {
    if (state.mode === "none") return null;
    const effectiveUnit: Unit = state.mode === "custom" ? state.unit : state.mode;
    const usesWeekdays = effectiveUnit === "weekly";
    return {
      type: effectiveUnit,
      interval: state.mode === "custom" ? Math.max(1, Number(state.interval) || 1) : 1,
      weekdays: usesWeekdays && state.weekdays.length ? [...state.weekdays].sort() : null,
      end_date: state.endDate || null,
    };
  };

  /** Aplica a regra imediatamente (sem depender do clique em "Salvar"). */
  const apply = (patch: Partial<{ mode: Mode; unit: Unit; interval: number; weekdays: number[]; endDate: string }>) => {
    const next = { mode, unit, interval, weekdays, endDate, ...patch };
    if (patch.mode !== undefined) setMode(patch.mode);
    if (patch.unit !== undefined) setUnit(patch.unit);
    if (patch.interval !== undefined) setIntervalValue(patch.interval);
    if (patch.weekdays !== undefined) setWeekdays(patch.weekdays);
    if (patch.endDate !== undefined) setEndDate(patch.endDate);
    onChange({ recurrence: buildRule(next) });
  };

  return (
    <div
      ref={scrollRef}
      className="tasks-dark max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain bg-popover text-popover-foreground"
    >
      <Calendar
        mode="single"
        locale={ptBR}
        selected={selected}
        defaultMonth={selected}
        onSelect={(date) => onChange({ due_date: date ? toISODate(date) : null })}
        initialFocus
        className="p-3 pointer-events-auto"
      />

      <div className="border-t border-border/70 px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-full justify-start text-[12px]"
          onClick={() => onChange({ due_date: null, recurrence: null })}
        >
          <CalendarX2 className="mr-2 h-3.5 w-3.5" /> Limpar data
        </Button>
      </div>

      <div className="space-y-2.5 border-t border-border/70 p-3">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <Repeat2 className="h-3.5 w-3.5" /> Repetir
        </div>

        <div className="grid grid-cols-2 gap-1">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => apply({ mode: opt.value })}
              className={cn(
                "rounded-md border px-2 py-1.5 text-[12px] font-medium transition-colors",
                opt.value === "none" && "col-span-2",
                mode === opt.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {mode === "custom" && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-muted-foreground">a cada</span>
              <Input
                type="number"
                min={1}
                value={interval}
                onChange={(e) => apply({ interval: Math.max(1, Number(e.target.value) || 1) })}
                className="h-8 w-16 text-[12.5px]"
              />
            </div>
            <div className="flex gap-1">
              {UNIT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => apply({ unit: opt.value })}
                  className={cn(
                    "flex-1 rounded-md border px-2 py-1 text-[12px] transition-colors",
                    unit === opt.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:bg-accent"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {showWeekdays && (
          <div className="flex gap-1">
            {WEEKDAY_LABELS.map((label, day) => (
              <button
                key={day}
                type="button"
                onClick={() =>
                  apply({
                    weekdays: weekdays.includes(day)
                      ? weekdays.filter((d) => d !== day)
                      : [...weekdays, day],
                  })
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
              onBlur={(e) => apply({ endDate: e.target.value })}
              className="h-8 text-[12.5px]"
            />
          </div>
        )}
      </div>
    </div>
  );
};
