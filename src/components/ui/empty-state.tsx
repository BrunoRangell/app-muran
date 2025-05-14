
import React from 'react';
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ 
  title, 
  description,
  icon = <SearchX className="h-16 w-16 text-gray-300 mb-4" />,
  action
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center bg-white border border-gray-100 rounded-lg p-10 text-center">
      {icon}
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-md mb-6">{description}</p>
      {action}
    </div>
  );
}
