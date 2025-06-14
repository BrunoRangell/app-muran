
import { useCallback } from "react";
import { z } from "zod";

// Hook para validação de dados em tempo real
export function useDataValidator() {
  
  // Validar dados de cliente
  const validateClientData = useCallback((data: any) => {
    const clientSchema = z.object({
      company_name: z.string().min(1, "Nome da empresa é obrigatório"),
      contact_name: z.string().min(1, "Nome do contato é obrigatório"),
      contact_phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
      contract_value: z.number().min(0, "Valor do contrato deve ser positivo"),
      status: z.enum(['active', 'inactive'], {
        errorMap: () => ({ message: "Status deve ser 'active' ou 'inactive'" })
      })
    });

    try {
      return { isValid: true, data: clientSchema.parse(data), errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return { isValid: false, data: null, errors };
      }
      return { isValid: false, data: null, errors: [{ field: 'general', message: 'Erro de validação' }] };
    }
  }, []);

  // Validar dados de pagamento
  const validatePaymentData = useCallback((data: any) => {
    const paymentSchema = z.object({
      client_id: z.string().uuid("ID do cliente deve ser um UUID válido"),
      amount: z.number().min(0.01, "Valor deve ser maior que zero"),
      reference_month: z.string().min(1, "Mês de referência é obrigatório"),
      notes: z.string().optional()
    });

    try {
      return { isValid: true, data: paymentSchema.parse(data), errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return { isValid: false, data: null, errors };
      }
      return { isValid: false, data: null, errors: [{ field: 'general', message: 'Erro de validação' }] };
    }
  }, []);

  // Validar dados de custo
  const validateCostData = useCallback((data: any) => {
    const costSchema = z.object({
      name: z.string().min(1, "Nome do custo é obrigatório"),
      amount: z.number().min(0.01, "Valor deve ser maior que zero"),
      date: z.string().min(1, "Data é obrigatória"),
      description: z.string().optional()
    });

    try {
      return { isValid: true, data: costSchema.parse(data), errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return { isValid: false, data: null, errors };
      }
      return { isValid: false, data: null, errors: [{ field: 'general', message: 'Erro de validação' }] };
    }
  }, []);

  return {
    validateClientData,
    validatePaymentData,
    validateCostData
  };
}
