
import { ClientReviewHistory } from "../../ClientReviewHistory";

interface HistoryTabProps {
  clientId: string;
}

export const HistoryTab = ({ clientId }: HistoryTabProps) => {
  return (
    <div className="space-y-4">
      <ClientReviewHistory clientId={clientId} />
    </div>
  );
};
