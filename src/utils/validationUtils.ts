
import { z } from "zod";

// Validações comuns reutilizáveis
export const commonValidations = {
  email: z.string().email("Email inválido"),
  phone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, "Formato: (11) 99999-9999"),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "Formato: 000.000.000-00"),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "Formato: 00.000.000/0000-00"),
  currency: z.number().min(0, "Valor deve ser positivo"),
  percentage: z.number().min(0).max(100, "Percentual deve estar entre 0 e 100"),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), "Data inválida"),
  requiredString: z.string().min(1, "Campo obrigatório"),
  optionalString: z.string().optional(),
};

// Função para validar dados antes de envio
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: string[] } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ["Erro de validação desconhecido"] };
  }
};

// Sanitização de dados
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, "");
};

export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitized = { ...obj };
  
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key]);
    }
  });
  
  return sanitized;
};
