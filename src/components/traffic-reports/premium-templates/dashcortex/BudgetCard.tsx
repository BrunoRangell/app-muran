import { Wallet } from "lucide-react";

interface BudgetCardProps {
  metaSpend: number;
  googleSpend: number;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

export function BudgetCard({ metaSpend, googleSpend }: BudgetCardProps) {
  const total = metaSpend + googleSpend;
  const metaPct = total > 0 ? (metaSpend / total) * 100 : 0;
  const googlePct = total > 0 ? (googleSpend / total) * 100 : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#ff6e00]/10 via-white/[0.02] to-transparent p-5 backdrop-blur-xl">
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#ff6e00] opacity-10 blur-3xl" />

      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br from-[#ff6e00]/30 to-[#ff6e00]/10">
            <Wallet className="h-4 w-4 text-[#ff6e00]" />
          </div>
          <p className="text-sm font-semibold text-white">Investimento total</p>
        </div>
        <p className="text-lg font-bold text-white">{formatCurrency(total)}</p>
      </div>

      {/* Distribution bar */}
      <div className="relative h-2 w-full rounded-full overflow-hidden bg-white/5 mb-3 flex">
        <div
          className="h-full transition-all duration-700"
          style={{
            width: `${metaPct}%`,
            background: "linear-gradient(90deg, #1877f2, #4a9bff)",
            boxShadow: "0 0 8px rgba(24,119,242,0.5)",
          }}
        />
        <div
          className="h-full transition-all duration-700"
          style={{
            width: `${googlePct}%`,
            background: "linear-gradient(90deg, #34a853, #5fcc7a)",
            boxShadow: "0 0 8px rgba(52,168,83,0.5)",
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#1877f2]" />
            <p className="text-[10px] uppercase tracking-wider text-white/50">Meta</p>
          </div>
          <p className="text-sm font-semibold text-white">{formatCurrency(metaSpend)}</p>
          <p className="text-[10px] text-white/40">{metaPct.toFixed(1)}%</p>
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#34a853]" />
            <p className="text-[10px] uppercase tracking-wider text-white/50">Google</p>
          </div>
          <p className="text-sm font-semibold text-white">{formatCurrency(googleSpend)}</p>
          <p className="text-[10px] text-white/40">{googlePct.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}
