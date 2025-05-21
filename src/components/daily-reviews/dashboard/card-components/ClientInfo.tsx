
import { formatDateInBrasiliaTz } from "../../summary/utils";

interface ClientInfoProps {
  companyName: string;
  lastReviewDate: string | null;
}

export const ClientInfo = ({ companyName, lastReviewDate }: ClientInfoProps) => {
  return (
    <div className="flex-1 p-3">
      <div className="font-medium text-muran-dark flex items-center gap-1">
        {companyName}
      </div>
      <div className="text-xs text-gray-500">
        {lastReviewDate ? formatDateInBrasiliaTz(new Date(lastReviewDate), "dd/MM 'às' HH:mm") : "Sem revisão"}
      </div>
    </div>
  );
};
