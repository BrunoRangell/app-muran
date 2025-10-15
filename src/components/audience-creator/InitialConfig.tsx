import { Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface InitialConfigProps {
  accountId: string;
  onAccountIdChange: (value: string) => void;
}

const InitialConfig = ({ accountId, onAccountIdChange }: InitialConfigProps) => {

  return (
    <Card className="p-6 border-2 hover:border-primary/50 transition-colors">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-primary/10">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Configuração Inicial</h2>
          <p className="text-sm text-muted-foreground">
            Digite o ID da sua conta de anúncios Meta
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
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Ex: 1234567890"
            value={accountId}
            onChange={(e) => {
              // Aceita apenas números
              const value = e.target.value.replace(/\D/g, '');
              onAccountIdChange(value);
            }}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Digite apenas os números do ID da conta (sem o prefixo "act_")
          </p>
        </div>
      </div>
    </Card>
  );
};

export default InitialConfig;
