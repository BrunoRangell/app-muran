import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { TaskMember } from "@/types/tasks";

interface Props {
  member?: TaskMember | null;
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
      {member?.avatar_url && <AvatarImage src={member.avatar_url} alt={member.name} />}
      <AvatarFallback
        className="text-[10px] font-semibold text-white"
        style={{ backgroundColor: member?.color || "hsl(var(--primary))" }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};
