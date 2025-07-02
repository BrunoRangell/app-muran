
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, DefaultValues } from "react-hook-form";
import { toast } from "@/components/ui/use-toast";
import { z } from "zod";
import { handleApiError } from "@/lib/errors";
import { sanitizeText, validateUUID } from "@/components/auth/InputValidation";

interface UseSecureFormValidationProps<T extends z.ZodType> {
  schema: T;
  defaultValues?: DefaultValues<z.infer<T>>;
  onSubmit: (data: z.infer<T>) => Promise<void>;
  onSuccess?: () => void;
}

export function useSecureFormValidation<T extends z.ZodType>({
  schema,
  defaultValues,
  onSubmit,
  onSuccess,
}: UseSecureFormValidationProps<T>) {
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      console.log('Iniciando submissão segura do formulário:', {
        timestamp: new Date().toISOString(),
        hasData: !!data
      });

      // Sanitizar dados de entrada
      const sanitizedData = { ...data };
      
      // Sanitizar campos de texto
      Object.keys(sanitizedData).forEach(key => {
        if (typeof sanitizedData[key] === 'string') {
          sanitizedData[key] = sanitizeText(sanitizedData[key]);
        }
      });

      // Validar UUIDs se presentes
      if (sanitizedData.clientId && !validateUUID(sanitizedData.clientId)) {
        throw new Error("ID do cliente inválido");
      }

      if (sanitizedData.id && !validateUUID(sanitizedData.id)) {
        throw new Error("ID inválido");
      }

      await onSubmit(sanitizedData);
      
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
        error: appError.message,
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
