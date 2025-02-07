
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { UserPlus, Loader2, Users, AlertCircle } from "lucide-react";
import { TeamMemberCard } from "@/components/team/TeamMemberCard";
import { EditMemberDialog } from "@/components/team/EditMemberDialog";
import { useTeamMembers, useCurrentUser } from "@/hooks/useTeamMembers";
import { TeamMemberForm } from "@/components/admin/TeamMemberForm";
import { supabase } from "@/lib/supabase";
import { EditFormData, TeamMember } from "@/types/team";
import { TestBadge } from "@/components/team/TestBadge"; // Novo import
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Managers = () => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const { toast } = useToast();

  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();
  const { data: teamMembers, isLoading: isLoadingTeam, error } = useTeamMembers();

  const handleEdit = (member: TeamMember) => {
    if (currentUser?.permission !== "admin" && currentUser?.id !== member.id) {
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
    if (currentUser?.permission !== "admin") {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem adicionar novos membros.",
        variant: "destructive",
      });
      return;
    }
    setIsAddDialogOpen(true);
  };

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
        tiktok: data.tiktok
      };

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
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Erro ao carregar membros
        </h2>
        <p className="text-gray-600 max-w-md">
          Ocorreu um erro ao tentar carregar a lista de membros. Por favor, tente
          recarregar a página.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="h-7 md:h-9 w-7 md:w-9 text-muran-primary" />
            Nossa Equipe
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Conheça os membros que fazem nossa empresa brilhar.
          </p>
        </div>

        {currentUser?.permission === "admin" && (
          <>
            <TestBadge /> {/* Adicionado temporariamente */}
            <Button
              onClick={handleAddMember}
              className="bg-muran-primary hover:bg-muran-primary/90 flex items-center gap-2 transition-transform hover:scale-105 w-full md:w-auto"
              size="lg"
            >
              <UserPlus className="h-5 w-5" />
              <span>Adicionar Membro</span>
            </Button>
          </>
        )}
      </header>

      <Card className="p-4 md:p-6 bg-white/95 backdrop-blur-sm border border-gray-100 shadow-lg">
        {isLoadingTeam || isLoadingUser ? (
          <div className="min-h-[300px] flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 text-muran-primary animate-spin" />
            <p className="text-gray-600 text-sm">Carregando equipe...</p>
          </div>
        ) : teamMembers && teamMembers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {teamMembers.map((member) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                currentUserPermission={currentUser?.permission}
                currentUserId={currentUser?.id}
                onEdit={handleEdit}
                className="hover:shadow-md transition-all duration-300 ease-in-out"
              />
            ))}
          </div>
        ) : (
          <div className="min-h-[300px] flex flex-col items-center justify-center gap-4 text-center p-4">
            <AlertCircle className="h-12 w-12 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">
              Nenhum membro encontrado
            </h3>
            <p className="text-gray-600 max-w-sm text-sm">
              Parece que ainda não há membros cadastrados na equipe.
              {currentUser?.permission === "admin" &&
                " Clique no botão acima para adicionar um novo."}
            </p>
          </div>
        )}
      </Card>

      <EditMemberDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        selectedMember={selectedMember}
        onSubmit={onSubmit}
      />

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <UserPlus className="h-6 w-6" />
              Adicionar Novo Membro
            </DialogTitle>
          </DialogHeader>
          <TeamMemberForm onSuccess={() => setIsAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Managers;
