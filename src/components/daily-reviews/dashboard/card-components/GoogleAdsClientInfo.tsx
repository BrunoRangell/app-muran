
import { formatDateInBrasiliaTz } from "../../summary/utils";
import { ClientWithReview } from "../../hooks/types/reviewTypes";

interface GoogleAdsClientInfoProps {
  client: ClientWithReview;
  formattedLastReviewDate: string;
  hasGoogleAccounts: boolean;
  accountsLabel: string;
  usingCustomBudget: boolean;
}

export const GoogleAdsClientInfo = ({
  client,
  formattedLastReviewDate,
  hasGoogleAccounts,
  accountsLabel,
  usingCustomBudget
}: GoogleAdsClientInfoProps) => {
  return (
    <div>
      <h3 className="font-semibold text-gray-800 text-sm line-clamp-1 mb-1">
        {client.company_name}
      </h3>
      <div className="flex items-center">
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
          {formattedLastReviewDate}
        </span>
        {hasGoogleAccounts && (
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded ml-1">
            {accountsLabel}
          </span>
        )}
        {usingCustomBudget && (
          <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded ml-1 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
            </svg>
            Orç. Personalizado
          </span>
        )}
      </div>
    </div>
  );
};
