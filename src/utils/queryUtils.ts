
// Utilitários para gerenciamento de query keys e cache
export const QUERY_KEYS = {
  clients: {
    all: ['clients'] as const,
    withPayments: ['clients-with-payments'] as const,
    unified: ['clients-unified'] as const,
    active: ['clients-active'] as const,
    byId: (id: string) => ['clients', id] as const,
  },
  payments: {
    all: ['payments'] as const,
    recebimentos: ['payments-recebimentos'] as const,
    byFilters: (filters: Record<string, any>) => ['payments', 'filters', filters] as const,
    byClient: (clientId: string) => ['payments', 'client', clientId] as const,
  },
  costs: {
    all: ['costs'] as const,
    byFilters: (filters: Record<string, any>) => ['costs', 'filters', filters] as const,
  },
  reviews: {
    meta: ['meta-reviews'] as const,
    google: ['google-reviews'] as const,
    byClient: (clientId: string) => ['reviews', 'client', clientId] as const,
  },
  metrics: {
    allClients: ['metrics-all-clients'] as const,
    filtered: ['metrics-filtered'] as const,
  }
};

export const createQueryKey = (base: readonly string[], ...params: any[]): string[] => {
  return [...base, ...params.map(p => typeof p === 'object' ? JSON.stringify(p) : String(p))];
};
