
import { Card, CardContent } from "@/components/ui/card";
import { SearchX } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="p-12 flex flex-col items-center justify-center text-center">
        {icon || <SearchX className="h-16 w-16 text-[#ff6e00]/30 mb-4" />}
        <h3 className="text-xl font-medium text-[#321e32] mb-2">{title}</h3>
        <p className="text-[#321e32]/70">{description}</p>
      </CardContent>
    </Card>
  );
}
