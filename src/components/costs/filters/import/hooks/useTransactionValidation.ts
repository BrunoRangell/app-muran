
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Transaction } from "../types";

export function useTransactionValidation() {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  const validateTransactions = (selectedTransactions: Transaction[]) => {
    const newErrors: { [key: string]: string } = {};
    let hasErrors = false;

    selectedTransactions.forEach(transaction => {
      if (!transaction.name?.trim()) {
        newErrors[`name-${transaction.fitid}`] = "Nome é obrigatório";
        hasErrors = true;
      }
      if (!transaction.category) {
        newErrors[`category-${transaction.fitid}`] = "Categoria é obrigatória";
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  };

  const clearError = (type: string, fitid: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${type}-${fitid}`];
      return newErrors;
    });
  };

  return {
    errors,
    validateTransactions,
    clearError
  };
}
