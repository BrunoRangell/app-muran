import { MapPin } from "lucide-react";

interface RegionTableProps {
  regions: Array<{ label: string; value: number }>;
}

export function RegionTable({ regions }: RegionTableProps) {
  const max = Math.max(...regions.map((r) => r.value), 1);
  const top = regions.slice(0, 8);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-6 backdrop-blur-xl h-full">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-[#ff6e00]/30 to-[#ff6e00]/10">
          <MapPin className="h-5 w-5 text-[#ff6e00]" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Região</h3>
          <p className="text-[11px] text-white/40">Top localidades por conversão</p>
        </div>
      </div>

      <div className="space-y-3">
        {top.length === 0 && (
          <p className="text-sm text-white/40 text-center py-6">Sem dados de região disponíveis</p>
        )}
        {top.map((region, i) => {
          const pct = (region.value / max) * 100;
          return (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70 font-medium">{region.label}</span>
                <span className="text-white/90 font-semibold">
                  {new Intl.NumberFormat("pt-BR").format(region.value)}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: "linear-gradient(90deg, #ff6e00, #ff8c33)",
                    boxShadow: "0 0 10px rgba(255,110,0,0.4)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
