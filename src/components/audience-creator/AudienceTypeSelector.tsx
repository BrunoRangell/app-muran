import { Globe, MessageSquare } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AudienceType } from "@/pages/AudienceCreator";

interface AudienceTypeSelectorProps {
  selectedType: AudienceType;
  onSelectType: (type: AudienceType) => void;
}

const AudienceTypeSelector = ({ selectedType, onSelectType }: AudienceTypeSelectorProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Tipo de Público</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Escolha o tipo de público que deseja criar
        </p>
      </div>

      <RadioGroup
        value={selectedType || ''}
        onValueChange={(value) => onSelectType(value as AudienceType)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
              selectedType === 'site'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => onSelectType('site')}
          >
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="site" id="site" className="mt-1" />
              <div className="flex-1">
                <Label
                  htmlFor="site"
                  className="flex items-center gap-2 cursor-pointer font-semibold"
                >
                  <Globe className="w-5 h-5 text-primary" />
                  Públicos de Site
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Crie públicos baseados em eventos do pixel (PageView, Purchase, etc)
                </p>
              </div>
            </div>
          </div>

          <div
            className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
              selectedType === 'engagement'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => onSelectType('engagement')}
          >
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="engagement" id="engagement" className="mt-1" />
              <div className="flex-1">
                <Label
                  htmlFor="engagement"
                  className="flex items-center gap-2 cursor-pointer font-semibold"
                >
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Públicos de Engajamento
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Crie públicos de pessoas que interagiram no Instagram ou Facebook
                </p>
              </div>
            </div>
          </div>
        </div>
      </RadioGroup>
    </div>
  );
};

export default AudienceTypeSelector;
