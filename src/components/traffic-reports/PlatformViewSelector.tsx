import { cn } from "@/lib/utils";

type ViewMode = 'combined' | 'meta' | 'google';

interface PlatformViewSelectorProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  hasMetaData?: boolean;
  hasGoogleData?: boolean;
}

export function PlatformViewSelector({
  viewMode,
  onViewModeChange,
  hasMetaData = true,
  hasGoogleData = true
}: PlatformViewSelectorProps) {
  const tabs = [
    { 
      id: 'combined' as ViewMode, 
      label: 'Visão Geral', 
      icon: '📊',
      color: 'from-muran-primary to-muran-primary-glow',
      enabled: true
    },
    { 
      id: 'meta' as ViewMode, 
      label: 'Meta Ads', 
      icon: '📘',
      color: 'from-blue-500 to-blue-600',
      enabled: hasMetaData
    },
    { 
      id: 'google' as ViewMode, 
      label: 'Google Ads', 
      icon: '📗',
      color: 'from-yellow-500 to-yellow-600',
      enabled: hasGoogleData
    }
  ];

  return (
    <div className="glass-card p-2 rounded-xl inline-flex gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => tab.enabled && onViewModeChange(tab.id)}
          disabled={!tab.enabled}
          className={cn(
            "relative px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300",
            "flex items-center gap-2",
            viewMode === tab.id
              ? `bg-gradient-to-r ${tab.color} text-white shadow-lg shadow-primary/20`
              : "hover:bg-muted/50 text-muted-foreground hover:text-foreground",
            !tab.enabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <span className="text-base">{tab.icon}</span>
          <span>{tab.label}</span>
          
          {viewMode === tab.id && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
              <div className={cn(
                "w-0 h-0 border-l-8 border-r-8 border-t-8",
                "border-l-transparent border-r-transparent",
                tab.id === 'combined' && "border-t-muran-primary",
                tab.id === 'meta' && "border-t-blue-500",
                tab.id === 'google' && "border-t-yellow-500"
              )} />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
