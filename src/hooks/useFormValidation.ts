
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/use-toast";
import { z } from "zod";

interface UseFormValidationProps<T extends z.ZodType> {
  schema: T;
  defaultValues?: Partial<z.infer<T>>;
  onSubmit: (data: z.infer<T>) => Promise<void>;
}

export function useFormValidation<T extends z.ZodType>({
  schema,
  defaultValues,
  onSubmit,
}: UseFormValidationProps<T>) {
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Erro na submissão do formulário:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar formulário",
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
