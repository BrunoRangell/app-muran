
import { CircularBudgetCard } from "./CircularBudgetCard";

interface ClientCardProps {
  client: any;
  platform?: "meta" | "google";
}

export function ClientCard({ client, platform = "meta" }: ClientCardProps) {
  return <CircularBudgetCard client={client} platform={platform} />;
}
