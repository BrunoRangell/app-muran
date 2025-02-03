import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { EditFormData, TeamMember } from "@/types/team";
import { useCurrentUser } from "@/hooks/useTeamMembers";

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
  const form = useForm<EditFormData>();
  const { data: currentUser } = useCurrentUser();
  const isAdmin = currentUser?.permission === 'admin';

  if (!selectedMember) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Informações</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              defaultValue={selectedMember.name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            {isAdmin && (
              <FormField
                control={form.control}
                name="role"
                defaultValue={selectedMember.role}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="photo_url"
              defaultValue={selectedMember.photo_url}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da Foto</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    Para melhor compatibilidade, recomendamos usar serviços como imgur.com ou imgbb.com para hospedar suas fotos. 
                    Cole aqui o link direto da imagem após fazer o upload.
                  </FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="birthday"
              defaultValue={selectedMember.birthday}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Aniversário</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">Salvar</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};