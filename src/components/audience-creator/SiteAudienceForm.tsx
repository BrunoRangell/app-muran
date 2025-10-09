import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useMetaPixels } from "@/hooks/useMetaPixels";
import { SiteAudienceData } from "@/pages/AudienceCreator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const EVENT_TYPES = [
  { value: 'PageView', label: 'PageView - Visualização de página' },
  { value: 'ViewContent', label: 'ViewContent - Visualização de conteúdo' },
  { value: 'AddToCart', label: 'AddToCart - Adicionar ao carrinho' },
  { value: 'InitiateCheckout', label: 'InitiateCheckout - Iniciar checkout' },
  { value: 'Purchase', label: 'Purchase - Compra' },
];

const RETENTION_PERIODS = 6; // 7D, 14D, 30D, 60D, 90D, 180D

interface SiteAudienceFormProps {
  data: SiteAudienceData;
  onChange: (data: SiteAudienceData) => void;
}

const SiteAudienceForm = ({ data, onChange }: SiteAudienceFormProps) => {
  const { data: pixels, isLoading: loadingPixels } = useMetaPixels(data.accountId);

  const handleEventToggle = (eventValue: string, checked: boolean) => {
    if (checked) {
      onChange({ ...data, eventTypes: [...data.eventTypes, eventValue] });
    } else {
      onChange({ ...data, eventTypes: data.eventTypes.filter(e => e !== eventValue) });
    }
  };

  const totalAudiences = data.eventTypes.length * RETENTION_PERIODS;

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="site-account">ID da Conta de Anúncios *</Label>
        <Input
          id="site-account"
          placeholder="Digite o ID da conta (ex: 123456789)"
          value={data.accountId}
          onChange={(e) => onChange({ ...data, accountId: e.target.value, pixelId: '', eventTypes: [] })}
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
        </>
      )}

      {data.pixelId && (
        <>
          <Separator />
          <div>
            <Label className="mb-3 block">Eventos *</Label>
            <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
              {EVENT_TYPES.map((event) => (
                <div key={event.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`site-${event.value}`}
                    checked={data.eventTypes.includes(event.value)}
                    onCheckedChange={(checked) => handleEventToggle(event.value, checked as boolean)}
                  />
                  <label
                    htmlFor={`site-${event.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {event.label}
                  </label>
                </div>
              ))}
            </div>
            {data.eventTypes.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  📊 Serão criados: {totalAudiences} públicos
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ({data.eventTypes.length} eventos × {RETENTION_PERIODS} períodos)
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SiteAudienceForm;
