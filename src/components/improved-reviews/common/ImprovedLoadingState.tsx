
import React from "react";
import { Loader } from "lucide-react";

interface ImprovedLoadingStateProps {
  message?: string;
}

export const ImprovedLoadingState = ({ message = "Carregando..." }: ImprovedLoadingStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-gray-100 border-opacity-30"></div>
        <Loader className="h-12 w-12 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-spin text-muran-primary" />
      </div>
      <p className="mt-4 text-gray-600 font-medium">{message}</p>
    </div>
  );
};
