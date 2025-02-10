
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Award, Trophy, BadgeCheck, Star, Medal, Ribbon, Gem, Flag } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBadges } from "@/hooks/useBadges";
import { TeamMember } from "@/types/team";
import { useToast } from "@/components/ui/use-toast";

interface GiveBadgeDialogProps {
  teamMembers: TeamMember[];
}

const BADGE_ICONS = [
  { icon: Trophy, name: "trophy", label: "Troféu" },
  { icon: Award, name: "award", label: "Prêmio" },
  { icon: Star, name: "star", label: "Estrela" },
  { icon: Medal, name: "medal", label: "Medalha" },
  { icon: Ribbon, name: "ribbon", label: "Fita" },
  { icon: Gem, name: "gem", label: "Gema" },
  { icon: Flag, name: "flag", label: "Bandeira" },
  { icon: BadgeCheck, name: "badge_check", label: "Emblema Verificado" },
];

export function GiveBadgeDialog({ teamMembers }: GiveBadgeDialogProps) {
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [newBadge, setNewBadge] = useState({
    name: "",
    description: "",
    icon: "trophy",
  });
  const [isOpen, setIsOpen] = useState(false);
  const { addBadge } = useBadges(selectedMember);
  const { toast } = useToast();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const handleCreateBadge = async () => {
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
      toast({
        title: "Sucesso!",
        description: "Emblema adicionado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao criar emblema:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o emblema.",
        variant: "destructive",
      });
    }
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Selecionar Membro</label>
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um membro da equipe" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        {member.photo_url ? (
                          <AvatarImage src={member.photo_url} alt={member.name} />
                        ) : (
                          <AvatarFallback className="bg-muran-primary text-white text-xs">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span>{member.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="new" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="new" className="flex-1">Criar Novo Emblema</TabsTrigger>
            </TabsList>
            <TabsContent value="new" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome do Emblema *</label>
                <Input
                  value={newBadge.name}
                  onChange={(e) => setNewBadge((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Inovador do Mês"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição do Emblema *</label>
                <Textarea
                  value={newBadge.description}
                  onChange={(e) => setNewBadge((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o significado deste emblema..."
                  className="resize-none"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ícone do Emblema</label>
                <div className="grid grid-cols-4 gap-2">
                  {BADGE_ICONS.map(({ icon: Icon, name, label }) => (
                    <Button
                      key={name}
                      type="button"
                      variant={newBadge.icon === name ? "default" : "outline"}
                      className="h-20 flex-col gap-2 hover:bg-muran-primary/10"
                      onClick={() => setNewBadge((prev) => ({ ...prev, icon: name }))}
                    >
                      <Icon className={`h-6 w-6 ${newBadge.icon === name ? "text-white" : "text-muran-primary"}`} />
                      <span className="text-xs">{label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Button onClick={handleCreateBadge} className="w-full">
                Criar e Dar Emblema
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
