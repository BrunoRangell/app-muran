// Service Worker para cache de assets estáticos
const CACHE_NAME = 'muran-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/lovable-uploads/2638a3ab-9001-4f4e-b0df-a1a3bb8786da.png',
];

// Instalar e fazer cache dos assets críticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching critical assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativar e limpar caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia de cache: Network First com fallback para cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Apenas fazer cache de GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Não fazer cache de API calls do Supabase
  if (request.url.includes('supabase')) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Se a resposta for válida, clonar e adicionar ao cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          
          // Apenas fazer cache de assets estáticos (JS, CSS, imagens)
          if (
            request.url.includes('/assets/') ||
            request.url.includes('.png') ||
            request.url.includes('.jpg') ||
            request.url.includes('.webp') ||
            request.url.includes('.css') ||
            request.url.includes('.js')
          ) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
        }
        return response;
      })
      .catch(() => {
        // Se a rede falhar, tentar buscar do cache
        return caches.match(request);
      })
  );
});
