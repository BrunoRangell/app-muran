
import { z } from "zod";

// Schema de validação para entrada de usuário
export const userInputSchema = z.object({
  email: z.string().email("Email inválido").max(255, "Email muito longo"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres").max(128, "Senha muito longa"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  phone: z.string().regex(/^[\d\s\-\+\(\)]+$/, "Telefone inválido").optional(),
  company: z.string().min(2, "Nome da empresa deve ter pelo menos 2 caracteres").max(100, "Nome muito longo").optional(),
});

// Schema para validação de upload de arquivo
export const fileUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, "Arquivo deve ter no máximo 5MB")
    .refine((file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type), "Apenas imagens JPEG, PNG ou WebP são permitidas")
});

// Schema para validação de valores monetários
export const monetaryValueSchema = z.object({
  amount: z.number().min(0, "Valor deve ser positivo").max(999999999, "Valor muito alto"),
  currency: z.enum(["BRL", "USD", "EUR"]).default("BRL"),
});

// Schema para validação de datas
export const dateSchema = z.object({
  date: z.string().refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime()) && parsed >= new Date('1900-01-01') && parsed <= new Date('2100-12-31');
  }, "Data inválida"),
});

// Função para sanitizar entrada de texto
export const sanitizeText = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '') // Remove event handlers
    .replace(/on\w+\s*=\s*'[^']*'/gi, '') // Remove event handlers
    .trim();
};

// Função para validar e sanitizar entrada de busca
export const validateSearchInput = (input: string): string => {
  if (input.length > 100) {
    throw new Error("Termo de busca muito longo");
  }
  
  return sanitizeText(input);
};

// Função para validar IDs UUID
export const validateUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};
