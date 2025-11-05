import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface CompactHeaderProps {
  greeting: string;
  userName: string;
  userAvatar: string | null;
  userRole: string;
  quote: string;
}

export const CompactHeader = ({ 
  greeting, 
  userName, 
  userAvatar, 
  userRole,
  quote 
}: CompactHeaderProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-center justify-between gap-4 py-4 px-6 bg-gradient-to-r from-muran-primary/5 to-muran-complementary/5 rounded-xl border border-muran-primary/10">
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14 ring-2 ring-muran-primary/20">
          {userAvatar ? (
            <AvatarImage src={userAvatar} alt={userName} />
          ) : (
            <AvatarFallback className="bg-muran-primary text-white text-lg font-bold">
              {getInitials(userName || "U")}
            </AvatarFallback>
          )}
        </Avatar>
        
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-foreground">
            {greeting}, {userName || "Bem-vindo"}!
          </h1>
          <Badge variant="outline" className="w-fit text-xs">
            {userRole || "Membro da equipe"}
          </Badge>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-2 max-w-md">
        <Sparkles className="h-5 w-5 text-muran-primary flex-shrink-0" />
        <p className="text-sm text-muted-foreground italic line-clamp-2">
          "{quote}"
        </p>
      </div>
    </div>
  );
};
