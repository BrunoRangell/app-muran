
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Shield, Calendar } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { SocialMediaSchemaType } from "@/components/team/schemas/memberSchema";

interface ProfessionalInfoSectionProps {
  form: UseFormReturn<SocialMediaSchemaType>;
  isAdmin: boolean;
  isMember: boolean;
}

export const ProfessionalInfoSection = ({ form, isAdmin, isMember }: ProfessionalInfoSectionProps) => {
  if (!isAdmin) return null;

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent">
        <div className="flex items-center space-x-2">
          <Briefcase className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-[#321e32]">Informações Profissionais</CardTitle>
        </div>
        <CardDescription>
          Configurações relacionadas ao trabalho (somente administradores)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
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
        </div>

        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <FormItem>
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
      </CardContent>
    </Card>
  );
};
