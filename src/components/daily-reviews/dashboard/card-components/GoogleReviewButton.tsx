
import { Loader } from "lucide-react";

interface GoogleReviewButtonProps {
  onReviewClick: () => void;
  isProcessing: boolean;
  inactive: boolean;
}

export const GoogleReviewButton = ({
  onReviewClick,
  isProcessing,
  inactive
}: GoogleReviewButtonProps) => {
  return (
    <button
      onClick={onReviewClick}
      disabled={isProcessing || inactive}
      className={`px-3 py-1 rounded text-xs font-medium ${
        inactive
          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
          : isProcessing
          ? 'bg-blue-100 text-blue-700 cursor-wait'
          : 'bg-muran-primary text-white hover:bg-muran-primary/90'
      }`}
    >
      {isProcessing ? (
        <div className="flex items-center">
          <Loader className="animate-spin mr-1 h-3 w-3" />
          <span>Analisando</span>
        </div>
      ) : inactive ? (
        'Sem Conta'
      ) : (
        'Analisar'
      )}
    </button>
  );
};
