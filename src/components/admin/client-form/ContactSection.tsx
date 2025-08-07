
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { ClientFormData } from "@/types/client";
import { formatPhoneNumber } from "@/utils/formatters";
import { SanitizedInput } from "@/components/common/SanitizedInputs";
import { handlePhonePaste } from "@/utils/inputSanitizers";

interface ContactSectionProps {
  form: UseFormReturn<ClientFormData>;
}

export const ContactSection = ({ form }: ContactSectionProps) => {
  return (
    <>
      <FormField
        control={form.control}
        name="contactName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome do Responsável</FormLabel>
            <FormControl>
              <SanitizedInput placeholder="Nome completo do responsável" {...field} maxLengthLimit={255} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="contactPhone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Contato do Responsável</FormLabel>
            <FormControl>
              <Input 
                placeholder="(00) 00000-0000"
                {...field}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  e.target.value = formatted;
                  field.onChange(formatted);
                }}
                onPaste={(e) => handlePhonePaste(e as any, (digits) => {
                  // Aplica máscara após normalizar os dígitos
                  const masked = formatPhoneNumber(digits);
                  (e.target as HTMLInputElement).value = masked;
                  field.onChange(masked);
                })}
                maxLength={15}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
