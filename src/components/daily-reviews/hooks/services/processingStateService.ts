
import { useState } from "react";

/**
 * Serviço para gerenciar o estado de processamento de clientes e contas
 */
export const useProcessingState = () => {
  const [processingClients, setProcessingClients] = useState<string[]>([]);
  const [processingAccounts, setProcessingAccounts] = useState<string[]>([]);

  /**
   * Marca um cliente como em processamento
   */
  const markClientProcessing = (clientId: string) => {
    setProcessingClients((prev) => [...prev, clientId]);
  };

  /**
   * Marca uma conta específica como em processamento
   */
  const markAccountProcessing = (clientId: string, accountId: string) => {
    const accountKey = `${clientId}-${accountId}`;
    setProcessingAccounts((prev) => [...prev, accountKey]);
  };

  /**
   * Remove um cliente da lista de processamento
   */
  const unmarkClientProcessing = (clientId: string) => {
    setProcessingClients((prev) => prev.filter(id => id !== clientId));
  };

  /**
   * Remove uma conta da lista de processamento
   */
  const unmarkAccountProcessing = (clientId: string, accountId: string) => {
    const accountKey = `${clientId}-${accountId}`;
    setProcessingAccounts((prev) => prev.filter(key => key !== accountKey));
  };

  /**
   * Marca todos os clientes de uma lista como em processamento
   */
  const markAllClientsProcessing = (clientIds: string[]) => {
    setProcessingClients(clientIds);
  };

  /**
   * Marca todas as contas como em processamento
   */
  const markAllAccountsProcessing = (accountKeys: string[]) => {
    setProcessingAccounts(accountKeys);
  };

  /**
   * Limpa todos os estados de processamento
   */
  const clearAllProcessingStates = () => {
    setProcessingClients([]);
    setProcessingAccounts([]);
  };

  /**
   * Verifica se um cliente ou uma conta específica está em processamento
   */
  const isProcessingAccount = (clientId: string, accountId?: string) => {
    // Se não temos um accountId específico, verificamos se o cliente está em processamento
    if (!accountId) {
      return processingClients.includes(clientId);
    }
    
    // Caso contrário, verificamos se a combinação cliente + conta está em processamento
    const accountKey = `${clientId}-${accountId}`;
    return processingAccounts.includes(accountKey) || processingClients.includes(clientId);
  };

  return {
    processingClients,
    markClientProcessing,
    unmarkClientProcessing,
    markAccountProcessing,
    unmarkAccountProcessing,
    markAllClientsProcessing,
    markAllAccountsProcessing,
    clearAllProcessingStates,
    isProcessingAccount
  };
};
