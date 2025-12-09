import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Trash2, Loader2, ImageIcon, Link } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ClientLogoUploadProps {
  clientId: string;
  clientName: string;
  currentLogoUrl?: string | null;
}

export const ClientLogoUpload = ({ 
  clientId, 
  clientName, 
  currentLogoUrl 
}: ClientLogoUploadProps) => {
  const queryClient = useQueryClient();
  const [logoUrl, setLogoUrl] = useState(currentLogoUrl || '');
  const [uploadTab, setUploadTab] = useState<'url' | 'file'>('url');

  // Mutation para atualizar logo_url
  const updateLogo = useMutation({
    mutationFn: async (newLogoUrl: string | null) => {
      const { error } = await supabase
        .from('clients')
        .update({ logo_url: newLogoUrl })
        .eq('id', clientId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-clients'] });
      toast.success('Logo atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar logo: ' + error.message);
    }
  });

  const handleSaveUrl = () => {
    if (!logoUrl.trim()) {
      toast.error('Insira uma URL válida');
      return;
    }
    updateLogo.mutate(logoUrl.trim());
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    updateLogo.mutate(null);
  };

  const getClientInitial = () => {
    return clientName.charAt(0).toUpperCase();
  };

  return (
    <div className="bg-card rounded-xl border p-6 max-w-2xl">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Logo do Cliente</h2>
          <p className="text-sm text-muted-foreground">
            A logo será exibida no cabeçalho do portal do cliente
          </p>
        </div>

        {/* Preview da logo atual */}
        <div className="flex items-start gap-6">
          <div className="shrink-0">
            <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
            <div className="h-24 w-24 rounded-xl bg-gradient-to-br from-muran-primary/20 to-muran-primary/10 flex items-center justify-center overflow-hidden border-2 border-dashed border-border">
              {currentLogoUrl || logoUrl ? (
                <img 
                  src={logoUrl || currentLogoUrl || ''} 
                  alt={clientName}
                  className="h-full w-full object-contain p-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="text-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50 mx-auto mb-1" />
                  <span className="text-xs text-muted-foreground">Sem logo</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <Tabs value={uploadTab} onValueChange={(v) => setUploadTab(v as 'url' | 'file')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url" className="gap-2">
                  <Link className="h-4 w-4" />
                  URL
                </TabsTrigger>
                <TabsTrigger value="file" className="gap-2" disabled>
                  <Upload className="h-4 w-4" />
                  Upload (em breve)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="logo-url">URL da Logo</Label>
                  <Input
                    id="logo-url"
                    placeholder="https://exemplo.com/logo.png"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use uma URL pública de imagem (PNG, JPG, SVG)
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveUrl}
                    disabled={updateLogo.isPending || !logoUrl.trim()}
                    className="gap-2"
                  >
                    {updateLogo.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Salvar Logo
                  </Button>

                  {(currentLogoUrl || logoUrl) && (
                    <Button 
                      variant="outline"
                      onClick={handleRemoveLogo}
                      disabled={updateLogo.isPending}
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remover
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="file">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Upload de arquivos estará disponível em breve
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Preview como aparecerá no portal */}
        <div className="pt-4 border-t">
          <Label className="text-xs text-muted-foreground mb-3 block">
            Como aparecerá no portal do cliente:
          </Label>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden border">
                {logoUrl || currentLogoUrl ? (
                  <img 
                    src={logoUrl || currentLogoUrl || ''} 
                    alt={clientName}
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <span className="text-2xl font-bold bg-gradient-to-br from-muran-primary to-muran-primary/70 bg-clip-text text-transparent">
                    {getClientInitial()}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{clientName}</h3>
                <p className="text-sm text-muted-foreground">Relatório de Performance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
