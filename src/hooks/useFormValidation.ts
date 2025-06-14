
import { useUnifiedForm } from "@/hooks/common/useUnifiedForm";
import { z } from "zod";
import { DefaultValues } from "react-hook-form";
import { logger } from "@/utils/logger";

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
  logger.info("FORM_VALIDATION", "Inicializando validação de formulário");

  const {
    form,
    handleSubmit,
    isSubmitting,
    errors,
  } = useUnifiedForm({
    schema,
    defaultValues,
    onSubmit,
    onSuccess,
  });

  return {
    form,
    handleSubmit,
    isSubmitting,
    errors,
  };
}
