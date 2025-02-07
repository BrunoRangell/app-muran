
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
    <div className="w-full">
      <div className="p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-5 w-5 text-muran-primary" />
          <h3 className="text-lg font-semibold text-gray-900">Conquistas e Reconhecimentos</h3>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {badges.map((badge) => {
            const IconComponent = BadgeIconMap[badge.icon] || Trophy;
            
            return (
              <TooltipProvider key={badge.id} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="group relative p-3 bg-gradient-to-br from-muran-primary/20 to-muran-primary/10 rounded-xl hover:from-muran-primary/30 hover:to-muran-primary/20 transition-all duration-300 shadow-sm hover:shadow-md">
                      <IconComponent className="h-7 w-7 text-muran-primary transition-transform group-hover:scale-110 duration-300" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="top" 
                    align="center" 
                    sideOffset={12}
                    className="fixed bg-white/95 backdrop-blur-sm border-2 border-muran-primary/20 shadow-xl p-6 max-w-[300px] z-[9999] break-words rounded-xl"
                    style={{ 
                      position: 'fixed', 
                      pointerEvents: 'auto',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      top: '20%'
                    }}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muran-primary/10 rounded-lg">
                          <IconComponent className="h-6 w-6 text-muran-primary" />
                        </div>
                        <h4 className="font-bold text-xl text-gray-900">{badge.name}</h4>
                      </div>
                      <div className="w-12 h-1 bg-muran-primary/20 rounded-full"></div>
                      <p className="text-base text-gray-700 leading-relaxed">{badge.description}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>
    </div>
  );
};
