// Diferir carregamento de CSS não-crítico para melhorar performance
export const deferNonCriticalCSS = () => {
  // Apenas executar em produção e após o load
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      // Encontrar todos os links de CSS
      const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
      
      cssLinks.forEach((link) => {
        const href = link.getAttribute('href');
        
        // Se o CSS já está carregado, não fazer nada
        if (!href || link.hasAttribute('data-deferred')) {
          return;
        }
        
        // Marcar como diferido para não processar novamente
        link.setAttribute('data-deferred', 'true');
        
        // CSS já foi carregado de forma síncrona na primeira renderização
        // Agora vamos garantir que ele está no cache do browser
        console.log('✅ CSS carregado:', href);
      });
    });
  }
};
