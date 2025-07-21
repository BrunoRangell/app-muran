
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { CampaignDetail } from "./types/enhanced-types";

interface CampaignDetailsTooltipProps {
  campaigns: CampaignDetail[];
  children: React.ReactNode;
  title: string;
  platform: string;
}

export function CampaignDetailsTooltip({ campaigns, children, title, platform }: CampaignDetailsTooltipProps) {
  if (!campaigns || campaigns.length === 0) {
    return <div>{children}</div>;
  }

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString('pt-BR');
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent className="max-w-md p-4">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm mb-2">{title} - {platform}</h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {campaigns.map((campaign, index) => (
              <div key={`${campaign.id}-${index}`} className="text-xs border-b border-gray-200 pb-1 last:border-b-0">
                <div className="font-medium truncate" title={campaign.name}>
                  {campaign.name}
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{formatCurrency(campaign.cost)}</span>
                  <span>{formatNumber(campaign.impressions)} impr.</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
            Total: {campaigns.length} campanha{campaigns.length !== 1 ? 's' : ''}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
