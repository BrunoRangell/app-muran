
/**
 * Utilitários para manipulação de payloads para funções Edge
 */

/**
 * Serializa o payload de forma segura para envio
 */
export const preparePayload = (payload: any) => {
  if (!payload) {
    throw new Error("Payload inválido: nulo ou indefinido");
  }

  if (typeof payload !== 'object') {
    throw new Error(`Payload inválido: esperado objeto, recebido ${typeof payload}`);
  }

  try {
    // Método seguro para fazer deep clone e detectar problemas de serialização
    const serialized = JSON.stringify(payload);
    if (!serialized || serialized === '{}') {
      console.warn("[payloadUtils] AVISO: Payload vazio após serialização!");
      throw new Error("Payload serializado está vazio");
    }
    
    const cleanPayload = JSON.parse(serialized);
    
    // Verificação extra para garantir que não temos um objeto vazio
    if (Object.keys(cleanPayload).length === 0) {
      console.warn("[payloadUtils] AVISO: Payload é um objeto vazio!");
      throw new Error("Payload é um objeto vazio após processamento");
    }
    
    // Log para debug
    console.log("[payloadUtils] Payload processado com sucesso. Tamanho:", serialized.length, "bytes");
    
    return cleanPayload;
  } catch (err) {
    if (err.message.includes("circular") || err.message.includes("cyclic")) {
      console.error("[payloadUtils] ERRO: Detectada estrutura cíclica no payload!");
      
      // Tentar extrair propriedades de primeiro nível manualmente
      const fallbackPayload = {};
      for (const key in payload) {
        if (Object.prototype.hasOwnProperty.call(payload, key)) {
          try {
            const value = payload[key];
            // Tratar tipos primitivos e objetos simples
            if (value === null || 
                value === undefined || 
                typeof value !== 'object' ||
                Array.isArray(value)) {
              fallbackPayload[key] = value;
            } else {
              // Para objetos, tentar clonar superficialmente
              fallbackPayload[key] = {...value};
            }
          } catch (innerErr) {
            console.warn(`[payloadUtils] Não foi possível processar a propriedade ${key}`);
          }
        }
      }
      
      if (Object.keys(fallbackPayload).length === 0) {
        throw new Error("Não foi possível processar o payload devido a referências cíclicas");
      }
      
      console.warn("[payloadUtils] Criado payload alternativo sem referências cíclicas");
      return fallbackPayload;
    }
    
    // Outros erros de serialização
    console.error("[payloadUtils] ERRO ao processar payload:", err);
    throw new Error(`Erro ao processar payload: ${err.message}`);
  }
};

/**
 * Prepara um objeto para logging (removendo dados sensíveis)
 */
export const preparePayloadForLog = (payload: any) => {
  if (!payload) return { empty: true };
  
  try {
    const payloadForLog = JSON.parse(JSON.stringify(payload));
    
    // Ocultar dados sensíveis
    if (payloadForLog.accessToken) {
      payloadForLog.accessToken = "***TOKEN OCULTADO***";
    }
    
    return payloadForLog;
  } catch (err) {
    return { 
      error: "Não foi possível preparar payload para log",
      reason: err.message
    };
  }
};
