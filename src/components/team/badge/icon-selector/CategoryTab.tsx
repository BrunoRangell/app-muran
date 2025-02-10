
import { ScrollArea } from "@/components/ui/scroll-area";
import { TabsContent } from "@/components/ui/tabs";
import { IconButton } from "./IconButton";
import { BadgeIcon } from "./types";

interface CategoryTabProps {
  category: string;
  icons: BadgeIcon[];
  selectedIcon: string;
  onSelectIcon: (name: string) => void;
}

export function CategoryTab({ category, icons, selectedIcon, onSelectIcon }: CategoryTabProps) {
  return (
    <TabsContent key={category} value={category}>
      <ScrollArea className="h-[300px]">
        <div className="grid grid-cols-6 gap-2 pr-4">
          {icons
            .filter(icon => icon.category === category)
            .map(({ icon, name, label }) => (
              <IconButton
                key={name}
                icon={icon}
                name={name}
                label={label}
                isSelected={selectedIcon === name}
                onSelect={onSelectIcon}
              />
            ))}
        </div>
      </ScrollArea>
    </TabsContent>
  );
}
