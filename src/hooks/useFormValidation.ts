
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, DefaultValues } from "react-hook-form";
import { toast } from "@/components/ui/use-toast";
import { z } from "zod";
import { handleApiError } from "@/lib/errors";

interface UseFormValidationProps<T extends z.ZodType> {
  schema: T;
  defaultValues?: DefaultValues<z.infer<T>>;
  onSubmit: (data: z.infer<T>) => Promise<void>;
  onSuccess?: () => void;
}

export function useFormValidation<T extends z.ZodType>({
  schema,
  defaultValues,
  onSubmit,
  onSuccess,
}: UseFormValidationProps<T>) {
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      console.log('Iniciando submissão do formulário:', {
        formData: data,
        timestamp: new Date().toISOString()
      });

      await onSubmit(data);
      
      console.log('Formulário submetido com sucesso');
      
      toast({
        title: "Sucesso",
        description: "Operação realizada com sucesso",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const appError = handleApiError(error);
      console.error("Erro na submissão do formulário:", {
        error: appError,
        formData: data,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Erro",
        description: appError.message,
        variant: "destructive",
      });
    }
  });

  return {
    form,
    handleSubmit,
    isSubmitting: form.formState.isSubmitting,
    errors: form.formState.errors,
  };
}
