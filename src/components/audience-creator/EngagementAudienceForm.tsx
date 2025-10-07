import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useMetaAdAccounts } from "@/hooks/useMetaAdAccounts";
import { useMetaInstagramAccounts } from "@/hooks/useMetaInstagramAccounts";
import { useMetaFacebookPages } from "@/hooks/useMetaFacebookPages";
import { EngagementAudienceData } from "@/pages/AudienceCreator";
import { Skeleton } from "@/components/ui/skeleton";

interface EngagementAudienceFormProps {
  data: EngagementAudienceData;
  onChange: (data: EngagementAudienceData) => void;
}

const EngagementAudienceForm = ({ data, onChange }: EngagementAudienceFormProps) => {
  const { data: accounts, isLoading: loadingAccounts } = useMetaAdAccounts();
  const { data: instagramAccounts, isLoading: loadingInstagram } = useMetaInstagramAccounts(data.accountId);
  const { data: facebookPages, isLoading: loadingFacebook } = useMetaFacebookPages(data.accountId);

  const handleEngagementTypeToggle = (type: string, checked: boolean) => {
    if (checked) {
      onChange({ ...data, engagementTypes: [...data.engagementTypes, type] });
    } else {
      const newTypes = data.engagementTypes.filter(t => t !== type);
      const newData: any = { ...data, engagementTypes: newTypes };
      
      if (type === 'instagram') {
        delete newData.instagramAccountId;
      }
      if (type === 'facebook') {
        delete newData.facebookPageId;
      }
      
      onChange(newData);
    }
  };

  return (
    <div className="space-y-6 mt-6">
      <Separator />
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="account">Conta de Anúncios *</Label>
          {loadingAccounts ? (
            <Skeleton className="h-10 w-full mt-2" />
          ) : (
            <Select
              value={data.accountId}
              onValueChange={(value) => onChange({ accountId: value, engagementTypes: [] })}
            >
              <SelectTrigger id="account" className="mt-2">
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((account: any) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} ({account.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {data.accountId && (
          <div>
            <Label className="mb-3 block">Tipos de Engajamento *</Label>
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="instagram"
                    checked={data.engagementTypes.includes('instagram')}
                    onCheckedChange={(checked) => handleEngagementTypeToggle('instagram', checked as boolean)}
                  />
                  <label
                    htmlFor="instagram"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Instagram Business Profile
                  </label>
                </div>

                {data.engagementTypes.includes('instagram') && (
                  <div className="ml-6">
                    {loadingInstagram ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select
                        value={data.instagramAccountId}
                        onValueChange={(value) => onChange({ ...data, instagramAccountId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um perfil Instagram" />
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

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="facebook"
                    checked={data.engagementTypes.includes('facebook')}
                    onCheckedChange={(checked) => handleEngagementTypeToggle('facebook', checked as boolean)}
                  />
                  <label
                    htmlFor="facebook"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Página do Facebook
                  </label>
                </div>

                {data.engagementTypes.includes('facebook') && (
                  <div className="ml-6">
                    {loadingFacebook ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select
                        value={data.facebookPageId}
                        onValueChange={(value) => onChange({ ...data, facebookPageId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma página Facebook" />
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
              <p className="text-sm text-muted-foreground mt-2">
                {data.engagementTypes.length} público(s) será(ão) criado(s)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EngagementAudienceForm;
