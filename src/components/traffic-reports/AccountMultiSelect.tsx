import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface Account {
  id: string;
  account_name: string;
  platform: string;
  is_primary: boolean;
}

interface AccountMultiSelectProps {
  accounts: Account[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function AccountMultiSelect({
  accounts,
  selectedIds,
  onChange,
  disabled
}: AccountMultiSelectProps) {
  const handleToggle = (accountId: string) => {
    if (selectedIds.includes(accountId)) {
      onChange(selectedIds.filter(id => id !== accountId));
    } else {
      onChange([...selectedIds, accountId]);
    }
  };

  const handleSelectAll = () => {
    onChange(accounts.map(a => a.id));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const getDisplayText = () => {
    if (selectedIds.length === 0) return "Selecione contas";
    if (selectedIds.length === 1) {
      const account = accounts.find(a => a.id === selectedIds[0]);
      return account?.account_name || "1 conta selecionada";
    }
    return `${selectedIds.length} contas selecionadas`;
  };

  const getPlatformIcon = (platform: string) => {
    return platform === 'meta' ? '🔵' : '🟢';
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
          disabled={disabled || accounts.length === 0}
        >
          <span className="truncate">{getDisplayText()}</span>
          <span className="ml-2">▼</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Contas de Anúncios</h4>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-7 text-xs"
              >
                Todas
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-7 text-xs"
              >
                Limpar
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {accounts.map((account) => (
              <div
                key={account.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors",
                  selectedIds.includes(account.id) && "bg-accent border-muran-primary"
                )}
                onClick={() => handleToggle(account.id)}
              >
                <Checkbox
                  checked={selectedIds.includes(account.id)}
                  onCheckedChange={() => handleToggle(account.id)}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {account.account_name}
                    </span>
                    {account.is_primary && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muran-primary/10 text-muran-primary">
                        Principal
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs">{getPlatformIcon(account.platform)}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {account.platform === 'meta' ? 'Meta Ads' : 'Google Ads'}
                    </span>
                  </div>
                </div>

                {selectedIds.includes(account.id) && (
                  <Check className="h-4 w-4 text-muran-primary" />
                )}
              </div>
            ))}
          </div>

          {accounts.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma conta disponível
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
