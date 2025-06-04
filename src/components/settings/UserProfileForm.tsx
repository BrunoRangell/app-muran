
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { useCurrentUser } from "@/hooks/useTeamMembers";
import { socialMediaSchema, SocialMediaSchemaType } from "@/components/team/schemas/memberSchema";
import { SocialMediaForm } from "@/components/team/forms/SocialMediaForm";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export const UserProfileForm = () => {
  const { data: currentUser, refetch } = useCurrentUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SocialMediaSchemaType>({
    resolver: zodResolver(socialMediaSchema),
    defaultValues: {
      name: '',
      role: '',
      photo_url: '',
      birthday: '',
      bio: '',
      instagram: '',
      linkedin: '',
      tiktok: '',
      permission: '',
      start_date: ''
    }
  });

  useEffect(() => {
    if (currentUser) {
      console.log("Resetando form com dados do usuário:", currentUser);
      form.reset({
        name: currentUser.name || '',
        role: currentUser.role || '',
        photo_url: currentUser.photo_url || '',
        birthday: currentUser.birthday || '',
        bio: currentUser.bio || '',
        instagram: currentUser.instagram || '',
        linkedin: currentUser.linkedin || '',
        tiktok: currentUser.tiktok || '',
        permission: currentUser.permission || '',
        start_date: currentUser.start_date || ''
      });
    }
  }, [currentUser, form]);

  const isAdmin = currentUser?.permission === 'admin';
  const isMember = currentUser?.permission === 'member' || !isAdmin;

  const handleSubmit = async (data: SocialMediaSchemaType) => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      console.log("Salvando dados do perfil:", data);

      // Para membros, apenas campos permitidos podem ser atualizados
      const updateData = isMember ? {
        name: data.name,
        photo_url: data.photo_url,
        birthday: data.birthday,
        bio: data.bio,
        instagram: data.instagram,
        linkedin: data.linkedin,
        tiktok: data.tiktok
      } : {
        name: data.name,
        role: data.role,
        photo_url: data.photo_url,
        birthday: data.birthday,
        bio: data.bio,
        instagram: data.instagram,
        linkedin: data.linkedin,
        tiktok: data.tiktok,
        permission: data.permission,
        start_date: data.start_date
      };

      const { error } = await supabase
        .from('team_members')
        .update(updateData)
        .eq('id', currentUser.id);

      if (error) {
        console.error("Erro ao atualizar perfil:", error);
        throw error;
      }

      toast({
        title: "Sucesso!",
        description: "Suas informações foram atualizadas com sucesso.",
      });

      // Atualizar os dados do usuário
      refetch();
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar suas informações.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-[#321e32] mb-2">Carregando...</h3>
          <p className="text-gray-600">Carregando suas informações de perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg border p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#321e32] mb-2">Meu Perfil</h2>
          <p className="text-gray-600">
            Gerencie suas informações pessoais e preferências.
          </p>
          
          {isMember && (
            <Alert className="mt-4">
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                Como membro, você pode editar: Nome, Foto de Perfil, Data de Aniversário, Biografia e Redes Sociais. 
                Outros campos são gerenciados pelos administradores.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Cargo
                      {isMember && <span className="text-sm text-gray-500 ml-1">(Somente leitura)</span>}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        disabled={isMember}
                        className={isMember ? "bg-gray-100 text-gray-600" : ""}
                      />
                    </FormControl>
                    {isMember && (
                      <FormDescription className="text-xs text-gray-500">
                        Este campo é gerenciado pelos administradores.
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isAdmin && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="permission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível de Permissão</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
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
                    <FormItem>
                      <FormLabel>Na Muran desde</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="photo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da Foto de Perfil</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Para melhor compatibilidade, recomendamos usar serviços como imgur.com ou imgbb.com para hospedar suas fotos. 
                    Cole aqui o link direto da imagem após fazer o upload.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birthday"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Aniversário *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biografia</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Conte um pouco sobre você..."
                      className="resize-none h-24"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-[#321e32] mb-4">Redes Sociais</h3>
              <SocialMediaForm form={form} />
            </div>

            <div className="flex justify-end pt-6 border-t">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-[#ff6e00] hover:bg-[#e56200] min-w-[120px]"
              >
                {isLoading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};
