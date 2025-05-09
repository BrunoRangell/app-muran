
import React from "react";
import { Loader } from "lucide-react";

export const BudgetLoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <Loader className="h-10 w-10 animate-spin text-muran-primary" />
      <p className="text-gray-600 font-medium">Carregando dados de orçamento...</p>
    </div>
  );
};
