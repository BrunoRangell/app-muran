
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Award } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBadges } from "@/hooks/useBadges";
import { TeamMember } from "@/types/team";
import { useToast } from "@/components/ui/use-toast";
import { MemberSelect } from "./badge/MemberSelect";
import { BadgeForm } from "./badge/BadgeForm";
import { ExistingBadgesList } from "./badge/ExistingBadgesList";

interface GiveBadgeDialogProps {
  teamMembers: TeamMember[];
}

export function GiveBadgeDialog({ teamMembers }: GiveBadgeDialogProps) {
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [newBadge, setNewBadge] = useState({
    name: "",
    description: "",
    icon: "trophy",
  });
  const [isOpen, setIsOpen] = useState(false);
  const { allBadges, userBadges, addBadge, deleteBadge, isLoading } = useBadges(selectedMember);
  const { toast } = useToast();

  const handleCreateBadge = async () => {
    const badgeExists = allBadges?.some(
      (badge) => badge.name.toLowerCase() === newBadge.name.toLowerCase()
    );

    if (badgeExists) {
      toast({
        title: "Emblema já existe",
        description: "Já existe um emblema com este nome. Por favor, escolha outro nome.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedMember || !newBadge.name || !newBadge.description) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addBadge({
        code: newBadge.name.toUpperCase().replace(/\s+/g, "_"),
        name: newBadge.name,
        description: newBadge.description,
        icon: newBadge.icon,
        team_member_id: selectedMember,
      });

      setNewBadge({ name: "", description: "", icon: "trophy" });
      setIsOpen(false);
    } catch (error) {
      console.error("Erro ao criar emblema:", error);
    }
  };

  const handleGiveBadge = async (badge: typeof allBadges[0]) => {
    if (!selectedMember) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um membro da equipe.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addBadge({
        code: badge.code,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        team_member_id: selectedMember,
      });
    } catch (error) {
      console.error("Erro ao dar emblema:", error);
    }
  };

  const handleDeleteBadge = (code: string, memberId?: string) => {
    deleteBadge({ code, memberId });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Award className="h-4 w-4" />
          Dar emblema
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Award className="h-6 w-6 text-muran-primary" />
            Dar Emblema
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <MemberSelect
            teamMembers={teamMembers}
            selectedMember={selectedMember}
            onSelect={setSelectedMember}
          />

          <div className="bg-white rounded-lg">
            <Tabs defaultValue="existing" className="w-full">
              <div className="flex justify-center mb-6">
                <TabsList className="grid grid-cols-2 w-[400px]">
                  <TabsTrigger value="existing" className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Emblemas Existentes
                  </TabsTrigger>
                  <TabsTrigger value="new" className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Criar Novo
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="existing" className="mt-4 px-4">
                <ExistingBadgesList
                  badges={allBadges || []}
                  userBadges={userBadges}
                  onGiveBadge={handleGiveBadge}
                  onDeleteBadge={handleDeleteBadge}
                  selectedMember={selectedMember}
                  isLoading={isLoading}
                />
              </TabsContent>

              <TabsContent value="new" className="mt-4">
                <div className="max-w-xl mx-auto px-4">
                  <BadgeForm
                    name={newBadge.name}
                    description={newBadge.description}
                    icon={newBadge.icon}
                    onNameChange={(name) => setNewBadge((prev) => ({ ...prev, name }))}
                    onDescriptionChange={(description) => setNewBadge((prev) => ({ ...prev, description }))}
                    onIconChange={(icon) => setNewBadge((prev) => ({ ...prev, icon }))}
                    onSubmit={handleCreateBadge}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

