
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white p-0 overflow-hidden">
        <div className="flex flex-col">
          {/* Header com foto e informações básicas */}
          <div className="p-6 flex items-start gap-6">
            <div className="relative group">
              <Avatar className="h-20 w-20 ring-2 ring-gray-100">
                {member.photo_url ? (
                  <AvatarImage
                    src={member.photo_url}
                    alt={member.name}
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <AvatarFallback className="bg-gray-100 text-gray-600 text-xl">
                    {getInitials(member.name)}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{member.name}</h2>
              <p className="text-gray-600 font-medium">{member.role}</p>
              <p className="text-gray-500 text-sm mt-1">{member.email}</p>
              
              <div className="flex gap-4 mt-4">
                <div className="text-center">
                  <span className="font-semibold block text-gray-900">
                    {formatBirthday(member.birthday || '')}
                  </span>
                  <span className="text-xs text-gray-500">Aniversário</span>
                </div>
                <div className="text-center">
                  <span className="font-semibold block text-gray-900">
                    {formatDate(member.start_date)}
                  </span>
                  <span className="text-xs text-gray-500">Início</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Bio */}
          <div className="px-6 py-4">
            <p className="text-gray-600 text-sm whitespace-pre-wrap">
              {member.bio || "Biografia não informada"}
            </p>
          </div>

          <Separator />

          {/* Links Sociais */}
          <div className="grid grid-cols-3 gap-2 p-4">
            {member.instagram && (
              <a
                href={member.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
              >
                <Instagram className="h-4 w-4" />
                <span>Instagram</span>
              </a>
            )}

            {member.linkedin && (
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
              >
                <Linkedin className="h-4 w-4" />
                <span>LinkedIn</span>
              </a>
            )}

            {member.tiktok && (
              <a
                href={member.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
                <span>TikTok</span>
              </a>
            )}
          </div>

          {/* Informações Adicionais */}
          <div className="bg-gray-50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Briefcase className="h-4 w-4 text-gray-400" />
              <span>Cargo: {member.role}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CalendarClock className="h-4 w-4 text-gray-400" />
              <span>Início: {formatDate(member.start_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4 text-gray-400" />
              <span>{member.email}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

