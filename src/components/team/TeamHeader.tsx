
import { Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GiveBadgeDialog } from "./GiveBadgeDialog";
import { TeamMember } from "@/types/team";

interface TeamHeaderProps {
  onAddMember: () => void;
  isAdmin: boolean;
  teamMembers: TeamMember[];
}

export const TeamHeader = ({ onAddMember, isAdmin, teamMembers }: TeamHeaderProps) => {
  return (
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

      {isAdmin && (
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            onClick={onAddMember}
            className="bg-muran-primary hover:bg-muran-primary/90 flex items-center gap-2 transition-transform hover:scale-105 w-full md:w-auto"
            size="lg"
          >
            <UserPlus className="h-5 w-5" />
            <span>Adicionar Membro</span>
          </Button>
          <GiveBadgeDialog teamMembers={teamMembers} />
        </div>
      )}
    </header>
  );
};
