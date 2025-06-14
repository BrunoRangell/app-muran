
import { z } from "zod";

// Schemas de validação centralizados

export const clientSchema = z.object({
  company_name: z.string().min(1, "Nome da empresa é obrigatório"),
  contact_name: z.string().min(1, "Nome do contato é obrigatório"),
  contact_phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  contract_value: z.number().min(0, "Valor do contrato deve ser positivo"),
  status: z.enum(['active', 'inactive'], {
    errorMap: () => ({ message: "Status deve ser 'active' ou 'inactive'" })
  })
});

export const paymentSchema = z.object({
  client_id: z.string().uuid("ID do cliente deve ser um UUID válido"),
  amount: z.number().min(0.01, "Valor deve ser maior que zero"),
  reference_month: z.string().min(1, "Mês de referência é obrigatório"),
  notes: z.string().optional()
});

export const costSchema = z.object({
  name: z.string().min(1, "Nome do custo é obrigatório"),
  amount: z.number().min(0.01, "Valor deve ser maior que zero"),
  date: z.string().min(1, "Data é obrigatória"),
  description: z.string().optional()
});

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
}

export function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  return cleanCPF.length === 11;
}

export function validateCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  return cleanCNPJ.length === 14;
}
