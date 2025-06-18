
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { IgnoreWarningDialog } from "./IgnoreWarningDialog";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface IgnoreWarningButtonProps {
  clientId: string;
  clientName: string;
  onWarningIgnored: () => void;
}

export function IgnoreWarningButton({ 
  clientId, 
  clientName, 
  onWarningIgnored 
}: IgnoreWarningButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleIgnoreWarning = async () => {
    setIsLoading(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Buscar a revisão mais recente do cliente
      const { data: latestReview, error: fetchError } = await supabase
        .from('google_ads_reviews')
        .select('id')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar revisão:', fetchError);
        throw new Error('Erro ao buscar revisão do cliente');
      }

      if (!latestReview) {
        throw new Error('Nenhuma revisão encontrada para este cliente');
      }

      // Atualizar a revisão com o aviso ignorado
      const { error: updateError } = await supabase
        .from('google_ads_reviews')
        .update({
          warning_ignored_today: true,
          warning_ignored_date: today,
          updated_at: new Date().toISOString()
        })
        .eq('id', latestReview.id);

      if (updateError) {
        console.error('Erro ao atualizar revisão:', updateError);
        throw new Error('Erro ao ignorar aviso');
      }

      toast({
        title: "Aviso ignorado com sucesso",
        description: `A recomendação para ${clientName} foi ocultada até amanhã.`,
      });

      onWarningIgnored();
    } catch (error: any) {
      console.error('Erro ao ignorar aviso:', error);
      toast({
        title: "Erro ao ignorar aviso",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDialogOpen(true)}
              disabled={isLoading}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="h-3 w-3 text-gray-500" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Oculta este aviso por hoje</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <IgnoreWarningDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleIgnoreWarning}
        clientName={clientName}
      />
    </>
  );
}
