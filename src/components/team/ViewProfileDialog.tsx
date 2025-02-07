
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
import { CalendarDays, Mail, Briefcase, CalendarClock, Instagram, Linkedin } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
      <DialogContent className="max-w-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50">
        <DialogHeader className="relative">
          <div className="absolute inset-0 bg-muran-primary/10 backdrop-blur-sm -z-10" />
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Perfil do Membro
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6 flex flex-col items-center space-y-6">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-muran-primary rounded-full blur opacity-30 group-hover:opacity-50 transition duration-300" />
            <Avatar className="h-32 w-32 ring-4 ring-white bg-white relative">
              {member.photo_url ? (
                <AvatarImage
                  src={member.photo_url}
                  alt={member.name}
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <AvatarFallback className="bg-muran-primary text-white text-3xl">
                  {getInitials(member.name)}
                </AvatarFallback>
              )}
            </Avatar>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-muran-primary to-muran-complementary bg-clip-text text-transparent">
              {member.name}
            </h2>
            <p className="text-lg text-muran-primary font-medium">
              {member.role}
            </p>
          </div>

          <div className="w-full text-center px-6">
            <p className="text-gray-600 italic bg-white/50 backdrop-blur-sm p-4 rounded-lg shadow-sm border border-gray-100">
              {member.bio || "Biografia não informada"}
            </p>
          </div>

          <div className="w-full space-y-4 bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-gray-100 hover:border-muran-primary/20 transition-colors duration-300">
            <div className="flex items-center gap-3 text-gray-700 hover:text-muran-primary transition-colors group">
              <div className="p-2 rounded-lg bg-muran-primary/10 group-hover:bg-muran-primary/20 transition-colors">
                <Mail className="h-5 w-5 text-muran-primary" />
              </div>
              <span>{member.email}</span>
            </div>

            <div className="flex items-center gap-3 text-gray-700 hover:text-muran-primary transition-colors group">
              <div className="p-2 rounded-lg bg-muran-primary/10 group-hover:bg-muran-primary/20 transition-colors">
                <Briefcase className="h-5 w-5 text-muran-primary" />
              </div>
              <span>Cargo: {member.role}</span>
            </div>

            <div className="flex items-center gap-3 text-gray-700 hover:text-muran-primary transition-colors group">
              <div className="p-2 rounded-lg bg-muran-primary/10 group-hover:bg-muran-primary/20 transition-colors">
                <CalendarClock className="h-5 w-5 text-muran-primary" />
              </div>
              <span>Data de início: {formatDate(member.start_date)}</span>
            </div>

            {member.birthday && (
              <div className="flex items-center gap-3 text-gray-700 hover:text-muran-primary transition-colors group">
                <div className="p-2 rounded-lg bg-muran-primary/10 group-hover:bg-muran-primary/20 transition-colors">
                  <CalendarDays className="h-5 w-5 text-muran-primary" />
                </div>
                <span>Aniversário: {formatBirthday(member.birthday)}</span>
              </div>
            )}
          </div>

          <Separator className="w-full bg-gradient-to-r from-transparent via-muran-primary/20 to-transparent" />
          
          <div className="flex gap-6 justify-center w-full pb-2">
            <a
              href={member.linkedin || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                member.linkedin
                  ? "hover:bg-muran-primary/10 text-gray-600 hover:text-muran-primary cursor-pointer"
                  : "text-gray-400 cursor-not-allowed opacity-50"
              }`}
              onClick={(e) => !member.linkedin && e.preventDefault()}
            >
              <Linkedin className="h-5 w-5" />
              <span>{member.linkedin ? "LinkedIn" : "LinkedIn não informado"}</span>
            </a>

            <a
              href={member.instagram || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                member.instagram
                  ? "hover:bg-muran-primary/10 text-gray-600 hover:text-muran-primary cursor-pointer"
                  : "text-gray-400 cursor-not-allowed opacity-50"
              }`}
              onClick={(e) => !member.instagram && e.preventDefault()}
            >
              <Instagram className="h-5 w-5" />
              <span>{member.instagram ? "Instagram" : "Instagram não informado"}</span>
            </a>

            <a
              href={member.tiktok || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                member.tiktok
                  ? "hover:bg-muran-primary/10 text-gray-600 hover:text-muran-primary cursor-pointer"
                  : "text-gray-400 cursor-not-allowed opacity-50"
              }`}
              onClick={(e) => !member.tiktok && e.preventDefault()}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
              <span>{member.tiktok ? "TikTok" : "TikTok não informado"}</span>
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
