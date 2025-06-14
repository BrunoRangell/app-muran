
// Constantes centralizadas do projeto

export const MURAN_COLORS = {
  PRIMARY: '#ff6e00',
  COMPLEMENTARY: '#321e32',
  SECONDARY: '#ebebf0',
  DARK: '#0f0f0f'
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'muran-auth-token',
  THEME: 'muran-theme',
  SIDEBAR_COLLAPSED: 'muran-sidebar-collapsed'
} as const;

export const QUERY_STALE_TIME = {
  SHORT: 1000 * 30, // 30 segundos
  MEDIUM: 1000 * 60, // 1 minuto
  LONG: 1000 * 60 * 5 // 5 minutos
} as const;

export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100
} as const;

export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  API: 'yyyy-MM-dd',
  DATETIME: 'dd/MM/yyyy HH:mm'
} as const;

export const API_ENDPOINTS = {
  CLIENTS: '/clients',
  PAYMENTS: '/payments',
  COSTS: '/costs',
  TEAM: '/team-members'
} as const;

export const CLIENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
} as const;

export const PLATFORMS = {
  META: 'meta',
  GOOGLE: 'google'
} as const;
