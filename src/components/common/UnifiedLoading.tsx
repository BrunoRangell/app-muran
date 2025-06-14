
import { Loader2 } from "lucide-react";

interface UnifiedLoadingProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "spinner-only" | "full-screen";
  className?: string;
}

export function UnifiedLoading({ 
  message = "Carregando...", 
  size = "md",
  variant = "default",
  className = ""
}: UnifiedLoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  const messageSize = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  if (variant === "spinner-only") {
    return (
      <div className={`flex justify-center ${className}`}>
        <Loader2 className={`animate-spin text-[#ff6e00] ${sizeClasses[size]}`} />
      </div>
    );
  }

  if (variant === "full-screen") {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-muran-secondary/20 to-white ${className}`}>
        <div className="text-center">
          <Loader2 className={`animate-spin text-[#ff6e00] mx-auto mb-4 ${sizeClasses[size]}`} />
          <p className={`text-gray-600 ${messageSize[size]}`}>{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`text-center py-12 ${className}`}>
      <Loader2 className={`animate-spin text-[#ff6e00] mx-auto mb-4 ${sizeClasses[size]}`} />
      <p className={`text-gray-500 ${messageSize[size]}`}>{message}</p>
    </div>
  );
}
