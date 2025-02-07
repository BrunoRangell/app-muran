
import { Badge } from "@/types/team";
import { Trophy, Award, Star, Medal, Ribbon, Gem, Flag, BadgeCheck, BadgeIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BadgeDisplayProps {
  badges?: Badge[];
}

const BadgeIconMap: Record<string, React.ComponentType<any>> = {
  trophy: Trophy,
  award: Award,
  star: Star,
  medal: Medal,
  ribbon: Ribbon,
  gem: Gem,
  flag: Flag,
  badge: BadgeIcon,
  badge_check: BadgeCheck,
};

export const BadgeDisplay = ({ badges }: BadgeDisplayProps) => {
  if (!badges || badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {badges.map((badge) => {
        const IconComponent = BadgeIconMap[badge.icon] || Trophy;
        
        return (
          <TooltipProvider key={badge.id} delayDuration={0}>
            <Tooltip>
              <TooltipTrigger>
                <div className="p-1.5 bg-muran-primary/10 rounded-full hover:bg-muran-primary/20 transition-colors">
                  <IconComponent className="h-5 w-5 text-muran-primary" />
                </div>
              </TooltipTrigger>
              <TooltipContent 
                side="top" 
                align="center" 
                sideOffset={8}
                className="fixed bg-white z-[9999] shadow-lg border border-gray-200 p-3 max-w-[300px] break-words"
              >
                <div className="text-sm">
                  <p className="font-semibold text-gray-900">{badge.name}</p>
                  <p className="text-xs text-gray-600 mt-1">{badge.description}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
};

