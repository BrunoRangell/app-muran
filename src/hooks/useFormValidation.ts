
import { useUnifiedForm } from "@/hooks/common/useUnifiedForm";
import { z } from "zod";
import { DefaultValues } from "react-hook-form";

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
