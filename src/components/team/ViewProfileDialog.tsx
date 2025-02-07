
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
    return format(parseISO(dateString), "dd/MM/yyyy", {
      locale: ptBR,
    });
  };

  const formatBirthday = (dateString: string) => {
    if (!dateString) return "";
    return format(parseISO(dateString), "dd/MM", { locale: ptBR });
  };

  const socialLinks = [
    {
      name: "Instagram",
      icon: <Instagram className="h-5 w-5 text-muran-primary" />,
      url: member.instagram || "#",
      isActive: !!member.instagram
    },
    {
      name: "LinkedIn",
      icon: <Linkedin className="h-5 w-5 text-muran-primary" />,
      url: member.linkedin || "#",
      isActive: !!member.linkedin
    },
    {
      name: "TikTok",
      icon: <svg 
              viewBox="0 0 24 24" 
              className="h-5 w-5 text-muran-primary"
              fill="currentColor"
            >
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>,
      url: member.tiktok || "#",
      isActive: !!member.tiktok
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white p-0 overflow-hidden">
        {/* Header com gradiente e foto */}
        <div className="relative bg-gradient-to-br from-muran-primary/10 to-muran-primary/5 p-8">
          <div className="flex flex-col items-center gap-6">
            <Avatar className="h-32 w-32 ring-4 ring-white shadow-xl">
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
            
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{member.name}</h2>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full">
                <Briefcase className="h-4 w-4 text-muran-primary" />
                <p className="text-gray-700 font-medium">{member.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Informações principais */}
        <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50">
          <div className="space-y-1 text-center p-3 bg-white rounded-lg shadow-sm">
            <span className="text-sm text-gray-500">Na Muran desde</span>
            <p className="text-lg font-semibold text-gray-900">{formatDate(member.start_date)}</p>
          </div>
          {member.birthday && (
            <div className="space-y-1 text-center p-3 bg-white rounded-lg shadow-sm">
              <span className="text-sm text-gray-500">Aniversário</span>
              <p className="text-lg font-semibold text-gray-900">{formatBirthday(member.birthday)}</p>
            </div>
          )}
        </div>

        {/* Bio */}
        {member.bio && (
          <>
            <div className="px-6 py-4">
              <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">
                {member.bio}
              </p>
            </div>
            <Separator />
          </>
        )}

        {/* Informações de Contato */}
        <div className="p-4 bg-gray-50 space-y-2">
          {socialLinks.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target={link.isActive ? "_blank" : undefined}
              rel={link.isActive ? "noopener noreferrer" : undefined}
              className={`flex items-center gap-3 text-sm text-gray-600 bg-white p-3 rounded-lg ${
                link.isActive 
                  ? "hover:bg-gray-50 transition-colors cursor-pointer" 
                  : "opacity-50 cursor-not-allowed"
              }`}
              onClick={e => !link.isActive && e.preventDefault()}
            >
              {link.icon}
              <span className="font-medium">{link.name}</span>
              {!link.isActive && (
                <span className="ml-auto text-xs text-gray-400">Não informado</span>
              )}
            </a>
          ))}

          <div className="flex items-center gap-3 text-sm text-gray-600 bg-white p-3 rounded-lg">
            <Mail className="h-5 w-5 text-muran-primary" />
            <span className="font-medium">{member.email}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

