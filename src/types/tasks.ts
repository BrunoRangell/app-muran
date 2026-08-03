export type TaskStatus = "pendente" | "fazendo" | "em_aprovacao" | "ajuste" | "concluido";
export type TaskPriority = "baixa" | "normal" | "alta" | "urgente";
export type InternalArea = "Operacional" | "Financeiro" | "Administrativo";

export type LeadStatus =
  | "novo_lead"
  | "contato_iniciado"
  | "qualificacao"
  | "reuniao_agendada"
  | "proposta_enviada"
  | "negociacao"
  | "follow_up"
  | "aguardando_documentos"
  | "fechamento"
  | "ganho"
  | "perdido";

export interface Task {
  id: string;
  list_id: string | null;
  is_internal: boolean;
  internal_area: InternalArea | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignee_id: string | null;
  due_date: string | null;
  priority: TaskPriority | null;
  position: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientTaskList {
  id: string;
  client_id: string;
  name: string;
  position: number;
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string | null;
  contact_info: string | null;
  status: LeadStatus;
  assignee_id: string | null;
  notes: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

/** Paleta espelhando o ClickUp real (tema escuro). */
export const TASK_STATUS_META: Record<
  TaskStatus,
  { label: string; dot: string; header: string; border: string; badge: string }
> = {
  pendente: {
    label: "PENDENTE",
    dot: "bg-amber-400",
    header: "text-amber-300",
    border: "border-t-amber-400",
    badge: "bg-amber-400/15 text-amber-300 border-amber-400/30",
  },
  fazendo: {
    label: "FAZENDO",
    dot: "bg-sky-400",
    header: "text-sky-300",
    border: "border-t-sky-400",
    badge: "bg-sky-400/15 text-sky-300 border-sky-400/30",
  },
  em_aprovacao: {
    label: "EM APROVAÇÃO",
    dot: "bg-purple-400",
    header: "text-purple-300",
    border: "border-t-purple-400",
    badge: "bg-purple-400/15 text-purple-300 border-purple-400/30",
  },
  ajuste: {
    label: "AJUSTE",
    dot: "bg-rose-500",
    header: "text-rose-300",
    border: "border-t-rose-500",
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  },
  concluido: {
    label: "CONCLUÍDO",
    dot: "bg-emerald-400",
    header: "text-emerald-300",
    border: "border-t-emerald-400",
    badge: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  },
};

export const CLIENT_TASK_STATUSES: TaskStatus[] = [
  "pendente",
  "fazendo",
  "em_aprovacao",
  "ajuste",
  "concluido",
];

export const INTERNAL_TASK_STATUSES: TaskStatus[] = [
  "pendente",
  "fazendo",
  "em_aprovacao",
  "concluido",
];

export const TASK_PRIORITY_META: Record<TaskPriority, { label: string; badge: string; flag: string }> = {
  baixa: { label: "Baixa", badge: "bg-slate-400/10 text-slate-300 border-slate-400/25", flag: "text-slate-400" },
  normal: { label: "Normal", badge: "bg-sky-400/10 text-sky-300 border-sky-400/25", flag: "text-sky-400" },
  alta: { label: "Alta", badge: "bg-orange-400/10 text-orange-300 border-orange-400/25", flag: "text-orange-400" },
  urgente: { label: "Urgente", badge: "bg-rose-500/10 text-rose-300 border-rose-500/25", flag: "text-rose-500" },
};

export const INTERNAL_AREAS: InternalArea[] = ["Operacional", "Financeiro", "Administrativo"];

export const CLIENT_LIST_NAMES = [
  "Onboarding",
  "Relacionamento",
  "Mídia paga",
  "Criação",
  "Desenvolvimento WEB",
] as const;

export const LEAD_STATUS_META: Record<LeadStatus, { label: string; dot: string; badge: string }> = {
  novo_lead: { label: "Novo lead", dot: "bg-slate-400", badge: "bg-slate-400/15 text-slate-300 border-slate-400/30" },
  contato_iniciado: { label: "Contato iniciado", dot: "bg-amber-400", badge: "bg-amber-400/15 text-amber-300 border-amber-400/30" },
  qualificacao: { label: "Qualificação", dot: "bg-yellow-400", badge: "bg-yellow-400/15 text-yellow-300 border-yellow-400/30" },
  reuniao_agendada: { label: "Reunião agendada", dot: "bg-sky-400", badge: "bg-sky-400/15 text-sky-300 border-sky-400/30" },
  proposta_enviada: { label: "Proposta enviada", dot: "bg-indigo-400", badge: "bg-indigo-400/15 text-indigo-300 border-indigo-400/30" },
  negociacao: { label: "Negociação", dot: "bg-purple-400", badge: "bg-purple-400/15 text-purple-300 border-purple-400/30" },
  follow_up: { label: "Follow up", dot: "bg-fuchsia-400", badge: "bg-fuchsia-400/15 text-fuchsia-300 border-fuchsia-400/30" },
  aguardando_documentos: { label: "Aguardando documentos", dot: "bg-orange-400", badge: "bg-orange-400/15 text-orange-300 border-orange-400/30" },
  fechamento: { label: "Fechamento", dot: "bg-teal-400", badge: "bg-teal-400/15 text-teal-300 border-teal-400/30" },
  ganho: { label: "Ganho", dot: "bg-emerald-400", badge: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30" },
  perdido: { label: "Perdido", dot: "bg-rose-500", badge: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
};

export const LEAD_STATUSES: LeadStatus[] = [
  "novo_lead",
  "contato_iniciado",
  "qualificacao",
  "reuniao_agendada",
  "proposta_enviada",
  "negociacao",
  "follow_up",
  "aguardando_documentos",
  "fechamento",
  "ganho",
  "perdido",
];
