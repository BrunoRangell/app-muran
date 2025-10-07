import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AudienceTypeSelector from "@/components/audience-creator/AudienceTypeSelector";
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
  const [audienceType, setAudienceType] = useState<AudienceType>(null);
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

  const handleCreate = () => {
    if (!audienceType) {
      toast.error("Selecione o tipo de público");
      return;
    }

    const payload: any = {
      audienceType
    };

    if (audienceType === 'site') {
      if (!siteData.accountId || !siteData.pixelId || siteData.eventTypes.length === 0) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }
      Object.assign(payload, siteData);
    } else {
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
      Object.assign(payload, engagementData);
    }

    setShowProgress(true);

    createAudiences(payload, {
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
    setAudienceType(null);
    setSiteData({ accountId: '', pixelId: '', eventTypes: [] });
    setEngagementData({ accountId: '', engagementTypes: [] });
  };

  if (showResult && result) {
    return <AudienceResult result={result} onCreateNew={handleCreateNew} />;
  }

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

        <Card className="p-6">
          <AudienceTypeSelector
            selectedType={audienceType}
            onSelectType={setAudienceType}
          />

          {audienceType === 'site' && (
            <SiteAudienceForm
              data={siteData}
              onChange={setSiteData}
            />
          )}

          {audienceType === 'engagement' && (
            <EngagementAudienceForm
              data={engagementData}
              onChange={setEngagementData}
            />
          )}

          {audienceType && (
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleCreate}
                disabled={isPending}
                size="lg"
                className="min-w-[200px]"
              >
                {isPending ? "Criando..." : "Criar Públicos"}
              </Button>
            </div>
          )}
        </Card>
      </div>

      <AudienceProgress isOpen={showProgress} />
    </div>
  );
};

export default AudienceCreator;
