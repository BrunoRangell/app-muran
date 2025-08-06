
import { CircularBudgetCard } from "./CircularBudgetCard";

interface ClientCardProps {
  client: any;
  platform?: "meta" | "google";
  budgetCalculationMode?: "weighted" | "current";
}

export function ClientCard({ client, platform = "meta", budgetCalculationMode }: ClientCardProps) {
  return <CircularBudgetCard client={client} platform={platform} budgetCalculationMode={budgetCalculationMode} />;
}
