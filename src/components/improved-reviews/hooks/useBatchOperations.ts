import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { logger } from "@/utils/logger";
import { Json } from "@supabase/supabase-js";

interface BatchReviewInfo {
  lastBatchReviewTime: string;
  details: {
    platform: string;
    successCount: number;
    errorCount: number;
    totalClients: number;
    completedAt: string;
  };
}

export const useBatchOperations = () => {
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [lastMetaBatchReview, setLastMetaBatchReview] = useState<BatchReviewInfo | null>(null);
  const [lastGoogleBatchReview, setLastGoogleBatchReview] = useState<BatchReviewInfo | null>(null);

  const fetchBatchReviewInfo = async (platform: 'meta' | 'google'): Promise<BatchReviewInfo | null> => {
    try {
      logger.info('BATCH_OPERATIONS', `Buscando informações de batch para ${platform}`);
      
      const { data, error } = await supabase
        .from('system_configs')
        .select('value')
        .eq('key', `last_batch_review_${platform}`)
        .maybeSingle();

      if (error) throw error;
      
      if (data?.value) {
        // Garantir que os dados estão no formato correto
        const parsedValue = typeof data.value === 'string' ? 
          JSON.parse(data.value) : data.value;
          
        // Se for um objeto válido, retornar como BatchReviewInfo
        if (typeof parsedValue === 'object' && parsedValue !== null) {
          return {
            lastBatchReviewTime: parsedValue.lastBatchReviewTime || new Date().toISOString(),
            details: {
              platform: parsedValue.details?.platform || platform,
              successCount: parsedValue.details?.successCount || 0,
              errorCount: parsedValue.details?.errorCount || 0,
              totalClients: parsedValue.details?.totalClients || 0,
              completedAt: parsedValue.details?.completedAt || new Date().toISOString()
            }
          };
        }
      }
      
      return null;
    } catch (error) {
      logger.error('BATCH_OPERATIONS', `Erro ao buscar batch info para ${platform}`, error);
      return null;
    }
  };

  const fetchGoogleBatchReviewInfo = async (): Promise<BatchReviewInfo | null> => {
    try {
      logger.info('BATCH_OPERATIONS', 'Buscando informações de batch do Google');
      
      const { data, error } = await supabase
        .from('system_configs')
        .select('value')
        .eq('key', 'last_batch_review_google')
        .maybeSingle();

      if (error) throw error;
      
      if (data?.value) {
        const parsedValue = typeof data.value === 'string' ? 
          JSON.parse(data.value) : data.value;
          
        if (typeof parsedValue === 'object' && parsedValue !== null) {
          return {
            lastBatchReviewTime: parsedValue.lastBatchReviewTime || new Date().toISOString(),
            details: {
              platform: parsedValue.details?.platform || 'google',
              successCount: parsedValue.details?.successCount || 0,
              errorCount: parsedValue.details?.errorCount || 0,
              totalClients: parsedValue.details?.totalClients || 0,
              completedAt: parsedValue.details?.completedAt || new Date().toISOString()
            }
          };
        }
      }
      
      return null;
    } catch (error) {
      logger.error('BATCH_OPERATIONS', 'Erro ao buscar batch info do Google', error);
      return null;
    }
  };

  const runBatchMetaReviews = async () => {
    setIsBatchRunning(true);
    try {
      logger.info('BATCH_OPERATIONS', 'Iniciando batch de revisões Meta');
      const { data, error } = await supabase.functions.invoke('batch-meta-review');

      if (error) {
        logger.error('BATCH_OPERATIONS', 'Erro ao executar batch de revisões Meta', error);
        throw new Error(error.message);
      }

      logger.info('BATCH_OPERATIONS', 'Batch de revisões Meta concluído', data);
      setLastMetaBatchReview({
        lastBatchReviewTime: new Date().toISOString(),
        details: data
      });
      return data;
    } catch (error: any) {
      logger.error('BATCH_OPERATIONS', 'Erro ao rodar batch de revisões Meta', error);
      throw new Error(error.message);
    } finally {
      setIsBatchRunning(false);
    }
  };

  const runBatchGoogleReviews = async () => {
    setIsBatchRunning(true);
    try {
      logger.info('BATCH_OPERATIONS', 'Iniciando batch de revisões Google Ads');
      const { data, error } = await supabase.functions.invoke('batch-google-ads-review');

      if (error) {
        logger.error('BATCH_OPERATIONS', 'Erro ao executar batch de revisões Google Ads', error);
        throw new Error(error.message);
      }

      logger.info('BATCH_OPERATIONS', 'Batch de revisões Google Ads concluído', data);
       setLastGoogleBatchReview({
        lastBatchReviewTime: new Date().toISOString(),
        details: data
      });
      return data;
    } catch (error: any) {
      logger.error('BATCH_OPERATIONS', 'Erro ao rodar batch de revisões Google Ads', error);
      throw new Error(error.message);
    } finally {
      setIsBatchRunning(false);
    }
  };

  const saveBatchReviewInfo = async (platform: string, details: any) => {
    try {
      logger.info('BATCH_OPERATIONS', `Salvando informações de batch para ${platform}`, details);

      const { error } = await supabase
        .from('system_configs')
        .upsert({
          key: `last_batch_review_${platform}`,
          value: {
            lastBatchReviewTime: new Date().toISOString(),
            details: details
          }
        }, { onConflict: 'key' });

      if (error) {
        logger.error('BATCH_OPERATIONS', `Erro ao salvar informações de batch para ${platform}`, error);
        throw error;
      }

      logger.info('BATCH_OPERATIONS', `Informações de batch salvas com sucesso para ${platform}`);
    } catch (error) {
      logger.error('BATCH_OPERATIONS', `Erro ao salvar informações de batch para ${platform}`, error);
      throw error;
    }
  };

  return {
    isBatchRunning,
    runBatchMetaReviews,
    runBatchGoogleReviews,
    saveBatchReviewInfo,
    fetchBatchReviewInfo,
    fetchGoogleBatchReviewInfo,
    lastMetaBatchReview,
    lastGoogleBatchReview
  };
};
