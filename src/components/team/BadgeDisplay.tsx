import { Badge } from "@/types/team";
import { Trophy } from "lucide-react";
import { BADGE_ICONS } from "./constants/badgeIcons";
import { 
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

interface BadgeDisplayProps {
  badges?: Badge[];
}

export const BadgeDisplay = ({ badges }: BadgeDisplayProps) => {
  if (!badges || badges.length === 0) return null;

  return (
    <div className="w-full">
      <div className="p-3 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="h-4 w-4 text-muran-primary" />
          <h3 className="text-base font-semibold text-gray-900">Conquistas e Reconhecimentos</h3>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => {
            const IconComponent = BADGE_ICONS.find(icon => icon.name === badge.icon)?.icon || Trophy;
            
            return (
              <Dialog key={badge.id}>
                <DialogTrigger asChild>
                  <button className="group relative p-2 bg-gradient-to-br from-muran-primary/20 to-muran-primary/10 rounded-lg hover:from-muran-primary/30 hover:to-muran-primary/20 transition-all duration-300 shadow-sm hover:shadow-md">
                    <IconComponent className="h-5 w-5 text-muran-primary transition-transform group-hover:scale-110 duration-300" />
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-white p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-muran-primary/10 rounded-xl">
                        <IconComponent className="h-8 w-8 text-muran-primary" />
                      </div>
                      <h4 className="font-bold text-2xl text-gray-900">{badge.name}</h4>
                    </div>
                    <div className="w-16 h-1 bg-muran-primary/20 rounded-full"></div>
                    <p className="text-base text-gray-700 leading-relaxed">{badge.description}</p>
                  </div>
                </DialogContent>
              </Dialog>
            );
          })}
        </div>
      </div>
    </div>
  );
};
