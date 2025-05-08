
import * as z from "zod";
import { isValid } from "date-fns";

// Schema para validação do formulário
export const customBudgetSchema = z.object({
  client_id: z.string({
    required_error: "Selecione um cliente",
  }),
  budget_amount: z.number({
    required_error: "Informe o valor do orçamento",
  }).positive("O valor deve ser maior que zero"),
  start_date: z.date({
    required_error: "Informe a data de início",
  }),
  end_date: z.date({
    required_error: "Informe a data de término",
  }).refine(
    (date) => date instanceof Date && !isNaN(date.getTime()),
    { message: "Data inválida" }
  ),
  platform: z.enum(['meta', 'google'], {
    required_error: "Selecione uma plataforma",
  }),
  description: z.string().nullable().optional(),
  is_recurring: z.boolean().default(false),
  recurrence_pattern: z.string().nullable().optional(),
}).refine(
  (data) => data.end_date >= data.start_date,
  {
    message: "A data de término deve ser igual ou posterior à data de início",
    path: ["end_date"],
  }
).refine(
  (data) => !data.is_recurring || (data.is_recurring && data.recurrence_pattern),
  {
    message: "Selecione um padrão de recorrência para orçamentos recorrentes",
    path: ["recurrence_pattern"],
  }
);

export type FormData = z.infer<typeof customBudgetSchema>;

// Constantes para os padrões de recorrência
export const RECURRENCE_PATTERNS = [
  { value: "weekly", label: "Semanal" },
  { value: "biweekly", label: "Quinzenal" },
  { value: "monthly", label: "Mensal" },
  { value: "custom", label: "Personalizado" },
];
