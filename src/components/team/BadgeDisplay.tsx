
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
    <div className="flex flex-wrap gap-3 mt-3">
      {badges.map((badge) => {
        const IconComponent = BadgeIconMap[badge.icon] || Trophy;
        
        return (
          <TooltipProvider key={badge.id} delayDuration={0}>
            <Tooltip>
              <TooltipTrigger>
                <div className="p-2.5 bg-gradient-to-br from-muran-primary/20 to-muran-primary/10 rounded-xl hover:from-muran-primary/30 hover:to-muran-primary/20 transition-all duration-300 shadow-sm hover:shadow-md">
                  <IconComponent className="h-7 w-7 text-muran-primary" />
                </div>
              </TooltipTrigger>
              <TooltipContent 
                side="top" 
                align="center" 
                sideOffset={12}
                className="fixed bg-white/95 backdrop-blur-sm border-2 border-muran-primary/20 shadow-xl p-5 max-w-[280px] z-[9999] break-words rounded-xl"
                style={{ position: 'fixed', pointerEvents: 'auto' }}
              >
                <div className="space-y-2">
                  <h4 className="font-bold text-lg text-gray-900">{badge.name}</h4>
                  <div className="w-12 h-1 bg-muran-primary/20 rounded-full"></div>
                  <p className="text-base text-gray-700 leading-relaxed">{badge.description}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
};

