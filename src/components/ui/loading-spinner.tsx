
import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Carregando dados...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#ff6e00] border-t-transparent"></div>
      <p className="mt-4 text-lg text-gray-600">{message}</p>
    </div>
  );
}
