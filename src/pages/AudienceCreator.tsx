import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Globe, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import InitialConfig from "@/components/audience-creator/InitialConfig";
import SiteAudienceForm from "@/components/audience-creator/SiteAudienceForm";
import EngagementAudienceForm from "@/components/audience-creator/EngagementAudienceForm";
import CreationSummary from "@/components/audience-creator/CreationSummary";
import AudienceProgress from "@/components/audience-creator/AudienceProgress";
import AudienceResult from "@/components/audience-creator/AudienceResult";
import { useCreateAudiences } from "@/hooks/useCreateAudiences";
import { toast } from "sonner";

interface UnifiedFormData {
  accountId: string;
  pixelId: string;
  siteEvents: string[];
  engagementTypes: string[];
  instagramAccountId?: string;
  facebookPageId?: string;
}

const AudienceCreator = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<UnifiedFormData>({
    accountId: '',
    pixelId: '',
    siteEvents: [],
    engagementTypes: [],
    instagramAccountId: undefined,
    facebookPageId: undefined
  });
  const [showProgress, setShowProgress] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<any>(null);

  const { mutate: createAudiences, isPending } = useCreateAudiences();

  const handleCreateAudiences = () => {
    // Validações
    if (!formData.accountId || formData.accountId.length < 10) {
      toast.error("Digite um Account ID válido");
      return;
    }

    const hasSiteAudiences = formData.siteEvents.length > 0;
    const hasEngagementAudiences = formData.engagementTypes.length > 0;

    if (!hasSiteAudiences && !hasEngagementAudiences) {
      toast.error("Selecione pelo menos um tipo de público para criar");
      return;
    }

    // Validar Pixel se houver eventos de site
    if (hasSiteAudiences && !formData.pixelId) {
      toast.error("Selecione um Pixel para criar públicos de site");
      return;
    }

    // Validar perfil Instagram
    if (formData.engagementTypes.includes('instagram') && !formData.instagramAccountId) {
      toast.error("Selecione um perfil do Instagram");
      return;
    }

    // Validar página Facebook
    if (formData.engagementTypes.includes('facebook') && !formData.facebookPageId) {
      toast.error("Selecione uma página do Facebook");
      return;
    }

    setShowProgress(true);

    createAudiences(formData, {
      onSuccess: (data) => {
        setShowProgress(false);
        setResult(data);
        setShowResult(true);
        
        if (data.created > 0) {
          toast.success(`${data.created} público(s) criado(s) com sucesso!`);
        }
        if (data.failed > 0) {
          toast.error(`${data.failed} público(s) falharam`);
        }
      },
      onError: (error: any) => {
        setShowProgress(false);
        toast.error(error.message || "Erro ao criar públicos");
      }
    });
  };

  const handleCreateNew = () => {
    setShowResult(false);
    setResult(null);
    setFormData({
      accountId: '',
      pixelId: '',
      siteEvents: [],
      engagementTypes: [],
      instagramAccountId: undefined,
      facebookPageId: undefined
    });
  };

  if (showResult && result) {
    return <AudienceResult result={result} onCreateNew={handleCreateNew} />;
  }

  const isAccountIdValid = formData.accountId.length >= 10;
  const canCreateAudiences = 
    isAccountIdValid && 
    (formData.siteEvents.length > 0 || formData.engagementTypes.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Criador de Públicos Meta Ads</h1>
          <p className="text-muted-foreground">
            Crie públicos personalizados de forma rápida e automatizada
          </p>
        </div>

        <div className="space-y-6">
          {/* Configuração Inicial */}
          <InitialConfig
            accountId={formData.accountId}
            onAccountIdChange={(value) => {
              // Invalidar cache quando trocar de conta
              queryClient.invalidateQueries({ queryKey: ['meta-instagram-accounts'] });
              queryClient.invalidateQueries({ queryKey: ['meta-facebook-pages'] });
              queryClient.invalidateQueries({ queryKey: ['meta-pixels'] });
              setFormData({ 
                ...formData, 
                accountId: value, 
                pixelId: '', 
                siteEvents: [], 
                engagementTypes: [], 
                instagramAccountId: undefined, 
                facebookPageId: undefined 
              });
            }}
          />

          {/* Públicos de Site */}
          {isAccountIdValid && (
            <Card className="p-6 border-2 hover:border-primary/50 transition-colors animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Públicos de Site</h2>
                  <p className="text-sm text-muted-foreground">
                    Baseado em eventos do pixel
                  </p>
                </div>
              </div>

              <SiteAudienceForm
                accountId={formData.accountId}
                pixelId={formData.pixelId}
                selectedEvents={formData.siteEvents}
                onPixelChange={(value) => setFormData({ ...formData, pixelId: value })}
                onChange={(events) => setFormData({ ...formData, siteEvents: events })}
                disabled={!formData.pixelId}
              />
            </Card>
          )}

          {/* Públicos de Engajamento */}
          {isAccountIdValid && (
            <Card className="p-6 border-2 hover:border-primary/50 transition-colors animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Públicos de Engajamento</h2>
                  <p className="text-sm text-muted-foreground">
                    Baseado em interações sociais
                  </p>
                </div>
              </div>

              <EngagementAudienceForm
                accountId={formData.accountId}
                selectedTypes={formData.engagementTypes}
                instagramAccountId={formData.instagramAccountId}
                facebookPageId={formData.facebookPageId}
                onChange={({ engagementTypes, instagramAccountId, facebookPageId }) => 
                  setFormData({ ...formData, engagementTypes, instagramAccountId, facebookPageId })
                }
              />
            </Card>
          )}

          {/* Resumo */}
          {isAccountIdValid && (
            <CreationSummary
              siteEventsCount={formData.siteEvents.length}
              engagementTypesCount={formData.engagementTypes.length}
            />
          )}

          {/* Botão de Criação */}
          {isAccountIdValid && (
            <Button
              onClick={handleCreateAudiences}
              disabled={isPending || !canCreateAudiences}
              size="lg"
              className="w-full"
            >
              {isPending ? "Criando Públicos..." : "Criar Todos os Públicos"}
            </Button>
          )}
        </div>
      </div>

      <AudienceProgress isOpen={showProgress} />
    </div>
  );
};

export default AudienceCreator;
