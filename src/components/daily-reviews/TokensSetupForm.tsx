
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
  const { data: existingTokens, isLoading, refetch } = useQuery({
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
      // Primeiro verificamos se o token já existe
      const { data: existingToken } = await supabase
        .from("api_tokens")
        .select("*")
        .eq("name", "meta_access_token")
        .maybeSingle();

      let response;
      
      if (existingToken) {
        // Se o token já existe, atualizamos
        response = await supabase
          .from("api_tokens")
          .update({ value: tokens.meta_access_token })
          .eq("name", "meta_access_token");
      } else {
        // Se não existe, criamos um novo
        response = await supabase
          .from("api_tokens")
          .insert([{ 
            name: "meta_access_token", 
            value: tokens.meta_access_token,
            description: "Token de acesso para a API do Meta Ads"
          }]);
      }

      if (response.error) throw new Error(response.error.message);
      
      // Após salvar, recarregamos os tokens
      await refetch();
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Token salvo",
        description: "O token do Meta Ads foi configurado com sucesso.",
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

  const handleSaveToken = async () => {
    // Configure o token fornecido pelo usuário
    const metaToken = "EAAFcZAOf159MBO8Wd0qZBmTbEj4pXSuDeUV8egjwaZBxQZCB73V634CdZBYN92k4pUidagEzJujlLIrZCrn9UpN28SvzapBHoixmT8ErWcMZAx3eaLxwlfAHhC2ZBw5gZBTeR8IBMQDxq71GBJqV6wJ6UphDmz0MMM5GumqnaXWmFCBZAjF4qc8FZBseV9u";
    
    setTokens(prev => ({
      ...prev,
      meta_access_token: metaToken
    }));
    
    // Simulamos um click no botão salvar
    setTimeout(() => {
      saveTokensMutation.mutate();
    }, 100);
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
              Por favor, preencha o campo ou use o botão de configuração rápida.
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

            <div className="flex flex-col gap-3">
              <Button
                className="w-full"
                onClick={handleSaveToken}
                variant="secondary"
              >
                Configurar Token Rapidamente
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
