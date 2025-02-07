
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
                <div className="p-2 bg-muran-primary/10 rounded-lg hover:bg-muran-primary/20 transition-colors">
                  <IconComponent className="h-6 w-6 text-muran-primary" />
                </div>
              </TooltipTrigger>
              <TooltipContent 
                side="top" 
                align="center" 
                sideOffset={10}
                className="fixed bg-white border-2 border-muran-primary/20 shadow-lg p-4 max-w-[250px] z-[9999] break-words"
                style={{ position: 'fixed', pointerEvents: 'auto' }}
              >
                <div>
                  <h4 className="font-bold text-base text-gray-900 mb-1">{badge.name}</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{badge.description}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
};

