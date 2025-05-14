
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CustomBudgetFormData } from "../../hooks/useCustomBudgets";
import { formatCurrency } from "@/utils/formatters";
import { customBudgetSchema, FormData } from "./BudgetFormSchema";
import { formatDateToYYYYMMDD } from "./DateFormatUtils";

interface UseBudgetFormProps {
  selectedBudget: CustomBudgetFormData | null;
  onSubmit: (data: CustomBudgetFormData) => void;
}

export function useBudgetForm({ selectedBudget, onSubmit }: UseBudgetFormProps) {
  const [formattedBudget, setFormattedBudget] = useState("");
  const [showRecurrenceOptions, setShowRecurrenceOptions] = useState(false);

  // Configurar o formulário com react-hook-form e zod
  const form = useForm<FormData>({
    resolver: zodResolver(customBudgetSchema),
    defaultValues: {
      client_id: "",
      budget_amount: 0,
      start_date: new Date(),
      end_date: new Date(),
      platform: 'meta',
      description: "",
      is_recurring: false,
      recurrence_pattern: null,
    },
    mode: "onChange", // Validar ao alterar os campos
  });

  // Preencher o formulário quando um orçamento for selecionado para edição
  useEffect(() => {
    if (selectedBudget) {
      try {
        // Log para debug
        console.log('Dados do orçamento selecionado:', selectedBudget);
        
        // Corrigindo o problema da data: converter as strings para objetos Date
        // sem alterar o fuso horário
        let startDate: Date | null = null;
        let endDate: Date | null = null;
        
        try {
          // Garantir que temos uma string de data válida antes de construir o objeto Date
          if (selectedBudget.startDate && typeof selectedBudget.startDate === 'string') {
            startDate = new Date(`${selectedBudget.startDate}T12:00:00Z`);
            // Verificar se a data é válida
            if (isNaN(startDate.getTime())) {
              console.warn('Data de início inválida:', selectedBudget.startDate);
              startDate = new Date(); // Fallback para a data atual
            }
          } else {
            startDate = new Date();
          }
          
          if (selectedBudget.endDate && typeof selectedBudget.endDate === 'string') {
            endDate = new Date(`${selectedBudget.endDate}T12:00:00Z`);
            // Verificar se a data é válida
            if (isNaN(endDate.getTime())) {
              console.warn('Data de término inválida:', selectedBudget.endDate);
              endDate = new Date(); // Fallback para a data atual
            }
          } else {
            endDate = new Date();
          }
        } catch (error) {
          console.error('Erro ao processar datas:', error);
          // Use datas atuais como fallback
          startDate = new Date();
          endDate = new Date();
        }
        
        setShowRecurrenceOptions(!!selectedBudget.isRecurring);
        
        // Log para verificar as datas processadas
        console.log('Datas processadas:', { 
          startDate: startDate?.toISOString(), 
          endDate: endDate?.toISOString() 
        });
        
        form.reset({
          client_id: selectedBudget.clientId,
          budget_amount: selectedBudget.budgetAmount,
          start_date: startDate,
          end_date: endDate,
          // Corrigindo o erro: garantindo que o valor de platform é sempre 'meta' ou 'google'
          platform: (selectedBudget.platform === 'meta' || selectedBudget.platform === 'google') 
            ? selectedBudget.platform 
            : 'meta',
          description: selectedBudget.description,
          is_recurring: selectedBudget.isRecurring || false,
          recurrence_pattern: selectedBudget.recurrencePattern || null,
        });
        setFormattedBudget(formatCurrency(selectedBudget.budgetAmount));
      } catch (error) {
        console.error('Erro ao processar orçamento selecionado:', error);
        // Reset para valores padrão em caso de erro
        form.reset({
          client_id: "",
          budget_amount: 0,
          start_date: new Date(),
          end_date: new Date(),
          platform: 'meta',
          description: "",
          is_recurring: false,
          recurrence_pattern: null,
        });
      }
    } else {
      form.reset({
        client_id: "",
        budget_amount: 0,
        start_date: new Date(),
        end_date: new Date(),
        platform: 'meta',
        description: "",
        is_recurring: false,
        recurrence_pattern: null,
      });
      setFormattedBudget("");
      setShowRecurrenceOptions(false);
    }
  }, [selectedBudget, form]);

  // Monitorar mudanças no is_recurring para atualizar o estado de exibição
  const isRecurring = form.watch("is_recurring");
  useEffect(() => {
    setShowRecurrenceOptions(isRecurring);
  }, [isRecurring]);

  // Calcular o número de dias no período e o valor diário
  const startDate = form.watch("start_date");
  const endDate = form.watch("end_date");
  const budgetAmount = form.watch("budget_amount");

  const getDaysInPeriod = () => {
    if (startDate && endDate && startDate instanceof Date && endDate instanceof Date) {
      // +1 para incluir o dia inicial e final na contagem
      return Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    }
    return 0;
  };

  const getDailyBudget = () => {
    const days = getDaysInPeriod();
    if (days > 0 && budgetAmount) {
      return budgetAmount / days;
    }
    return 0;
  };

  // Manipulador de submissão do formulário
  const handleFormSubmit = (data: FormData) => {
    try {
      const formData: CustomBudgetFormData = {
        clientId: data.client_id,
        budgetAmount: data.budget_amount,
        startDate: formatDateToYYYYMMDD(data.start_date),
        endDate: formatDateToYYYYMMDD(data.end_date),
        platform: data.platform,
        description: data.description || "",
        isRecurring: data.is_recurring,
        recurrencePattern: data.is_recurring ? data.recurrence_pattern : undefined
      };

      onSubmit(formData);
    } catch (error) {
      console.error('Erro ao processar formulário:', error);
    }
  };

  return {
    form,
    showRecurrenceOptions,
    formattedBudget,
    setFormattedBudget,
    getDaysInPeriod,
    getDailyBudget,
    handleFormSubmit,
  };
}
