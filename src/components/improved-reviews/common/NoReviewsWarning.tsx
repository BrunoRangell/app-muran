import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { formatDateForDisplay, getTodayInBrazil } from "@/utils/brazilTimezone";

interface NoReviewsWarningProps {
  platform: "meta" | "google";
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function NoReviewsWarning({ platform, onRefresh, isRefreshing }: NoReviewsWarningProps) {
  const platformName = platform === "meta" ? "Meta Ads" : "Google Ads";
  const today = getTodayInBrazil();
  const todayFormatted = formatDateForDisplay(today);

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-700">
          <AlertTriangle className="h-5 w-5" />
          Nenhuma revisão encontrada para hoje
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-orange-600">
          <p>
            Não foram encontradas revisões de <strong>{platformName}</strong> para{" "}
            <strong>{todayFormatted}</strong>.
          </p>
          <p className="mt-2">
            Execute a atualização para gerar os dados mais recentes e criar as revisões do dia.
          </p>
        </div>
        
        {onRefresh && (
          <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="bg-[#ff6e00] hover:bg-[#e55a00] text-white"
            size="sm"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar e Gerar Revisões
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}