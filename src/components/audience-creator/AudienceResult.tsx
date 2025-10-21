import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Users, Globe, Instagram, Facebook, ExternalLink, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buildAudiencesUrl } from "@/utils/platformUrls";

interface AudienceResultProps {
  result: {
    created: number;
    failed: number;
    audiences: Array<{
      name: string;
      status: 'success' | 'failed';
      audienceId?: string;
      error?: string;
    }>;
  };
  accountId: string;
  onCreateNew: () => void;
}

interface AudienceCategoryCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  audiences: Array<{
    name: string;
    status: 'success' | 'failed';
    audienceId?: string;
    error?: string;
  }>;
  colorClass: string;
}

const AudienceCategoryCard = ({ title, icon: Icon, audiences, colorClass }: AudienceCategoryCardProps) => {
  if (audiences.length === 0) return null;

  const successCount = audiences.filter(a => a.status === 'success').length;
  const failedCount = audiences.filter(a => a.status === 'failed').length;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">
            {successCount} criado{successCount !== 1 ? 's' : ''} com sucesso
            {failedCount > 0 && ` • ${failedCount} falhou${failedCount !== 1 ? 'ram' : ''}`}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {audiences.map((audience, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              audience.status === 'success'
                ? 'border-green-200 bg-green-50 dark:bg-green-950/20'
                : 'border-red-200 bg-red-50 dark:bg-red-950/20'
            }`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {audience.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{audience.name}</div>
                {audience.audienceId && (
                  <div className="text-xs text-muted-foreground">
                    ID: {audience.audienceId}
                  </div>
                )}
                {audience.error && (
                  <div className="text-xs text-red-600 mt-1">
                    {audience.error}
                  </div>
                )}
              </div>
            </div>
            <Badge
              variant={audience.status === 'success' ? 'default' : 'destructive'}
              className="ml-2 flex-shrink-0 text-xs"
            >
              {audience.status === 'success' ? 'Sucesso' : 'Falhou'}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
};

const AudienceResult = ({ result, accountId, onCreateNew }: AudienceResultProps) => {
  const { created = 0, failed = 0, audiences = [] } = result || {};
  const total = created + failed;

  // Agrupar públicos por tipo
  const siteAudiences = audiences.filter(a => a.name.includes('[SITE]'));
  const instagramAudiences = audiences.filter(a => a.name.includes('[IG]'));
  const facebookAudiences = audiences.filter(a => a.name.includes('[FB]'));

  const audiencesUrl = buildAudiencesUrl(accountId);

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Públicos Criados</h1>
          <p className="text-sm text-muted-foreground">
            Processo de criação concluído
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <div className="px-3 py-1 rounded-md border bg-card">
            <span className="font-medium">{total}</span>
            <span className="text-muted-foreground ml-1">processados</span>
          </div>
          <div className="px-3 py-1 rounded-md border bg-green-500/5 border-green-200">
            <span className="font-medium text-green-600">{created}</span>
            <span className="text-muted-foreground ml-1">sucesso</span>
          </div>
          {failed > 0 && (
            <div className="px-3 py-1 rounded-md border bg-red-500/5 border-red-200">
              <span className="font-medium text-red-600">{failed}</span>
              <span className="text-muted-foreground ml-1">falhas</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <AudienceCategoryCard
          title="Públicos de Site"
          icon={Globe}
          audiences={siteAudiences}
          colorClass="bg-blue-500"
        />

        <AudienceCategoryCard
          title="Públicos do Instagram"
          icon={Instagram}
          audiences={instagramAudiences}
          colorClass="bg-gradient-to-br from-purple-500 to-pink-500"
        />

        <AudienceCategoryCard
          title="Públicos do Facebook"
          icon={Facebook}
          audiences={facebookAudiences}
          colorClass="bg-blue-600"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={() => window.open(audiencesUrl, '_blank')}
          className="group"
        >
          Ver Públicos no Meta Ads
          <ExternalLink className="ml-2 w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Button>
        <Button 
          onClick={onCreateNew} 
          variant="outline"
          className="group"
        >
          <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Criar Novos Públicos
        </Button>
      </div>
    </div>
  );
};

export default AudienceResult;
