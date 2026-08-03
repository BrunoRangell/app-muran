import { useCallback, useEffect, useState } from "react";

/** Colunas configuráveis da lista de tarefas (Nome é fixa e sempre a primeira). */
export type TaskColumnId = "assignee" | "due" | "priority" | "created" | "origin";

export interface TaskColumnPref {
  id: TaskColumnId;
  show: boolean;
}

export const TASK_COLUMN_LABEL: Record<TaskColumnId, string> = {
  assignee: "Responsável",
  due: "Data de vencimento",
  priority: "Prioridade",
  created: "Criado em",
  origin: "Lista/Pasta",
};

export const TASK_COLUMN_WIDTH: Record<TaskColumnId, string> = {
  assignee: "w-[110px]",
  due: "w-[120px]",
  priority: "w-[100px]",
  created: "w-[110px]",
  origin: "w-[180px]",
};

export const DEFAULT_TASK_COLUMNS: TaskColumnPref[] = [
  { id: "assignee", show: true },
  { id: "due", show: true },
  { id: "priority", show: true },
  { id: "created", show: false },
  { id: "origin", show: false },
];

/** Garante que novas colunas apareçam em preferências antigas salvas. */
const reconcile = (saved: TaskColumnPref[]): TaskColumnPref[] => {
  const known = saved.filter((c) => c.id in TASK_COLUMN_LABEL);
  const missing = DEFAULT_TASK_COLUMNS.filter((d) => !known.some((c) => c.id === d.id));
  return [...known, ...missing];
};

const EVENT = "muran:tasks-pref";

/**
 * Preferência global sincronizada entre componentes (toolbar e lista) via
 * localStorage + evento de janela.
 */
function useGlobalPref<T>(key: string, initial: T, fix?: (value: T) => T) {
  const read = useCallback((): T => {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? (JSON.parse(raw) as T) : initial;
      return fix ? fix(parsed) : parsed;
    } catch {
      return initial;
    }
  }, [key]);

  const [value, setValue] = useState<T>(read);

  useEffect(() => {
    const onSync = (e: Event) => {
      if ((e as CustomEvent<string>).detail === key) setValue(read());
    };
    window.addEventListener(EVENT, onSync);
    return () => window.removeEventListener(EVENT, onSync);
  }, [key, read]);

  const update = useCallback(
    (next: T) => {
      setValue(next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* storage indisponível */
      }
      window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
    },
    [key]
  );

  return [value, update] as const;
}

/** Ordem/visibilidade das colunas (preferência global única). */
export const useTaskColumnPrefs = () =>
  useGlobalPref<TaskColumnPref[]>("tasks:columns", DEFAULT_TASK_COLUMNS, reconcile);

/** Toggle "Mostrar concluídas" — desligado por padrão. */
export const useShowCompleted = () => useGlobalPref<boolean>("tasks:showCompleted", false);
