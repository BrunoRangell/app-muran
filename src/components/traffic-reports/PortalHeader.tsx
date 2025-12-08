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
    <header className="relative overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50/50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-50/40 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-gray-100/30 via-transparent to-transparent" />
      
      <div className="relative max-w-[1600px] mx-auto px-6 md:px-10">
        {/* Hero Section - Logo + Info + Badge */}
        <div className="py-8 flex items-center justify-between">
          {/* Left: Logo container + Client info */}
          <div className="flex items-center gap-5">
            {/* Standardized logo container */}
            <div className="w-16 h-16 rounded-2xl bg-white shadow-lg shadow-gray-200/50 
                          border border-gray-100 flex items-center justify-center 
                          overflow-hidden p-2 flex-shrink-0">
              {clientLogoUrl ? (
                <img 
                  src={clientLogoUrl} 
                  alt={clientName || 'Logo'}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <span className="text-3xl font-bold bg-gradient-to-br from-[#ff6e00] to-[#ff8c33] 
                               bg-clip-text text-transparent select-none">
                  {clientName?.charAt(0).toUpperCase() || 'C'}
                </span>
              )}
            </div>
            
            {/* Client info */}
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight truncate">
                {clientName || 'Relatório'}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Relatório de Performance
              </p>
            </div>
          </div>
          
          {/* Right: Live badge */}
          <div className="hidden sm:flex bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 
                        border border-gray-200/50 shadow-sm items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-gray-600">Dados ao vivo</span>
          </div>
        </div>
        
        {/* Subtle separator */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        
        {/* Navigation Section */}
        {showTabs && (
          <div className="py-5 flex items-center justify-between gap-4">
            {/* Desktop: Glassmorphism tabs */}
            <nav className="hidden md:inline-flex bg-white/80 backdrop-blur-lg rounded-2xl p-1.5 
                          shadow-lg shadow-gray-200/30 border border-gray-200/50 gap-1">
              {tabs.map((tab) => {
                const isActive = viewMode === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => tab.enabled && onViewModeChange(tab.id)}
                    disabled={!tab.enabled}
                    className={cn(
                      "px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300",
                      isActive 
                        ? "bg-gradient-to-r from-[#ff6e00] to-[#ff8c33] text-white shadow-lg shadow-orange-500/25" 
                        : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900",
                      !tab.enabled && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-gray-600"
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
            
            {/* Mobile: Pill tabs */}
            <div className="md:hidden overflow-x-auto scrollbar-hide -mx-2 px-2">
              <nav className="flex gap-2">
                {tabs.map((tab) => {
                  const isActive = viewMode === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => tab.enabled && onViewModeChange(tab.id)}
                      disabled={!tab.enabled}
                      className={cn(
                        "px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                        isActive 
                          ? "bg-gradient-to-r from-[#ff6e00] to-[#ff8c33] text-white shadow-md" 
                          : "bg-white/80 text-gray-600 border border-gray-200/50",
                        !tab.enabled && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
            
            {/* Powered by Muran - discreet */}
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-400 flex-shrink-0">
              <span>Powered by</span>
              <span className="font-semibold bg-gradient-to-r from-[#ff6e00] to-[#ff8c33] bg-clip-text text-transparent tracking-tight">
                Muran
              </span>
            </div>
          </div>
        )}
        
        {/* Mobile: Live badge + Powered by */}
        <div className="sm:hidden pb-4 flex items-center justify-between">
          <div className="flex bg-white/80 backdrop-blur-sm rounded-full px-3 py-1.5 
                        border border-gray-200/50 shadow-sm items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-medium text-gray-600">Ao vivo</span>
          </div>
          
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <span>Powered by</span>
            <span className="font-semibold text-[#ff6e00]">Muran</span>
          </div>
        </div>
      </div>
    </header>
  );
}
