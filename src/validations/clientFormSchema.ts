
import * as z from "zod";

export const clientFormSchema = z.object({
  companyName: z.string().min(1, "Nome da empresa é obrigatório"),
  contractValue: z.any().refine(val => {
    try {
      const number = parseFloat(String(val).replace(/[^\d,.-]/g, '').replace(',', '.'));
      return !isNaN(number) && number > 0;
    } catch {
      return false;
    }
  }, "Valor do contrato inválido"),
  firstPaymentDate: z.string().refine(val => {
    try {
      return Boolean(val && new Date(val).toString() !== 'Invalid Date');
    } catch {
      return false;
    }
  }, "Data de início inválida"),
  status: z.enum(["active", "inactive"], {
    required_error: "Status é obrigatório",
  }),
  paymentType: z.enum(["pre", "post"]),
  acquisitionChannel: z.string(),
  customAcquisitionChannel: z.string().optional(),
  companyBirthday: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string()
    .regex(/^(\(\d{2}\)\s?\d{4,5}-\d{4})?$/, "Formato inválido")
    .optional(),
  lastPaymentDate: z.string().optional(),
}).refine((data) => {
  if (data.status === "inactive" && !data.lastPaymentDate) {
    return false;
  }
  return true;
}, {
  message: "Data do último pagamento é obrigatória quando o status é inativo",
  path: ["lastPaymentDate"]
});
