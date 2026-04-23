import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  previousValue?: string;
  change?: number;
  icon: LucideIcon;
  accent: string; // hex color
  delay?: number;
}

export function KpiCard({ title, value, previousValue, change = 0, icon: Icon, accent, delay = 0 }: KpiCardProps) {
  const isPositive = change >= 0;
  const progress = Math.min(Math.abs(change), 100);

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-5 backdrop-blur-xl transition-all duration-500 hover:border-white/[0.12] hover:-translate-y-1"
      style={{
        animation: `fade-in 0.6s ease-out ${delay}ms backwards`,
        boxShadow: `0 8px 32px -12px ${accent}15`,
      }}
    >
      {/* Glow background */}
      <div
        className="absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
        style={{ background: accent }}
      />

      <div className="relative flex items-start justify-between mb-5">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10"
          style={{
            background: `linear-gradient(135deg, ${accent}30, ${accent}10)`,
          }}
        >
          <Icon className="h-5 w-5" style={{ color: accent }} />
        </div>
        {change !== 0 && (
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
            )}
          >
            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>

      <div className="relative space-y-2">
        <p className="text-[11px] font-medium tracking-wide text-white/40 uppercase">{title}</p>
        <p className="text-2xl font-bold tracking-tight text-white">{value}</p>

        {/* Progress bar */}
        <div className="pt-2">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${Math.max(progress, 8)}%`,
                background: `linear-gradient(90deg, ${accent}, ${accent}90)`,
                boxShadow: `0 0 12px ${accent}80`,
              }}
            />
          </div>
          {previousValue && (
            <p className="mt-2 text-[10px] text-white/35">
              Anterior: <span className="text-white/55">{previousValue}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
