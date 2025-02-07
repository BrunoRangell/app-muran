
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Instagram, Linkedin } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  role: z.string().min(1, "Cargo é obrigatório"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  bio: z.string().max(500, "Biografia deve ter no máximo 500 caracteres").optional(),
  instagram_url: z.string().url("URL inválida").optional().or(z.literal("")),
  linkedin_url: z.string().url("URL inválida").optional().or(z.literal("")),
});

type TeamMemberFormData = z.infer<typeof formSchema>;

interface TeamMemberFormProps {
  onSuccess?: () => void;
}

export const TeamMemberForm = ({ onSuccess }: TeamMemberFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<TeamMemberFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "",
      password: "",
      bio: "",
      instagram_url: "",
      linkedin_url: "",
    }
  });

  const onSubmit = async (data: TeamMemberFormData) => {
    try {
      setIsLoading(true);
      console.log("Criando novo membro:", data);

      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .insert([
          {
            name: data.name,
            email: data.email,
            role: data.role,
            bio: data.bio,
            instagram_url: data.instagram_url,
            linkedin_url: data.linkedin_url,
            permission: 'member',
          }
        ])
        .select()
        .single();

      if (memberError) throw memberError;
      console.log("Registro na tabela team_members criado com sucesso:", memberData);

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          name: data.name,
          role: data.role,
        }
      });

      if (authError) {
        await supabase
          .from('team_members')
          .delete()
          .eq('id', memberData.id);
        throw authError;
      }

      console.log("Usuário autenticado criado com sucesso", authData);

      toast({
        title: "Sucesso!",
        description: "Membro da equipe cadastrado com sucesso!",
      });
      
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao cadastrar membro:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar o membro da equipe. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@exemplo.com" {...field} />
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
              <FormLabel>Cargo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Desenvolvedor, Designer, etc" {...field} />
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
                  placeholder="Conte um pouco sobre você..." 
                  className="resize-none"
                  maxLength={500}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="instagram_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </FormLabel>
                <FormControl>
                  <Input placeholder="https://instagram.com/seu_perfil" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="linkedin_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </FormLabel>
                <FormControl>
                  <Input placeholder="https://linkedin.com/in/seu_perfil" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Digite a senha" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Cadastrando..." : "Cadastrar membro"}
        </Button>
      </form>
    </Form>
  );
};
