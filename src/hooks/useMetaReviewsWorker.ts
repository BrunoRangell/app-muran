/**
 * FASE 4A: Hook para usar Web Worker de processamento Meta Ads
 * Processa dados complexos em background thread
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { logger } from '@/lib/logger';
import type { WorkerMessage, WorkerResponse } from '@/workers/metaReviews.worker';

export const useMetaReviewsWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    logger.info('🔧 Iniciando Meta Reviews Worker...');
    
    // Criar worker apenas se o navegador suportar
    if (typeof Worker !== 'undefined') {
      logger.debug('✅ Web Workers suportados pelo navegador');
      
      try {
        logger.debug('📦 Criando worker com URL:', new URL('../workers/metaReviews.worker.ts', import.meta.url).href);
        
        workerRef.current = new Worker(
          new URL('../workers/metaReviews.worker.ts', import.meta.url),
          { type: 'module' }
        );

        workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
          setIsProcessing(false);
          logger.info('📨 Meta Reviews Worker resposta recebida:', {
            type: event.data.type,
            hasPayload: !!event.data.payload
          });
        };

        workerRef.current.onerror = (error) => {
          logger.error('❌ Meta Reviews Worker erro:', {
            message: error.message,
            filename: error.filename,
            lineno: error.lineno,
            colno: error.colno
          });
          setIsProcessing(false);
          setIsWorkerReady(false);
        };

        setIsWorkerReady(true);
        logger.info('✅ Meta Reviews Worker inicializado com sucesso');
      } catch (error) {
        logger.error('❌ Falha ao inicializar Meta Reviews Worker:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        setIsWorkerReady(false);
      }
    } else {
      logger.warn('⚠️ Web Workers não suportados neste navegador');
      setIsWorkerReady(false);
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        logger.info('🔚 Meta Reviews Worker terminado');
      }
    };
  }, []);

  const processMetaData = useCallback(
    (
      clients: any[],
      metaAccounts: any[],
      reviews: any[],
      activeCustomBudgets: any[],
      campaignHealthData: any[]
    ): Promise<any> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current || !isWorkerReady) {
          logger.error('❌ Worker não disponível:', {
            hasWorkerRef: !!workerRef.current,
            isWorkerReady,
            clientsCount: clients?.length || 0
          });
          reject(new Error('Worker not ready'));
          return;
        }

        logger.debug('⚙️ Enviando dados para worker processar:', {
          clients: clients?.length || 0,
          metaAccounts: metaAccounts?.length || 0,
          reviews: reviews?.length || 0,
          customBudgets: activeCustomBudgets?.length || 0,
          campaignHealth: campaignHealthData?.length || 0
        });

        setIsProcessing(true);

        const handleMessage = (event: MessageEvent<WorkerResponse>) => {
          if (event.data.type === 'PROCESSED_DATA') {
            workerRef.current?.removeEventListener('message', handleMessage);
            logger.info('✅ Dados processados pelo worker com sucesso');
            resolve(event.data.payload);
          } else if (event.data.type === 'ERROR') {
            workerRef.current?.removeEventListener('message', handleMessage);
            logger.error('❌ Erro no worker:', event.data.payload.message);
            reject(new Error(event.data.payload.message));
          }
        };

        workerRef.current.addEventListener('message', handleMessage);

        workerRef.current.postMessage({
          type: 'PROCESS_META_DATA',
          payload: { clients, metaAccounts, reviews, activeCustomBudgets, campaignHealthData },
        } as WorkerMessage);
      });
    },
    [isWorkerReady]
  );

  return {
    isWorkerReady,
    isProcessing,
    processMetaData,
  };
};
