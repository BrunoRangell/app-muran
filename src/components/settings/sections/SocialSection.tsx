
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Instagram, Linkedin, Music } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { SocialMediaSchemaType } from "@/components/team/schemas/memberSchema";

interface SocialSectionProps {
  form: UseFormReturn<SocialMediaSchemaType>;
}

export const SocialSection = ({ form }: SocialSectionProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-[#321e32] mb-2">Redes Sociais Profissionais</h3>
        <p className="text-gray-600">Conecte suas redes sociais para melhor networking</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="instagram"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center space-x-2">
                <Instagram className="h-4 w-4 text-pink-500" />
                <span>Instagram</span>
              </FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="@seu_usuario"
                  className="focus:ring-[#ff6e00] focus:border-[#ff6e00]"
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
              <FormLabel className="flex items-center space-x-2">
                <Linkedin className="h-4 w-4 text-blue-600" />
                <span>LinkedIn</span>
              </FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="linkedin.com/in/seu-perfil"
                  className="focus:ring-[#ff6e00] focus:border-[#ff6e00]"
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
            <FormItem className="md:col-span-2">
              <FormLabel className="flex items-center space-x-2">
                <Music className="h-4 w-4 text-black" />
                <span>TikTok</span>
              </FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="@seu_usuario"
                  className="focus:ring-[#ff6e00] focus:border-[#ff6e00]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">💡 Dica Profissional</h4>
        <p className="text-blue-700 text-sm">
          Manter suas redes sociais atualizadas ajuda na construção de uma presença digital 
          profissional e fortalece o networking da equipe.
        </p>
      </div>
    </div>
  );
};
