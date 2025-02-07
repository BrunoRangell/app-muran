
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { SocialMediaSchemaType } from "../schemas/memberSchema";

interface SocialMediaFormProps {
  form: UseFormReturn<SocialMediaSchemaType>;
}

export const SocialMediaForm = ({ form }: SocialMediaFormProps) => {
  return (
    <div className="space-y-3 border rounded-lg p-3 bg-gray-50">
      <h3 className="font-medium text-sm text-gray-700">Redes Sociais</h3>
      
      <FormField
        control={form.control}
        name="instagram"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Instagram (URL)</FormLabel>
            <FormControl>
              <Input {...field} placeholder="https://www.instagram.com/seu.perfil/" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="linkedin"
        render={({ field }) => (
          <FormItem>
            <FormLabel>LinkedIn (URL)</FormLabel>
            <FormControl>
              <Input {...field} placeholder="https://www.linkedin.com/in/seu-perfil/" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="tiktok"
        render={({ field }) => (
          <FormItem>
            <FormLabel>TikTok (URL)</FormLabel>
            <FormControl>
              <Input {...field} placeholder="https://www.tiktok.com/@seu.perfil" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
