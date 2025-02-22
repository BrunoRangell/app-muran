
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pencil, Eye } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TeamMember } from "@/types/team";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ViewProfileDialog } from "./ViewProfileDialog";

interface TeamMemberCardProps {
  member: TeamMember;
  currentUserPermission: string | undefined;
  currentUserId: string | undefined;
  onEdit: (member: TeamMember) => void;
  className?: string;
}

export const TeamMemberCard = ({ 
  member, 
  currentUserPermission, 
  currentUserId, 
  onEdit,
  className 
}: TeamMemberCardProps) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = parseISO(dateString);
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  const formatBirthday = (dateString: string) => {
    if (!dateString) return '';
    const date = parseISO(dateString);
    return format(date, 'dd/MM', { locale: ptBR });
  };

  const convertGoogleDriveLink = (url: string) => {
    if (!url) return '';
    const match = url.match(/\/d\/(.+?)\/view/);
    if (match) {
      const fileId = match[1];
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    return url;
  };

  return (
    <>
      <Card className={cn("relative p-6 flex flex-col items-center space-y-4 hover:shadow-lg transition-shadow", className)}>
        {(currentUserPermission === 'admin' || currentUserId === member.id) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(member)}
            className="absolute right-2 top-2 h-8 w-8 hover:bg-gray-100"
          >
            <Pencil className="h-4 w-4 text-gray-500" />
          </Button>
        )}
        
        <Avatar className="h-24 w-24">
          {member.photo_url ? (
            <AvatarImage src={convertGoogleDriveLink(member.photo_url)} alt={member.name} />
          ) : (
            <AvatarFallback className="bg-[#ff6e00] text-white text-xl">
              {getInitials(member.name)}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-lg">{member.name}</h3>
          <p className="text-gray-600">{member.role}</p>
          <p className="text-sm text-gray-500">
            Na Muran desde: {formatDate(member.start_date)}
          </p>
          {member.birthday && (
            <p className="text-sm text-gray-500">
              Aniversário: {formatBirthday(member.birthday)}
            </p>
          )}
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsProfileOpen(true)}
              className="w-full"
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver perfil
            </Button>
          </div>
        </div>
      </Card>

      <ViewProfileDialog
        member={member}
        isOpen={isProfileOpen}
        onOpenChange={setIsProfileOpen}
      />
    </>
  );
};

