import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useMetaAdAccounts } from "@/hooks/useMetaAdAccounts";
import { useMetaPixels } from "@/hooks/useMetaPixels";
import { SiteAudienceData } from "@/pages/AudienceCreator";
import { Skeleton } from "@/components/ui/skeleton";

const EVENT_TYPES = [
  { value: 'PageView', label: 'PageView - Visualização de página' },
  { value: 'ViewContent', label: 'ViewContent - Visualização de conteúdo' },
  { value: 'AddToCart', label: 'AddToCart - Adicionar ao carrinho' },
  { value: 'InitiateCheckout', label: 'InitiateCheckout - Iniciar checkout' },
  { value: 'Purchase', label: 'Purchase - Compra' },
];

interface SiteAudienceFormProps {
  data: SiteAudienceData;
  onChange: (data: SiteAudienceData) => void;
}

const SiteAudienceForm = ({ data, onChange }: SiteAudienceFormProps) => {
  const { data: accounts, isLoading: loadingAccounts } = useMetaAdAccounts();
  const { data: pixels, isLoading: loadingPixels } = useMetaPixels(data.accountId);

  const handleEventToggle = (eventValue: string, checked: boolean) => {
    if (checked) {
      onChange({ ...data, eventTypes: [...data.eventTypes, eventValue] });
    } else {
      onChange({ ...data, eventTypes: data.eventTypes.filter(e => e !== eventValue) });
    }
  };

  const handleSelectAll = () => {
    if (data.eventTypes.length === EVENT_TYPES.length) {
      onChange({ ...data, eventTypes: [] });
    } else {
      onChange({ ...data, eventTypes: EVENT_TYPES.map(e => e.value) });
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
              onValueChange={(value) => onChange({ ...data, accountId: value, pixelId: '', eventTypes: [] })}
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
            <Label htmlFor="pixel">Pixel *</Label>
            {loadingPixels ? (
              <Skeleton className="h-10 w-full mt-2" />
            ) : (
              <Select
                value={data.pixelId}
                onValueChange={(value) => onChange({ ...data, pixelId: value })}
              >
                <SelectTrigger id="pixel" className="mt-2">
                  <SelectValue placeholder="Selecione um pixel" />
                </SelectTrigger>
                <SelectContent>
                  {pixels?.map((pixel: any) => (
                    <SelectItem key={pixel.id} value={pixel.id}>
                      {pixel.name} ({pixel.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {data.pixelId && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Eventos *</Label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sm text-primary hover:underline"
              >
                {data.eventTypes.length === EVENT_TYPES.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            </div>
            <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
              {EVENT_TYPES.map((event) => (
                <div key={event.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={event.value}
                    checked={data.eventTypes.includes(event.value)}
                    onCheckedChange={(checked) => handleEventToggle(event.value, checked as boolean)}
                  />
                  <label
                    htmlFor={event.value}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {event.label}
                  </label>
                </div>
              ))}
            </div>
            {data.eventTypes.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {data.eventTypes.length} público(s) será(ão) criado(s)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SiteAudienceForm;
