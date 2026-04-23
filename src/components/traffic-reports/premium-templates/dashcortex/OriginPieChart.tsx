import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Compass } from "lucide-react";

interface OriginPieChartProps {
  data: Array<{ name: string; value: number; color: string }>;
}

export function OriginPieChart({ data }: OriginPieChartProps) {
  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-6 backdrop-blur-xl h-full">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/30 to-violet-500/10">
          <Compass className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Origem dos Acessos</h3>
          <p className="text-[11px] text-white/40">Distribuição por plataforma</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_140px] gap-4 items-center">
        <div className="h-[180px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                stroke="none"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "rgba(15,18,30,0.95)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  color: "#fff",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-[10px] uppercase tracking-wider text-white/40">Total</p>
            <p className="text-lg font-bold text-white">
              {new Intl.NumberFormat("pt-BR").format(total)}
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {data.map((item, i) => {
            const pct = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={i} className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }}
                  />
                  <span className="text-white/70 truncate">{item.name}</span>
                </div>
                <span className="text-white/90 font-semibold shrink-0">{pct.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
