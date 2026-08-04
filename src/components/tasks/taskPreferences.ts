import { useCallback, useEffect, useState } from "react";

/** Colunas configuráveis da lista de tarefas (Nome é fixa e sempre a primeira). */
export type TaskColumnId = "status" | "assignee" | "due" | "priority" | "created" | "origin";

export interface TaskColumnPref {
  id: TaskColumnId;
  show: boolean;
  /** Largura em px (ajustável arrastando a borda do cabeçalho). */
  width?: number;
}


export const TASK_COLUMN_LABEL: Record<TaskColumnId, string> = {
  status: "Status",
  assignee: "Responsável",
  due: "Data de vencimento",
  priority: "Prioridade",
  created: "Criado em",
  origin: "Lista/Pasta",
};

/** Largura padrão (px) de cada coluna. */
export const TASK_COLUMN_DEFAULT_WIDTH: Record<TaskColumnId, number> = {
  status: 130,
  assignee: 110,
  due: 130,
  priority: 100,
  created: 110,
  origin: 180,
};

/** Largura mínima permitida ao arrastar. */
export const TASK_COLUMN_MIN_WIDTH = 60;

export const DEFAULT_TASK_COLUMNS: TaskColumnPref[] = [
  { id: "status", show: true, width: TASK_COLUMN_DEFAULT_WIDTH.status },
  { id: "assignee", show: true, width: TASK_COLUMN_DEFAULT_WIDTH.assignee },
  { id: "due", show: true, width: TASK_COLUMN_DEFAULT_WIDTH.due },
  { id: "priority", show: true, width: TASK_COLUMN_DEFAULT_WIDTH.priority },
  { id: "created", show: false, width: TASK_COLUMN_DEFAULT_WIDTH.created },
  { id: "origin", show: false, width: TASK_COLUMN_DEFAULT_WIDTH.origin },
];

/** Garante que novas colunas/larguras apareçam em preferências antigas salvas. */
const reconcile = (saved: TaskColumnPref[]): TaskColumnPref[] => {
  const known = saved
    .filter((c) => c.id in TASK_COLUMN_LABEL)
    .map((c) => ({
      ...c,
      width: Math.max(
        TASK_COLUMN_MIN_WIDTH,
        c.width ?? TASK_COLUMN_DEFAULT_WIDTH[c.id]
      ),
    }));
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

/**
 * "Habilitar salvamento automático" por visualização (chave = id da view).
 * Desligado por padrão: mudanças de toolbar ficam em rascunho até salvar.
 */
export const useViewAutosave = () =>
  useGlobalPref<Record<string, boolean>>("tasks:viewAutosave", {});
