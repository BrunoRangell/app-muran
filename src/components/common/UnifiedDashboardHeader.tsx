
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface UnifiedDashboardHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
    icon?: LucideIcon;
    disabled?: boolean;
  }>;
  gradient?: boolean;
  className?: string;
}

export function UnifiedDashboardHeader({
  title,
  description,
  icon: Icon,
  badge,
  actions = [],
  gradient = false,
  className = ""
}: UnifiedDashboardHeaderProps) {
  const headerClasses = gradient 
    ? "bg-gradient-to-r from-muran-dark to-muran-dark/90 text-white"
    : "bg-white border border-gray-100";

  return (
    <Card className={`p-6 ${headerClasses} ${className}`}>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Título e Descrição */}
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl shadow-lg ${
            gradient 
              ? "bg-muran-primary" 
              : "bg-gradient-to-br from-muran-primary to-muran-primary/80"
          }`}>
            <Icon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold flex items-center gap-3 ${
              gradient ? "text-white" : "text-muran-dark"
            }`}>
              {title}
              {badge && (
                <Badge variant={badge.variant || "secondary"} className={
                  gradient ? "bg-white/20 text-white" : "bg-muran-primary/10 text-muran-primary"
                }>
                  {badge.text}
                </Badge>
              )}
            </h1>
            <p className={`text-lg mt-1 ${
              gradient ? "text-white/80" : "text-gray-600"
            }`}>
              {description}
            </p>
          </div>
        </div>

        {/* Ações */}
        {actions.length > 0 && (
          <div className="flex items-center gap-3">
            {actions.map((action, index) => {
              const ActionIcon = action.icon;
              return (
                <Button
                  key={index}
                  variant={action.variant || 'default'}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={
                    action.variant === 'default' && !gradient
                      ? 'bg-muran-primary hover:bg-muran-primary/90'
                      : gradient && action.variant === 'outline'
                      ? 'border-white text-white hover:bg-white/10'
                      : ''
                  }
                >
                  {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                  {action.label}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
