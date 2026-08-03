import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { TeamMember } from "@/types/team";

interface Props {
  member?: TeamMember | null;
  className?: string;
}

export const MemberAvatar = ({ member, className }: Props) => {
  const initials = (member?.name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <Avatar className={cn("h-7 w-7 border", className)}>
      {member?.photo_url && <AvatarImage src={member.photo_url} alt={member.name} />}
      <AvatarFallback className="bg-muran-primary/10 text-[10px] font-semibold text-muran-primary">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};
