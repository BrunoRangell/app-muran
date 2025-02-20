
import { useForm } from "react-hook-form";
import { useCurrentUser } from "@/hooks/useTeamMembers";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { socialMediaSchema } from "@/components/team/schemas/memberSchema";

export default function Settings() {
  const { data: user, isLoading: isLoadingUser } = useCurrentUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isAdmin = user?.permission === 'admin';
  
  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(socialMediaSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      role: user?.role || "",
      bio: user?.bio || "",
      instagram: user?.instagram || "",
      linkedin: user?.linkedin || "",
      tiktok: user?.tiktok || "",
      photo_url: user?.photo_url || "",
      permission: user?.permission || "",
      start_date: user?.start_date || "",
      birthday: user?.birthday || "",
    }
  });

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      const updateData = {
        name: data.name,
        bio: data.bio,
        instagram: data.instagram,
        linkedin: data.linkedin,
        tiktok: data.tiktok,
        photo_url: data.photo_url,
        birthday: data.birthday,
        ...(isAdmin && {
          permission: data.permission,
          start_date: data.start_date,
        }),
      };

      const { error } = await supabase
        .from('team_members')
        .update(updateData)
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao tentar atualizar suas informações.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingUser) {
    return <div className="flex items-center justify-center h-96">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>;
  }

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Perfil</CardTitle>
          <CardDescription>
            Gerencie suas informações pessoais e preferências
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.photo_url || ""} alt={user?.name} />
                <AvatarFallback>{user?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="photo_url">URL da Foto</Label>
                <Input
                  id="photo_url"
                  {...register("photo_url")}
                  placeholder="https://exemplo.com/sua-foto.jpg"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  disabled
                  value={user?.email}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Cargo</Label>
                <Input
                  id="role"
                  disabled
                  value={user?.role}
                />
              </div>

              {isAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="permission">Nível de Permissão</Label>
                  <Select 
                    defaultValue={user?.permission}
                    onValueChange={(value) => setValue("permission", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a permissão" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Membro</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="birthday">Aniversário</Label>
                <Input
                  id="birthday"
                  type="date"
                  {...register("birthday")}
                />
                {errors.birthday && (
                  <p className="text-sm text-red-500">{errors.birthday.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Na Muran desde</Label>
                <Input
                  id="start_date"
                  type="date"
                  {...register("start_date")}
                  disabled={!isAdmin}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Biografia</Label>
              <Textarea
                id="bio"
                {...register("bio")}
                placeholder="Conte um pouco sobre você..."
                className="h-32"
              />
              {errors.bio && (
                <p className="text-sm text-red-500">{errors.bio.message as string}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  {...register("instagram")}
                  placeholder="https://instagram.com/seuperfil"
                />
                {errors.instagram && (
                  <p className="text-sm text-red-500">{errors.instagram.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  {...register("linkedin")}
                  placeholder="https://linkedin.com/in/seuperfil"
                />
                {errors.linkedin && (
                  <p className="text-sm text-red-500">{errors.linkedin.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tiktok">TikTok</Label>
                <Input
                  id="tiktok"
                  {...register("tiktok")}
                  placeholder="https://tiktok.com/@seuperfil"
                />
                {errors.tiktok && (
                  <p className="text-sm text-red-500">{errors.tiktok.message as string}</p>
                )}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full md:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
