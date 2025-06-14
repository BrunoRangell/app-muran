
import { UnifiedEmptyState } from "@/components/common/UnifiedEmptyState";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <UnifiedEmptyState
      title={title}
      description={description}
      icon={icon}
      size="md"
    />
  );
}
