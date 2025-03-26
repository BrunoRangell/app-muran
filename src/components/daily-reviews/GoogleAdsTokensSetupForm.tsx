
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

export const GoogleAdsTokensSetupForm = () => {
  const [tokens, setTokens] = useState<Record<string, string>>({
    google_ads_access_token: "",
    google_ads_refresh_token: "",
    google_ads_client_id: "",
    google_ads_client_secret: "",
  });
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Buscar tokens existentes
  const { data: existingTokens, isLoading, refetch } = useQuery({
    queryKey: ["google-api-tokens"],
    queryFn: async () => {
      console.log("Buscando tokens Google Ads existentes...");
      const { data, error } = await supabase
        .from("api_tokens")
        .select("name, value")
        .or('name.eq.google_ads_access_token,name.eq.google_ads_refresh_token,name.eq.google_ads_client_id,name.eq.google_ads_client_secret');
      
      if (error) {
        console.error("Erro ao buscar tokens Google Ads:", error);
        throw error;
      }
      
      console.log("Tokens Google Ads encontrados:", data);
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
      console.log("Atualizando estado com tokens Google Ads existentes:", tokenData);
      setTokens(tokenData);
    }
  }, [existingTokens]);

  // Mutation para salvar tokens
  const saveTokensMutation = useMutation({
    mutationFn: async (tokenData: Record<string, string>) => {
      console.log("Iniciando salvamento dos tokens Google Ads:", tokenData);
      
      if (Object.values(tokenData).some(value => !value || value.trim() === "")) {
        throw new Error("Todos os campos de token são obrigatórios");
      }
      
      const promises = Object.entries(tokenData).map(async ([name, value]) => {
        // Primeiro verificamos se o token já existe
        const { data: existingToken, error: queryError } = await supabase
          .from("api_tokens")
          .select("*")
          .eq("name", name)
          .maybeSingle();
        
        if (queryError) {
          console.error(`Erro ao consultar token ${name} existente:`, queryError);
          throw new Error(`Erro ao verificar token ${name} existente: ${queryError.message}`);
        }
        
        let response;
        
        if (existingToken) {
          // Se o token já existe, atualizamos
          console.log(`Atualizando token ${name} existente`);
          response = await supabase
            .from("api_tokens")
            .update({ value: value })
            .eq("name", name);
        } else {
          // Se não existe, criamos um novo
          console.log(`Criando novo token ${name}`);
          response = await supabase
            .from("api_tokens")
            .insert([{ 
              name: name, 
              value: value,
              description: `Token de acesso para a API do Google Ads: ${name}`
            }]);
        }

        if (response.error) {
          console.error(`Erro na operação de salvamento do token ${name}:`, response.error);
          throw new Error(response.error.message);
        }
      });
      
      await Promise.all(promises);
      console.log("Todos os tokens Google Ads salvos com sucesso");
      
      // Após salvar, recarregamos os tokens
      await refetch();
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Tokens salvos",
        description: "Os tokens do Google Ads foram configurados com sucesso.",
      });
      setOpen(false);
    },
    onError: (error) => {
      console.error("Erro detalhado ao salvar tokens Google Ads:", error);
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
    console.log("Salvando tokens Google Ads com a mutation:", tokens);
    saveTokensMutation.mutate(tokens);
  };

  const handleQuickSetup = () => {
    try {
      // Você pode preencher estes valores com tokens temporários para teste
      const testTokens = {
        google_ads_access_token: "TEST_ACCESS_TOKEN",
        google_ads_refresh_token: "TEST_REFRESH_TOKEN",
        google_ads_client_id: "TEST_CLIENT_ID",
        google_ads_client_secret: "TEST_CLIENT_SECRET"
      };
      
      console.log("Configurando tokens de teste Google Ads:", testTokens);
      setTokens(testTokens);
      
      toast({
        title: "Tokens preenchidos",
        description: "Os campos foram preenchidos com valores de teste. Clique em 'Salvar' para confirmar.",
      });
    } catch (error) {
      console.error("Erro ao configurar tokens de teste:", error);
      toast({
        title: "Erro ao preencher tokens",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const hasEmptyRequiredTokens = () => {
    return Object.values(tokens).some(value => !value);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Configurar Google Ads
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Configurações de API Google Ads</SheetTitle>
          <SheetDescription>
            Configure os tokens necessários para integração com Google Ads.
          </SheetDescription>
        </SheetHeader>

        {hasEmptyRequiredTokens() && (
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Tokens ausentes</AlertTitle>
            <AlertDescription>
              Todos os tokens do Google Ads são necessários para o funcionamento da integração.
              Por favor, preencha todos os campos ou use o botão de configuração rápida.
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
              <Label htmlFor="google_ads_client_id">Client ID</Label>
              <Input
                id="google_ads_client_id"
                placeholder="Google Ads Client ID"
                value={tokens.google_ads_client_id || ""}
                onChange={(e) => handleInputChange("google_ads_client_id", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="google_ads_client_secret">Client Secret</Label>
              <Input
                id="google_ads_client_secret"
                type="password"
                placeholder="Google Ads Client Secret"
                value={tokens.google_ads_client_secret || ""}
                onChange={(e) => handleInputChange("google_ads_client_secret", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="google_ads_access_token">Access Token</Label>
              <Textarea
                id="google_ads_access_token"
                placeholder="Google Ads Access Token"
                value={tokens.google_ads_access_token || ""}
                onChange={(e) => handleInputChange("google_ads_access_token", e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="google_ads_refresh_token">Refresh Token</Label>
              <Textarea
                id="google_ads_refresh_token"
                placeholder="Google Ads Refresh Token"
                value={tokens.google_ads_refresh_token || ""}
                onChange={(e) => handleInputChange("google_ads_refresh_token", e.target.value)}
                rows={3}
              />
              <p className="text-xs text-gray-500">
                Estes tokens são necessários para autenticação OAuth com a API do Google Ads.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                className="w-full"
                onClick={handleQuickSetup}
                variant="secondary"
              >
                Preencher com Dados de Teste
              </Button>
              
              <Button
                className="w-full"
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
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
