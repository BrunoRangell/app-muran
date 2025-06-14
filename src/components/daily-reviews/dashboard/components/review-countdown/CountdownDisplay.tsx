
import { formatTime } from "./utils";

interface CountdownDisplayProps {
  secondsToNext: number;
  onManualRun: () => void;
  isRunning: boolean;
  isLoading: boolean;
}

export function CountdownDisplay({ secondsToNext, onManualRun, isRunning, isLoading }: CountdownDisplayProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 justify-between">
        <span className="text-xs text-gray-500">Próxima revisão:</span>
        <span className="font-mono text-xs font-medium">{formatTime(secondsToNext)}</span>
      </div>
      
      <button 
        onClick={onManualRun} 
        disabled={isRunning || isLoading}
        className="flex items-center justify-center gap-1 text-xs py-1 px-2 rounded bg-[#ff6e00] hover:bg-[#e66300] text-white disabled:opacity-50"
      >
        {isRunning || isLoading ? (
          <>
            <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
            Executando...
          </>
        ) : (
          <>
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Executar Agora
          </>
        )}
      </button>
    </div>
  );
}
