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
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface TeamMemberFormData {
  name: string;
  email: string;
  role: string;
  password: string;
  photo_url?: string;
  birthday?: string;
  start_date?: string;
  manager_id: string; // Novo campo adicionado
}

interface TeamMemberFormProps {
  onSuccess?: () => void;
}

export const TeamMemberForm = ({ onSuccess }: TeamMemberFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<TeamMemberFormData>();

  const onSubmit = async (data: TeamMemberFormData) => {
    try {
      setIsLoading(true);
      console.log("Criando novo membro:", data);

      // Primeiro, criar o registro na tabela team_members
      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .insert([
          {
            name: data.name,
            email: data.email,
            role: data.role,
            photo_url: data.photo_url,
            birthday: data.birthday,
            start_date: data.start_date,
            permission: 'member',
            manager_id: data.manager_id // Adicionando o manager_id ao insert
          }
        ])
        .select()
        .single();

      if (memberError) throw memberError;
      console.log("Registro na tabela team_members criado com sucesso:", memberData);

      // Em seguida, criar o usuário no Auth
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
        // Se houver erro na criação do usuário, remover o registro da tabela
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
          name="photo_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL da Foto</FormLabel>
              <FormControl>
                <Input placeholder="https://exemplo.com/foto.jpg" {...field} />
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
              <FormLabel>Data de Aniversário</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Início na Muran</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="manager_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID do Gestor</FormLabel>
              <FormControl>
                <Input placeholder="ID do gestor responsável" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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