import { LayoutGrid, Facebook, Search, Users, Award, Filter, BarChart3, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "performance", label: "Performance", icon: BarChart3 },
  { id: "meta-ads", label: "Meta Ads", icon: Facebook },
  { id: "google-ads", label: "Google Ads", icon: Search },
  { id: "funnel", label: "Funil", icon: Target },
  { id: "audience", label: "Audiência", icon: Users },
  { id: "creatives", label: "Criativos", icon: Award },
  { id: "campaigns", label: "Campanhas", icon: Filter },
];

export function SidebarNav({ active = "overview" }: { active?: string }) {
  const handleClick = (id: string) => {
    const el = document.getElementById(`dashcortex-section-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <aside className="hidden xl:flex flex-col gap-1 w-[200px] shrink-0 sticky top-6 self-start">
      <div className="px-4 py-3 mb-2">
        <p className="text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">
          Navegação
        </p>
      </div>
      {items.map((item) => {
        const isActive = item.id === active;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            className={cn(
              "group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 text-sm font-medium text-left",
              isActive
                ? "bg-gradient-to-r from-[#ff6e00]/20 to-transparent text-white border-l-2 border-[#ff6e00]"
                : "text-white/50 hover:text-white/90 hover:bg-white/[0.03] border-l-2 border-transparent"
            )}
          >
            <Icon className={cn("h-4 w-4 transition-transform", isActive && "text-[#ff6e00]")} />
            <span>{item.label}</span>
            {isActive && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#ff6e00] shadow-[0_0_8px_#ff6e00]" />
            )}
          </button>
        );
      })}
    </aside>
  );
}
