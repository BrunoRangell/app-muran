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
}

export const TeamMemberForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<TeamMemberFormData>();

  const onSubmit = async (data: TeamMemberFormData) => {
    try {
      setIsLoading(true);
      console.log("Criando novo membro:", data);
      
      const { error } = await supabase
        .from('team_members')
        .insert([
          {
            name: data.name,
            email: data.email,
            role: data.role,
          }
        ]);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Membro da equipe cadastrado com sucesso.",
      });
      
      form.reset();
    } catch (error) {
      console.error("Erro ao cadastrar membro:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar o membro da equipe.",
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

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Cadastrando..." : "Cadastrar membro"}
        </Button>
      </form>
    </Form>
  );
};