import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, Clock, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { isDateToday, isDateTomorrow } from "@/utils/dateHelpers";

interface DateItemProps {
  title: string;
  date: Date;
  daysUntil: number;
  badge?: {
    label: string;
    variant?: "default" | "outline";
  };
  icon?: React.ReactNode;
  avatarUrl?: string;
  avatarFallback?: string;
  dateFormat?: string;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const DateItem = ({
  title,
  date,
  daysUntil,
  badge,
  icon,
  avatarUrl,
  avatarFallback,
  dateFormat = "dd 'de' MMM",
  showActions = false,
  onEdit,
  onDelete,
}: DateItemProps) => {
  const isToday = isDateToday(date);
  const isTomorrow = isDateTomorrow(date);

  const containerClasses = `group relative flex items-center gap-3 p-3 rounded-lg transition-all ${
    isToday
      ? "bg-muran-primary text-white shadow-md"
      : isTomorrow
      ? "bg-blue-50 border border-blue-200"
      : "bg-white border border-gray-200 hover:border-muran-primary/30 hover:shadow-sm"
  }`;

  const iconContainerClasses = `flex items-center justify-center h-10 w-10 rounded-full shrink-0 ${
    isToday
      ? "bg-white/20"
      : isTomorrow
      ? "bg-blue-100"
      : "bg-muran-primary/10"
  }`;

  const titleClasses = `font-semibold text-sm ${
    isToday ? "text-white" : isTomorrow ? "text-blue-900" : "text-gray-900"
  }`;

  const dateTextClasses = `flex items-center gap-1 text-xs ${
    isToday ? "text-white/90" : isTomorrow ? "text-blue-700" : "text-gray-600"
  }`;

  const daysTextClasses = `flex items-center gap-1 text-xs font-medium ${
    isTomorrow ? "text-blue-700" : "text-muran-primary"
  }`;

  const badgeClasses = `text-xs ${
    isToday
      ? "bg-white/20 text-white border-white/30"
      : isTomorrow
      ? "bg-blue-100 text-blue-700 border-blue-300"
      : "bg-muran-primary/10 text-muran-primary border-muran-primary/20"
  }`;

  return (
    <div className={containerClasses}>
      {/* Avatar ou Ícone */}
      {avatarUrl !== undefined || avatarFallback !== undefined ? (
        <Avatar className={`h-10 w-10 shrink-0 ${isToday ? "ring-2 ring-white/40" : isTomorrow ? "ring-2 ring-blue-300" : ""}`}>
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={title} className="object-cover" />
          ) : null}
          <AvatarFallback
            className={
              isToday
                ? "bg-white/20 text-white text-sm"
                : isTomorrow
                ? "bg-blue-100 text-blue-700 text-sm"
                : "bg-muran-primary text-white text-sm"
            }
          >
            {avatarFallback}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className={iconContainerClasses}>{icon}</div>
      )}

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h4 className={titleClasses}>
            {isToday && "🎉 "}
            {isTomorrow && "🎂 "}
            {title}
          </h4>
          {badge && (
            <Badge variant={badge.variant || "outline"} className={badgeClasses}>
              {badge.label}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className={dateTextClasses}>
            <Calendar className="h-3 w-3" />
            {format(date, dateFormat, { locale: ptBR })}
          </span>
          {!isToday && (
            <span className={daysTextClasses}>
              <Clock className="h-3 w-3" />
              {daysUntil} {daysUntil === 1 ? "dia" : "dias"}
            </span>
          )}
        </div>
      </div>

      {/* Ações (apenas para datas customizadas) */}
      {showActions && (onEdit || onDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${isToday ? "text-white hover:bg-white/20" : "text-gray-500 hover:text-gray-700"}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
