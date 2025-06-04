
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { SocialMediaSchemaType } from "../schemas/memberSchema";
import { Instagram, Linkedin } from "lucide-react";

interface SocialMediaFormProps {
  form: UseFormReturn<SocialMediaSchemaType>;
}

export const SocialMediaForm = ({ form }: SocialMediaFormProps) => {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="instagram"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center space-x-2 text-sm">
              <Instagram className="h-3 w-3 text-[#ff6e00]" />
              <span>Instagram</span>
            </FormLabel>
            <FormControl>
              <Input 
                {...field} 
                placeholder="https://www.instagram.com/seu.perfil/"
                className="h-9 focus:ring-[#ff6e00] focus:border-[#ff6e00]"
              />
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
            <FormLabel className="flex items-center space-x-2 text-sm">
              <Linkedin className="h-3 w-3 text-[#ff6e00]" />
              <span>LinkedIn</span>
            </FormLabel>
            <FormControl>
              <Input 
                {...field} 
                placeholder="https://www.linkedin.com/in/seu-perfil/"
                className="h-9 focus:ring-[#ff6e00] focus:border-[#ff6e00]"
              />
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
            <FormLabel className="flex items-center space-x-2 text-sm">
              <span className="h-3 w-3 text-[#ff6e00] font-bold text-xs">TT</span>
              <span>TikTok</span>
            </FormLabel>
            <FormControl>
              <Input 
                {...field} 
                placeholder="https://www.tiktok.com/@seu.perfil"
                className="h-9 focus:ring-[#ff6e00] focus:border-[#ff6e00]"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
