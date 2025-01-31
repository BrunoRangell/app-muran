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
}

export const TeamMemberForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<TeamMemberFormData>();

  const onSubmit = async (data: TeamMemberFormData) => {
    try {
      setIsLoading(true);
      console.log("Criando novo membro:", data);
      
      // Criar o usuário autenticado no Supabase com URL de redirecionamento
      const { error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${import.meta.env.VITE_APP_URL || window.location.origin}/auth/callback`,
          data: {
            name: data.name,
            role: data.role,
          }
        }
      });

      if (authError) throw authError;

      console.log("Usuário autenticado criado com sucesso");
      
      // Criar o registro na tabela team_members
      const { error: dbError } = await supabase
        .from('team_members')
        .insert([
          {
            name: data.name,
            email: data.email,
            role: data.role,
            password: data.password
          }
        ]);

      if (dbError) throw dbError;

      console.log("Registro na tabela team_members criado com sucesso");

      toast({
        title: "Sucesso!",
        description: "Membro da equipe cadastrado com sucesso. Um email de confirmação foi enviado.",
      });
      
      form.reset();
    } catch (error) {
      console.error("Erro ao cadastrar membro:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar o membro da equipe. Verifique se o email já está em uso.",
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