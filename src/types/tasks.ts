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

/** Cores inspiradas no ClickUp para familiaridade do time. */
export const TASK_STATUS_META: Record<
  TaskStatus,
  { label: string; dot: string; header: string; border: string; badge: string }
> = {
  pendente: {
    label: "Pendente",
    dot: "bg-amber-500",
    header: "text-amber-700",
    border: "border-t-amber-500",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
  },
  fazendo: {
    label: "Fazendo",
    dot: "bg-blue-500",
    header: "text-blue-700",
    border: "border-t-blue-500",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
  },
  em_aprovacao: {
    label: "Em aprovação",
    dot: "bg-purple-500",
    header: "text-purple-700",
    border: "border-t-purple-500",
    badge: "bg-purple-100 text-purple-800 border-purple-200",
  },
  ajuste: {
    label: "Ajuste",
    dot: "bg-red-500",
    header: "text-red-700",
    border: "border-t-red-500",
    badge: "bg-red-100 text-red-800 border-red-200",
  },
  concluido: {
    label: "Concluído",
    dot: "bg-emerald-500",
    header: "text-emerald-700",
    border: "border-t-emerald-500",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
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

export const TASK_PRIORITY_META: Record<TaskPriority, { label: string; badge: string }> = {
  baixa: { label: "Baixa", badge: "bg-slate-100 text-slate-700 border-slate-200" },
  normal: { label: "Normal", badge: "bg-sky-100 text-sky-800 border-sky-200" },
  alta: { label: "Alta", badge: "bg-orange-100 text-orange-800 border-orange-200" },
  urgente: { label: "Urgente", badge: "bg-red-100 text-red-800 border-red-200" },
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
  novo_lead: { label: "Novo lead", dot: "bg-slate-400", badge: "bg-slate-100 text-slate-700 border-slate-200" },
  contato_iniciado: { label: "Contato iniciado", dot: "bg-amber-500", badge: "bg-amber-100 text-amber-800 border-amber-200" },
  qualificacao: { label: "Qualificação", dot: "bg-yellow-500", badge: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  reuniao_agendada: { label: "Reunião agendada", dot: "bg-blue-500", badge: "bg-blue-100 text-blue-800 border-blue-200" },
  proposta_enviada: { label: "Proposta enviada", dot: "bg-indigo-500", badge: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  negociacao: { label: "Negociação", dot: "bg-purple-500", badge: "bg-purple-100 text-purple-800 border-purple-200" },
  follow_up: { label: "Follow up", dot: "bg-fuchsia-500", badge: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200" },
  aguardando_documentos: { label: "Aguardando documentos", dot: "bg-orange-500", badge: "bg-orange-100 text-orange-800 border-orange-200" },
  fechamento: { label: "Fechamento", dot: "bg-teal-500", badge: "bg-teal-100 text-teal-800 border-teal-200" },
  ganho: { label: "Ganho", dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  perdido: { label: "Perdido", dot: "bg-red-500", badge: "bg-red-100 text-red-800 border-red-200" },
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
