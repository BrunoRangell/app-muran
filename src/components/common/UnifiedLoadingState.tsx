
import { Loader2 } from "lucide-react";

interface UnifiedLoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "skeleton" | "pulse";
  className?: string;
}

export const UnifiedLoadingState = ({ 
  message = "Carregando...", 
  size = "md",
  variant = "spinner",
  className = ""
}: UnifiedLoadingStateProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  const containerClasses = {
    sm: "p-4",
    md: "p-8",
    lg: "p-12"
  };

  if (variant === "skeleton") {
    return (
      <div className={`space-y-4 ${containerClasses[size]} ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-muran-secondary rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-muran-secondary rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-muran-secondary rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={`flex items-center justify-center ${containerClasses[size]} ${className}`}>
        <div className={`${sizeClasses[size]} bg-[#ff6e00] rounded-full animate-pulse`}></div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]} ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-muran-primary mb-2`} />
      {message && (
        <p className="text-sm text-muran-text-secondary text-center">{message}</p>
      )}
    </div>
  );
};
