import { TaskRecurrence } from "@/types/tasks";

/** Converte "YYYY-MM-DD" em Date local (evita shift de timezone). */
export function parseISODate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Data local → "YYYY-MM-DD". */
export const toISODate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

export const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

/**
 * Próxima data de vencimento a partir de `from` seguindo a regra de recorrência.
 * Retorna `null` quando a recorrência já terminou (passou de `end_date`).
 */
export function nextDueDate(
  from: string | null,
  rule: TaskRecurrence | null
): string | null {
  if (!rule) return null;
  const interval = Math.max(1, Math.floor(rule.interval || 1));
  const base = from ? parseISODate(from) : new Date();
  base.setHours(0, 0, 0, 0);

  let next: Date;
  if (rule.type === "weekly" && rule.weekdays?.length) {
    const days = [...new Set<number>(rule.weekdays)].filter((d) => d >= 0 && d <= 6).sort();
    next = new Date(base);
    // 1) próximo dia marcado ESTRITAMENTE após a data base (até 7 dias à frente)
    let found = false;
    for (let step = 1; step <= 7; step += 1) {
      const candidate = new Date(base);
      candidate.setDate(base.getDate() + step);
      if (days.includes(candidate.getDay())) {
        next = candidate;
        found = true;
        // 2) só soma as semanas extras do intervalo quando o dia encontrado já
        //    está em outra semana (virou o ciclo). Se ainda sobra um dia marcado
        //    na semana corrente, ele é usado como está.
        if (interval > 1 && candidate.getDay() <= base.getDay()) {
          next.setDate(next.getDate() + 7 * (interval - 1));
        }
        break;
      }
    }
    if (!found) next.setDate(base.getDate() + 7 * interval);
  } else if (rule.type === "weekly") {
    next = new Date(base);
    next.setDate(base.getDate() + 7 * interval);
  } else if (rule.type === "monthly") {
    next = new Date(base);
    const day = base.getDate();
    next.setDate(1);
    next.setMonth(base.getMonth() + interval);
    const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(day, lastDay));
  } else {
    next = new Date(base);
    next.setDate(base.getDate() + interval);
  }

  const iso = toISODate(next);
  if (rule.end_date && iso > rule.end_date) return null;
  return iso;
}

/** Texto curto descrevendo a recorrência (tooltip/indicador). */
export function describeRecurrence(rule: TaskRecurrence | null): string {
  if (!rule) return "";
  const n = Math.max(1, rule.interval || 1);
  const unit =
    rule.type === "daily" ? (n > 1 ? "dias" : "dia") : rule.type === "weekly" ? (n > 1 ? "semanas" : "semana") : n > 1 ? "meses" : "mês";
  let text = n > 1 ? `A cada ${n} ${unit}` : `Repete a cada ${unit}`;
  if (rule.type === "weekly" && rule.weekdays?.length) {
    const names = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    text += ` (${[...rule.weekdays].sort().map((d) => names[d]).join(", ")})`;
  }
  if (rule.end_date) text += ` até ${rule.end_date.split("-").reverse().join("/")}`;
  return text;
}
