
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TeamMember } from "@/types/team";
import { CalendarDays, Mail, Briefcase, CalendarClock } from "lucide-react";

interface ViewProfileDialogProps {
  member: TeamMember | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewProfileDialog = ({
  member,
  isOpen,
  onOpenChange,
}: ViewProfileDialogProps) => {
  if (!member) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return format(parseISO(dateString), "dd 'de' MMMM 'de' yyyy", {
      locale: ptBR,
    });
  };

  const formatBirthday = (dateString: string) => {
    if (!dateString) return "";
    return format(parseISO(dateString), "dd 'de' MMMM", { locale: ptBR });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Perfil do Membro
          </DialogTitle>
        </DialogHeader>
        <div className="mt-6 flex flex-col items-center space-y-6">
          <Avatar className="h-32 w-32 border-4 border-muran-primary/20">
            {member.photo_url ? (
              <AvatarImage
                src={member.photo_url}
                alt={member.name}
                className="object-cover"
              />
            ) : (
              <AvatarFallback className="bg-muran-primary text-white text-3xl">
                {getInitials(member.name)}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">{member.name}</h2>
            <p className="text-lg text-muran-primary font-medium">
              {member.role}
            </p>
          </div>

          <div className="w-full space-y-4 bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center gap-3 text-gray-700">
              <Mail className="h-5 w-5 text-muran-primary" />
              <span>{member.email}</span>
            </div>

            <div className="flex items-center gap-3 text-gray-700">
              <Briefcase className="h-5 w-5 text-muran-primary" />
              <span>Cargo: {member.role}</span>
            </div>

            <div className="flex items-center gap-3 text-gray-700">
              <CalendarClock className="h-5 w-5 text-muran-primary" />
              <span>Data de início: {formatDate(member.start_date)}</span>
            </div>

            {member.birthday && (
              <div className="flex items-center gap-3 text-gray-700">
                <CalendarDays className="h-5 w-5 text-muran-primary" />
                <span>Aniversário: {formatBirthday(member.birthday)}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
