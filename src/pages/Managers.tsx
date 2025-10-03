
import { useState, Suspense } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { EditMemberDialog } from "@/components/team/EditMemberDialog";
import { useTeamMembers, useCurrentUser } from "@/hooks/useTeamMembers";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { EditFormData, TeamMember } from "@/types/team";
import { ErrorState } from "@/components/clients/components/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamHeader } from "@/components/team/TeamHeader";
import { TeamGrid } from "@/components/team/TeamGrid";
import { AddMemberDialog } from "@/components/team/AddMemberDialog";

/**
 * Página principal de gerenciamento da equipe
 * Permite visualizar, adicionar e editar membros da equipe
 */
const Managers = () => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const { toast } = useToast();

  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();
  const { data: teamMembers, isLoading: isLoadingTeam, error } = useTeamMembers();
  const { data: userRole } = useUserRole();

  /**
   * Manipula a edição de um membro da equipe
   * Verifica permissões antes de permitir a edição
   */
  const handleEdit = (member: TeamMember) => {
    if (!userRole?.isAdmin && currentUser?.id !== member.id) {
      toast({
        title: "Acesso negado",
        description: "Você só pode editar suas próprias informações.",
        variant: "destructive",
      });
      return;
    }
    setSelectedMember(member);
    setIsEditDialogOpen(true);
  };

  /**
   * Manipula a adição de um novo membro
   * Verifica se o usuário tem permissão de administrador
   */
  const handleAddMember = () => {
    if (!userRole?.isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem adicionar novos membros.",
        variant: "destructive",
      });
      return;
    }
    setIsAddDialogOpen(true);
  };

  /**
   * Atualiza as informações de um membro da equipe
   */
  const onSubmit = async (data: EditFormData) => {
    try {
      if (!selectedMember) return;

      const updateData: EditFormData = {
        name: data.name,
        photo_url: data.photo_url,
        birthday: data.birthday,
        role: data.role,
        bio: data.bio,
        linkedin: data.linkedin,
        instagram: data.instagram,
        tiktok: data.tiktok,
        permission: data.permission,
        start_date: data.start_date
      };

      console.log("Dados a serem atualizados:", updateData);

      const { error } = await supabase
        .from("team_members")
        .update(updateData)
        .eq("id", selectedMember.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Informações atualizadas com sucesso.",
      });

      setIsEditDialogOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Erro ao atualizar informações:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as informações.",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return <ErrorState />;
  }

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
      <TeamHeader 
        onAddMember={handleAddMember}
        isAdmin={userRole?.isAdmin || false}
        teamMembers={teamMembers || []}
      />

      <Card className="p-4 md:p-6 bg-white/95 backdrop-blur-sm border border-gray-100 shadow-lg">
        <Suspense fallback={<TeamSkeleton />}>
          {isLoadingTeam || isLoadingUser ? (
            <TeamSkeleton />
          ) : (
            <TeamGrid
              teamMembers={teamMembers || []}
              currentUserPermission={currentUser?.permission}
              currentUserId={currentUser?.id}
              onEdit={handleEdit}
            />
          )}
        </Suspense>
      </Card>

      <EditMemberDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        selectedMember={selectedMember}
        onSubmit={onSubmit}
      />

      <AddMemberDialog 
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
};

/**
 * Componente de loading state para a grid de membros
 */
const TeamSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
    {[...Array(8)].map((_, i) => (
      <Card key={i} className="p-4 space-y-4">
        <div className="flex justify-center">
          <Skeleton className="h-24 w-24 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
          <Skeleton className="h-4 w-2/3 mx-auto" />
        </div>
      </Card>
    ))}
  </div>
);

export default Managers;
