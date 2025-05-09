
import React from "react";
import { Loader } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  platform?: "meta" | "google";
}

export function LoadingState({ message, platform = "meta" }: LoadingStateProps) {
  const platformName = platform === "meta" ? "Meta Ads" : "Google Ads";
  const defaultMessage = `Carregando dados do ${platformName}...`;

  return (
    <div className="flex flex-col items-center justify-center h-64 w-full">
      <div className="flex flex-col items-center justify-center p-8 rounded-lg bg-white shadow-sm border border-gray-100">
        <Loader className="h-12 w-12 text-[#ff6e00] animate-spin mb-4" />
        <p className="text-lg font-medium text-gray-700">{message || defaultMessage}</p>
        <p className="text-sm text-gray-500 mt-2">Isso pode levar alguns instantes</p>
      </div>
    </div>
  );
}
