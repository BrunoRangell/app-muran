import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { TeamMemberCard } from "@/components/team/TeamMemberCard";
import { EditMemberDialog } from "@/components/team/EditMemberDialog";
import { useTeamMembers, useCurrentUser } from "@/hooks/useTeamMembers";
import { TeamMemberForm } from "@/components/admin/TeamMemberForm";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Managers = () => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const { toast } = useToast();

  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();
  const { data: teamMembers, isLoading: isLoadingTeam, error } = useTeamMembers();

  console.log("Estado atual dos membros:", {
    currentUser,
    teamMembers,
    isLoadingUser,
    isLoadingTeam,
    error
  });

  const handleEdit = (member) => {
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
    setIsAddDialogOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (!selectedMember) return;

      const updateData = {
        name: data.name,
        photo_url: data.photo_url,
        birthday: data.birthday,
      };

      if (currentUser?.permission === 'admin') {
        updateData.role = data.role;
      }

      const { error } = await supabase
        .from('team_members')
        .update(updateData)
        .eq('id', selectedMember.id);

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
    return (
      <div className="p-4">
        <p className="text-red-500">Erro ao carregar membros da equipe.</p>
      </div>
    );
  }

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
        {isLoadingTeam || isLoadingUser ? (
          <p className="text-gray-600">Carregando integrantes...</p>
        ) : teamMembers && teamMembers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {teamMembers.map((member) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                currentUserPermission={currentUser?.permission}
                currentUserId={currentUser?.id}
                onEdit={handleEdit}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-600">Nenhum membro encontrado.</p>
        )}
      </Card>

      <EditMemberDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        selectedMember={selectedMember}
        onSubmit={onSubmit}
      />

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Membro</DialogTitle>
          </DialogHeader>
          <TeamMemberForm onSuccess={() => setIsAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Managers;