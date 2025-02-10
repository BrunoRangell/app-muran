
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { BADGE_ICONS } from "../constants/badgeIcons";

interface IconSelectorProps {
  selectedIcon: string;
  onSelectIcon: (iconName: string) => void;
}

export function IconSelector({ selectedIcon, onSelectIcon }: IconSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Ícone do Emblema</label>
      <ScrollArea className="h-[200px]">
        <div className="grid grid-cols-6 gap-2 pr-4">
          {BADGE_ICONS.map(({ icon: Icon, name, label }) => (
            <div key={name} className="relative">
              <Button
                type="button"
                variant={selectedIcon === name ? "default" : "outline"}
                className={`w-full aspect-square flex-col gap-1 group transition-all duration-300 ${
                  selectedIcon === name 
                    ? 'bg-muran-primary hover:bg-muran-primary/90' 
                    : 'hover:bg-muran-primary/10 hover:border-muran-primary'
                }`}
                onClick={() => onSelectIcon(name)}
                title={label}
              >
                <Icon 
                  className={`h-5 w-5 transition-all duration-300 ${
                    selectedIcon === name 
                      ? 'text-white' 
                      : 'text-muran-primary group-hover:scale-110'
                  }`} 
                />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
