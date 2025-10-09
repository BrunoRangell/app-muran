import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Globe, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SiteAudienceForm from "@/components/audience-creator/SiteAudienceForm";
import EngagementAudienceForm from "@/components/audience-creator/EngagementAudienceForm";
import AudienceProgress from "@/components/audience-creator/AudienceProgress";
import AudienceResult from "@/components/audience-creator/AudienceResult";
import { useCreateAudiences } from "@/hooks/useCreateAudiences";
import { toast } from "sonner";

export type AudienceType = 'site' | 'engagement' | null;

export interface SiteAudienceData {
  accountId: string;
  pixelId: string;
  eventTypes: string[];
}

export interface EngagementAudienceData {
  accountId: string;
  engagementTypes: string[];
  instagramAccountId?: string;
  facebookPageId?: string;
}

const AudienceCreator = () => {
  const navigate = useNavigate();
  const [siteData, setSiteData] = useState<SiteAudienceData>({
    accountId: '',
    pixelId: '',
    eventTypes: []
  });
  const [engagementData, setEngagementData] = useState<EngagementAudienceData>({
    accountId: '',
    engagementTypes: []
  });
  const [showProgress, setShowProgress] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<any>(null);

  const { mutate: createAudiences, isPending } = useCreateAudiences();

  const handleCreateSite = () => {
    if (!siteData.accountId || !siteData.pixelId || siteData.eventTypes.length === 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setShowProgress(true);

    createAudiences({ audienceType: 'site', ...siteData }, {
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

  const handleCreateEngagement = () => {
    if (!engagementData.accountId || engagementData.engagementTypes.length === 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (engagementData.engagementTypes.includes('instagram') && !engagementData.instagramAccountId) {
      toast.error("Selecione um perfil do Instagram");
      return;
    }
    if (engagementData.engagementTypes.includes('facebook') && !engagementData.facebookPageId) {
      toast.error("Selecione uma página do Facebook");
      return;
    }

    setShowProgress(true);

    createAudiences({ audienceType: 'engagement', ...engagementData }, {
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
    setSiteData({ accountId: '', pixelId: '', eventTypes: [] });
    setEngagementData({ accountId: '', engagementTypes: [] });
  };

  if (showResult && result) {
    return <AudienceResult result={result} onCreateNew={handleCreateNew} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-7xl mx-auto px-4 py-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Painel de Públicos de Site */}
          <Card className="p-6 border-2 hover:border-primary/50 transition-colors">
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
              data={siteData}
              onChange={setSiteData}
            />

            <Button
              onClick={handleCreateSite}
              disabled={isPending || !siteData.accountId || !siteData.pixelId || siteData.eventTypes.length === 0}
              size="lg"
              className="w-full mt-6"
            >
              {isPending ? "Criando..." : "Criar Públicos de Site"}
            </Button>
          </Card>

          {/* Painel de Públicos de Engajamento */}
          <Card className="p-6 border-2 hover:border-primary/50 transition-colors">
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
              data={engagementData}
              onChange={setEngagementData}
            />

            <Button
              onClick={handleCreateEngagement}
              disabled={isPending || !engagementData.accountId || engagementData.engagementTypes.length === 0}
              size="lg"
              className="w-full mt-6"
            >
              {isPending ? "Criando..." : "Criar Públicos de Engajamento"}
            </Button>
          </Card>
        </div>
      </div>

      <AudienceProgress isOpen={showProgress} />
    </div>
  );
};

export default AudienceCreator;
