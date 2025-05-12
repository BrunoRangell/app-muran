
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div className={cn("min-h-screen bg-gray-50 flex flex-col", className)}>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
