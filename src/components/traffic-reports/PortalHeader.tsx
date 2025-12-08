import { cn } from "@/lib/utils";
import { BarChart3 } from "lucide-react";

type ViewMode = 'combined' | 'meta' | 'google';

interface PortalHeaderProps {
  clientName?: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  hasMetaData?: boolean;
  hasGoogleData?: boolean;
  showTabs?: boolean;
}

// Custom Meta icon (Facebook "f" style)
const MetaIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02Z" />
  </svg>
);

// Custom Google icon
const GoogleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

interface Tab {
  id: ViewMode;
  label: string;
  icon: typeof BarChart3 | React.FC<React.SVGProps<SVGSVGElement>>;
  enabled: boolean;
}

export function PortalHeader({
  clientName,
  viewMode,
  onViewModeChange,
  hasMetaData = true,
  hasGoogleData = true,
  showTabs = true
}: PortalHeaderProps) {
  const tabs: Tab[] = [
    { 
      id: 'combined', 
      label: 'Visão Geral', 
      icon: BarChart3,
      enabled: true
    },
    { 
      id: 'meta', 
      label: 'Meta Ads', 
      icon: MetaIcon,
      enabled: hasMetaData
    },
    { 
      id: 'google', 
      label: 'Google Ads', 
      icon: GoogleIcon,
      enabled: hasGoogleData
    }
  ];

  return (
    <header className="bg-gradient-to-b from-[#321e32] to-[#2a1a2a] shadow-xl">
      {/* Área superior - Logo e Badge */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-5 flex items-center justify-between">
        <img 
          src="/images/muran-logo-portal.png" 
          alt="Muran - Soluções em Marketing Digital" 
          className="h-8 md:h-10"
        />
        
        {/* Badge "Dados em tempo real" */}
        <div className="flex items-center gap-2 text-white/90 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs md:text-sm font-medium">Dados em tempo real</span>
        </div>
      </div>
      
      {/* Separador sutil */}
      <div className="border-t border-white/10" />
      
      {/* Área de navegação - Nome do cliente e Abas */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Nome do cliente */}
          {clientName && (
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 bg-muran-primary rounded-full" />
              <span className="text-white/90 font-medium text-lg">
                {clientName}
              </span>
            </div>
          )}
          
          {/* Abas de navegação elegantes */}
          {showTabs && (
            <nav className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = viewMode === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => tab.enabled && onViewModeChange(tab.id)}
                    disabled={!tab.enabled}
                    className={cn(
                      "relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200",
                      "flex items-center gap-2",
                      isActive
                        ? "bg-white text-[#321e32] shadow-md"
                        : "text-white/70 hover:text-white hover:bg-white/10",
                      !tab.enabled && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
