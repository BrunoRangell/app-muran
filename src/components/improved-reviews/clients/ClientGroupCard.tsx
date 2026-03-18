import { ClientCard } from "./ClientCard";
import type { PlatformAccount } from "../hooks/useAllPlatformsData";

interface ClientGroupCardProps {
  clientName: string;
  accounts: PlatformAccount[];
  considerTaxes?: boolean;
  budgetCalculationMode?: "weighted" | "current";
}

export function ClientGroupCard({ clientName, accounts, considerTaxes, budgetCalculationMode }: ClientGroupCardProps) {
  // Ordenar: plataforma majoritária primeiro, depois a minoritária
  const metaCount = accounts.filter((a) => a.platform === "meta").length;
  const googleCount = accounts.filter((a) => a.platform === "google").length;
  const majorityFirst = metaCount >= googleCount ? "meta" : "google";

  const sortedAccounts = [...accounts].sort((a, b) => {
    if (a.platform === b.platform) return 0;
    return a.platform === majorityFirst ? -1 : 1;
  });

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h3 className="text-base font-semibold text-foreground">{clientName}</h3>
      <div className="grid gap-3 max-sm:!grid-cols-1" style={{ gridTemplateColumns: `repeat(${Math.min(sortedAccounts.length, 4)}, minmax(0, 1fr))` }}>
        {sortedAccounts.map((acc, i) => (
          <ClientCard
            key={`${acc.platform}-${i}`}
            client={acc.clientData}
            platform={acc.platform}
            considerTaxes={acc.platform === "meta" ? considerTaxes : undefined}
            budgetCalculationMode={acc.platform === "google" ? budgetCalculationMode : undefined}
          />
        ))}
      </div>
    </div>
  );
}