import { Badge } from "@/components/ui/badge";
import { ClientCard } from "./ClientCard";
import type { PlatformAccount } from "../hooks/useAllPlatformsData";

interface ClientGroupCardProps {
  clientName: string;
  accounts: PlatformAccount[];
  considerTaxes?: boolean;
  budgetCalculationMode?: "weighted" | "current";
}

const platformConfig = {
  meta: {
    label: "Meta Ads",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    borderClass: "border-l-blue-400",
  },
  google: {
    label: "Google Ads",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    borderClass: "border-l-amber-400",
  },
};

export function ClientGroupCard({ clientName, accounts, considerTaxes, budgetCalculationMode }: ClientGroupCardProps) {
  const metaAccounts = accounts.filter((a) => a.platform === "meta");
  const googleAccounts = accounts.filter((a) => a.platform === "google");

  const renderSection = (platform: "meta" | "google", accs: PlatformAccount[]) => {
    if (accs.length === 0) return null;
    const config = platformConfig[platform];
    return (
      <div className={`border-l-2 ${config.borderClass} pl-3 space-y-2`}>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={config.badgeClass}>
            {config.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {accs.length} {accs.length === 1 ? "conta" : "contas"}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {accs.map((acc, i) => (
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
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h3 className="text-base font-semibold text-foreground">{clientName}</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {renderSection("meta", metaAccounts)}
        {renderSection("google", googleAccounts)}
      </div>
    </div>
  );
}