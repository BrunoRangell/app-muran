
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Form } from "@/components/ui/form";
import { Loader } from "lucide-react";
import { CustomBudgetFormData } from "../hooks/useCustomBudgets";
import { useBudgetForm } from "./form/useBudgetForm";
import { ClientSelectField } from "./form/ClientSelectField";
import { PlatformSelectField } from "./form/PlatformSelectField";
import { BudgetAmountField } from "./form/BudgetAmountField";
import { DateField } from "./form/DateField";
import { BudgetStatsCard } from "./form/BudgetStatsCard";
import { RecurrenceSection } from "./form/RecurrenceSection";
import { DescriptionField } from "./form/DescriptionField";
import { FormActions } from "./form/FormActions";

interface CustomBudgetFormProps {
  selectedBudget: CustomBudgetFormData | null;
  isSubmitting: boolean;
  onSubmit: (data: CustomBudgetFormData) => void;
  onCancel: () => void;
}

export const CustomBudgetForm = ({
  selectedBudget,
  isSubmitting,
  onSubmit,
  onCancel,
}: CustomBudgetFormProps) => {
  // Buscar clientes ativos
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ["active-clients-for-budget"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name")
        .eq("status", "active")
        .order("company_name");

      if (error) throw error;
      return data;
    },
  });

  const {
    form,
    showRecurrenceOptions,
    formattedBudget,
    getDaysInPeriod,
    getDailyBudget,
    handleFormSubmit
  } = useBudgetForm({
    selectedBudget,
    onSubmit
  });

  // Exibir um indicador de carregamento enquanto os clientes estão sendo carregados
  if (isLoadingClients) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader className="animate-spin h-6 w-6 mr-2 text-muran-primary" />
        <span>Carregando clientes...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ClientSelectField 
              form={form} 
              clients={clients} 
              isSubmitting={isSubmitting} 
            />
            <PlatformSelectField 
              form={form} 
              isSubmitting={isSubmitting} 
            />
          </div>

          <div className="flex-1">
            <BudgetAmountField 
              form={form} 
              isSubmitting={isSubmitting}
              initialFormattedValue={formattedBudget}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DateField
              form={form}
              name="start_date"
              label="Data de Início"
              isSubmitting={isSubmitting}
            />
            <DateField
              form={form}
              name="end_date"
              label="Data de Término"
              isSubmitting={isSubmitting}
            />
          </div>

          <BudgetStatsCard
            daysInPeriod={getDaysInPeriod()}
            dailyBudget={getDailyBudget()}
          />

          <RecurrenceSection
            form={form}
            isSubmitting={isSubmitting}
            showRecurrenceOptions={showRecurrenceOptions}
          />

          <DescriptionField
            form={form}
            isSubmitting={isSubmitting}
          />

          <FormActions
            isSubmitting={isSubmitting}
            onCancel={onCancel}
            isEditing={!!selectedBudget}
          />
        </form>
      </Form>
    </div>
  );
};
