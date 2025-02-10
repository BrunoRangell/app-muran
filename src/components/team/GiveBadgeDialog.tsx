import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Award, Trophy, BadgeCheck, Star, Medal, Ribbon, Gem, Flag, Crown, 
  Heart, Shield, Bookmark, Target, Sparkles, Zap, Diamond, Bot, 
  Brain, Flame, Gift, HandMetal, Lightbulb, Rocket, PartyPopper,
  Megaphone, SquareStack
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBadges } from "@/hooks/useBadges";
import { TeamMember } from "@/types/team";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge as UIBadge } from "@/components/ui/badge";

interface GiveBadgeDialogProps {
  teamMembers: TeamMember[];
}

const BADGE_ICONS = [
  { icon: Trophy, name: "trophy", label: "Troféu" },
  { icon: Award, name: "award", label: "Prêmio" },
  { icon: Star, name: "star", label: "Estrela" },
  { icon: Medal, name: "medal", label: "Medalha" },
  { icon: Crown, name: "crown", label: "Coroa" },
  { icon: Heart, name: "heart", label: "Coração" },
  { icon: Shield, name: "shield", label: "Escudo" },
  { icon: Bookmark, name: "bookmark", label: "Marcador" },
  { icon: Target, name: "target", label: "Alvo" },
  { icon: Sparkles, name: "sparkles", label: "Brilhos" },
  { icon: Zap, name: "zap", label: "Raio" },
  { icon: Ribbon, name: "ribbon", label: "Fita" },
  { icon: Gem, name: "gem", label: "Gema" },
  { icon: Diamond, name: "diamond", label: "Diamante" },
  { icon: Flag, name: "flag", label: "Bandeira" },
  { icon: BadgeCheck, name: "badge_check", label: "Verificado" },
  { icon: Bot, name: "bot", label: "Bot" },
  { icon: Brain, name: "brain", label: "Cérebro" },
  { icon: Flame, name: "flame", label: "Chama" },
  { icon: Gift, name: "gift", label: "Presente" },
  { icon: HandMetal, name: "hand_metal", label: "Rock" },
  { icon: Lightbulb, name: "lightbulb", label: "Ideia" },
  { icon: Rocket, name: "rocket", label: "Foguete" },
  { icon: PartyPopper, name: "party", label: "Festa" },
  { icon: Megaphone, name: "megaphone", label: "Megafone" },
  { icon: SquareStack, name: "square_stack", label: "Destaque" },
];

export function GiveBadgeDialog({ teamMembers }: GiveBadgeDialogProps) {
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [newBadge, setNewBadge] = useState({
    name: "",
    description: "",
    icon: "trophy",
  });
  const [isOpen, setIsOpen] = useState(false);
  const { allBadges, userBadges, addBadge, isLoading } = useBadges(selectedMember);
  const { toast } = useToast();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

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

  const userHasBadge = (badgeCode: string) => {
    return userBadges?.some((badge) => badge.code === badgeCode);
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

          <Tabs defaultValue="existing" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="existing" className="flex-1">Emblemas Existentes</TabsTrigger>
              <TabsTrigger value="new" className="flex-1">Criar Novo Emblema</TabsTrigger>
            </TabsList>
            
            <TabsContent value="existing" className="mt-4">
              {isLoading ? (
                <div className="text-center py-4 text-gray-500">Carregando emblemas...</div>
              ) : allBadges && allBadges.length > 0 ? (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="grid grid-cols-1 gap-4">
                    {allBadges.map((badge) => {
                      const IconComponent = BADGE_ICONS.find(icon => icon.name === badge.icon)?.icon || Trophy;
                      const hasBadge = userHasBadge(badge.code);
                      
                      return (
                        <div
                          key={badge.id}
                          className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-muran-primary/10 rounded-lg">
                              <IconComponent className="h-6 w-6 text-muran-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="font-medium text-gray-900">{badge.name}</h4>
                                  <p className="text-sm text-gray-500 mt-1">{badge.description}</p>
                                </div>
                                {selectedMember && (
                                  hasBadge ? (
                                    <UIBadge variant="secondary" className="shrink-0">
                                      Usuário já possui
                                    </UIBadge>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="shrink-0"
                                      onClick={() => handleGiveBadge(badge)}
                                    >
                                      Dar emblema
                                    </Button>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhum emblema existente.
                </div>
              )}
            </TabsContent>

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
                <ScrollArea className="h-[200px]">
                  <div className="grid grid-cols-6 gap-2 pr-4">
                    {BADGE_ICONS.map(({ icon: Icon, name, label }) => (
                      <div key={name} className="relative">
                        <Button
                          type="button"
                          variant={newBadge.icon === name ? "default" : "outline"}
                          className={`w-full aspect-square flex-col gap-1 group transition-all duration-300 ${
                            newBadge.icon === name 
                              ? 'bg-muran-primary hover:bg-muran-primary/90' 
                              : 'hover:bg-muran-primary/10 hover:border-muran-primary'
                          }`}
                          onClick={() => setNewBadge((prev) => ({ ...prev, icon: name }))}
                          title={label}
                        >
                          <Icon 
                            className={`h-5 w-5 transition-all duration-300 ${
                              newBadge.icon === name 
                                ? 'text-white' 
                                : 'text-muran-primary group-hover:scale-110'
                            }`} 
                          />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
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
