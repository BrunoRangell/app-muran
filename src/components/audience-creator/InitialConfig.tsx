import { Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMetaPixels } from "@/hooks/useMetaPixels";

interface InitialConfigProps {
  accountId: string;
  pixelId: string;
  onAccountIdChange: (value: string) => void;
  onPixelIdChange: (value: string) => void;
}

const InitialConfig = ({ accountId, pixelId, onAccountIdChange, onPixelIdChange }: InitialConfigProps) => {
  const { data: pixels, isLoading: isLoadingPixels } = useMetaPixels(accountId);

  const isAccountIdValid = accountId.length >= 10;

  return (
    <Card className="p-6 border-2 hover:border-primary/50 transition-colors">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-primary/10">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Configuração Inicial</h2>
          <p className="text-sm text-muted-foreground">
            Configure sua conta de anúncios e pixel Meta
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="accountId">
            ID da Conta de Anúncios <span className="text-destructive">*</span>
          </Label>
          <Input
            id="accountId"
            type="text"
            placeholder="Ex: 1234567890 ou act_1234567890"
            value={accountId}
            onChange={(e) => onAccountIdChange(e.target.value)}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Digite apenas os números ou o ID completo com prefixo "act_"
          </p>
        </div>

        {isAccountIdValid && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <Label htmlFor="pixelId">
              Meta Pixel <span className="text-destructive">*</span>
            </Label>
            <Select value={pixelId} onValueChange={onPixelIdChange}>
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
              Necessário apenas para criar públicos de eventos de site
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default InitialConfig;
