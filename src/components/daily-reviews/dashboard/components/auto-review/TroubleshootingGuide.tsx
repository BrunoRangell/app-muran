
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";

interface TroubleshootingGuideProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}

export function TroubleshootingGuide({ isOpen, onToggle }: TroubleshootingGuideProps) {
  return (
    <Collapsible 
      open={isOpen} 
      onOpenChange={onToggle}
      className="w-full border rounded-md overflow-hidden"
    >
      <CollapsibleTrigger asChild>
        <div className="bg-amber-50 p-4 cursor-pointer hover:bg-amber-100 transition-colors flex justify-between items-center">
          <h3 className="font-medium text-amber-800">Solução de problemas</h3>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-amber-800" />
          ) : (
            <ChevronDown className="h-4 w-4 text-amber-800" />
          )}
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="p-4 bg-amber-50 text-amber-800 border-t border-amber-200">
          <h4 className="font-medium mb-2">Erros comuns e suas soluções:</h4>
          
          <div className="space-y-4 text-sm">
            <div>
              <h5 className="font-medium">Erro "Unexpected end of JSON input"</h5>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Este erro ocorre quando a função Edge retorna uma resposta JSON inválida ou vazia</li>
                <li>Verifique se a função "daily-meta-review" está publicada no Supabase</li>
                <li>Tente republicar a função Edge no console do Supabase</li>
                <li>Verifique os logs da função Edge para identificar o erro exato</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium">Erro "Edge Function returned a non-2xx status code"</h5>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>A função Edge está retornando um erro (código 4xx ou 5xx)</li>
                <li>Verifique se você tem permissões para acessar a função</li>
                <li>Verifique se a função está publicada e acessível</li>
                <li>Consulte os logs da função Edge para entender o erro específico</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium">Passos de solução geral:</h5>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Use o botão "Testar Conexão" para diagnosticar problemas</li>
                <li>Se o teste falhar, verifique a mensagem de erro detalhada</li>
                <li>Verifique se a função Edge está publicada no Supabase</li>
                <li>Se necessário, republique a função Edge no console do Supabase</li>
                <li>Limpe o cache do navegador ou use uma guia anônima</li>
                <li>Verifique se há problemas de rede ou firewall</li>
                <li>Se o problema persistir, consulte os logs no console do Supabase</li>
              </ol>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
