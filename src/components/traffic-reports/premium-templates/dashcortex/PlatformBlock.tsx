import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { LucideIcon } from "lucide-react";

interface PlatformBlockProps {
  title: string;
  icon: LucideIcon;
  accent: string;
  series: Array<{ date: string; value: number }>;
  metrics: Array<{ label: string; value: string }>;
  totalLabel: string;
  totalValue: string;
}

export function PlatformBlock({ title, icon: Icon, accent, series, metrics, totalLabel, totalValue }: PlatformBlockProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-6 backdrop-blur-xl">
      {/* accent glow */}
      <div
        className="absolute -top-20 -left-20 h-48 w-48 rounded-full opacity-10 blur-3xl"
        style={{ background: accent }}
      />

      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10"
            style={{ background: `linear-gradient(135deg, ${accent}30, ${accent}10)` }}
          >
            <Icon className="h-5 w-5" style={{ color: accent }} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="text-[11px] text-white/40">Performance no período</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-white/40">{totalLabel}</p>
          <p className="text-xl font-bold text-white">{totalValue}</p>
        </div>
      </div>

      <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_180px] gap-6">
        {/* Chart */}
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${accent.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent} stopOpacity={1} />
                  <stop offset="100%" stopColor={accent} stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                contentStyle={{
                  background: "rgba(15,18,30,0.95)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  color: "#fff",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {series.map((_, i) => (
                  <Cell key={i} fill={`url(#grad-${accent.replace("#", "")})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Metrics sidebar */}
        <div className="flex flex-col gap-3 lg:border-l lg:border-white/5 lg:pl-6">
          {metrics.map((m, i) => (
            <div key={i} className="space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider text-white/40">{m.label}</p>
              <p className="text-base font-semibold text-white">{m.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
