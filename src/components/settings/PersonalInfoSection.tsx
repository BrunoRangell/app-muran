
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Calendar, FileText, Camera } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { SocialMediaSchemaType } from "@/components/team/schemas/memberSchema";

interface PersonalInfoSectionProps {
  form: UseFormReturn<SocialMediaSchemaType>;
}

export const PersonalInfoSection = ({ form }: PersonalInfoSectionProps) => {
  const photoUrl = form.watch("photo_url");
  const userName = form.watch("name");

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent">
        <div className="flex items-center space-x-2">
          <User className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-[#321e32]">Informações Pessoais</CardTitle>
        </div>
        <CardDescription>
          Suas informações pessoais básicas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-[#ff6e00]" />
                  <span>Nome *</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} className="focus:ring-[#ff6e00] focus:border-[#ff6e00]" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="birthday"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-[#ff6e00]" />
                  <span>Data de Aniversário *</span>
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

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="photo_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center space-x-2">
                  <Camera className="h-4 w-4 text-[#ff6e00]" />
                  <span>URL da Foto de Perfil</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="https://exemplo.com/sua-foto.jpg"
                    className="focus:ring-[#ff6e00] focus:border-[#ff6e00]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Preview da foto */}
          {photoUrl && (
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <Avatar className="h-16 w-16">
                <AvatarImage src={photoUrl} alt={userName || "Preview"} />
                <AvatarFallback className="bg-[#ff6e00] text-white text-lg">
                  {userName?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-gray-700">Preview da foto</p>
                <p className="text-xs text-gray-500">Assim será exibida sua foto de perfil</p>
              </div>
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-[#ff6e00]" />
                <span>Biografia</span>
              </FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Conte um pouco sobre você..."
                  className="resize-none h-24 focus:ring-[#ff6e00] focus:border-[#ff6e00]"
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
