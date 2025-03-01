
import { Info } from "lucide-react";

interface DataSourceProps {
  analysis: any;
}

export function DataSource({ analysis }: DataSourceProps) {
  if (!analysis) return null;
  
  return (
    <div className="text-sm text-gray-500 flex items-center gap-1 mt-2">
      <Info size={14} />
      <span>
        Dados obtidos diretamente da API do Meta Ads em tempo real.
      </span>
    </div>
  );
}
