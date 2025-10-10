import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const EVENT_TYPES = [
  { value: 'PageView', label: 'Visualização de Página', description: 'Visitantes de qualquer página do site' },
  { value: 'ViewContent', label: 'Visualização de Conteúdo', description: 'Pessoas que visualizaram produtos/conteúdo' },
  { value: 'AddToCart', label: 'Adicionar ao Carrinho', description: 'Pessoas que adicionaram produtos ao carrinho' },
  { value: 'InitiateCheckout', label: 'Iniciar Checkout', description: 'Pessoas que iniciaram o processo de compra' },
  { value: 'Purchase', label: 'Compra', description: 'Pessoas que concluíram uma compra' },
];

interface SiteAudienceFormProps {
  selectedEvents: string[];
  onChange: (events: string[]) => void;
  disabled?: boolean;
}

const SiteAudienceForm = ({ selectedEvents, onChange, disabled = false }: SiteAudienceFormProps) => {
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

  const allSelected = selectedEvents.length === EVENT_TYPES.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Selecione os eventos de site</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={disabled || allSelected}
          >
            Selecionar Todos
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDeselectAll}
            disabled={disabled || selectedEvents.length === 0}
          >
            Desmarcar Todos
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {EVENT_TYPES.map((event) => (
          <div key={event.value} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
            <Checkbox
              id={`event-${event.value}`}
              checked={selectedEvents.includes(event.value)}
              onCheckedChange={() => handleEventToggle(event.value)}
              disabled={disabled}
              className="mt-0.5"
            />
            <div className="flex-1">
              <label
                htmlFor={`event-${event.value}`}
                className="text-sm font-medium leading-none cursor-pointer block"
              >
                {event.label}
              </label>
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
