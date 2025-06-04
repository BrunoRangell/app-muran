
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useTeamMembers";
import { socialMediaSchema, SocialMediaSchemaType } from "@/components/team/schemas/memberSchema";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { AccountSecuritySection } from "./AccountSecuritySection";
import { PersonalInfoSection } from "./PersonalInfoSection";
import { ProfessionalInfoSection } from "./ProfessionalInfoSection";
import { SocialMediaSection } from "./SocialMediaSection";
import { Save } from "lucide-react";

export const UserProfileForm = () => {
  const { data: currentUser, refetch } = useCurrentUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");

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
    // Buscar e-mail atual do usuário autenticado
    const getCurrentUserEmail = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setCurrentEmail(session.user.email);
      }
    };
    
    getCurrentUserEmail();
  }, []);

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
          <div className="w-8 h-8 border-4 border-[#ff6e00] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-[#321e32] mb-2">Carregando...</h3>
          <p className="text-gray-600">Carregando suas informações de perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header da página */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-[#321e32]">Configurações</h1>
        <p className="text-gray-600">
          Gerencie suas informações pessoais, profissionais e configurações de conta
        </p>
      </div>

      {/* Layout em grid para telas maiores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda - Conta e Pessoal */}
        <div className="space-y-6">
          {/* Seção de Configurações de Conta (E-mail e Senha) */}
          <AccountSecuritySection currentEmail={currentEmail} />

          {/* Informações Pessoais */}
          <Form {...form}>
            <PersonalInfoSection form={form} />
          </Form>
        </div>

        {/* Coluna Direita - Profissional e Redes Sociais */}
        <div className="space-y-6">
          <Form {...form}>
            {/* Informações Profissionais (apenas para admins) */}
            <ProfessionalInfoSection 
              form={form} 
              isAdmin={isAdmin} 
              isMember={isMember} 
            />

            {/* Redes Sociais */}
            <SocialMediaSection form={form} />
          </Form>
        </div>
      </div>

      {/* Botão de Salvar - Centralizado */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="flex justify-center pt-4 border-t border-gray-200">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-[#ff6e00] hover:bg-[#e56200] min-w-[200px] h-12 text-white font-medium text-lg"
            >
              <Save className="h-5 w-5 mr-2" />
              {isLoading ? "Salvando..." : "Salvar Todas as Alterações"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
