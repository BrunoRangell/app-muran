
import React from "react";
import { Loader } from "lucide-react";

export const BudgetLoadingState = () => {
  return (
    <div className="flex justify-center py-8">
      <Loader className="h-8 w-8 animate-spin text-muran-primary" />
    </div>
  );
};
