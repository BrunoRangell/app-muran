
import { ClientLatestReview } from "../../ClientLatestReview";

interface LatestReviewTabProps {
  clientId: string;
}

export const LatestReviewTab = ({ clientId }: LatestReviewTabProps) => {
  return (
    <div className="space-y-4">
      <ClientLatestReview clientId={clientId} />
    </div>
  );
};
