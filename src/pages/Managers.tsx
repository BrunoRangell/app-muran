import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { TeamMember, EditFormData } from "@/types/team";
import { TeamMemberCard } from "@/components/team/TeamMemberCard";
import { EditMemberDialog } from "@/components/team/EditMemberDialog";
import { useTeamMembers, useCurrentUser } from "@/hooks/useTeamMembers";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Managers = () => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: currentUser } = useCurrentUser();
  const { data: teamMembers, isLoading, refetch } = useTeamMembers();

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
    setIsEditDialogOpen(true);
  };

  const handleAddMember = () => {
    if (currentUser?.permission !== 'admin') {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem adicionar novos membros.",
        variant: "destructive",
      });
      return;
    }
    navigate("/admin");
  };

  const onSubmit = async (data: EditFormData) => {
    try {
      if (!selectedMember) return;

      const { error } = await supabase
        .from('team_members')
        .update({
          name: data.name,
          role: data.role,
          photo_url: data.photo_url,
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

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-muran-dark">Equipe</h1>
        {currentUser?.permission === 'admin' && (
          <Button
            onClick={handleAddMember}
            className="bg-muran-primary hover:bg-muran-primary/90 flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Adicionar Membro
          </Button>
        )}
      </div>

      <Card className="p-4 md:p-6">
        {isLoading ? (
          <p className="text-gray-600">Carregando integrantes...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {teamMembers?.map((member) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                currentUserPermission={currentUser?.permission}
                currentUserId={currentUser?.id}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </Card>

      <EditMemberDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        selectedMember={selectedMember}
        onSubmit={onSubmit}
      />
    </div>
  );
};

export default Managers;