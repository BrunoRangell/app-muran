
import { TeamMember } from "@/types/team";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MemberSelectProps {
  teamMembers: TeamMember[];
  selectedMember: string;
  onSelect: (value: string) => void;
}

export function MemberSelect({ teamMembers, selectedMember, onSelect }: MemberSelectProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Selecionar Membro</label>
      <Select value={selectedMember} onValueChange={onSelect}>
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
  );
}
