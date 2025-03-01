
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
    clickup_token: "",
    space_id: "",
    google_developer_token: "",
    google_oauth2_token: "",
    manager_customer_id: "",
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
        title: "Tokens salvos",
        description: "As configurações de API foram atualizadas com sucesso.",
      });
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar tokens",
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
    return (
      !tokens.meta_access_token ||
      !tokens.clickup_token ||
      !tokens.space_id ||
      !tokens.google_developer_token ||
      !tokens.google_oauth2_token ||
      !tokens.manager_customer_id
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Configurar APIs
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Configurações de API</SheetTitle>
          <SheetDescription>
            Configure os tokens necessários para integração com Meta Ads, Google Ads e ClickUp.
          </SheetDescription>
        </SheetHeader>

        {hasEmptyRequiredTokens() && (
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Tokens ausentes</AlertTitle>
            <AlertDescription>
              Alguns tokens necessários para o funcionamento das integrações estão ausentes.
              Por favor, preencha todos os campos.
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="space-y-2 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-10 bg-gray-100 rounded w-full"></div>
                </div>
              ))}
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
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="google_developer_token">Token de Desenvolvedor do Google Ads</Label>
              <Input
                id="google_developer_token"
                placeholder="Developer Token"
                value={tokens.google_developer_token || ""}
                onChange={(e) => handleInputChange("google_developer_token", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="google_oauth2_token">Token OAuth2 do Google Ads</Label>
              <Textarea
                id="google_oauth2_token"
                placeholder="OAuth2 Access Token"
                value={tokens.google_oauth2_token || ""}
                onChange={(e) => handleInputChange("google_oauth2_token", e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager_customer_id">ID do Cliente Gerenciador</Label>
              <Input
                id="manager_customer_id"
                placeholder="Ex: 1234567890"
                value={tokens.manager_customer_id || ""}
                onChange={(e) => handleInputChange("manager_customer_id", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clickup_token">Token do ClickUp</Label>
              <Input
                id="clickup_token"
                placeholder="ClickUp API Token"
                value={tokens.clickup_token || ""}
                onChange={(e) => handleInputChange("clickup_token", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="space_id">ID do Espaço no ClickUp</Label>
              <Input
                id="space_id"
                placeholder="Ex: 12345678"
                value={tokens.space_id || ""}
                onChange={(e) => handleInputChange("space_id", e.target.value)}
              />
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
                  Salvar configurações
                </>
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
