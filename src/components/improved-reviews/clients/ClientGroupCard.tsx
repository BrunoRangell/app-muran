import { Badge } from "@/components/ui/badge";
import { ClientCard } from "./ClientCard";
import type { PlatformAccount } from "../hooks/useAllPlatformsData";

interface ClientGroupCardProps {
  clientName: string;
  accounts: PlatformAccount[];
}

const platformConfig = {
  meta: {
    label: "Meta Ads",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  google: {
    label: "Google Ads",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
};

export function ClientGroupCard({ clientName, accounts }: ClientGroupCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <h3 className="text-base font-semibold text-foreground">{clientName}</h3>
        <div className="flex gap-1.5">
          {accounts.map((acc, i) => {
            const config = platformConfig[acc.platform];
            const accountName =
              acc.platform === "meta"
                ? acc.clientData.meta_account_name
                : acc.clientData.google_account_name;
            return (
              <Badge
                key={`${acc.platform}-${i}`}
                variant="outline"
                className={config.className}
              >
                {config.label}
                {accountName ? ` · ${accountName}` : ""}
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {accounts.map((acc, i) => (
          <div key={`${acc.platform}-${i}`} className="relative">
            <ClientCard
              client={acc.clientData}
              platform={acc.platform}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
