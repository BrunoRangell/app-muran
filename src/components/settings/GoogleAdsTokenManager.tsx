import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Eye, EyeOff } from "lucide-react";
import { TeamMemberCheck } from "@/components/auth/TeamMemberCheck";

interface TokenField {
  name: string;
  label: string;
  description: string;
  placeholder: string;
}

const TOKEN_FIELDS: TokenField[] = [
  {
    name: 'google_ads_access_token',
    label: 'Token de Acesso',
    description: 'OAuth2 Access Token do Google Ads',
    placeholder: 'ya29.a0...'
  },
  {
    name: 'google_ads_refresh_token',
    label: 'Refresh Token',
    description: 'OAuth2 Refresh Token para renovação automática',
    placeholder: '1//0g...'
  },
  {
    name: 'google_ads_client_id',
    label: 'Client ID',
    description: 'OAuth2 Client ID do Google Cloud Console',
    placeholder: '123456789-abc.apps.googleusercontent.com'
  },
  {
    name: 'google_ads_client_secret',
    label: 'Client Secret',
    description: 'OAuth2 Client Secret do Google Cloud Console',
    placeholder: 'GOCSPX-...'
  },
  {
    name: 'google_ads_developer_token',
    label: 'Developer Token',
    description: 'Token de desenvolvedor da conta Google Ads MCC',
    placeholder: 'abc123...'
  },
  {
    name: 'google_ads_manager_id',
    label: 'ID da Conta Gerenciadora',
    description: 'ID da conta MCC (sem hífens)',
    placeholder: '1234567890'
  }
];

export const GoogleAdsTokenManager = () => {
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      const { data, error } = await supabase
        .from('api_tokens')
        .select('name, value')
        .in('name', TOKEN_FIELDS.map(f => f.name));

      if (error) throw error;

      const tokenMap: Record<string, string> = {};
      data?.forEach(token => {
        tokenMap[token.name] = token.value;
      });

      setTokens(tokenMap);
    } catch (error) {
      console.error('Erro ao carregar tokens:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os tokens",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveToken = async (tokenName: string, value: string) => {
    setIsSaving(true);
    try {
      // Verificar se o token já existe
      const { data: existingToken } = await supabase
        .from('api_tokens')
        .select('id')
        .eq('name', tokenName)
        .single();

      if (existingToken) {
        // Atualizar token existente
        const { error } = await supabase
          .from('api_tokens')
          .update({ 
            value, 
            updated_at: new Date().toISOString() 
          })
          .eq('name', tokenName);

        if (error) throw error;
      } else {
        // Inserir novo token
        const tokenField = TOKEN_FIELDS.find(f => f.name === tokenName);
        const { error } = await supabase
          .from('api_tokens')
          .insert({
            name: tokenName,
            value,
            description: tokenField?.description || null
          });

        if (error) throw error;
      }

      setTokens(prev => ({ ...prev, [tokenName]: value }));

      toast({
        title: "Sucesso",
        description: `${TOKEN_FIELDS.find(f => f.name === tokenName)?.label} salvo com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao salvar token:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o token",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      for (const [name, value] of Object.entries(tokens)) {
        if (value && value.trim()) {
          await saveToken(name, value);
        }
      }
      
      toast({
        title: "Sucesso",
        description: "Todos os tokens foram salvos",
      });
    } catch (error) {
      console.error('Erro ao salvar tokens:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar alguns tokens",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muran-primary" />
      </div>
    );
  }

  return (
    <TeamMemberCheck requireAdmin={true}>
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Tokens do Google Ads</CardTitle>
          <CardDescription>
            Configure os tokens necessários para integração com a API do Google Ads
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {TOKEN_FIELDS.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>{field.label}</Label>
              <p className="text-sm text-muted-foreground">{field.description}</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id={field.name}
                    type={showTokens[field.name] ? "text" : "password"}
                    placeholder={field.placeholder}
                    value={tokens[field.name] || ""}
                    onChange={(e) => setTokens(prev => ({ ...prev, [field.name]: e.target.value }))}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowTokens(prev => ({ ...prev, [field.name]: !prev[field.name] }))}
                  >
                    {showTokens[field.name] ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSaveAll}
              disabled={isSaving}
              className="bg-muran-primary hover:bg-muran-primary/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Todos os Tokens
                </>
              )}
            </Button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-amber-800">
              <strong>⚠️ Importante:</strong> Estes tokens são sensíveis e devem ser mantidos em segredo. 
              Apenas administradores podem visualizar e editar estes valores.
            </p>
          </div>
        </CardContent>
      </Card>
    </TeamMemberCheck>
  );
};
