
import { cn } from "@/lib/utils";

interface SidebarLogoProps {
  isCollapsed?: boolean;
}

export const SidebarLogo = ({ isCollapsed }: SidebarLogoProps) => {
  return (
    <div className="flex items-center justify-center">
      <img 
        src="/lovable-uploads/2638a3ab-9001-4f4e-b0df-a1a3bb8786da.png" 
        alt="Muran" 
        className={cn(
          "w-auto transition-all duration-300",
          isCollapsed ? "h-8" : "h-12"
        )}
        loading="eager"
      />
    </div>
  );
};
