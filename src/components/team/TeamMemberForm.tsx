
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface FormData {
  name: string;
  email: string;
  role: string;
  photo_url?: string;
  birthday?: string;
  bio?: string;
  linkedin?: string;
  instagram?: string;
  tiktok?: string;
}

interface TeamMemberFormProps {
  onSuccess: () => void;
}

export const TeamMemberForm = ({ onSuccess }: TeamMemberFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("team_members")
        .insert([{
          ...data,
          start_date: new Date().toISOString(),
          permission: "member"
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Novo membro adicionado com sucesso.",
      });
      onSuccess();
    } catch (error) {
      console.error("Erro ao adicionar membro:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o novo membro.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nome completo *</Label>
          <Input
            id="name"
            {...register("name", { required: "Nome é obrigatório" })}
            className="mt-1"
          />
          {errors.name && (
            <span className="text-sm text-red-500">{errors.name.message}</span>
          )}
        </div>

        <div>
          <Label htmlFor="email">E-mail *</Label>
          <Input
            id="email"
            type="email"
            {...register("email", { required: "E-mail é obrigatório" })}
            className="mt-1"
          />
          {errors.email && (
            <span className="text-sm text-red-500">{errors.email.message}</span>
          )}
        </div>

        <div>
          <Label htmlFor="role">Cargo *</Label>
          <Input
            id="role"
            {...register("role", { required: "Cargo é obrigatório" })}
            className="mt-1"
          />
          {errors.role && (
            <span className="text-sm text-red-500">{errors.role.message}</span>
          )}
        </div>

        <div>
          <Label htmlFor="photo_url">URL da foto</Label>
          <Input
            id="photo_url"
            {...register("photo_url")}
            placeholder="Link do Google Drive"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="birthday">Data de nascimento</Label>
          <Input
            id="birthday"
            type="date"
            {...register("birthday")}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="bio">Biografia</Label>
          <Textarea
            id="bio"
            {...register("bio")}
            placeholder="Uma breve descrição sobre o membro"
            className="mt-1"
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-gray-700">Redes Sociais</h3>
          <div>
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input
              id="linkedin"
              {...register("linkedin")}
              placeholder="URL do perfil do LinkedIn"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              {...register("instagram")}
              placeholder="URL do perfil do Instagram"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="tiktok">TikTok</Label>
            <Input
              id="tiktok"
              {...register("tiktok")}
              placeholder="URL do perfil do TikTok"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-muran-primary hover:bg-muran-primary/90"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adicionando...
          </>
        ) : (
          "Adicionar Membro"
        )}
      </Button>
    </form>
  );
};
