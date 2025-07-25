
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
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  role: z.string().min(1, "Cargo é obrigatório"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
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
    }
  });

  const onSubmit = async (data: TeamMemberFormData) => {
    try {
      setIsLoading(true);

      // Primeiro, criar o usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: data.role,
          }
        }
      });

      if (authError) {
        console.error("Erro ao criar usuário autenticado:", authError);
        throw authError;
      }

      if (!authData.user?.id) {
        throw new Error("Não foi possível criar o usuário");
      }

      console.log("Usuário autenticado criado com sucesso:", authData);

      // Depois, criar o registro na tabela team_members
      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .insert([
          {
            name: data.name,
            email: data.email,
            role: data.role,
            permission: 'member',
            manager_id: authData.user.id, // Usando o ID do usuário como manager_id
          }
        ])
        .select()
        .single();

      if (memberError) {
        // Se houver erro na criação do membro, remove o usuário autenticado
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.error("Erro ao criar registro na tabela team_members:", memberError);
        throw memberError;
      }

      console.log("Registro na tabela team_members criado com sucesso:", memberData);

      toast({
        title: "Sucesso!",
        description: "Membro da equipe cadastrado com sucesso!",
      });
      
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao cadastrar membro:", error);
      
      let errorMessage = "Não foi possível cadastrar o membro da equipe.";
      
      if (error.message?.includes("duplicate key")) {
        errorMessage = "Este email já está cadastrado.";
      } else if (error.message?.includes("manager_id")) {
        errorMessage = "Erro ao vincular o usuário como membro da equipe.";
      } else if (error.message?.includes("invalid email")) {
        errorMessage = "O email fornecido é inválido.";
      }
      
      toast({
        title: "Erro no cadastro",
        description: errorMessage,
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

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Cadastrando..." : "Cadastrar membro"}
        </Button>
      </form>
    </Form>
  );
};

