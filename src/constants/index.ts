
// Constantes centralizadas do projeto

export const QUERY_STALE_TIME = {
  SHORT: 30 * 1000,      // 30 segundos
  MEDIUM: 2 * 60 * 1000, // 2 minutos
  LONG: 5 * 60 * 1000,   // 5 minutos
  EXTRA_LONG: 10 * 60 * 1000 // 10 minutos
} as const;

export const CACHE_KEYS = {
  CLIENTS: 'clients',
  PAYMENTS: 'payments',
  COSTS: 'costs',
  REVIEWS: 'reviews',
  METRICS: 'metrics'
} as const;

export const API_ENDPOINTS = {
  CLIENTS: '/clients',
  PAYMENTS: '/payments',
  COSTS: '/costs',
  REVIEWS: '/reviews'
} as const;

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_DELAY = 1000;
