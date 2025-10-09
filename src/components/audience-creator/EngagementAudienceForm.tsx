import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useMetaInstagramAccounts } from "@/hooks/useMetaInstagramAccounts";
import { useMetaFacebookPages } from "@/hooks/useMetaFacebookPages";
import { EngagementAudienceData } from "@/pages/AudienceCreator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const RETENTION_PERIODS = 8; // 7D, 14D, 30D, 60D, 90D, 180D, 365D, 730D

interface EngagementAudienceFormProps {
  data: EngagementAudienceData;
  onChange: (data: EngagementAudienceData) => void;
}

const EngagementAudienceForm = ({ data, onChange }: EngagementAudienceFormProps) => {
  const { data: instagramAccounts, isLoading: loadingInstagram } = useMetaInstagramAccounts(data.accountId);
  const { data: facebookPages, isLoading: loadingFacebook } = useMetaFacebookPages(data.accountId);

  const handleTypeToggle = (type: string, checked: boolean) => {
    if (checked) {
      onChange({ ...data, engagementTypes: [...data.engagementTypes, type] });
    } else {
      const newTypes = data.engagementTypes.filter(t => t !== type);
      const updates: any = { engagementTypes: newTypes };
      
      if (type === 'instagram') {
        updates.instagramAccountId = undefined;
      }
      if (type === 'facebook') {
        updates.facebookPageId = undefined;
      }
      
      onChange({ ...data, ...updates });
    }
  };

  const totalAudiences = data.engagementTypes.length * RETENTION_PERIODS;

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="engagement-account">ID da Conta de Anúncios *</Label>
        <Input
          id="engagement-account"
          placeholder="Digite o ID da conta (ex: 123456789)"
          value={data.accountId}
          onChange={(e) => onChange({ 
            accountId: e.target.value, 
            engagementTypes: [],
            instagramAccountId: undefined,
            facebookPageId: undefined
          })}
          className="mt-2"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Insira apenas os números, sem o prefixo "act_"
        </p>
      </div>

      {data.accountId && data.accountId.length >= 10 && (
        <>
          <Separator />
          <div>
            <Label className="mb-3 block">Tipos de Engajamento *</Label>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-instagram"
                    checked={data.engagementTypes.includes('instagram')}
                    onCheckedChange={(checked) => handleTypeToggle('instagram', checked as boolean)}
                  />
                  <label
                    htmlFor="type-instagram"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Instagram Business Profile
                  </label>
                </div>

                {data.engagementTypes.includes('instagram') && (
                  <div className="ml-6 mt-2">
                    <Label htmlFor="instagram-account" className="text-xs">Perfil do Instagram</Label>
                    {loadingInstagram ? (
                      <Skeleton className="h-10 w-full mt-1" />
                    ) : (
                      <Select
                        value={data.instagramAccountId}
                        onValueChange={(value) => onChange({ ...data, instagramAccountId: value })}
                      >
                        <SelectTrigger id="instagram-account" className="mt-1">
                          <SelectValue placeholder="Selecione um perfil" />
                        </SelectTrigger>
                        <SelectContent>
                          {instagramAccounts?.map((account: any) => (
                            <SelectItem key={account.id} value={account.id}>
                              @{account.username} ({account.name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-facebook"
                    checked={data.engagementTypes.includes('facebook')}
                    onCheckedChange={(checked) => handleTypeToggle('facebook', checked as boolean)}
                  />
                  <label
                    htmlFor="type-facebook"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Página do Facebook
                  </label>
                </div>

                {data.engagementTypes.includes('facebook') && (
                  <div className="ml-6 mt-2">
                    <Label htmlFor="facebook-page" className="text-xs">Página do Facebook</Label>
                    {loadingFacebook ? (
                      <Skeleton className="h-10 w-full mt-1" />
                    ) : (
                      <Select
                        value={data.facebookPageId}
                        onValueChange={(value) => onChange({ ...data, facebookPageId: value })}
                      >
                        <SelectTrigger id="facebook-page" className="mt-1">
                          <SelectValue placeholder="Selecione uma página" />
                        </SelectTrigger>
                        <SelectContent>
                          {facebookPages?.map((page: any) => (
                            <SelectItem key={page.id} value={page.id}>
                              {page.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </div>
            </div>

            {data.engagementTypes.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  📊 Serão criados: {totalAudiences} públicos
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ({data.engagementTypes.length} tipos × {RETENTION_PERIODS} períodos)
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default EngagementAudienceForm;
