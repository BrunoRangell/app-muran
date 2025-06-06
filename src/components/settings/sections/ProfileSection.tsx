
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Calendar, FileText } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { SocialMediaSchemaType } from "@/components/team/schemas/memberSchema";
import { PhotoUploadDialog } from "../PhotoUploadDialog";
import { useCurrentUser } from "@/hooks/useTeamMembers";
import { useEffect } from "react";

interface ProfileSectionProps {
  form: UseFormReturn<SocialMediaSchemaType>;
}

export const ProfileSection = ({ form }: ProfileSectionProps) => {
  const photoUrl = form.watch("photo_url");
  const userName = form.watch("name");
  const { data: currentUser, refetch } = useCurrentUser();

  // Recarregar dados do usuário quando a foto mudar
  useEffect(() => {
    if (photoUrl && currentUser) {
      console.log('Photo URL mudou, recarregando dados do usuário:', photoUrl);
      refetch();
    }
  }, [photoUrl, refetch, currentUser]);

  const handlePhotoUpdate = (newUrl: string) => {
    console.log('=== ATUALIZANDO FOTO NO FORMULÁRIO ===');
    console.log('Nova URL:', newUrl);
    console.log('URL anterior:', photoUrl);
    
    // Atualizar o formulário
    form.setValue("photo_url", newUrl);
    
    // Forçar re-render do formulário
    form.trigger("photo_url");
    
    // Recarregar dados do usuário
    setTimeout(() => {
      console.log('Recarregando dados do usuário após atualização da foto...');
      refetch();
    }, 1000);
    
    console.log('Formulário atualizado com sucesso');
  };

  console.log('=== PROFILE SECTION RENDER ===');
  console.log('Current User ID:', currentUser?.id);
  console.log('Photo URL atual no form:', photoUrl);
  console.log('Photo URL atual no user:', currentUser?.photo_url);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Avatar className="h-24 w-24">
            <AvatarImage 
              src={photoUrl || currentUser?.photo_url} 
              alt={userName || "Profile"}
              key={photoUrl || currentUser?.photo_url} // Force re-render when URL changes
            />
            <AvatarFallback className="bg-[#ff6e00] text-white text-xl">
              {userName?.charAt(0)?.toUpperCase() || currentUser?.name?.charAt(0)?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div className="space-y-3">
          {currentUser?.id && (
            <PhotoUploadDialog
              currentPhotoUrl={photoUrl || currentUser?.photo_url}
              onPhotoUpdate={handlePhotoUpdate}
              userId={currentUser.id}
            />
          )}
          
          <p className="text-xs text-gray-500">
            Recomendado: imagem quadrada, mínimo 400x400px
          </p>
        </div>
      </div>

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
