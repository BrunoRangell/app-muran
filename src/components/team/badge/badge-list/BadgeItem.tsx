
import { Button } from "@/components/ui/button";
import { Badge as UIBadge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Trash2, XCircle } from "lucide-react";
import { BADGE_ICONS } from "../../constants/badgeIcons";

interface BadgeItemProps {
  badge: {
    id: string;
    code: string;
    name: string;
    description: string;
    icon: string;
  };
  userHasBadge: boolean;
  selectedMember: string;
  onGiveBadge: () => void;
  onDeleteClick: (type: "member" | "all") => void;
}

export function BadgeItem({
  badge,
  userHasBadge,
  selectedMember,
  onGiveBadge,
  onDeleteClick,
}: BadgeItemProps) {
  const badgeIconData = BADGE_ICONS.find(icon => icon.name === badge.icon);
  const badgeIconEmoji = badgeIconData?.icon || "🏆";

  return (
    <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-muran-primary/10 rounded-lg">
          <span role="img" aria-label={badge.name} className="text-2xl">
            {badgeIconEmoji}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-medium text-gray-900">{badge.name}</h4>
              <p className="text-sm text-gray-500 mt-1">{badge.description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {selectedMember && (
                <>
                  {userHasBadge ? (
                    <>
                      <UIBadge variant="secondary" className="shrink-0">
                        Usuário possui
                      </UIBadge>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                            onClick={() => onDeleteClick("member")}
                          >
                            <XCircle className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Remover emblema deste membro</p>
                        </TooltipContent>
                      </Tooltip>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={onGiveBadge}
                    >
                      Dar emblema
                    </Button>
                  )}
                </>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                    onClick={() => onDeleteClick("all")}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Excluir emblema de todos os membros</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
