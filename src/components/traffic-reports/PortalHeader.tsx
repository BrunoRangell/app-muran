import { cn } from "@/lib/utils";

type ViewMode = 'combined' | 'meta' | 'google';

interface PortalHeaderProps {
  clientName?: string;
  clientLogoUrl?: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  hasMetaData?: boolean;
  hasGoogleData?: boolean;
  showTabs?: boolean;
}

interface Tab {
  id: ViewMode;
  label: string;
  enabled: boolean;
}

export function PortalHeader({
  clientName,
  clientLogoUrl,
  viewMode,
  onViewModeChange,
  hasMetaData = true,
  hasGoogleData = true,
  showTabs = true
}: PortalHeaderProps) {
  const tabs: Tab[] = [
    { id: 'combined', label: 'Visão Geral', enabled: true },
    { id: 'meta', label: 'Meta Ads', enabled: hasMetaData },
    { id: 'google', label: 'Google Ads', enabled: hasGoogleData }
  ];

  return (
    <header
      className="relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at top, #1a1030 0%, #0B0F1A 60%)',
        fontFamily: "'Space Grotesk', -apple-system, sans-serif",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,110,0,0.10),transparent_60%)]" />

      <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10">
        {/* Hero */}
        <div className="py-6 sm:py-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08]
                          flex items-center justify-center overflow-hidden p-2 flex-shrink-0
                          shadow-[0_8px_24px_-12px_rgba(255,110,0,0.25)]">
              {clientLogoUrl ? (
                <img
                  src={clientLogoUrl}
                  alt={clientName || 'Logo'}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-[#ff6e00] to-[#ff8c33]
                               bg-clip-text text-transparent select-none">
                  {clientName?.charAt(0).toUpperCase() || 'C'}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.25em] text-[#ff6e00] uppercase mb-1">
                Master Report
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                {clientName || 'Relatório'}
              </h1>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <img
                src="/lovable-uploads/2638a3ab-9001-4f4e-b0df-a1a3bb8786da.png"
                alt="Muran"
                className="h-7 w-auto opacity-90"
              />
              <span className="font-medium text-white/80 tracking-tight">muran</span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-white/60">Ao vivo</span>
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {showTabs && (
          <div className="py-4 sm:py-5 flex items-center justify-between gap-4 flex-wrap">
            <nav className="hidden md:inline-flex bg-white/[0.03] backdrop-blur-lg rounded-2xl p-1.5
                          border border-white/[0.06] gap-1">
              {tabs.map((tab) => {
                const isActive = viewMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => tab.enabled && onViewModeChange(tab.id)}
                    disabled={!tab.enabled}
                    className={cn(
                      "px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-300",
                      isActive
                        ? "bg-gradient-to-r from-[#ff6e00] to-[#ff8c33] text-white shadow-lg shadow-orange-500/20"
                        : "text-white/60 hover:bg-white/[0.05] hover:text-white",
                      !tab.enabled && "opacity-30 cursor-not-allowed hover:bg-transparent hover:text-white/60"
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            <div className="md:hidden overflow-x-auto scrollbar-hide -mx-2 px-2 w-full">
              <nav className="flex gap-2">
                {tabs.map((tab) => {
                  const isActive = viewMode === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => tab.enabled && onViewModeChange(tab.id)}
                      disabled={!tab.enabled}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-r from-[#ff6e00] to-[#ff8c33] text-white shadow-md"
                          : "bg-white/[0.04] text-white/70 border border-white/[0.06]",
                        !tab.enabled && "opacity-30 cursor-not-allowed"
                      )}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs text-white/30 flex-shrink-0">
              <span>Powered by</span>
              <span className="font-semibold bg-gradient-to-r from-[#ff6e00] to-[#ff8c33] bg-clip-text text-transparent tracking-tight">
                Muran
              </span>
            </div>
          </div>
        )}

        <div className="sm:hidden pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-medium text-white/60">Ao vivo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <img
              src="/lovable-uploads/2638a3ab-9001-4f4e-b0df-a1a3bb8786da.png"
              alt="Muran"
              className="h-5 w-auto opacity-90"
            />
            <span className="font-medium text-xs text-white/70">muran</span>
          </div>
        </div>
      </div>
    </header>
  );
}
