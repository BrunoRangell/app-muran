
import { Badge } from "@/types/team";
import { Trophy } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BadgeDisplayProps {
  badges?: Badge[];
}

export const BadgeDisplay = ({ badges }: BadgeDisplayProps) => {
  if (!badges || badges.length === 0) return null;

  return (
    <div className="flex gap-2 mt-2">
      {badges.map((badge) => (
        <TooltipProvider key={badge.id}>
          <Tooltip>
            <TooltipTrigger>
              <div className="p-1.5 bg-muran-primary/10 rounded-full hover:bg-muran-primary/20 transition-colors">
                <Trophy className="h-5 w-5 text-muran-primary" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <p className="font-semibold">{badge.name}</p>
                <p className="text-xs text-gray-500">{badge.description}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
};
