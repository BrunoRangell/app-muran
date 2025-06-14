
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, DefaultValues, FieldValues } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useState } from "react";

interface UseUnifiedFormProps<T extends z.ZodType> {
  schema: T;
  defaultValues?: DefaultValues<z.infer<T>>;
  onSubmit: (data: z.infer<T>) => Promise<void>;
  onSuccess?: (data: z.infer<T>) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useUnifiedForm<T extends z.ZodType>({
  schema,
  defaultValues,
  onSubmit,
  onSuccess,
  successMessage = "Operação realizada com sucesso",
  errorMessage = "Ocorreu um erro ao processar a operação",
}: UseUnifiedFormProps<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      console.log('Iniciando submissão do formulário:', {
        formData: data,
        timestamp: new Date().toISOString()
      });

      await onSubmit(data);
      
      console.log('Formulário submetido com sucesso');
      
      toast({
        title: "Sucesso",
        description: successMessage,
      });

      if (onSuccess) {
        onSuccess(data);
      }
    } catch (error) {
      console.error("Erro na submissão do formulário:", {
        error,
        formData: data,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return {
    form,
    handleSubmit,
    isSubmitting,
    errors: form.formState.errors,
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty,
    reset: form.reset,
    setValue: form.setValue,
    watch: form.watch,
  };
}
