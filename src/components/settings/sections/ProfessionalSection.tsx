
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Shield, Calendar, AlertCircle } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { SocialMediaSchemaType } from "@/components/team/schemas/memberSchema";

interface ProfessionalSectionProps {
  form: UseFormReturn<SocialMediaSchemaType>;
  isAdmin: boolean;
  isMember: boolean;
}

export const ProfessionalSection = ({ form, isAdmin, isMember }: ProfessionalSectionProps) => {
  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Acesso Restrito</h3>
        <p className="text-gray-500">
          Apenas administradores podem acessar as configurações profissionais.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-[#321e32] mb-2">Configurações Profissionais</h3>
        <p className="text-gray-600">Gerencie informações relacionadas ao trabalho</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center space-x-2">
                <Briefcase className="h-4 w-4 text-[#ff6e00]" />
                <span>Cargo</span>
              </FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  disabled={isMember}
                  className={`focus:ring-[#ff6e00] focus:border-[#ff6e00] ${
                    isMember ? "bg-gray-100 text-gray-600" : ""
                  }`}
                  placeholder="Ex: Desenvolvedor, Designer, Gerente"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="permission"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-[#ff6e00]" />
                <span>Nível de Permissão</span>
              </FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger className="focus:ring-[#ff6e00] focus:border-[#ff6e00]">
                    <SelectValue placeholder="Selecione a permissão" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-[#ff6e00]" />
                <span>Na Muran desde</span>
              </FormLabel>
              <FormControl>
                <Input 
                  type="date" 
                  {...field} 
                  className="focus:ring-[#ff6e00] focus:border-[#ff6e00]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-medium text-purple-800 mb-2">ℹ️ Informações Importantes</h4>
        <ul className="text-purple-700 text-sm space-y-1">
          <li>• Apenas administradores podem alterar permissões</li>
          <li>• Mudanças de permissão afetam o acesso às funcionalidades</li>
          <li>• A data de início é usada para calcular tempo na empresa</li>
        </ul>
      </div>
    </div>
  );
};
