/**
 * Hook para usar Web Worker de cálculos financeiros
 * Fase 3C: Otimização de Performance com Web Workers
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { logger } from '@/lib/logger';
import type { WorkerMessage, WorkerResponse } from '@/workers/financialMetrics.worker';

export const useFinancialWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    // Criar worker apenas se o navegador suportar
    if (typeof Worker !== 'undefined') {
      try {
        workerRef.current = new Worker(
          new URL('../workers/financialMetrics.worker.ts', import.meta.url),
          { type: 'module' }
        );

        workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
          setIsCalculating(false);
          logger.debug('Worker response received:', event.data.type);
        };

        workerRef.current.onerror = (error) => {
          logger.error('Worker error:', error);
          setIsCalculating(false);
        };

        setIsWorkerReady(true);
        logger.debug('Financial metrics worker initialized');
      } catch (error) {
        logger.error('Failed to initialize worker:', error);
        setIsWorkerReady(false);
      }
    } else {
      logger.warn('Web Workers not supported in this browser');
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        logger.debug('Financial metrics worker terminated');
      }
    };
  }, []);

  const calculateMetrics = useCallback(
    (clients: any[], payments: any[], costs: any[]): Promise<any> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current || !isWorkerReady) {
          reject(new Error('Worker not ready'));
          return;
        }

        setIsCalculating(true);

        const handleMessage = (event: MessageEvent<WorkerResponse>) => {
          if (event.data.type === 'METRICS_RESULT') {
            workerRef.current?.removeEventListener('message', handleMessage);
            resolve(event.data.payload);
          } else if (event.data.type === 'ERROR') {
            workerRef.current?.removeEventListener('message', handleMessage);
            reject(new Error(event.data.payload.message));
          }
        };

        workerRef.current.addEventListener('message', handleMessage);

        workerRef.current.postMessage({
          type: 'CALCULATE_METRICS',
          payload: { clients, payments, costs },
        } as WorkerMessage);
      });
    },
    [isWorkerReady]
  );

  const calculateLTV = useCallback(
    (clients: any[], payments: any[], targetMonth: Date): Promise<number> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current || !isWorkerReady) {
          reject(new Error('Worker not ready'));
          return;
        }

        setIsCalculating(true);

        const handleMessage = (event: MessageEvent<WorkerResponse>) => {
          if (event.data.type === 'LTV_RESULT') {
            workerRef.current?.removeEventListener('message', handleMessage);
            resolve(event.data.payload);
          } else if (event.data.type === 'ERROR') {
            workerRef.current?.removeEventListener('message', handleMessage);
            reject(new Error(event.data.payload.message));
          }
        };

        workerRef.current.addEventListener('message', handleMessage);

        workerRef.current.postMessage({
          type: 'CALCULATE_LTV',
          payload: { clients, payments, targetMonth: targetMonth.toISOString() },
        } as WorkerMessage);
      });
    },
    [isWorkerReady]
  );

  return {
    isWorkerReady,
    isCalculating,
    calculateMetrics,
    calculateLTV,
  };
};
