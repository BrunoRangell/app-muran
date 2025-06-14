
import { z } from "zod";

export const customBudgetSchema = z.object({
  platform: z.enum(["meta", "google"], {
    required_error: "Selecione uma plataforma",
  }),
  client_id: z.string().min(1, "Selecione um cliente"),
  budget_amount: z.number({
    required_error: "Informe o valor do orçamento",
    invalid_type_error: "Valor deve ser um número",
  }).min(0.01, "Valor deve ser maior que zero"),
  start_date: z.date({
    required_error: "Selecione a data de início",
  }),
  end_date: z.date({
    required_error: "Selecione a data de término",
  }),
  description: z.string().optional(),
}).refine((data) => data.end_date >= data.start_date, {
  message: "Data de término deve ser maior ou igual à data de início",
  path: ["end_date"],
});

export type CustomBudgetFormData = z.infer<typeof customBudgetSchema>;
