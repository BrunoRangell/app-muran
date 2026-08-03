import { useState } from "react";
import {
  BarChart3,
  Briefcase,
  Code2,
  Flame,
  Folder,
  Globe,
  Heart,
  Megaphone,
  Palette,
  Rocket,
  ShoppingBag,
  Star,
  Target,
  Users,
} from "lucide-react";
import { FolderIconName } from "@/types/tasks";

export const FOLDER_ICON_MAP: Record<FolderIconName, typeof Folder> = {
  folder: Folder,
  briefcase: Briefcase,
  rocket: Rocket,
  target: Target,
  megaphone: Megaphone,
  palette: Palette,
  code: Code2,
  chart: BarChart3,
  users: Users,
  star: Star,
  heart: Heart,
  flame: Flame,
  globe: Globe,
  shopping: ShoppingBag,
};

export const getFolderIcon = (name?: string | null) =>
  FOLDER_ICON_MAP[(name || "folder") as FolderIconName] ?? Folder;

export const FolderIconPicker = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (icon: FolderIconName) => void;
}) => (
  <div className="flex flex-wrap gap-1.5">
    {(Object.keys(FOLDER_ICON_MAP) as FolderIconName[]).map((name) => {
      const Icon = FOLDER_ICON_MAP[name];
      return (
        <button
          key={name}
          type="button"
          onClick={() => onChange(name)}
          className={
            "flex h-8 w-8 items-center justify-center rounded-[6px] border transition-colors " +
            (value === name
              ? "border-primary bg-primary/15 text-primary"
              : "border-border text-muted-foreground hover:bg-accent")
          }
          aria-label={name}
        >
          <Icon className="h-4 w-4" />
        </button>
      );
    })}
  </div>
);

export const ColorPicker = ({
  value,
  onChange,
  colors,
}: {
  value: string;
  onChange: (color: string) => void;
  colors: readonly string[];
}) => (
  <div className="flex flex-wrap gap-1.5">
    {colors.map((color) => (
      <button
        key={color}
        type="button"
        onClick={() => onChange(color)}
        style={{ backgroundColor: color }}
        className={
          "h-7 w-7 rounded-full border-2 transition-transform " +
          (value === color ? "scale-110 border-foreground" : "border-transparent hover:scale-105")
        }
        aria-label={color}
      />
    ))}
  </div>
);

/** Estado compartilhado para formulários de pasta. */
export const useFolderDraft = (initial?: { name?: string; color?: string; icon?: string | null }) => {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? "#ff6e00");
  const [icon, setIcon] = useState<string>(initial?.icon ?? "folder");
  return { name, setName, color, setColor, icon, setIcon };
};
