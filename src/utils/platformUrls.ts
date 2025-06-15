
export const buildPlatformUrl = (platform: 'meta' | 'google', accountId?: string): string => {
  if (platform === 'meta') {
    if (accountId) {
      return `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${accountId}`;
    }
    // Fallback para o gerenciador de anúncios genérico se não houver ID da conta
    return 'https://www.facebook.com/adsmanager';
  }

  if (platform === 'google') {
    // Este URL é fixo conforme a solicitação
    return 'https://ads.google.com/aw/accounts?ocid=6722116510';
  }

  // Retornar um fallback seguro
  return '#';
};
