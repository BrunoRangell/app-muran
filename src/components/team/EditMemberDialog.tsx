
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { EditFormData, TeamMember } from "@/types/team";
import { useCurrentUser } from "@/hooks/useTeamMembers";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/use-toast";
import { useEffect } from "react";
import { socialMediaSchema, SocialMediaSchemaType } from "./schemas/memberSchema";
import { SocialMediaForm } from "./forms/SocialMediaForm";

interface EditMemberDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMember: TeamMember | null;
  onSubmit: (data: EditFormData) => Promise<void>;
}

export const EditMemberDialog = ({
  isOpen,
  onOpenChange,
  selectedMember,
  onSubmit,
}: EditMemberDialogProps) => {
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
      tiktok: ''
    }
  });

  useEffect(() => {
    if (selectedMember) {
      console.log("Resetando form com dados do membro:", selectedMember);
      form.reset({
        name: selectedMember.name || '',
        role: selectedMember.role || '',
        photo_url: selectedMember.photo_url || '',
        birthday: selectedMember.birthday || '',
        bio: selectedMember.bio || '',
        instagram: selectedMember.instagram || '',
        linkedin: selectedMember.linkedin || '',
        tiktok: selectedMember.tiktok || ''
      });
    }
  }, [selectedMember, form]);

  const { data: currentUser } = useCurrentUser();
  const isAdmin = currentUser?.permission === 'admin';

  if (!selectedMember) return null;

  const handleSubmit = async (data: SocialMediaSchemaType) => {
    try {
      await onSubmit(data as EditFormData);
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as alterações.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar Informações</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 overflow-y-auto pr-2">
            <div className="space-y-4">
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

              {isAdmin && (
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="photo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Foto</FormLabel>
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

              <SocialMediaForm form={form} />
            </div>

            <div className="sticky bottom-0 pt-4 bg-white">
              <Button type="submit" className="w-full">Salvar</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
