
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { useCurrentUser } from "@/hooks/useTeamMembers";
import { socialMediaSchema, SocialMediaSchemaType } from "@/components/team/schemas/memberSchema";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { ProfileSection } from "@/components/settings/sections/ProfileSection";
import { SecuritySection } from "@/components/settings/sections/SecuritySection";
import { SocialSection } from "@/components/settings/sections/SocialSection";
import { ProfessionalSection } from "@/components/settings/sections/ProfessionalSection";

export default function Settings() {
  const [activeSection, setActiveSection] = useState("profile");
  const [currentEmail, setCurrentEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const { data: currentUser, refetch } = useCurrentUser();
  const { toast } = useToast();

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

  // Watch form changes
  useEffect(() => {
    const subscription = form.watch(() => {
      setHasChanges(true);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const isAdmin = currentUser?.permission === 'admin';
  const isMember = currentUser?.permission === 'member' || !isAdmin;

  const handleSubmit = async (data: SocialMediaSchemaType) => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      console.log("Salvando dados do perfil:", data);

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

      setHasChanges(false);
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

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return <ProfileSection form={form} />;
      case "security":
        return <SecuritySection currentEmail={currentEmail} />;
      case "social":
        return <SocialSection form={form} />;
      case "professional":
        return <ProfessionalSection form={form} isAdmin={isAdmin} isMember={isMember} />;
      default:
        return <ProfileSection form={form} />;
    }
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center space-x-2 mb-4">
          <Link 
            to="/" 
            className="flex items-center text-[#ff6e00] hover:text-[#cc5800] transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar ao Dashboard
          </Link>
        </div>
        
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[#ff6e00] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-[#321e32] mb-2">Carregando...</h3>
            <p className="text-gray-600">Carregando suas informações de perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <SettingsLayout
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onSave={form.handleSubmit(handleSubmit)}
          isLoading={isLoading}
          hasChanges={hasChanges}
        >
          {renderSection()}
        </SettingsLayout>
      </form>
    </Form>
  );
}
