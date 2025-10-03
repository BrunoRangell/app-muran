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
    // Criar worker apenas se o navegador suportar
    if (typeof Worker !== 'undefined') {
      try {
        workerRef.current = new Worker(
          new URL('../workers/metaReviews.worker.ts', import.meta.url),
          { type: 'module' }
        );

        workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
          setIsProcessing(false);
          logger.debug('Meta Reviews Worker response received:', event.data.type);
        };

        workerRef.current.onerror = (error) => {
          logger.error('Meta Reviews Worker error:', error);
          setIsProcessing(false);
        };

        setIsWorkerReady(true);
        logger.debug('Meta Reviews Worker initialized');
      } catch (error) {
        logger.error('Failed to initialize Meta Reviews Worker:', error);
        setIsWorkerReady(false);
      }
    } else {
      logger.warn('Web Workers not supported in this browser');
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        logger.debug('Meta Reviews Worker terminated');
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
          reject(new Error('Worker not ready'));
          return;
        }

        setIsProcessing(true);

        const handleMessage = (event: MessageEvent<WorkerResponse>) => {
          if (event.data.type === 'PROCESSED_DATA') {
            workerRef.current?.removeEventListener('message', handleMessage);
            resolve(event.data.payload);
          } else if (event.data.type === 'ERROR') {
            workerRef.current?.removeEventListener('message', handleMessage);
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
