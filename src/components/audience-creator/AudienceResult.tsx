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
    <Card className="p-6 mb-4">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground">
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Públicos Criados!</h1>
          <p className="text-muted-foreground">
            Processo de criação concluído. Veja os detalhes abaixo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 text-center">
            <div className="text-4xl font-bold mb-2">{total}</div>
            <div className="text-sm text-muted-foreground font-medium">Total Processado</div>
          </Card>
          <Card className="p-6 text-center bg-green-500/5 border-green-200">
            <div className="text-4xl font-bold text-green-600 mb-2">{created}</div>
            <div className="text-sm text-muted-foreground font-medium">Criados com Sucesso</div>
          </Card>
          <Card className="p-6 text-center bg-red-500/5 border-red-200">
            <div className="text-4xl font-bold text-red-600 mb-2">{failed}</div>
            <div className="text-sm text-muted-foreground font-medium">Falharam</div>
          </Card>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Detalhes por Categoria</h2>
          
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

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={() => window.open(audiencesUrl, '_blank')}
            size="lg" 
            className="group"
          >
            Ver Públicos no Meta Ads
            <ExternalLink className="ml-2 w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Button>
          <Button 
            onClick={onCreateNew} 
            size="lg" 
            variant="outline"
            className="group"
          >
            <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Criar Novos Públicos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AudienceResult;
