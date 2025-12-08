import { cn } from "@/lib/utils";
import { BarChart3 } from "lucide-react";

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
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-[1600px] mx-auto px-6 md:px-10">
        {/* Linha principal: Logo + Abas + Badge */}
        <div className="flex items-center justify-between h-16">
          {/* Logo "M" placeholder + Abas */}
          <div className="flex items-center gap-8">
            {/* Logo M elegante */}
            <span className="text-2xl font-bold text-gray-900 tracking-tight select-none">
              M
            </span>
            
            {/* Abas minimalistas */}
            {showTabs && (
              <nav className="hidden md:flex items-center">
                {tabs.map((tab) => {
                  const isActive = viewMode === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => tab.enabled && onViewModeChange(tab.id)}
                      disabled={!tab.enabled}
                      className={cn(
                        "relative px-4 py-5 text-sm font-medium transition-colors",
                        isActive
                          ? "text-gray-900"
                          : "text-gray-500 hover:text-gray-900",
                        !tab.enabled && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      {tab.label}
                      {/* Underline laranja ativo */}
                      {isActive && (
                        <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#ff6e00] rounded-full" />
                      )}
                    </button>
                  );
                })}
              </nav>
            )}
          </div>
          
          {/* Badge "Ao vivo" discreto */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
            </span>
            <span className="hidden sm:inline">Ao vivo</span>
          </div>
        </div>
        
        {/* Linha secundária: Nome do cliente (e logo futura) */}
        {clientName && (
          <div className="pb-4 -mt-2">
            <div className="flex items-center gap-3">
              {/* Logo do cliente (futuro) */}
              {clientLogoUrl && (
                <img 
                  src={clientLogoUrl} 
                  alt={clientName}
                  className="h-6 w-auto object-contain"
                />
              )}
              <span className="text-sm text-gray-600">{clientName}</span>
            </div>
          </div>
        )}
        
        {/* Abas mobile */}
        {showTabs && (
          <div className="md:hidden pb-3 -mt-1 overflow-x-auto">
            <nav className="flex items-center gap-1">
              {tabs.map((tab) => {
                const isActive = viewMode === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => tab.enabled && onViewModeChange(tab.id)}
                    disabled={!tab.enabled}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors",
                      isActive
                        ? "bg-gray-900 text-white"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
                      !tab.enabled && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
