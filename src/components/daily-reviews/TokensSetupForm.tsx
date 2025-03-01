
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AlertCircle, Save, Loader, Settings } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const TokensSetupForm = () => {
  const [tokens, setTokens] = useState<Record<string, string>>({
    meta_access_token: "",
  });
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Buscar tokens existentes
  const { data: existingTokens, isLoading } = useQuery({
    queryKey: ["api-tokens"],
    queryFn: async () => {
      const { data, error } = await supabase.from("api_tokens").select("name, value");
      if (error) throw error;
      return data;
    },
  });

  // Atualizar o estado quando os tokens forem carregados
  useEffect(() => {
    if (existingTokens) {
      const tokenData: Record<string, string> = {};
      existingTokens.forEach((token) => {
        tokenData[token.name] = token.value;
      });
      setTokens(tokenData);
    }
  }, [existingTokens]);

  // Mutation para salvar tokens
  const saveTokensMutation = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke("daily-budget-reviews", {
        body: {
          method: "saveTokens",
          tokens: Object.entries(tokens).map(([name, value]) => ({ name, value })),
        },
      });

      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Token salvo",
        description: "As configurações de API foram atualizadas com sucesso.",
      });
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar token",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (name: string, value: string) => {
    setTokens((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    saveTokensMutation.mutate();
  };

  const hasEmptyRequiredTokens = () => {
    return !tokens.meta_access_token;
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Configurar API
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Configurações de API</SheetTitle>
          <SheetDescription>
            Configure o token necessário para integração com Meta Ads.
          </SheetDescription>
        </SheetHeader>

        {hasEmptyRequiredTokens() && (
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Token ausente</AlertTitle>
            <AlertDescription>
              O token do Meta Ads é necessário para o funcionamento da integração.
              Por favor, preencha o campo.
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="space-y-4">
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-10 bg-gray-100 rounded w-full"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meta_access_token">Token do Meta Ads</Label>
              <Textarea
                id="meta_access_token"
                placeholder="Meta Ads Access Token"
                value={tokens.meta_access_token || ""}
                onChange={(e) => handleInputChange("meta_access_token", e.target.value)}
                rows={4}
              />
              <p className="text-xs text-gray-500">
                Este token é único para cada usuário e pode ser obtido no Business Manager do Meta Ads.
              </p>
            </div>

            <Button
              className="w-full mt-6"
              onClick={handleSave}
              disabled={saveTokensMutation.isPending}
            >
              {saveTokensMutation.isPending ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar configuração
                </>
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
