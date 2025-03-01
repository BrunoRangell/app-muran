
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { ApiErrorDetails } from "./ApiErrorDetails";
import { ApiTestTools } from "./ApiTestTools";
import { DebugInfo } from "./DebugInfo";

interface ErrorContentProps {
  error: string;
  rawApiResponse: any;
  debugInfo: any;
  isLoading: boolean;
  client: any;
  testMetaToken: () => Promise<boolean | void>;
  testEdgeFunction: () => Promise<boolean | void>;
  handleOpenGraphExplorer: () => void;
  handleMakeSampleRequest: () => void;
}

export function ErrorContent({
  error,
  rawApiResponse,
  debugInfo,
  isLoading,
  client,
  testMetaToken,
  testEdgeFunction,
  handleOpenGraphExplorer,
  handleMakeSampleRequest
}: ErrorContentProps) {
  // Determinar tipos específicos de erro para sugestões melhores
  const isMetaApiError = rawApiResponse?.error?.message?.includes('Invalid OAuth access token') || 
                        error?.includes('Token do Meta') ||
                        error?.includes('token');

  const isEdgeFunctionError = error?.includes('função Edge') || 
                            error?.includes('Edge Function') ||
                            error?.includes('conectar');

  const isEmptyRequestBodyError = error?.includes('Corpo da requisição vazio') ||
                                 rawApiResponse?.error?.message?.includes('Corpo da requisição vazio') ||
                                 error?.includes('Unexpected end of JSON input') ||
                                 rawApiResponse?.error?.message?.includes('Unexpected end of JSON input');

  const isJsonParseError = error?.includes('JSON input') ||
                          rawApiResponse?.error?.message?.includes('JSON input') ||
                          (error?.includes('SyntaxError') && error?.includes('JSON'));

  const isNetworkError = error?.includes('Failed to fetch') ||
                        error?.includes('Network error') ||
                        error?.includes('CORS') ||
                        error?.includes('timeout');

  return (
    <div className="space-y-4">
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro na análise</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
      
      {rawApiResponse?.error && <ApiErrorDetails error={rawApiResponse.error} />}
      
      <ApiTestTools 
        isLoading={isLoading}
        client={client}
        testMetaToken={testMetaToken}
        testEdgeFunction={testEdgeFunction}
        handleOpenGraphExplorer={handleOpenGraphExplorer}
        handleMakeSampleRequest={handleMakeSampleRequest}
      />
      
      <DebugInfo debugInfo={debugInfo} rawApiResponse={rawApiResponse} />
      
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-md mt-4">
        <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
          <AlertTriangle size={18} />
          <span>Sugestões para solução:</span>
        </div>
        <ul className="list-disc pl-6 space-y-1 text-amber-700">
          {isEmptyRequestBodyError && (
            <>
              <li>A função Edge não está recebendo corretamente os dados enviados pelo cliente</li>
              <li>Verifique se o payload está sendo serializado corretamente com JSON.stringify()</li>
              <li>Confirme que está enviando o corpo da requisição com content-type: application/json</li>
              <li>Verifique se o conteúdo do body não é undefined ou null antes de enviar</li>
              <li>Tente usar o botão "Testar Função Edge" acima para verificar a conexão com a função</li>
              <li>Verifique os logs da função Edge no console do Supabase para mais detalhes</li>
              <li>Reinicie a aplicação ou limpe o cache do navegador e tente novamente</li>
            </>
          )}
          
          {isJsonParseError && !isEmptyRequestBodyError && (
            <>
              <li>O formato da resposta JSON está corrompido ou incompleto</li>
              <li>Verifique se a função Edge está recebendo corretamente os parâmetros</li>
              <li>Confira se o payload enviado para a função está completo e bem formado</li>
              <li>Use as ferramentas de diagnóstico para verificar o estado da função Edge</li>
            </>
          )}
          
          {isMetaApiError && (
            <>
              <li>Verifique se o token de acesso do Meta Ads está correto e não expirou</li>
              <li>Gere um novo token de acesso no Facebook Developer e atualize nas configurações</li>
              <li>Confirme se o token tem as permissões necessárias para acessar dados de anúncios</li>
            </>
          )}
          
          {isEdgeFunctionError && (
            <>
              <li>Verifique se a função Edge está publicada no Supabase</li>
              <li>Tente republicar a função Edge no console do Supabase</li>
              <li>Verifique se o CORS está configurado na função Edge para permitir seu domínio</li>
              <li>Tente reiniciar a aplicação ou limpar o cache do navegador</li>
            </>
          )}
          
          {isNetworkError && (
            <>
              <li>Pode haver um problema de rede ou CORS impedindo a comunicação</li>
              <li>Verifique se você está conectado à internet</li>
              <li>Tente acessar de uma rede diferente ou desabilite extensões de bloqueio</li>
              <li>Verifique se a função Edge está online e acessível</li>
            </>
          )}
          
          {!isMetaApiError && !isEdgeFunctionError && !isJsonParseError && !isNetworkError && !isEmptyRequestBodyError && (
            <>
              <li>Confirme se o ID da conta Meta Ads está correto para este cliente</li>
              <li>Verifique se a conta Meta Ads tem permissões para acessar as campanhas</li>
              <li>Tente novamente em alguns minutos caso seja um problema temporário</li>
              <li>Use as ferramentas de diagnóstico acima para testar o token e a API diretamente</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
