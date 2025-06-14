
import { useCallback } from "react";
import { clientSchema, paymentSchema, costSchema } from "@/utils/validators";
import { logger } from "@/utils/logger";

export function useDataValidator() {
  
  const validateClientData = useCallback((data: any) => {
    try {
      const validatedData = clientSchema.parse(data);
      logger.info("VALIDATOR", "Dados de cliente válidos");
      return { isValid: true, data: validatedData, errors: [] };
    } catch (error: any) {
      logger.warn("VALIDATOR", "Erro na validação de cliente", error);
      if (error.errors) {
        const errors = error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return { isValid: false, data: null, errors };
      }
      return { isValid: false, data: null, errors: [{ field: 'general', message: 'Erro de validação' }] };
    }
  }, []);

  const validatePaymentData = useCallback((data: any) => {
    try {
      const validatedData = paymentSchema.parse(data);
      logger.info("VALIDATOR", "Dados de pagamento válidos");
      return { isValid: true, data: validatedData, errors: [] };
    } catch (error: any) {
      logger.warn("VALIDATOR", "Erro na validação de pagamento", error);
      if (error.errors) {
        const errors = error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return { isValid: false, data: null, errors };
      }
      return { isValid: false, data: null, errors: [{ field: 'general', message: 'Erro de validação' }] };
    }
  }, []);

  const validateCostData = useCallback((data: any) => {
    try {
      const validatedData = costSchema.parse(data);
      logger.info("VALIDATOR", "Dados de custo válidos");
      return { isValid: true, data: validatedData, errors: [] };
    } catch (error: any) {
      logger.warn("VALIDATOR", "Erro na validação de custo", error);
      if (error.errors) {
        const errors = error.errors.map((err: any) => ({
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
