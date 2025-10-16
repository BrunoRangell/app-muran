import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useMetaInstagramAccounts } from "@/hooks/useMetaInstagramAccounts";
import { useMetaFacebookPages } from "@/hooks/useMetaFacebookPages";

interface EngagementAudienceFormProps {
  accountId: string;
  selectedTypes: string[];
  instagramAccountId?: string;
  facebookPageId?: string;
  onChange: (data: { 
    engagementTypes: string[];
    instagramAccountId?: string;
    facebookPageId?: string;
  }) => void;
  disabled?: boolean;
}

const EngagementAudienceForm = ({ 
  accountId, 
  selectedTypes, 
  instagramAccountId, 
  facebookPageId, 
  onChange,
  disabled = false 
}: EngagementAudienceFormProps) => {
  const { data: instagramAccounts, isLoading: isLoadingInstagram } = useMetaInstagramAccounts(accountId);
  const { data: facebookPages, isLoading: isLoadingPages } = useMetaFacebookPages(accountId);

  console.log('[EngagementAudienceForm] 📊 Estado atual:', {
    accountId,
    instagramAccounts,
    facebookPages,
    isLoadingInstagram,
    isLoadingPages
  });

  const handleTypeToggle = (type: string) => {
    let newTypes: string[];
    if (selectedTypes.includes(type)) {
      newTypes = selectedTypes.filter(t => t !== type);
      // Limpar o ID associado quando desmarcar
      if (type === 'instagram') {
        onChange({ engagementTypes: newTypes, instagramAccountId: undefined, facebookPageId });
      } else {
        onChange({ engagementTypes: newTypes, instagramAccountId, facebookPageId: undefined });
      }
    } else {
      newTypes = [...selectedTypes, type];
      onChange({ engagementTypes: newTypes, instagramAccountId, facebookPageId });
    }
  };

  return (
    <div className="space-y-4">
      <Label>Selecione os tipos de engajamento</Label>
      
      <div className="space-y-4">
        {/* Instagram */}
        <div className="p-4 rounded-lg border hover:bg-accent/50 transition-colors">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="engagement-instagram"
              checked={selectedTypes.includes('instagram')}
              onCheckedChange={() => handleTypeToggle('instagram')}
              disabled={disabled}
              className="mt-0.5"
            />
            <div className="flex-1 space-y-2">
              <label
                htmlFor="engagement-instagram"
                className="text-sm font-medium leading-none cursor-pointer block"
              >
                Instagram
              </label>
              <p className="text-xs text-muted-foreground">
                Pessoas que interagiram com seu perfil do Instagram
              </p>
              
              {selectedTypes.includes('instagram') && (
                <div className="mt-3 pl-3 border-l-2 border-primary/30 animate-in fade-in slide-in-from-top-2">
                  <Label htmlFor="instagram-account" className="text-xs">
                    Perfil do Instagram <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={instagramAccountId}
                    onValueChange={(value) => onChange({ engagementTypes: selectedTypes, instagramAccountId: value, facebookPageId })}
                    disabled={disabled}
                  >
                    <SelectTrigger id="instagram-account" className="mt-1.5">
                      <SelectValue placeholder={isLoadingInstagram ? "Carregando perfis..." : "Selecione um perfil"} />
                    </SelectTrigger>
                    <SelectContent>
              {instagramAccounts && instagramAccounts.length > 0 ? (
                instagramAccounts.map((account: any) => (
                  <SelectItem key={account.id} value={account.id}>
                    @{account.username} ({account.name})
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-sm text-muted-foreground">
                  Nenhum perfil Instagram encontrado
                </div>
              )}
            </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Facebook */}
        <div className="p-4 rounded-lg border hover:bg-accent/50 transition-colors">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="engagement-facebook"
              checked={selectedTypes.includes('facebook')}
              onCheckedChange={() => handleTypeToggle('facebook')}
              disabled={disabled}
              className="mt-0.5"
            />
            <div className="flex-1 space-y-2">
              <label
                htmlFor="engagement-facebook"
                className="text-sm font-medium leading-none cursor-pointer block"
              >
                Facebook
              </label>
              <p className="text-xs text-muted-foreground">
                Pessoas que interagiram com sua página do Facebook
              </p>
              
              {selectedTypes.includes('facebook') && (
                <div className="mt-3 pl-3 border-l-2 border-primary/30 animate-in fade-in slide-in-from-top-2">
                  <Label htmlFor="facebook-page" className="text-xs">
                    Página do Facebook <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={facebookPageId}
                    onValueChange={(value) => onChange({ engagementTypes: selectedTypes, instagramAccountId, facebookPageId: value })}
                    disabled={disabled}
                  >
                    <SelectTrigger id="facebook-page" className="mt-1.5">
                      <SelectValue placeholder={isLoadingPages ? "Carregando páginas..." : "Selecione uma página"} />
                    </SelectTrigger>
            <SelectContent>
              {facebookPages && facebookPages.length > 0 ? (
                facebookPages.map((page: any) => (
                  <SelectItem key={page.id} value={page.id}>
                    {page.name}
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-sm text-muted-foreground">
                  Nenhuma página Facebook encontrada
                </div>
              )}
            </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngagementAudienceForm;
