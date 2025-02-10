
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge as UIBadge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { BADGE_ICONS } from "../constants/badgeIcons";

interface ExistingBadgesListProps {
  badges: Array<{
    id: string;
    code: string;
    name: string;
    description: string;
    icon: string;
  }>;
  userBadges?: Array<{ code: string }>;
  onGiveBadge: (badge: any) => void;
  selectedMember: string;
  isLoading: boolean;
}

export function ExistingBadgesList({
  badges,
  userBadges,
  onGiveBadge,
  selectedMember,
  isLoading,
}: ExistingBadgesListProps) {
  const userHasBadge = (badgeCode: string) => {
    return userBadges?.some((badge) => badge.code === badgeCode);
  };

  if (isLoading) {
    return <div className="text-center py-4 text-gray-500">Carregando emblemas...</div>;
  }

  if (!badges || badges.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum emblema existente.
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="grid grid-cols-1 gap-4">
        {badges.map((badge) => {
          const IconComponent = BADGE_ICONS.find(icon => icon.name === badge.icon)?.icon || Trophy;
          const hasBadge = userHasBadge(badge.code);
          
          return (
            <div
              key={badge.id}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muran-primary/10 rounded-lg">
                  <IconComponent className="h-6 w-6 text-muran-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{badge.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{badge.description}</p>
                    </div>
                    {selectedMember && (
                      hasBadge ? (
                        <UIBadge variant="secondary" className="shrink-0">
                          Usuário já possui
                        </UIBadge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0"
                          onClick={() => onGiveBadge(badge)}
                        >
                          Dar emblema
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
