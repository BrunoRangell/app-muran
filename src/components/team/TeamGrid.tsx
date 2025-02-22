
import { TeamMember } from "@/types/team";
import { TeamMemberCard } from "./TeamMemberCard";
import { AlertCircle } from "lucide-react";

interface TeamGridProps {
  teamMembers: TeamMember[];
  currentUserPermission?: string;
  currentUserId?: string;
  onEdit: (member: TeamMember) => void;
}

export const TeamGrid = ({ 
  teamMembers, 
  currentUserPermission, 
  currentUserId, 
  onEdit 
}: TeamGridProps) => {
  if (!teamMembers || teamMembers.length === 0) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center gap-4 text-center p-4">
        <AlertCircle className="h-12 w-12 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900">
          Nenhum membro encontrado
        </h3>
        <p className="text-gray-600 max-w-sm text-sm">
          Parece que ainda não há membros cadastrados na equipe.
          {currentUserPermission === "admin" &&
            " Clique no botão acima para adicionar um novo."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {teamMembers.map((member) => (
        <TeamMemberCard
          key={member.id}
          member={member}
          currentUserPermission={currentUserPermission}
          currentUserId={currentUserId}
          onEdit={onEdit}
          className="hover:shadow-md transition-all duration-300 ease-in-out"
        />
      ))}
    </div>
  );
};
