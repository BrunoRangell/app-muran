
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { EditFormData, TeamMember } from "@/types/team";
import { useCurrentUser } from "@/hooks/useTeamMembers";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/components/ui/use-toast";
import { useEffect } from "react";

const socialMediaSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  role: z.string().optional(),
  photo_url: z.string().optional(),
  birthday: z.string().min(1, "Data de aniversário é obrigatória"),
  bio: z.string().optional(),
  instagram: z.string().optional()
    .refine(value => !value || value.match(/^https:\/\/(www\.)?instagram\.com\/.+/), {
      message: "O link do Instagram deve começar com 'https://www.instagram.com/' ou 'https://instagram.com/'"
    }),
  linkedin: z.string().optional()
    .refine(value => !value || value.match(/^https:\/\/(www\.)?linkedin\.com\/.+/), {
      message: "O link do LinkedIn deve começar com 'https://www.linkedin.com/' ou 'https://linkedin.com/'"
    }),
  tiktok: z.string().optional()
    .refine(value => !value || value.match(/^https:\/\/(www\.)?tiktok\.com\/.+/), {
      message: "O link do TikTok deve começar com 'https://www.tiktok.com/' ou 'https://tiktok.com/'"
    })
});

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
  const form = useForm<z.infer<typeof socialMediaSchema>>({
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

  const handleSubmit = async (data: z.infer<typeof socialMediaSchema>) => {
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

              <div className="space-y-3 border rounded-lg p-3 bg-gray-50">
                <h3 className="font-medium text-sm text-gray-700">Redes Sociais</h3>
                
                <FormField
                  control={form.control}
                  name="instagram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram (URL)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://www.instagram.com/seu.perfil/" />
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
                      <FormLabel>LinkedIn (URL)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://www.linkedin.com/in/seu-perfil/" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tiktok"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TikTok (URL)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://www.tiktok.com/@seu.perfil" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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

