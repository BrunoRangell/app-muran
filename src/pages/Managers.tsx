import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  photo_url: string;
  birthday: string;
  start_date: string;
  email: string;
  permission: string;
}

interface EditFormData {
  name: string;
  role: string;
  photo_url: string;
  birthday: string;
}

const Managers = () => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const { toast } = useToast();
  const form = useForm<EditFormData>();

  const { data: currentUser } = useQuery({
    queryKey: ["current_user"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data: teamMember } = await supabase
        .from('team_members')
        .select('*')
        .eq('email', session.user.email)
        .single();

      return teamMember;
    },
  });

  const { data: teamMembers, isLoading, refetch } = useQuery({
    queryKey: ["team_members"],
    queryFn: async () => {
      console.log("Buscando membros da equipe...");
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .order('start_date', { ascending: true })
          .order('name');

        if (error) {
          console.error("Erro ao buscar membros:", error);
          throw error;
        }

        console.log("Membros encontrados:", data);
        return data;
      } catch (error) {
        console.error("Erro na consulta de membros:", error);
        throw error;
      }
    },
  });

  const convertGoogleDriveLink = (url: string) => {
    if (!url) return '';
    
    // Verifica se é um link do Google Drive
    const match = url.match(/\/d\/(.+?)\/view/);
    if (match) {
      const fileId = match[1];
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    return url;
  };

  const handleEdit = (member: TeamMember) => {
    if (currentUser?.permission !== 'admin' && currentUser?.id !== member.id) {
      toast({
        title: "Acesso negado",
        description: "Você só pode editar suas próprias informações.",
        variant: "destructive",
      });
      return;
    }

    setSelectedMember(member);
    form.reset({
      name: member.name,
      role: member.role,
      photo_url: member.photo_url || '',
      birthday: member.birthday,
    });
    setIsEditDialogOpen(true);
  };

  const onSubmit = async (data: EditFormData) => {
    try {
      if (!selectedMember) return;

      const convertedPhotoUrl = convertGoogleDriveLink(data.photo_url);
      console.log("URL convertida:", convertedPhotoUrl);

      const { error } = await supabase
        .from('team_members')
        .update({
          name: data.name,
          role: data.role,
          photo_url: convertedPhotoUrl,
          birthday: data.birthday,
        })
        .eq('id', selectedMember.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Informações atualizadas com sucesso.",
      });

      setIsEditDialogOpen(false);
      refetch();
    } catch (error) {
      console.error("Erro ao atualizar informações:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as informações.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = parseISO(dateString);
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-muran-dark">Equipe</h1>
      </div>

      <Card className="p-6">
        {isLoading ? (
          <p className="text-gray-600">Carregando integrantes...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {teamMembers?.map((member: TeamMember) => (
              <Card key={member.id} className="p-6 flex flex-col items-center space-y-4 hover:shadow-lg transition-shadow">
                <Avatar className="h-24 w-24">
                  {member.photo_url ? (
                    <AvatarImage src={convertGoogleDriveLink(member.photo_url)} alt={member.name} />
                  ) : (
                    <AvatarFallback className="bg-muran-primary text-white text-xl">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg">{member.name}</h3>
                  <p className="text-gray-600">{member.role}</p>
                  <p className="text-sm text-gray-500">
                    Início: {formatDate(member.start_date)}
                  </p>
                  {member.birthday && (
                    <p className="text-sm text-gray-500">
                      Aniversário: {formatDate(member.birthday)}
                    </p>
                  )}
                  {(currentUser?.permission === 'admin' || currentUser?.id === member.id) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => handleEdit(member)}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Informações</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="photo_url"
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
    </div>
  );
};

export default Managers;
