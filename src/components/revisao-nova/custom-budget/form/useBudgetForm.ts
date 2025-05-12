
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { customBudgetSchema, FormData } from "./BudgetFormSchema";
import { CustomBudgetFormData } from "../../hooks/useCustomBudgets";

interface UseBudgetFormProps {
  selectedBudget: CustomBudgetFormData | null;
  onSubmit: (data: CustomBudgetFormData) => void;
}

export function useBudgetForm({ selectedBudget, onSubmit }: UseBudgetFormProps) {
  const [showRecurrenceOptions, setShowRecurrenceOptions] = useState(false);
  const [formattedBudget, setFormattedBudget] = useState<string>("");

  // Inicializar formulário com valores padrão ou do orçamento selecionado
  const form = useForm<FormData>({
    resolver: zodResolver(customBudgetSchema),
    defaultValues: selectedBudget ? {
      client_id: selectedBudget.clientId,
      budget_amount: selectedBudget.budgetAmount,
      start_date: selectedBudget.startDate ? new Date(selectedBudget.startDate) : undefined,
      end_date: selectedBudget.endDate ? new Date(selectedBudget.endDate) : undefined,
      platform: selectedBudget.platform as "meta" | "google" || "meta",
      description: selectedBudget.description || "",
      is_recurring: selectedBudget.isRecurring || false,
      recurrence_pattern: selectedBudget.recurrencePattern || null,
    } : {
      client_id: "",
      budget_amount: 0,
      start_date: new Date(),
      end_date: new Date(new Date().setDate(new Date().getDate() + 30)), // Padrão para 30 dias
      platform: "meta",
      description: "",
      is_recurring: false,
      recurrence_pattern: null,
    }
  });

  // Observar mudanças no campo de recorrência
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.is_recurring !== undefined) {
        setShowRecurrenceOptions(value.is_recurring);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Formatar orçamento para exibição no formulário
  useEffect(() => {
    if (selectedBudget) {
      const formatValue = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { 
          minimumFractionDigits: 2,
          maximumFractionDigits: 2 
        }).format(value);
      };
      
      setFormattedBudget(formatValue(selectedBudget.budgetAmount));
    }
  }, [selectedBudget]);

  // Calcular dias no período
  const getDaysInPeriod = () => {
    const startDate = form.getValues('start_date');
    const endDate = form.getValues('end_date');
    
    if (!startDate || !endDate) return 0;
    
    // Adicionar um dia porque queremos incluir ambas as datas
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // Calcular orçamento diário
  const getDailyBudget = () => {
    const budgetAmount = form.getValues('budget_amount');
    const days = getDaysInPeriod();
    
    if (!budgetAmount || !days || days === 0) return 0;
    
    return budgetAmount / days;
  };

  // Função para submeter o formulário
  const handleFormSubmit = async (data: FormData) => {
    console.log("Dados do formulário a serem submetidos:", data);
    
    // Converter datas para string no formato YYYY-MM-DD
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    // Preparar dados para enviar ao backend
    const formData: CustomBudgetFormData = {
      clientId: data.client_id,
      budgetAmount: Number(data.budget_amount),
      startDate: formatDate(data.start_date),
      endDate: formatDate(data.end_date),
      platform: data.platform,
      description: data.description || "",
      isRecurring: data.is_recurring || false,
      recurrencePattern: data.is_recurring ? data.recurrence_pattern : null
    };

    console.log("Dados formatados para submissão:", formData);
    onSubmit(formData);
  };

  return {
    form,
    showRecurrenceOptions,
    formattedBudget,
    getDaysInPeriod,
    getDailyBudget,
    handleFormSubmit
  };
}
