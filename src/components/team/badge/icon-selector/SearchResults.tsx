
import { ScrollArea } from "@/components/ui/scroll-area";
import { IconButton } from "./IconButton";
import { BadgeIcon } from "./types";

interface SearchResultsProps {
  icons: BadgeIcon[];
  selectedIcon: string;
  onSelectIcon: (name: string) => void;
}

export function SearchResults({ icons, selectedIcon, onSelectIcon }: SearchResultsProps) {
  return (
    <ScrollArea className="h-[300px]">
      <div className="grid grid-cols-6 gap-2 pr-4">
        {icons.map(({ icon, name, label }) => (
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
  );
}
