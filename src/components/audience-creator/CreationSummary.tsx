import { BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CreationSummaryProps {
  siteEventsCount: number;
  engagementTypesCount: number;
}

const RETENTION_PERIODS = 6;
const ENGAGEMENT_PERIODS = 8;

const CreationSummary = ({ siteEventsCount, engagementTypesCount }: CreationSummaryProps) => {
  const siteAudiencesTotal = siteEventsCount * RETENTION_PERIODS;
  const engagementAudiencesTotal = engagementTypesCount * ENGAGEMENT_PERIODS;
  const total = siteAudiencesTotal + engagementAudiencesTotal;

  if (total === 0) {
    return null;
  }

  return (
    <Card className="p-6 border-2 border-primary/30 bg-primary/5">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <BarChart3 className="w-6 h-6 text-primary" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-lg font-bold">Resumo da Criação</h3>
            <Badge variant="default" className="text-base px-3 py-1">
              {total} público{total !== 1 ? 's' : ''} no total
            </Badge>
          </div>

          <div className="space-y-2">
            {siteAudiencesTotal > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>
                  <strong>{siteAudiencesTotal}</strong> públicos de site 
                  <span className="text-muted-foreground ml-1">
                    ({siteEventsCount} evento{siteEventsCount !== 1 ? 's' : ''} × {RETENTION_PERIODS} períodos)
                  </span>
                </span>
              </div>
            )}

            {engagementAudiencesTotal > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span>
                  <strong>{engagementAudiencesTotal}</strong> públicos de engajamento 
                  <span className="text-muted-foreground ml-1">
                    ({engagementTypesCount} tipo{engagementTypesCount !== 1 ? 's' : ''} × {ENGAGEMENT_PERIODS} períodos)
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CreationSummary;
