
import { Button } from "@/components/ui/button";
import { IconButtonProps } from "./types";

export function IconButton({ icon, name, label, isSelected, onSelect }: IconButtonProps) {
  return (
    <Button
      type="button"
      variant={isSelected ? "default" : "outline"}
      className={`w-full aspect-square flex-col gap-1 group transition-all duration-300 ${
        isSelected 
          ? 'bg-muran-primary hover:bg-muran-primary/90' 
          : 'hover:bg-muran-primary/10 hover:border-muran-primary'
      }`}
      onClick={() => onSelect(name)}
      title={label}
    >
      <span 
        className={`text-2xl transition-all duration-300 ${
          isSelected 
            ? '' 
            : 'group-hover:scale-110'
        }`} 
        role="img" 
        aria-label={label}
      >
        {icon}
      </span>
    </Button>
  );
}
