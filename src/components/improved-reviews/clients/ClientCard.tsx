
import { CircularBudgetCard } from "./CircularBudgetCard";

interface ClientCardProps {
  client: any;
  platform?: "meta" | "google";
  budgetCalculationMode?: "weighted" | "current";
  considerTaxes?: boolean;
}

export function ClientCard({ client, platform = "meta", budgetCalculationMode, considerTaxes }: ClientCardProps) {
  return <CircularBudgetCard client={client} platform={platform} budgetCalculationMode={budgetCalculationMode} considerTaxes={considerTaxes} />;
}
