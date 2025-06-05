
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Calendar, FileText } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { SocialMediaSchemaType } from "@/components/team/schemas/memberSchema";
import { PhotoUploadDialog } from "../PhotoUploadDialog";
import { useCurrentUser } from "@/hooks/useTeamMembers";

interface ProfileSectionProps {
  form: UseFormReturn<SocialMediaSchemaType>;
}

export const ProfileSection = ({ form }: ProfileSectionProps) => {
  const photoUrl = form.watch("photo_url");
  const userName = form.watch("name");
  const { data: currentUser } = useCurrentUser();

  const handlePhotoUpdate = (newUrl: string) => {
    form.setValue("photo_url", newUrl);
  };

  return (
    <div className="space-y-8">
      {/* Foto de Perfil */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={photoUrl} alt={userName || "Profile"} />
            <AvatarFallback className="bg-[#ff6e00] text-white text-xl">
              {userName?.charAt(0)?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div className="space-y-3">
          <PhotoUploadDialog
            currentPhotoUrl={photoUrl}
            onPhotoUpdate={handlePhotoUpdate}
            userId={currentUser?.id || ''}
          />
          
          <p className="text-xs text-gray-500">
            Recomendado: imagem quadrada, mínimo 400x400px
          </p>
        </div>
      </div>

      {/* Informações Básicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center space-x-2">
                <User className="h-4 w-4 text-[#ff6e00]" />
                <span>Nome Completo *</span>
              </FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  className="focus:ring-[#ff6e00] focus:border-[#ff6e00]" 
                  placeholder="Seu nome completo"
                />
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

      {/* Biografia */}
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
    </div>
  );
};
