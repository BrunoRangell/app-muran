
/**
 * Utilitários para manipulação de payloads para funções Edge
 */

/**
 * Serializa o payload de forma segura para envio
 */
export const preparePayload = (payload: any) => {
  if (!payload || typeof payload !== 'object') {
    throw new Error("Payload inválido para a requisição da função Edge");
  }

  // Problema: vários níveis de transformação podem estar causando perda do payload
  // Vamos simplificar e criar um objeto novo diretamente
  const cleanPayload = {};
  
  // Copiar manualmente as propriedades para garantir um objeto limpo
  for (const key in payload) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      // Se for um objeto aninhado, clonar também
      if (payload[key] && typeof payload[key] === 'object' && !Array.isArray(payload[key])) {
        cleanPayload[key] = { ...payload[key] };
      } else if (Array.isArray(payload[key])) {
        cleanPayload[key] = [...payload[key]];
      } else {
        cleanPayload[key] = payload[key];
      }
    }
  }
  
  // Verificar se payload está vazio após processamento
  if (Object.keys(cleanPayload).length === 0) {
    console.warn("[payloadUtils] AVISO: Payload está vazio após processamento!");
  }
  
  // Verificação adicional para debug
  console.log("[payloadUtils] Payload processado:", cleanPayload);
  console.log("[payloadUtils] Tipo do payload:", typeof cleanPayload);
  
  return cleanPayload;
};

/**
 * Prepara um objeto para logging (removendo dados sensíveis)
 */
export const preparePayloadForLog = (payload: any) => {
  const payloadForLog = { ...payload };
  
  // Ocultar dados sensíveis
  if (payloadForLog.accessToken) {
    payloadForLog.accessToken = "***TOKEN OCULTADO***";
  }
  
  return payloadForLog;
};
