
import { CardHeader as UICardHeader, CardTitle } from "@/components/ui/card";

interface CardHeaderProps {
  client: any;
  accountIdField: string;
  hasPlatformConfig: boolean;
  platform?: 'meta' | 'google';
}

export const CardHeader = ({
  client,
  accountIdField,
  hasPlatformConfig,
  platform = 'meta'
}: CardHeaderProps) => {
  const platformName = platform === 'meta' ? 'Meta Ads' : 'Google Ads';
  const accountId = client[accountIdField];
  
  return (
    <UICardHeader className="pb-2">
      <CardTitle className="text-lg font-semibold flex flex-col">
        {client.company_name}
        {hasPlatformConfig && (
          <span className="text-xs font-normal text-gray-500 mt-1">
            ID {platformName}: {accountId}
          </span>
        )}
      </CardTitle>
    </UICardHeader>
  );
};
