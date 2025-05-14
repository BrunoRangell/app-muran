
import { ReactNode } from "react";
import { ReviewsProvider } from "./ReviewContext";
import { BudgetProvider } from "./BudgetContext";

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <ReviewsProvider>
      <BudgetProvider>{children}</BudgetProvider>
    </ReviewsProvider>
  );
};
