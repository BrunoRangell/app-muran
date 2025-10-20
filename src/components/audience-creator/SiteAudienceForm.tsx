import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info } from "lucide-react";
import { useMetaPixels } from "@/hooks/useMetaPixels";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SiteAudienceFormProps {
  accountId: string;
  pixelId: string;
  selectedEvents: string[];
  onPixelChange: (pixelId: string) => void;
  onChange: (events: string[]) => void;
  disabled?: boolean;
}

const EVENT_TYPES = [
  { 
    value: 'PageView', 
    label: 'Visualização de Página',
    description: 'Pessoas que visitaram qualquer página do site' 
  },
  { 
    value: 'ViewContent', 
    label: 'Visualização de Conteúdo',
    description: 'Pessoas que visualizaram produtos ou conteúdo específico' 
  },
  { 
    value: 'AddToCart', 
    label: 'Adicionar ao Carrinho',
    description: 'Pessoas que adicionaram produtos ao carrinho' 
  },
  { 
    value: 'InitiateCheckout', 
    label: 'Iniciar Checkout',
    description: 'Pessoas que iniciaram o processo de compra' 
  },
  { 
    value: 'Purchase', 
    label: 'Compra',
    description: 'Pessoas que concluíram uma compra' 
  },
];

const SiteAudienceForm = ({ accountId, pixelId, selectedEvents, onPixelChange, onChange, disabled = false }: SiteAudienceFormProps) => {
  const { data: pixels, isLoading: isLoadingPixels } = useMetaPixels(accountId);

  const handleEventToggle = (eventType: string) => {
    if (selectedEvents.includes(eventType)) {
      onChange(selectedEvents.filter(e => e !== eventType));
    } else {
      onChange([...selectedEvents, eventType]);
    }
  };

  const handleSelectAll = () => {
    onChange(EVENT_TYPES.map(e => e.value));
  };

  const handleDeselectAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pixelId">
          Meta Pixel <span className="text-destructive">*</span>
        </Label>
        <Select value={pixelId} onValueChange={onPixelChange}>
          <SelectTrigger id="pixelId">
            <SelectValue placeholder={isLoadingPixels ? "Carregando pixels..." : "Selecione um pixel"} />
          </SelectTrigger>
          <SelectContent>
            {pixels?.map((pixel: any) => (
              <SelectItem key={pixel.id} value={pixel.id}>
                {pixel.name} ({pixel.id})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Necessário para criar públicos de eventos de site
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          disabled={disabled}
        >
          Selecionar Todos
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDeselectAll}
          disabled={disabled}
        >
          Desmarcar Todos
        </Button>
      </div>

      <div className="space-y-3">
        {EVENT_TYPES.map((event) => (
          <div 
            key={event.value} 
            className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
          >
            <Checkbox
              id={`event-${event.value}`}
              checked={selectedEvents.includes(event.value)}
              onCheckedChange={() => handleEventToggle(event.value)}
              disabled={disabled}
              className="mt-0.5"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <label
                  htmlFor={`event-${event.value}`}
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  {event.label}
                </label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{event.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {event.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SiteAudienceForm;
