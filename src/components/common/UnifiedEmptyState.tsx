
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UnifiedEmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function UnifiedEmptyState({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
  className = "",
  size = "md"
}: UnifiedEmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: "py-8",
      icon: "h-12 w-12",
      title: "text-base",
      description: "text-sm"
    },
    md: {
      container: "py-12", 
      icon: "h-16 w-16",
      title: "text-lg",
      description: "text-sm"
    },
    lg: {
      container: "py-16",
      icon: "h-20 w-20", 
      title: "text-xl",
      description: "text-base"
    }
  };

  const classes = sizeClasses[size];

  return (
    <div className={`text-center text-gray-500 ${classes.container} ${className}`}>
      {Icon && (
        <div className="mb-4">
          <Icon className={`${classes.icon} mx-auto text-gray-300`} />
        </div>
      )}
      <h3 className={`font-medium mb-2 ${classes.title}`}>{title}</h3>
      {description && (
        <p className={`${classes.description} mb-4`}>{description}</p>
      )}
      {actionLabel && onAction && (
        <Button 
          onClick={onAction}
          className="bg-[#ff6e00] hover:bg-[#e66300]"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
